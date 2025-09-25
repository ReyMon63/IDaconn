/**
 * Sistema de Gestión de Gastos
 * Maneja captura de fotos, OCR y registro de gastos
 */

class ExpenseManager {
    constructor() {
        this.currentExpense = null;
        this.isCapturing = false;
        
        debug.log('ExpenseManager initialized');
        this.setupExpenseModal();
    }

    // Configurar modal de gastos
    setupExpenseModal() {
        // Crear modal de registro de gastos dinámicamente
        this.createExpenseModal();
        
        // Configurar eventos
        this.setupExpenseEvents();
        
        debug.log('Expense modal configured');
    }

    // Crear modal de gastos
    createExpenseModal() {
        const modalHTML = `
            <div id="expenseModal" class="modal">
                <div class="modal-content max-w-lg">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold">Registrar Gasto</h2>
                        <button id="closeExpenseModal" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- Captura de Foto -->
                    <div id="cameraSection" class="mb-6">
                        <h3 class="text-lg font-medium mb-3">1. Capturar Recibo</h3>
                        
                        <div id="cameraContainer" class="relative bg-gray-100 rounded-lg overflow-hidden mb-4" style="height: 300px;">
                            <video id="expenseVideo" class="w-full h-full object-cover hidden" autoplay playsinline></video>
                            <canvas id="previewCanvas" class="w-full h-full object-cover hidden"></canvas>
                            
                            <!-- Overlay de guía -->
                            <div id="cameraOverlay" class="absolute inset-4 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center">
                                <div class="text-center text-gray-600">
                                    <i class="fas fa-camera text-4xl mb-2"></i>
                                    <p class="text-sm">Presiona "Iniciar Cámara" para capturar el recibo</p>
                                </div>
                            </div>
                            
                            <!-- Controles de cámara -->
                            <div id="cameraControls" class="absolute bottom-4 left-1/2 transform -translate-x-1/2 hidden">
                                <div class="flex gap-3">
                                    <button id="captureBtn" class="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700">
                                        <i class="fas fa-camera"></i>
                                    </button>
                                    <button id="switchCameraBtn" class="bg-gray-600 text-white p-3 rounded-full hover:bg-gray-700">
                                        <i class="fas fa-sync-alt"></i>
                                    </button>
                                    <button id="stopCameraBtn" class="bg-red-600 text-white p-3 rounded-full hover:bg-red-700">
                                        <i class="fas fa-stop"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex gap-3">
                            <button id="startCameraBtn" class="btn-touch flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                <i class="fas fa-camera mr-2"></i> Iniciar Cámara
                            </button>
                            <button id="retakeBtn" class="btn-touch flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg hidden">
                                <i class="fas fa-redo mr-2"></i> Repetir
                            </button>
                        </div>
                    </div>

                    <!-- OCR y Datos del Gasto -->
                    <div id="expenseDataSection" class="space-y-4 hidden">
                        <h3 class="text-lg font-medium">2. Confirmar Datos</h3>
                        
                        <!-- Resultado de OCR -->
                        <div id="ocrResult" class="bg-gray-50 rounded-lg p-4 hidden">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium">Texto detectado:</span>
                                <span id="ocrConfidence" class="text-xs text-gray-600">Confianza: 0%</span>
                            </div>
                            <div id="ocrText" class="text-sm text-gray-700 max-h-20 overflow-y-auto"></div>
                        </div>

                        <form id="expenseForm" class="space-y-4">
                            <!-- Categoría -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Categoría:</label>
                                <select id="expenseCategory" class="w-full px-4 py-3 border rounded-lg text-base" required>
                                    <option value="">Seleccionar categoría...</option>
                                    <option value="Producción">Producción</option>
                                    <option value="Comercial">Comercial</option>
                                    <option value="Administración">Administración</option>
                                </select>
                            </div>

                            <!-- Monto -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Monto (MXN):</label>
                                <input type="number" id="expenseAmount" step="0.01" min="0" 
                                       class="w-full px-4 py-3 border rounded-lg text-base" 
                                       placeholder="0.00" required>
                            </div>

                            <!-- Descripción -->
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Descripción:</label>
                                <textarea id="expenseDescription" rows="3"
                                          class="w-full px-4 py-3 border rounded-lg text-base"
                                          placeholder="Descripción del gasto (opcional)"></textarea>
                            </div>

                            <!-- Botones -->
                            <div class="flex gap-3 pt-4">
                                <button type="button" id="cancelExpenseBtn" 
                                        class="btn-touch flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg">
                                    Cancelar
                                </button>
                                <button type="submit" id="saveExpenseBtn"
                                        class="btn-touch flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg">
                                    Guardar Gasto
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- Estados de procesamiento -->
                    <div id="processingState" class="hidden text-center py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p id="processingText" class="text-gray-600">Procesando imagen...</p>
                    </div>
                </div>
            </div>
        `;

        // Agregar modal al DOM si no existe
        if (!document.getElementById('expenseModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    // Configurar eventos del modal de gastos
    setupExpenseEvents() {
        // Cerrar modal
        const closeBtn = document.getElementById('closeExpenseModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeExpenseModal());
        }

        // Iniciar cámara
        const startCameraBtn = document.getElementById('startCameraBtn');
        if (startCameraBtn) {
            startCameraBtn.addEventListener('click', () => this.startCamera());
        }

        // Capturar foto
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        // Cambiar cámara
        const switchBtn = document.getElementById('switchCameraBtn');
        if (switchBtn) {
            switchBtn.addEventListener('click', () => this.switchCamera());
        }

        // Detener cámara
        const stopBtn = document.getElementById('stopCameraBtn');
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopCamera());
        }

        // Repetir captura
        const retakeBtn = document.getElementById('retakeBtn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => this.retakePhoto());
        }

        // Formulario de gasto
        const expenseForm = document.getElementById('expenseForm');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => this.saveExpense(e));
        }

        // Cancelar
        const cancelBtn = document.getElementById('cancelExpenseBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeExpenseModal());
        }

        // Cerrar modal al hacer click fuera
        const modal = document.getElementById('expenseModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeExpenseModal();
                }
            });
        }
    }

    // Mostrar modal de gastos
    showExpenseModal() {
        debug.log('Showing expense modal');

        const selectedProject = window.projectManager?.getSelectedProject();
        if (!selectedProject) {
            auth.showErrorMessage('Por favor selecciona un proyecto primero');
            return;
        }

        const modal = document.getElementById('expenseModal');
        if (modal) {
            modal.classList.add('show');
            this.resetExpenseModal();
        }
    }

    // Cerrar modal de gastos
    closeExpenseModal() {
        debug.log('Closing expense modal');

        this.stopCamera();
        
        const modal = document.getElementById('expenseModal');
        if (modal) {
            modal.classList.remove('show');
        }
        
        this.currentExpense = null;
    }

    // Resetear modal a estado inicial
    resetExpenseModal() {
        // Ocultar secciones
        document.getElementById('expenseDataSection')?.classList.add('hidden');
        document.getElementById('processingState')?.classList.add('hidden');
        document.getElementById('cameraControls')?.classList.add('hidden');
        document.getElementById('retakeBtn')?.classList.add('hidden');
        
        // Mostrar cámara
        document.getElementById('cameraSection')?.classList.remove('hidden');
        document.getElementById('startCameraBtn')?.classList.remove('hidden');
        document.getElementById('cameraOverlay')?.classList.remove('hidden');
        
        // Limpiar formulario
        const form = document.getElementById('expenseForm');
        if (form) form.reset();
        
        // Ocultar video y canvas
        const video = document.getElementById('expenseVideo');
        const canvas = document.getElementById('previewCanvas');
        if (video) video.classList.add('hidden');
        if (canvas) canvas.classList.add('hidden');
    }

    // Iniciar scanner inteligente
    async startCamera() {
        try {
            debug.log('Starting smart scanner for expense');
            
            const video = document.getElementById('expenseVideo');
            const overlayCanvas = document.getElementById('overlayCanvas');
            const statusDiv = document.getElementById('scannerStatus');
            const statusText = document.getElementById('statusText');
            
            if (!video || !overlayCanvas) {
                debug.error('Video or overlay canvas not found');
                return;
            }

            // Mostrar estado de inicialización
            statusDiv?.classList.remove('hidden');
            if (statusText) statusText.textContent = '🚀 Iniciando scanner inteligente...';

            // Iniciar scanner inteligente con OpenCV
            await window.smartScanner.startScanning(video, overlayCanvas);

            // Actualizar UI
            document.getElementById('cameraOverlay')?.classList.add('hidden');
            document.getElementById('cameraControls')?.classList.remove('hidden');
            document.getElementById('startCameraBtn')?.classList.add('hidden');
            video.classList.remove('hidden');
            overlayCanvas.classList.remove('hidden');
            
            if (statusText) statusText.textContent = '📄 Busca un documento para escanear';

            debug.log('Smart scanner started successfully');

        } catch (error) {
            debug.error('Failed to start smart scanner', error);
            auth.showErrorMessage('Error al iniciar scanner inteligente: ' + error.message);
            
            // Fallback a cámara normal
            await this.startFallbackCamera();
        }
    }

    // Cámara de respaldo si el scanner inteligente falla
    async startFallbackCamera() {
        try {
            debug.log('Starting fallback camera');
            
            const video = document.getElementById('expenseVideo');
            if (!video) return;

            await window.cameraManager.startCamera(video, {
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // Mostrar controles básicos
            document.getElementById('cameraOverlay')?.classList.add('hidden');
            document.getElementById('cameraControls')?.classList.remove('hidden');
            document.getElementById('startCameraBtn')?.classList.add('hidden');
            video.classList.remove('hidden');
            
            const statusText = document.getElementById('statusText');
            if (statusText) statusText.textContent = '📸 Modo cámara básica - Presiona capturar';

        } catch (error) {
            debug.error('Fallback camera also failed', error);
            auth.showErrorMessage('Error al acceder a la cámara: ' + error.message);
        }
    }

    // Capturar con scanner inteligente
    async capturePhoto() {
        try {
            debug.log('Capturing with smart scanner');

            if (this.isCapturing) return;
            this.isCapturing = true;

            // Mostrar estado de procesamiento
            this.showProcessingState('📄 Capturando documento...');
            
            let photoData;
            
            try {
                // Intentar captura con scanner inteligente
                photoData = await window.smartScanner.captureDetectedDocument();
                debug.log('Smart scanner capture successful');
                
            } catch (smartError) {
                debug.warn('Smart scanner failed, using fallback', smartError);
                
                // Fallback a captura normal
                this.showProcessingState('📸 Capturando con cámara básica...');
                photoData = await window.cameraManager.capturePhoto(0.8);
            }
            
            // Mostrar preview del documento capturado
            this.showPhotoPreview(photoData);
            
            // Procesar con OCR mejorado
            this.showProcessingState('🔍 Leyendo texto con OCR...');
            const ocrResult = await window.ocrManager.processImage(photoData);
            
            // Mostrar datos del gasto
            this.showExpenseData(ocrResult, photoData);
            
        } catch (error) {
            debug.error('Failed to capture document', error);
            auth.showErrorMessage('Error al capturar documento: ' + error.message);
            this.hideProcessingState();
        } finally {
            this.isCapturing = false;
        }
    }

    // Mostrar preview de foto
    showPhotoPreview(photoData) {
        const canvas = document.getElementById('previewCanvas');
        const video = document.getElementById('expenseVideo');
        
        if (canvas && photoData) {
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = photoData.width;
                canvas.height = photoData.height;
                ctx.drawImage(img, 0, 0);
                
                // Mostrar canvas y ocultar video
                canvas.classList.remove('hidden');
                video?.classList.add('hidden');
                
                // Mostrar botón de repetir
                document.getElementById('retakeBtn')?.classList.remove('hidden');
            };
            
            img.src = photoData.dataURL;
        }
    }

    // Mostrar estado de procesamiento
    showProcessingState(message) {
        const processingState = document.getElementById('processingState');
        const processingText = document.getElementById('processingText');
        
        if (processingState) processingState.classList.remove('hidden');
        if (processingText) processingText.textContent = message;
        
        // Ocultar controles de cámara
        document.getElementById('cameraControls')?.classList.add('hidden');
    }

    // Ocultar estado de procesamiento
    hideProcessingState() {
        const processingState = document.getElementById('processingState');
        if (processingState) processingState.classList.add('hidden');
    }

    // Mostrar datos del gasto
    showExpenseData(ocrResult, photoData) {
        debug.log('Showing expense data', ocrResult);

        // Ocultar procesamiento
        this.hideProcessingState();
        
        // Mostrar sección de datos
        document.getElementById('expenseDataSection')?.classList.remove('hidden');
        
        // Mostrar resultado OCR si hay texto
        if (ocrResult.text) {
            const ocrResultDiv = document.getElementById('ocrResult');
            const ocrTextDiv = document.getElementById('ocrText');
            const ocrConfidenceSpan = document.getElementById('ocrConfidence');
            
            if (ocrResultDiv) ocrResultDiv.classList.remove('hidden');
            if (ocrTextDiv) ocrTextDiv.textContent = ocrResult.text.substring(0, 200) + '...';
            if (ocrConfidenceSpan) {
                ocrConfidenceSpan.textContent = `Confianza: ${Math.round(ocrResult.confidence * 100)}%`;
            }
        }
        
        // Pre-llenar monto si se detectó
        const amountInput = document.getElementById('expenseAmount');
        if (amountInput && ocrResult.suggestedAmount) {
            amountInput.value = ocrResult.suggestedAmount.toFixed(2);
        }
        
        // Guardar datos actuales
        this.currentExpense = {
            photo: photoData,
            ocr: ocrResult,
            timestamp: Date.now()
        };
    }

    // Repetir foto
    retakePhoto() {
        debug.log('Retaking photo');
        
        // Volver a mostrar video
        const video = document.getElementById('expenseVideo');
        const canvas = document.getElementById('previewCanvas');
        
        if (video) video.classList.remove('hidden');
        if (canvas) canvas.classList.add('hidden');
        
        // Mostrar controles
        document.getElementById('cameraControls')?.classList.remove('hidden');
        document.getElementById('retakeBtn')?.classList.add('hidden');
        
        // Ocultar datos del gasto
        document.getElementById('expenseDataSection')?.classList.add('hidden');
        
        this.currentExpense = null;
    }

    // Cambiar cámara
    async switchCamera() {
        try {
            await window.cameraManager.switchCamera();
        } catch (error) {
            debug.error('Failed to switch camera', error);
            auth.showErrorMessage('Error al cambiar cámara: ' + error.message);
        }
    }

    // Detener scanner y cámara
    stopCamera() {
        debug.log('Stopping smart scanner and camera');
        
        // Detener scanner inteligente
        if (window.smartScanner) {
            window.smartScanner.stopScanning();
        }
        
        // Detener cámara básica
        window.cameraManager.stopCamera();
        
        // Resetear UI completa
        const video = document.getElementById('expenseVideo');
        const canvas = document.getElementById('previewCanvas');
        const overlayCanvas = document.getElementById('overlayCanvas');
        const statusDiv = document.getElementById('scannerStatus');
        
        if (video) video.classList.add('hidden');
        if (canvas) canvas.classList.add('hidden');
        if (overlayCanvas) {
            overlayCanvas.classList.add('hidden');
            // Limpiar overlay
            const ctx = overlayCanvas.getContext('2d');
            ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }
        if (statusDiv) statusDiv.classList.add('hidden');
        
        document.getElementById('cameraControls')?.classList.add('hidden');
        document.getElementById('cameraOverlay')?.classList.remove('hidden');
        document.getElementById('startCameraBtn')?.classList.remove('hidden');
    }

    // Guardar gasto
    async saveExpense(e) {
        e.preventDefault();
        
        const saveBtn = document.getElementById('saveExpenseBtn');
        if (!saveBtn) return;
        
        try {
            debug.log('Saving expense');
            
            auth.setButtonLoading(saveBtn, true);
            
            // Obtener proyecto seleccionado
            const selectedProject = window.projectManager?.getSelectedProject();
            if (!selectedProject) {
                throw new Error('No hay proyecto seleccionado');
            }
            
            // Obtener datos del formulario
            const category = document.getElementById('expenseCategory')?.value;
            const amount = parseFloat(document.getElementById('expenseAmount')?.value || 0);
            const description = document.getElementById('expenseDescription')?.value?.trim();
            
            // Validar datos
            if (!category) throw new Error('Selecciona una categoría');
            if (amount <= 0) throw new Error('El monto debe ser mayor a cero');
            
            // Crear registro de gasto
            const expenseData = {
                project_id: selectedProject.id,
                user_id: auth.getCurrentUser().id,
                category,
                amount,
                description: description || 'Gasto registrado via captura de foto',
                receipt_image: this.currentExpense?.photo?.dataURL || '',
                ocr_confidence: this.currentExpense?.ocr?.confidence || 0
            };
            
            // Guardar en base de datos
            await db.createRecord('expenses', expenseData);
            
            // Actualizar saldo del proyecto
            await window.projectManager.updateProjectBalance();
            
            // Actualizar gastos recientes
            await window.projectManager.loadRecentExpenses();
            
            // Cerrar modal
            this.closeExpenseModal();
            
            // Mostrar éxito
            auth.showSuccessMessage('Gasto registrado exitosamente');
            
        } catch (error) {
            debug.error('Failed to save expense', error);
            auth.showErrorMessage('Error al guardar gasto: ' + error.message);
        } finally {
            auth.setButtonLoading(saveBtn, false);
        }
    }
}

// Crear instancia global
window.expenseManager = new ExpenseManager();