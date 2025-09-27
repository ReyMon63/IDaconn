/**
 * Sistema de Gestión de Tipos de Comprobante
 * Maneja Factura, Ticket y Manual con IA integrada
 */

class ExpenseTypeManager {
    constructor() {
        this.currentExpenseType = null;
        this.capturedTicketData = null;
        this.smartAmountDetector = null;
        this.videoStream = null;
        this.currentFacingMode = 'environment';
        
        debug.log('ExpenseTypeManager initialized');
        this.initializeSmartDetector();
        this.setupEventListeners();
    }

    // Inicializar detector de IA
    initializeSmartDetector() {
        try {
            if (typeof SmartAmountDetector !== 'undefined') {
                this.smartAmountDetector = new SmartAmountDetector();
                debug.log('SmartAmountDetector initialized successfully');
            } else {
                debug.warn('SmartAmountDetector not available');
            }
        } catch (error) {
            debug.error('Error initializing SmartAmountDetector:', error);
        }
    }

    // Configurar event listeners
    setupEventListeners() {
        // Modal de selección de tipo (botón original)
        document.getElementById('addExpenseBtn')?.addEventListener('click', (e) => {
            debug.log('Add expense button clicked');
            e.preventDefault();
            this.showExpenseTypeModal();
        });
        
        // Modal de selección de tipo (botón del header)
        document.getElementById('headerAddExpenseBtn')?.addEventListener('click', (e) => {
            debug.log('Header add expense button clicked');
            e.preventDefault();
            this.showExpenseTypeModal();
        });
        document.getElementById('closeExpenseTypeModal')?.addEventListener('click', () => this.closeExpenseTypeModal());

        // Botones de tipo de comprobante
        document.getElementById('expenseTypeFactura')?.addEventListener('click', () => this.openFacturaModal());
        document.getElementById('expenseTypeTicket')?.addEventListener('click', () => this.openTicketModal());
        document.getElementById('expenseTypeManual')?.addEventListener('click', () => this.openManualModal());

        // Factura modal
        this.setupFacturaEvents();
        
        // Ticket modal (cámara + IA)
        this.setupTicketEvents();
        
        // Manual modal
        this.setupManualEvents();

        debug.log('Event listeners configured');
    }

    // ========== MODAL DE SELECCIÓN DE TIPO ==========
    showExpenseTypeModal() {
        debug.log('Showing expense type modal');
        
        const selectedProject = window.projectManager?.getSelectedProject();
        if (!selectedProject) {
            auth.showErrorMessage('Por favor selecciona un proyecto primero');
            return;
        }

        document.getElementById('expenseTypeModal').classList.add('show');
    }

    closeExpenseTypeModal() {
        document.getElementById('expenseTypeModal').classList.remove('show');
    }

    // ========== FACTURA MODAL ==========
    setupFacturaEvents() {
        // Cerrar modal
        document.getElementById('closeFacturaModal')?.addEventListener('click', () => this.closeFacturaModal());
        document.getElementById('cancelFacturaBtn')?.addEventListener('click', () => this.closeFacturaModal());

        // File inputs
        document.getElementById('xmlFile')?.addEventListener('change', (e) => this.handleXMLFile(e));
        document.getElementById('pdfFile')?.addEventListener('change', (e) => this.handlePDFFile(e));

        // Form submission
        document.getElementById('facturaForm')?.addEventListener('submit', (e) => this.saveFactura(e));
    }

    openFacturaModal() {
        this.currentExpenseType = 'factura';
        this.closeExpenseTypeModal();
        document.getElementById('facturaModal').classList.add('show');
        debug.log('Factura modal opened');
    }

    closeFacturaModal() {
        document.getElementById('facturaModal').classList.remove('show');
        this.resetFacturaForm();
    }

    handleXMLFile(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('xmlFileName').textContent = file.name;
            document.getElementById('xmlFileName').classList.remove('hidden');
            debug.log('XML file selected:', file.name);
        }
    }

    handlePDFFile(event) {
        const file = event.target.files[0];
        if (file) {
            document.getElementById('pdfFileName').textContent = file.name;
            document.getElementById('pdfFileName').classList.remove('hidden');
            debug.log('PDF file selected:', file.name);
        }
    }

    async saveFactura(event) {
        event.preventDefault();
        
        try {
            const xmlFile = document.getElementById('xmlFile').files[0];
            const pdfFile = document.getElementById('pdfFile').files[0];
            const category = document.getElementById('facturaCategory').value;

            if (!xmlFile) throw new Error('Selecciona el archivo XML');
            if (!pdfFile) throw new Error('Selecciona el archivo PDF');
            if (!category) throw new Error('Selecciona una categoría');

            const selectedProject = window.projectManager?.getSelectedProject();
            
            // Simular procesamiento del XML para extraer monto
            const mockAmount = Math.floor(Math.random() * 5000) + 100; // Simular monto

            const expenseData = {
                project_id: selectedProject.id,
                user_id: auth.getCurrentUser().id,
                type: 'factura',
                category,
                amount: mockAmount,
                description: `Factura: ${xmlFile.name}`,
                xml_file: xmlFile.name,
                pdf_file: pdfFile.name,
                created_at: Date.now()
            };

            await db.createRecord('expenses', expenseData);
            await window.projectManager.updateProjectBalance();
            await window.projectManager.loadRecentExpenses();

            auth.showSuccessMessage(`Factura guardada: $${mockAmount.toFixed(2)}`);
            this.closeFacturaModal();
            this.showContinueDialog();

        } catch (error) {
            debug.error('Error saving factura:', error);
            auth.showErrorMessage('Error: ' + error.message);
        }
    }

    resetFacturaForm() {
        document.getElementById('facturaForm')?.reset();
        document.getElementById('xmlFileName')?.classList.add('hidden');
        document.getElementById('pdfFileName')?.classList.add('hidden');
    }

    // ========== TICKET MODAL (CÁMARA + IA) ==========
    setupTicketEvents() {
        // Cerrar modal
        document.getElementById('closeTicketModal')?.addEventListener('click', () => this.closeTicketModal());
        document.getElementById('cancelTicketBtn')?.addEventListener('click', () => this.closeTicketModal());

        // Camera controls
        document.getElementById('startTicketCamera')?.addEventListener('click', () => this.startTicketCamera());
        document.getElementById('uploadTicketPhoto')?.addEventListener('click', () => this.uploadTicketPhoto());
        document.getElementById('ticketFileInput')?.addEventListener('change', (e) => this.handleTicketFileUpload(e));
        document.getElementById('captureTicketPhoto')?.addEventListener('click', () => this.captureTicketPhoto());
        document.getElementById('switchTicketCamera')?.addEventListener('click', () => this.switchTicketCamera());
        document.getElementById('retakeTicketPhoto')?.addEventListener('click', () => this.retakeTicketPhoto());
        document.getElementById('processTicketOCR')?.addEventListener('click', () => this.processTicketOCR());

        // Smart amount suggestions
        this.setupTicketSmartAmountEvents();

        // Form submission
        document.getElementById('ticketForm')?.addEventListener('submit', (e) => this.saveTicket(e));

        // Reportes buttons
        document.getElementById('viewReportsBtn')?.addEventListener('click', () => this.openReports());
        document.getElementById('headerViewReportsBtn')?.addEventListener('click', () => this.openReports());
    }

    openTicketModal() {
        debug.log('Opening ticket modal');
        this.currentExpenseType = 'ticket';
        this.closeExpenseTypeModal();
        
        // Asegurar que el modal se resetee antes de mostrar
        this.resetTicketModal();
        document.getElementById('ticketModal').classList.add('show');
        
        debug.log('Ticket modal opened');
    }

    closeTicketModal() {
        this.stopTicketCamera();
        document.getElementById('ticketModal').classList.remove('show');
        this.resetTicketModal();
    }

    resetTicketModal() {
        // Reset camera
        document.getElementById('ticketVideo').classList.add('hidden');
        document.getElementById('ticketCanvas').classList.add('hidden');
        document.getElementById('ticketPlaceholder').classList.remove('hidden');
        
        // Reset controls
        document.getElementById('ticketCameraControls').classList.remove('hidden');
        document.getElementById('ticketActiveControls').classList.add('hidden');
        document.getElementById('ticketRetakeControls').classList.add('hidden');
        
        // Reset results
        document.getElementById('ticketResultsSection').classList.add('hidden');
        document.getElementById('ticketAmountSuggestions').classList.add('hidden');
        
        // Reset form
        document.getElementById('ticketForm')?.reset();
        
        this.capturedTicketData = null;
    }

    uploadTicketPhoto() {
        debug.log('Opening file picker for ticket photo');
        document.getElementById('ticketFileInput').click();
    }

    handleTicketFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        debug.log('File selected for ticket:', file.name);

        // Validar que sea imagen
        if (!file.type.startsWith('image/')) {
            auth.showErrorMessage('Por favor selecciona una imagen válida');
            return;
        }

        // Convertir a canvas
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.getElementById('ticketCanvas');
                const ctx = canvas.getContext('2d');

                // Ajustar canvas al tamaño de la imagen
                canvas.width = img.width;
                canvas.height = img.height;

                // Dibujar imagen en canvas
                ctx.drawImage(img, 0, 0);

                // Mostrar canvas y ocultar placeholder
                document.getElementById('ticketPlaceholder').classList.add('hidden');
                canvas.classList.remove('hidden');

                // Cambiar controles
                document.getElementById('ticketCameraControls').classList.add('hidden');
                document.getElementById('ticketRetakeControls').classList.remove('hidden');

                // Guardar datos de imagen
                this.capturedTicketData = canvas.toDataURL('image/jpeg', 0.8);

                auth.showSuccessMessage('Foto cargada - Presiona "Analizar con IA"');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    async startTicketCamera() {
        try {
            debug.log('Starting ticket camera');
            
            const constraints = {
                video: {
                    facingMode: this.currentFacingMode,
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 }
                }
            };

            this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            const video = document.getElementById('ticketVideo');
            video.srcObject = this.videoStream;

            // Show video and controls
            document.getElementById('ticketPlaceholder').classList.add('hidden');
            video.classList.remove('hidden');
            document.getElementById('ticketCameraControls').classList.add('hidden');
            document.getElementById('ticketActiveControls').classList.remove('hidden');

            auth.showSuccessMessage('Cámara activa - Captura tu ticket');
            
        } catch (error) {
            debug.error('Error accessing ticket camera:', error);
            let errorMessage = 'Error desconocido';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Permisos de cámara denegados';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No se encontró cámara en el dispositivo';
            } else {
                errorMessage = error.message;
            }
            
            auth.showErrorMessage('❌ ' + errorMessage);
        }
    }

    async captureTicketPhoto() {
        try {
            const video = document.getElementById('ticketVideo');
            const canvas = document.getElementById('ticketCanvas');
            const ctx = canvas.getContext('2d');

            // Set canvas size
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw frame
            ctx.drawImage(video, 0, 0);

            // Stop video
            this.stopTicketCamera();

            // Show canvas
            video.classList.add('hidden');
            canvas.classList.remove('hidden');

            // Update controls
            document.getElementById('ticketActiveControls').classList.add('hidden');
            document.getElementById('ticketRetakeControls').classList.remove('hidden');

            // Store image data
            this.capturedTicketData = canvas.toDataURL('image/jpeg', 0.8);

            auth.showSuccessMessage('Foto capturada - Presiona "Analizar con IA"');
            
        } catch (error) {
            debug.error('Error capturing ticket photo:', error);
            auth.showErrorMessage('Error al capturar foto: ' + error.message);
        }
    }

    async switchTicketCamera() {
        this.currentFacingMode = this.currentFacingMode === 'environment' ? 'user' : 'environment';
        
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            await this.startTicketCamera();
        }
    }

    retakeTicketPhoto() {
        this.resetTicketModal();
    }

    stopTicketCamera() {
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }
    }

    async processTicketOCR() {
        if (!this.capturedTicketData) {
            auth.showErrorMessage('No hay imagen para procesar');
            return;
        }

        if (!this.smartAmountDetector) {
            auth.showErrorMessage('Sistema de IA no disponible');
            return;
        }

        try {
            debug.log('Processing ticket with OCR and AI');
            auth.showInfoMessage('🔍 Analizando ticket con IA...');

            // Verificar que Tesseract esté disponible
            if (typeof Tesseract === 'undefined') {
                throw new Error('OCR no disponible');
            }

            // Process with Tesseract
            const { data: { text, confidence } } = await Tesseract.recognize(
                this.capturedTicketData,
                'eng',
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            const percent = Math.round(m.progress * 100);
                            auth.showInfoMessage(`🔍 Analizando texto... ${percent}%`);
                        }
                    },
                    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK
                }
            );

            debug.log('OCR completed:', { textLength: text.length, confidence });

            if (!text.trim()) {
                auth.showWarningMessage('No se detectó texto en la imagen');
                document.getElementById('ticketResultsSection').classList.remove('hidden');
                return;
            }

            // Process with Smart Amount Detection
            const amountAnalysis = this.smartAmountDetector.analyzeAmounts(text, confidence / 100);
            debug.log('Smart amount analysis:', amountAnalysis);

            if (amountAnalysis.suggested) {
                this.showTicketAmountSuggestions(amountAnalysis);
                document.getElementById('ticketAmount').value = amountAnalysis.suggested.value.toFixed(2);
                auth.showSuccessMessage(`🤖 IA sugiere: $${amountAnalysis.suggested.value.toFixed(2)}`);
            } else {
                auth.showWarningMessage('No se pudieron detectar montos válidos');
            }

            // Show results section
            document.getElementById('ticketResultsSection').classList.remove('hidden');

        } catch (error) {
            debug.error('OCR Error:', error);
            auth.showErrorMessage('Error en análisis: ' + error.message);
            // Mostrar formulario aunque falle el OCR
            document.getElementById('ticketResultsSection').classList.remove('hidden');
        }
    }

    showTicketAmountSuggestions(analysis) {
        const suggestionsDiv = document.getElementById('ticketAmountSuggestions');
        const suggestedButton = document.getElementById('ticketSuggestedAmount');
        const confidenceSpan = document.getElementById('ticketAiConfidence');
        const alternativesDiv = document.getElementById('ticketAlternatives');
        const showAlternativesBtn = document.getElementById('showTicketAlternatives');

        // Show main suggestion
        const suggested = analysis.suggested;
        suggestedButton.querySelector('span').textContent = `$${suggested.value.toFixed(2)}`;
        confidenceSpan.textContent = `${Math.round(analysis.confidence * 100)}%`;

        // Create alternatives
        if (analysis.alternatives && analysis.alternatives.length > 0) {
            alternativesDiv.innerHTML = '';
            
            analysis.alternatives.forEach((alt, index) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'ticket-alternative-amount text-xs p-1 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors';
                button.textContent = `$${alt.value.toFixed(2)}`;
                button.title = `Confianza: ${Math.round(alt.totalScore || 0)}%`;
                alternativesDiv.appendChild(button);
            });

            showAlternativesBtn.classList.remove('hidden');
        } else {
            showAlternativesBtn.classList.add('hidden');
        }

        suggestionsDiv.classList.remove('hidden');
    }

    setupTicketSmartAmountEvents() {
        // Main suggestion click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'ticketSuggestedAmount' || e.target.closest('#ticketSuggestedAmount')) {
                const button = e.target.closest('#ticketSuggestedAmount') || e.target;
                const amount = button.querySelector('span')?.textContent.replace('$', '') || '0';
                document.getElementById('ticketAmount').value = amount;
                
                // Visual feedback
                button.classList.add('bg-green-100', 'border-green-400');
                setTimeout(() => {
                    button.classList.remove('bg-green-100', 'border-green-400');
                }, 500);
            }

            // Show alternatives toggle
            if (e.target.id === 'showTicketAlternatives') {
                const alternatives = document.getElementById('ticketAlternativeAmounts');
                const button = e.target;
                
                if (alternatives.classList.contains('hidden')) {
                    alternatives.classList.remove('hidden');
                    button.textContent = 'Ocultar alternativas';
                } else {
                    alternatives.classList.add('hidden');
                    button.textContent = 'Ver más opciones detectadas';
                }
            }

            // Alternative amount clicks
            if (e.target.classList.contains('ticket-alternative-amount')) {
                const amount = e.target.textContent.replace('$', '');
                document.getElementById('ticketAmount').value = amount;
                
                // Visual feedback
                e.target.classList.add('bg-green-100', 'border-green-400');
                setTimeout(() => {
                    e.target.classList.remove('bg-green-100', 'border-green-400');
                }, 500);
            }
        });
    }

    async saveTicket(event) {
        event.preventDefault();
        
        try {
            const category = document.getElementById('ticketCategory').value;
            const amount = parseFloat(document.getElementById('ticketAmount').value);
            const description = document.getElementById('ticketDescription').value.trim();

            if (!category) throw new Error('Selecciona una categoría');
            if (isNaN(amount) || amount <= 0) throw new Error('Ingresa un monto válido');

            const selectedProject = window.projectManager?.getSelectedProject();
            
            const expenseData = {
                project_id: selectedProject.id,
                user_id: auth.getCurrentUser().id,
                type: 'ticket',
                category,
                amount,
                description: description || 'Ticket registrado con IA',
                receipt_image: this.capturedTicketData || '',
                ai_processed: true,
                created_at: Date.now()
            };

            await db.createRecord('expenses', expenseData);
            await window.projectManager.updateProjectBalance();
            await window.projectManager.loadRecentExpenses();

            auth.showSuccessMessage(`Ticket guardado: $${amount.toFixed(2)}`);
            this.closeTicketModal();
            this.showContinueDialog();

        } catch (error) {
            debug.error('Error saving ticket:', error);
            auth.showErrorMessage('Error: ' + error.message);
        }
    }

    // ========== MANUAL MODAL ==========
    setupManualEvents() {
        // Cerrar modal
        document.getElementById('closeManualModal')?.addEventListener('click', () => this.closeManualModal());
        document.getElementById('cancelManualBtn')?.addEventListener('click', () => this.closeManualModal());

        // Set current date by default
        document.getElementById('manualDate').value = new Date().toISOString().split('T')[0];

        // Form submission
        document.getElementById('manualForm')?.addEventListener('submit', (e) => this.saveManual(e));
    }

    openManualModal() {
        this.currentExpenseType = 'manual';
        this.closeExpenseTypeModal();
        document.getElementById('manualModal').classList.add('show');
        // Set current date
        document.getElementById('manualDate').value = new Date().toISOString().split('T')[0];
        debug.log('Manual modal opened');
    }

    closeManualModal() {
        document.getElementById('manualModal').classList.remove('show');
        document.getElementById('manualForm')?.reset();
    }

    async saveManual(event) {
        event.preventDefault();
        
        try {
            const date = document.getElementById('manualDate').value;
            const amount = parseFloat(document.getElementById('manualAmount').value);
            const concept = document.getElementById('manualConcept').value.trim();
            const category = document.getElementById('manualCategory').value;

            if (!date) throw new Error('Selecciona una fecha');
            if (isNaN(amount) || amount <= 0) throw new Error('Ingresa un monto válido');
            if (!concept) throw new Error('Ingresa un concepto');
            if (!category) throw new Error('Selecciona una categoría');

            const selectedProject = window.projectManager?.getSelectedProject();
            
            const expenseData = {
                project_id: selectedProject.id,
                user_id: auth.getCurrentUser().id,
                type: 'manual',
                category,
                amount,
                description: concept,
                expense_date: new Date(date).getTime(),
                created_at: Date.now()
            };

            await db.createRecord('expenses', expenseData);
            await window.projectManager.updateProjectBalance();
            await window.projectManager.loadRecentExpenses();

            auth.showSuccessMessage(`Gasto manual guardado: $${amount.toFixed(2)}`);
            this.closeManualModal();
            this.showContinueDialog();

        } catch (error) {
            debug.error('Error saving manual expense:', error);
            auth.showErrorMessage('Error: ' + error.message);
        }
    }

    // ========== DIÁLOGO CONTINUAR ==========
    showContinueDialog() {
        this.showCustomConfirm(
            '¿Deseas registrar otro gasto?',
            () => {
                // SÍ - Volver al selector de tipo
                this.showExpenseTypeModal();
            },
            () => {
                // NO - Preguntar por reportes o logout
                this.showCustomConfirm(
                    '¿Deseas ver los reportes de tus gastos?',
                    () => {
                        // SÍ - Ir a reportes
                        document.getElementById('viewReportsBtn')?.click();
                    },
                    () => {
                        // NO - Cerrar sesión automáticamente
                        if (confirm('Cerrando sesión...')) {
                            document.getElementById('logoutBtn')?.click();
                        }
                    }
                );
            }
        );
    }

    // Diálogo personalizado con SÍ/NO
    showCustomConfirm(message, onYes, onNo) {
        // Crear modal personalizado
        const modalHTML = `
            <div id="customConfirmModal" class="modal show">
                <div class="modal-content max-w-sm">
                    <div class="text-center p-6">
                        <i class="fas fa-question-circle text-4xl text-blue-600 mb-4"></i>
                        <h3 class="text-lg font-bold mb-4">${message}</h3>
                        <div class="flex gap-3">
                            <button id="confirmNo" class="btn-touch flex-1 bg-gray-500 hover:bg-gray-600 text-white rounded-lg">
                                NO
                            </button>
                            <button id="confirmYes" class="btn-touch flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                SÍ
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Event listeners
        document.getElementById('confirmYes').onclick = () => {
            document.getElementById('customConfirmModal').remove();
            if (onYes) onYes();
        };

        document.getElementById('confirmNo').onclick = () => {
            document.getElementById('customConfirmModal').remove();
            if (onNo) onNo();
        };
    }
    // Abrir reportes
    openReports() {
        debug.log('Opening reports');
        if (window.reportManager) {
            window.reportManager.showReportsModal();
        } else {
            auth.showErrorMessage('Sistema de reportes no disponible');
        }
    }
}

// Crear instancia global
window.expenseTypeManager = new ExpenseTypeManager();