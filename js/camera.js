/**
 * Sistema de Captura de Fotos y OCR para Móviles
 * Optimizado para capturar recibos y detectar montos
 */

class CameraManager {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.isCapturing = false;
        this.supportedConstraints = null;
        
        debug.log('CameraManager initialized');
        this.checkCameraSupport();
    }

    // Verificar soporte de cámara
    checkCameraSupport() {
        const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        debug.log('Camera support check', { hasCamera });
        
        if (hasCamera) {
            try {
                this.supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
                debug.log('Camera constraints supported', this.supportedConstraints);
            } catch (error) {
                debug.warn('Failed to get supported constraints', error);
            }
        }
        
        return hasCamera;
    }

    // Iniciar captura de cámara
    async startCamera(videoElement, options = {}) {
        try {
            debug.log('Starting camera', options);
            
            if (!this.checkCameraSupport()) {
                throw new Error('Cámara no soportada en este dispositivo');
            }

            // Configuración optimizada para documentos
            const constraints = {
                video: {
                    facingMode: { ideal: 'environment' }, // Cámara trasera preferida
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    aspectRatio: { ideal: 16/9 },
                    ...options.video
                },
                audio: false
            };

            debug.log('Requesting camera with constraints', constraints);

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoElement) {
                this.video = videoElement;
                this.video.srcObject = this.stream;
                this.video.setAttribute('playsinline', true);
                this.video.setAttribute('webkit-playsinline', true);
                
                // Configurar video para mejor experiencia
                this.video.style.width = '100%';
                this.video.style.height = 'auto';
                this.video.style.objectFit = 'cover';
                
                await new Promise((resolve, reject) => {
                    this.video.onloadedmetadata = () => {
                        this.video.play();
                        resolve();
                    };
                    this.video.onerror = reject;
                    setTimeout(reject, 10000); // Timeout de 10s
                });
            }

            debug.log('Camera started successfully');
            return this.stream;

        } catch (error) {
            debug.error('Failed to start camera', error);
            throw new Error(`Error al acceder a la cámara: ${error.message}`);
        }
    }

    // Detener cámara
    stopCamera() {
        debug.log('Stopping camera');
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
                debug.log('Camera track stopped', track.label);
            });
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
        }

        this.isCapturing = false;
    }

    // Capturar foto
    async capturePhoto(quality = 0.9) {
        try {
            debug.log('Capturing photo', { quality });

            if (!this.video || !this.stream) {
                throw new Error('Cámara no iniciada');
            }

            if (this.isCapturing) {
                throw new Error('Ya se está capturando una foto');
            }

            this.isCapturing = true;

            // Crear canvas para captura
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Obtener dimensiones del video
            const videoWidth = this.video.videoWidth;
            const videoHeight = this.video.videoHeight;

            debug.log('Video dimensions', { videoWidth, videoHeight });

            if (videoWidth === 0 || videoHeight === 0) {
                throw new Error('Video no está listo para captura');
            }

            // Configurar canvas
            canvas.width = videoWidth;
            canvas.height = videoHeight;

            // Dibujar frame del video
            ctx.drawImage(this.video, 0, 0, videoWidth, videoHeight);

            // Aplicar mejoras para documentos
            this.enhanceDocumentImage(ctx, videoWidth, videoHeight);

            // Convertir a blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg', quality);
            });

            // Crear data URL para preview
            const dataURL = canvas.toDataURL('image/jpeg', quality);

            debug.log('Photo captured successfully', {
                size: blob.size,
                width: videoWidth,
                height: videoHeight
            });

            this.isCapturing = false;

            return {
                blob,
                dataURL,
                width: videoWidth,
                height: videoHeight,
                timestamp: Date.now()
            };

        } catch (error) {
            this.isCapturing = false;
            debug.error('Photo capture failed', error);
            throw error;
        }
    }

    // Mejorar imagen de documento
    enhanceDocumentImage(ctx, width, height) {
        debug.log('Enhancing document image');

        try {
            // Obtener datos de imagen
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Aplicar mejoras básicas
            for (let i = 0; i < data.length; i += 4) {
                // Aumentar contraste
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                
                // Ajuste de contraste simple
                const contrast = 1.2;
                const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
                
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // R
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
            }

            // Aplicar imagen mejorada
            ctx.putImageData(imageData, 0, 0);

        } catch (error) {
            debug.warn('Image enhancement failed', error);
        }
    }

    // Cambiar cámara (frontal/trasera)
    async switchCamera() {
        try {
            debug.log('Switching camera');

            if (!this.stream) {
                throw new Error('No hay stream activo');
            }

            // Obtener configuración actual
            const videoTrack = this.stream.getVideoTracks()[0];
            const settings = videoTrack.getSettings();
            
            // Alternar entre frontal y trasera
            const newFacingMode = settings.facingMode === 'environment' ? 'user' : 'environment';
            
            debug.log('Switching to facing mode', newFacingMode);

            // Detener stream actual
            this.stopCamera();

            // Iniciar con nueva configuración
            await this.startCamera(this.video, {
                video: { facingMode: { exact: newFacingMode } }
            });

        } catch (error) {
            debug.error('Camera switch failed', error);
            
            // Intentar reiniciar con configuración por defecto
            try {
                this.stopCamera();
                await this.startCamera(this.video);
            } catch (fallbackError) {
                debug.error('Camera fallback failed', fallbackError);
                throw new Error('No se pudo cambiar de cámara');
            }
        }
    }

    // Obtener información de cámaras disponibles
    async getCameraList() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices.filter(device => device.kind === 'videoinput');
            
            debug.log('Available cameras', videoInputs);
            return videoInputs;

        } catch (error) {
            debug.error('Failed to get camera list', error);
            return [];
        }
    }

    // Verificar permisos de cámara
    async checkCameraPermissions() {
        try {
            if (!navigator.permissions) {
                debug.warn('Permissions API not supported');
                return 'unknown';
            }

            const permission = await navigator.permissions.query({ name: 'camera' });
            debug.log('Camera permission status', permission.state);
            
            return permission.state;

        } catch (error) {
            debug.error('Failed to check camera permissions', error);
            return 'unknown';
        }
    }
}

// Crear instancia global
window.cameraManager = new CameraManager();