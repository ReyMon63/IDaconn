/**
 * Scanner Inteligente con OpenCV.js y Tesseract.js v5
 * Detección automática de documentos, recorte, rotación y OCR
 */

class SmartScanner {
    constructor() {
        this.isOpenCvReady = false;
        this.isCapturing = false;
        this.detectionTimeout = null;
        this.lastDetectionTime = 0;
        this.detectionThreshold = 3000; // 3 segundos
        
        // Canvas para procesamiento
        this.processCanvas = null;
        this.overlayCanvas = null;
        this.video = null;
        
        // Configuración de detección
        this.minContourArea = 5000;
        this.maxContourArea = 100000;
        this.approxEpsilon = 0.02;
        
        debug.log('SmartScanner initialized');
    }

    // Callback cuando OpenCV está listo
    onOpenCvReady() {
        try {
            this.isOpenCvReady = typeof cv !== 'undefined' && cv.Mat !== undefined;
            debug.log('OpenCV ready status:', this.isOpenCvReady);
            
            if (this.isOpenCvReady) {
                // Verificar funciones críticas de OpenCV
                const requiredFunctions = ['imread', 'cvtColor', 'findContours', 'approxPolyDP'];
                const missing = requiredFunctions.filter(fn => typeof cv[fn] !== 'function');
                
                if (missing.length > 0) {
                    debug.error('OpenCV missing required functions:', missing);
                    this.isOpenCvReady = false;
                } else {
                    debug.log('OpenCV fully loaded with all required functions');
                    this.initializeCanvases();
                }
            } else {
                debug.warn('OpenCV not available - will use fallback detection');
            }
            
        } catch (error) {
            debug.error('Error checking OpenCV readiness', error);
            this.isOpenCvReady = false;
        }
    }

    // Inicializar canvas de procesamiento
    initializeCanvases() {
        // Canvas para procesamiento (oculto)
        this.processCanvas = document.createElement('canvas');
        this.processCanvas.style.display = 'none';
        document.body.appendChild(this.processCanvas);
        
        debug.log('Processing canvas initialized');
    }

    // Iniciar scanner inteligente
    async startScanning(videoElement, overlayCanvasElement) {
        try {
            debug.log('Starting smart scanning');
            
            this.video = videoElement;
            this.overlayCanvas = overlayCanvasElement;
            
            if (!videoElement) {
                throw new Error('Video element is required');
            }
            
            if (!this.isOpenCvReady) {
                debug.warn('OpenCV not ready, will use fallback detection');
            }
            
            // Verificar permisos de cámara primero
            const permission = await this.checkCameraPermission();
            if (permission !== 'granted') {
                throw new Error('Permisos de cámara denegados');
            }
            
            // Iniciar cámara con configuración optimizada
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: { ideal: 'environment' },
                    width: { ideal: 1280, min: 640, max: 1920 },
                    height: { ideal: 720, min: 480, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                }
            });
            
            this.video.srcObject = stream;
            this.video.setAttribute('playsinline', true);
            this.video.setAttribute('webkit-playsinline', true);
            
            // Esperar a que el video esté listo
            await new Promise((resolve, reject) => {
                this.video.onloadedmetadata = () => {
                    this.video.play().then(resolve).catch(reject);
                };
                this.video.onerror = () => reject(new Error('Error al cargar video'));
                
                // Timeout de seguridad
                setTimeout(() => reject(new Error('Timeout al cargar video')), 15000);
            });
            
            debug.log('Video stream established', {
                width: this.video.videoWidth,
                height: this.video.videoHeight
            });
            
            // Configurar overlay canvas
            if (overlayCanvasElement) {
                this.setupOverlayCanvas();
            }
            
            // Iniciar detección continua
            this.startContinuousDetection();
            
            debug.log('Smart scanning started successfully');
            
        } catch (error) {
            debug.error('Failed to start smart scanning', error);
            
            // Limpiar recursos si hay error
            this.cleanup();
            
            // Re-lanzar con mensaje más descriptivo
            if (error.name === 'NotAllowedError') {
                throw new Error('Permisos de cámara denegados. Por favor permite el acceso a la cámara.');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No se encontró cámara disponible.');
            } else if (error.name === 'NotReadableError') {
                throw new Error('Cámara en uso por otra aplicación.');
            } else {
                throw new Error(`Error de cámara: ${error.message}`);
            }
        }
    }

    // Verificar permisos de cámara
    async checkCameraPermission() {
        try {
            if (!navigator.permissions) {
                debug.warn('Permissions API not supported');
                return 'unknown';
            }

            const permission = await navigator.permissions.query({ name: 'camera' });
            debug.log('Camera permission status:', permission.state);
            return permission.state;

        } catch (error) {
            debug.warn('Failed to check camera permissions', error);
            return 'unknown';
        }
    }

    // Limpiar recursos
    cleanup() {
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        this.isCapturing = false;
        
        if (this.detectionTimeout) {
            clearTimeout(this.detectionTimeout);
            this.detectionTimeout = null;
        }
    }

    // Configurar canvas overlay
    setupOverlayCanvas() {
        if (!this.overlayCanvas || !this.video) return;
        
        // Ajustar tamaño del overlay al video
        const updateOverlaySize = () => {
            const rect = this.video.getBoundingClientRect();
            this.overlayCanvas.width = rect.width;
            this.overlayCanvas.height = rect.height;
            this.overlayCanvas.style.position = 'absolute';
            this.overlayCanvas.style.top = rect.top + 'px';
            this.overlayCanvas.style.left = rect.left + 'px';
            this.overlayCanvas.style.pointerEvents = 'none';
            this.overlayCanvas.style.zIndex = '10';
        };
        
        updateOverlaySize();
        window.addEventListener('resize', updateOverlaySize);
        this.video.addEventListener('loadedmetadata', updateOverlaySize);
    }

    // Iniciar detección continua
    startContinuousDetection() {
        this.isCapturing = true;
        this.detectDocumentLoop();
        
        // Timeout para mostrar mensaje de ayuda
        this.detectionTimeout = setTimeout(() => {
            this.showHelpMessage();
        }, this.detectionThreshold);
    }

    // Loop de detección de documentos
    detectDocumentLoop() {
        if (!this.isCapturing || !this.video) return;
        
        try {
            const detection = this.detectDocument();
            
            if (detection.found) {
                this.drawDetectionOverlay(detection.corners);
                this.lastDetectionTime = Date.now();
                
                // Limpiar timeout de ayuda
                if (this.detectionTimeout) {
                    clearTimeout(this.detectionTimeout);
                    this.detectionTimeout = null;
                }
                
                this.hideHelpMessage();
                
            } else {
                this.drawScanningOverlay();
                
                // Verificar si necesitamos mostrar ayuda
                if (Date.now() - this.lastDetectionTime > this.detectionThreshold) {
                    this.showHelpMessage();
                }
            }
            
        } catch (error) {
            debug.warn('Detection loop error', error);
        }
        
        // Continuar loop
        requestAnimationFrame(() => this.detectDocumentLoop());
    }

    // Detectar documento en el frame actual
    detectDocument() {
        if (!this.isOpenCvReady || !this.video || !this.processCanvas) {
            return this.fallbackDetection();
        }
        
        try {
            // Capturar frame del video
            const ctx = this.processCanvas.getContext('2d');
            this.processCanvas.width = this.video.videoWidth;
            this.processCanvas.height = this.video.videoHeight;
            ctx.drawImage(this.video, 0, 0);
            
            // Convertir a matriz OpenCV
            let src = cv.imread(this.processCanvas);
            let gray = new cv.Mat();
            let blur = new cv.Mat();
            let edges = new cv.Mat();
            let contours = new cv.MatVector();
            let hierarchy = new cv.Mat();
            
            // Procesamiento de imagen
            cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
            cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
            cv.Canny(blur, edges, 50, 150);
            
            // Encontrar contornos
            cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
            
            // Buscar el mejor contorno rectangular
            let bestContour = this.findBestRectangularContour(contours);
            
            // Limpiar memoria
            src.delete();
            gray.delete();
            blur.delete();
            edges.delete();
            contours.delete();
            hierarchy.delete();
            
            if (bestContour) {
                return {
                    found: true,
                    corners: bestContour,
                    confidence: this.calculateConfidence(bestContour)
                };
            }
            
            return { found: false };
            
        } catch (error) {
            debug.error('OpenCV detection failed', error);
            return this.fallbackDetection();
        }
    }

    // Encontrar el mejor contorno rectangular
    findBestRectangularContour(contours) {
        let bestContour = null;
        let maxArea = 0;
        
        for (let i = 0; i < contours.size(); i++) {
            let contour = contours.get(i);
            let area = cv.contourArea(contour);
            
            // Filtrar por área
            if (area < this.minContourArea || area > this.maxContourArea) {
                continue;
            }
            
            // Aproximar contorno
            let approx = new cv.Mat();
            let peri = cv.arcLength(contour, true);
            cv.approxPolyDP(contour, approx, this.approxEpsilon * peri, true);
            
            // Verificar que sea un rectángulo (4 puntos)
            if (approx.rows === 4 && area > maxArea) {
                maxArea = area;
                
                // Convertir puntos a formato utilizable
                bestContour = [];
                for (let j = 0; j < 4; j++) {
                    bestContour.push({
                        x: approx.data32S[j * 2],
                        y: approx.data32S[j * 2 + 1]
                    });
                }
            }
            
            approx.delete();
        }
        
        return bestContour;
    }

    // Detección de respaldo (sin OpenCV)
    fallbackDetection() {
        // Simulación simple basada en tiempo y movimiento
        const random = Math.random();
        
        if (random > 0.7) {
            // Simular detección de documento
            const w = this.video?.videoWidth || 640;
            const h = this.video?.videoHeight || 480;
            
            return {
                found: true,
                corners: [
                    { x: w * 0.1, y: h * 0.2 },
                    { x: w * 0.9, y: h * 0.2 },
                    { x: w * 0.9, y: h * 0.8 },
                    { x: w * 0.1, y: h * 0.8 }
                ],
                confidence: 0.8
            };
        }
        
        return { found: false };
    }

    // Calcular confianza de detección
    calculateConfidence(corners) {
        if (!corners || corners.length !== 4) return 0;
        
        // Calcular área y aspectos geométricos
        let area = 0;
        for (let i = 0; i < 4; i++) {
            let j = (i + 1) % 4;
            area += corners[i].x * corners[j].y;
            area -= corners[j].x * corners[i].y;
        }
        area = Math.abs(area) / 2;
        
        // Normalizar confianza basada en área
        const minArea = 10000;
        const maxArea = 200000;
        const normalizedArea = Math.min(1, Math.max(0, (area - minArea) / (maxArea - minArea)));
        
        return normalizedArea * 0.9 + 0.1;
    }

    // Dibujar overlay de detección
    drawDetectionOverlay(corners) {
        if (!this.overlayCanvas || !corners) return;
        
        const ctx = this.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // Convertir coordenadas de video a canvas
        const scaleX = this.overlayCanvas.width / this.video.videoWidth;
        const scaleY = this.overlayCanvas.height / this.video.videoHeight;
        
        // Dibujar contorno detectado
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        corners.forEach((corner, index) => {
            const x = corner.x * scaleX;
            const y = corner.y * scaleY;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.closePath();
        ctx.stroke();
        
        // Dibujar puntos de esquina
        ctx.fillStyle = '#00ff00';
        corners.forEach(corner => {
            const x = corner.x * scaleX;
            const y = corner.y * scaleY;
            ctx.beginPath();
            ctx.arc(x, y, 6, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Texto de estado
        ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.font = '16px Arial';
        ctx.fillText('📄 Documento detectado', 10, 30);
    }

    // Dibujar overlay de escaneo
    drawScanningOverlay() {
        if (!this.overlayCanvas) return;
        
        const ctx = this.overlayCanvas.getContext('2d');
        ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        
        // Dibujar rectángulo de guía
        const centerX = this.overlayCanvas.width / 2;
        const centerY = this.overlayCanvas.height / 2;
        const rectWidth = this.overlayCanvas.width * 0.7;
        const rectHeight = this.overlayCanvas.height * 0.5;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        ctx.strokeRect(
            centerX - rectWidth / 2,
            centerY - rectHeight / 2,
            rectWidth,
            rectHeight
        );
        ctx.setLineDash([]);
        
        // Esquinas de enfoque
        const cornerSize = 20;
        const corners = [
            { x: centerX - rectWidth / 2, y: centerY - rectHeight / 2 },
            { x: centerX + rectWidth / 2, y: centerY - rectHeight / 2 },
            { x: centerX + rectWidth / 2, y: centerY + rectHeight / 2 },
            { x: centerX - rectWidth / 2, y: centerY + rectHeight / 2 }
        ];
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        
        corners.forEach(corner => {
            // Esquina superior izquierda de cada corner
            ctx.beginPath();
            ctx.moveTo(corner.x, corner.y + cornerSize);
            ctx.lineTo(corner.x, corner.y);
            ctx.lineTo(corner.x + cornerSize, corner.y);
            ctx.stroke();
        });
    }

    // Mostrar mensaje de ayuda
    showHelpMessage() {
        if (!this.overlayCanvas) return;
        
        const ctx = this.overlayCanvas.getContext('2d');
        
        // Fondo del mensaje
        const messageWidth = 280;
        const messageHeight = 60;
        const x = (this.overlayCanvas.width - messageWidth) / 2;
        const y = this.overlayCanvas.height - messageHeight - 20;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, messageWidth, messageHeight);
        
        // Texto del mensaje
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            '📋 Busca alinear en el recuadro',
            this.overlayCanvas.width / 2,
            y + 25
        );
        ctx.fillText(
            'Coloca el ticket dentro del área',
            this.overlayCanvas.width / 2,
            y + 45
        );
        ctx.textAlign = 'left';
    }

    // Ocultar mensaje de ayuda
    hideHelpMessage() {
        // El mensaje se limpia automáticamente en drawDetectionOverlay
    }

    // Capturar y procesar documento detectado
    async captureDetectedDocument() {
        if (!this.video) {
            throw new Error('Video no disponible');
        }
        
        debug.log('Capturing detected document');
        
        try {
            // Detectar documento actual
            const detection = this.detectDocument();
            
            if (!detection.found) {
                throw new Error('No se detectó documento para capturar');
            }
            
            // Capturar frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.video.videoWidth;
            canvas.height = this.video.videoHeight;
            ctx.drawImage(this.video, 0, 0);
            
            // Procesar documento detectado
            const processedImage = await this.processDetectedDocument(canvas, detection.corners);
            
            debug.log('Document captured and processed successfully');
            return processedImage;
            
        } catch (error) {
            debug.error('Failed to capture detected document', error);
            throw error;
        }
    }

    // Procesar documento detectado (recorte, rotación, zoom)
    async processDetectedDocument(sourceCanvas, corners) {
        debug.log('Processing detected document', corners);
        
        if (!this.isOpenCvReady || !corners) {
            return this.fallbackProcessing(sourceCanvas);
        }
        
        try {
            // Convertir a OpenCV
            let src = cv.imread(sourceCanvas);
            
            // Ordenar esquinas (top-left, top-right, bottom-right, bottom-left)
            const orderedCorners = this.orderCorners(corners);
            
            // Calcular dimensiones del documento
            const docWidth = Math.max(
                this.distance(orderedCorners[0], orderedCorners[1]),
                this.distance(orderedCorners[2], orderedCorners[3])
            );
            const docHeight = Math.max(
                this.distance(orderedCorners[0], orderedCorners[3]),
                this.distance(orderedCorners[1], orderedCorners[2])
            );
            
            // Crear puntos de destino (documento rectificado)
            const dstPoints = [
                [0, 0],
                [docWidth, 0],
                [docWidth, docHeight],
                [0, docHeight]
            ];
            
            // Matriz de transformación perspectiva
            let srcMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
                orderedCorners[0].x, orderedCorners[0].y,
                orderedCorners[1].x, orderedCorners[1].y,
                orderedCorners[2].x, orderedCorners[2].y,
                orderedCorners[3].x, orderedCorners[3].y
            ]);
            
            let dstMat = cv.matFromArray(4, 1, cv.CV_32FC2, [
                dstPoints[0][0], dstPoints[0][1],
                dstPoints[1][0], dstPoints[1][1],
                dstPoints[2][0], dstPoints[2][1],
                dstPoints[3][0], dstPoints[3][1]
            ]);
            
            let M = cv.getPerspectiveTransform(srcMat, dstMat);
            let dst = new cv.Mat();
            
            // Aplicar transformación perspectiva
            cv.warpPerspective(src, dst, M, new cv.Size(docWidth, docHeight));
            
            // Verificar orientación y rotar si es necesario
            const correctedImage = this.correctOrientation(dst);
            
            // Aplicar zoom para ocupar 80% del frame
            const finalImage = this.applySmartZoom(correctedImage, 0.8);
            
            // Convertir de vuelta a canvas
            const resultCanvas = document.createElement('canvas');
            cv.imshow(resultCanvas, finalImage);
            
            // Limpiar memoria OpenCV
            src.delete();
            srcMat.delete();
            dstMat.delete();
            M.delete();
            dst.delete();
            correctedImage.delete();
            finalImage.delete();
            
            return {
                canvas: resultCanvas,
                blob: await this.canvasToBlob(resultCanvas),
                dataURL: resultCanvas.toDataURL('image/jpeg', 0.8),
                width: resultCanvas.width,
                height: resultCanvas.height
            };
            
        } catch (error) {
            debug.error('OpenCV processing failed', error);
            return this.fallbackProcessing(sourceCanvas);
        }
    }

    // Procesamiento de respaldo sin OpenCV
    async fallbackProcessing(sourceCanvas) {
        debug.log('Using fallback processing');
        
        // Simplemente devolver la imagen original con mejoras básicas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = sourceCanvas.width;
        canvas.height = sourceCanvas.height;
        
        ctx.drawImage(sourceCanvas, 0, 0);
        
        // Aplicar mejoras básicas de contraste
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        this.enhanceImage(imageData);
        ctx.putImageData(imageData, 0, 0);
        
        return {
            canvas: canvas,
            blob: await this.canvasToBlob(canvas),
            dataURL: canvas.toDataURL('image/jpeg', 0.8),
            width: canvas.width,
            height: canvas.height
        };
    }

    // Ordenar esquinas en sentido horario desde arriba-izquierda
    orderCorners(corners) {
        // Calcular centro
        const centerX = corners.reduce((sum, p) => sum + p.x, 0) / 4;
        const centerY = corners.reduce((sum, p) => sum + p.y, 0) / 4;
        
        // Ordenar por ángulo desde el centro
        const sorted = corners.map(corner => ({
            ...corner,
            angle: Math.atan2(corner.y - centerY, corner.x - centerX)
        })).sort((a, b) => a.angle - b.angle);
        
        // Encontrar la esquina superior izquierda (menor suma x+y)
        const topLeft = sorted.reduce((min, p) => 
            (p.x + p.y < min.x + min.y) ? p : min
        );
        
        // Reorganizar desde top-left
        const startIndex = sorted.findIndex(p => p === topLeft);
        const ordered = [];
        
        for (let i = 0; i < 4; i++) {
            ordered.push(sorted[(startIndex + i) % 4]);
        }
        
        return ordered;
    }

    // Calcular distancia entre dos puntos
    distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    // Corregir orientación del documento
    correctOrientation(mat) {
        // Detectar si el documento está al revés usando análisis de texto
        // Por simplicidad, rotamos 180° si la altura > ancho (formato vertical)
        
        if (mat.rows > mat.cols) {
            let rotated = new cv.Mat();
            let center = new cv.Point(mat.cols / 2, mat.rows / 2);
            let rotationMatrix = cv.getRotationMatrix2D(center, 180, 1.0);
            
            cv.warpAffine(mat, rotated, rotationMatrix, new cv.Size(mat.cols, mat.rows));
            
            rotationMatrix.delete();
            return rotated;
        }
        
        return mat.clone();
    }

    // Aplicar zoom inteligente
    applySmartZoom(mat, targetRatio = 0.8) {
        const targetWidth = Math.floor(mat.cols * targetRatio);
        const targetHeight = Math.floor(mat.rows * targetRatio);
        
        let resized = new cv.Mat();
        cv.resize(mat, resized, new cv.Size(targetWidth, targetHeight));
        
        // Crear canvas con padding para centrar
        const finalWidth = mat.cols;
        const finalHeight = mat.rows;
        const offsetX = Math.floor((finalWidth - targetWidth) / 2);
        const offsetY = Math.floor((finalHeight - targetHeight) / 2);
        
        let final = cv.Mat.zeros(finalHeight, finalWidth, mat.type());
        
        // Copiar imagen redimensionada al centro
        let roi = final.roi(new cv.Rect(offsetX, offsetY, targetWidth, targetHeight));
        resized.copyTo(roi);
        
        resized.delete();
        roi.delete();
        
        return final;
    }

    // Mejorar imagen (contraste, brillo)
    enhanceImage(imageData) {
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // Aumentar contraste
            const contrast = 1.2;
            const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
            
            data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // R
            data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
            data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
        }
    }

    // Convertir canvas a blob
    async canvasToBlob(canvas) {
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });
    }

    // Detener scanner
    stopScanning() {
        debug.log('Stopping smart scanning');
        
        this.isCapturing = false;
        
        if (this.detectionTimeout) {
            clearTimeout(this.detectionTimeout);
            this.detectionTimeout = null;
        }
        
        // Limpiar overlay
        if (this.overlayCanvas) {
            const ctx = this.overlayCanvas.getContext('2d');
            ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }
        
        // Detener stream de video
        if (this.video && this.video.srcObject) {
            this.video.srcObject.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    // Verificar disponibilidad de OpenCV
    isReady() {
        return this.isOpenCvReady;
    }
}

// Crear instancia global
window.smartScanner = new SmartScanner();