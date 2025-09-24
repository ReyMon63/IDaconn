/**
 * Sistema Principal de la Aplicación
 * Coordina todos los componentes y maneja la funcionalidad general
 */

class App {
    constructor() {
        this.isInitialized = false;
        this.currentScreen = null;
        
        debug.log('App initializing');
        
        // Inicializar cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    // Inicializar aplicación
    async init() {
        try {
            debug.log('Starting app initialization');
            
            // Configurar eventos globales
            this.setupGlobalEvents();
            
            // Configurar PWA
            this.setupPWA();
            
            // Configurar botones de acción
            this.setupActionButtons();
            
            // Marcar como inicializada
            this.isInitialized = true;
            
            debug.log('App initialized successfully');
            
        } catch (error) {
            debug.error('App initialization failed', error);
        }
    }

    // Configurar eventos globales
    setupGlobalEvents() {
        debug.log('Setting up global events');
        
        // Manejar errores de ventana
        window.addEventListener('error', (e) => {
            debug.error('Window error', e.error);
        });
        
        // Manejar cambios de conectividad
        window.addEventListener('online', () => {
            debug.log('Connection restored');
            this.showConnectivityStatus('Conexión restaurada', 'success');
        });
        
        window.addEventListener('offline', () => {
            debug.log('Connection lost');
            this.showConnectivityStatus('Sin conexión - Trabajando offline', 'warning');
        });
        
        // Prevenir zoom accidental en móviles
        document.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Manejar orientación en dispositivos móviles
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                debug.log('Orientation changed', window.orientation);
                this.handleOrientationChange();
            }, 100);
        });
        
        // Manejar redimensionamiento de ventana
        window.addEventListener('resize', () => {
            debug.log('Window resized', {
                width: window.innerWidth,
                height: window.innerHeight
            });
        });
    }

    // Configurar PWA
    setupPWA() {
        debug.log('Setting up PWA');
        
        // Detectar si es una PWA instalada
        if (window.matchMedia('(display-mode: standalone)').matches) {
            debug.log('Running as PWA');
            document.body.classList.add('pwa-mode');
        }
        
        // Manejar instalación de PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            debug.log('PWA install prompt available');
            e.preventDefault();
            
            // Guardar el evento para uso posterior
            window.installPrompt = e;
            
            // Mostrar botón de instalación personalizado si se desea
            this.showInstallButton();
        });
        
        // Detectar cuando se instala la PWA
        window.addEventListener('appinstalled', () => {
            debug.log('PWA was installed');
            this.hideInstallButton();
        });
    }

    // Mostrar botón de instalación
    showInstallButton() {
        debug.log('Showing PWA install button');
        
        // Crear botón de instalación si no existe
        if (!document.getElementById('installBtn')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'installBtn';
            installBtn.className = 'fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg z-40';
            installBtn.innerHTML = '<i class="fas fa-download"></i>';
            installBtn.title = 'Instalar App';
            
            installBtn.addEventListener('click', () => this.installPWA());
            
            document.body.appendChild(installBtn);
        }
    }

    // Ocultar botón de instalación
    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    // Instalar PWA
    async installPWA() {
        if (window.installPrompt) {
            try {
                const result = await window.installPrompt.prompt();
                debug.log('PWA install result', result);
                
                if (result.outcome === 'accepted') {
                    debug.log('User accepted PWA installation');
                } else {
                    debug.log('User dismissed PWA installation');
                }
                
                window.installPrompt = null;
                this.hideInstallButton();
                
            } catch (error) {
                debug.error('PWA installation failed', error);
            }
        }
    }

    // Configurar botones de acción principales
    setupActionButtons() {
        debug.log('Setting up action buttons');
        
        // Botón agregar gasto
        const addExpenseBtn = document.getElementById('addExpenseBtn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => this.showAddExpense());
        }
        
        // Botón ver reportes
        const viewReportsBtn = document.getElementById('viewReportsBtn');
        if (viewReportsBtn) {
            viewReportsBtn.addEventListener('click', () => this.showReports());
        }
    }

    // Mostrar pantalla de agregar gasto
    showAddExpense() {
        debug.log('Showing add expense screen');
        
        const selectedProject = window.projectManager?.getSelectedProject();
        if (!selectedProject) {
            auth.showErrorMessage('Por favor selecciona un proyecto primero');
            return;
        }
        
        // Mostrar modal de captura de gastos
        if (window.expenseManager) {
            window.expenseManager.showExpenseModal();
        } else {
            auth.showErrorMessage('Sistema de gastos no disponible');
        }
    }

    // Mostrar pantalla de reportes
    showReports() {
        debug.log('Showing reports screen');
        
        // Mostrar modal de reportes
        if (window.reportManager) {
            window.reportManager.showReportsModal();
        } else {
            auth.showErrorMessage('Sistema de reportes no disponible');
        }
    }

    // Mostrar modal "próximamente"
    showComingSoonModal(title, description) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">${title}</h2>
                    <button class="close-modal text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="text-center py-8">
                    <i class="fas fa-tools text-6xl text-blue-600 mb-4"></i>
                    <h3 class="text-lg font-semibold mb-4">¡Próximamente!</h3>
                    <p class="text-gray-600 whitespace-pre-line">${description}</p>
                </div>
                
                <div class="flex justify-center mt-6">
                    <button class="close-modal btn-touch bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8">
                        Entendido
                    </button>
                </div>
            </div>
        `;
        
        // Agregar eventos de cierre
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => modal.remove());
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        document.body.appendChild(modal);
        
        // Auto-remover después de 10 segundos
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    }

    // Mostrar estado de conectividad
    showConnectivityStatus(message, type = 'info') {
        const colors = {
            success: 'bg-green-500',
            warning: 'bg-yellow-500',
            error: 'bg-red-500',
            info: 'bg-blue-500'
        };
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-4 right-4 ${colors[type]} text-white p-3 rounded-lg z-50 shadow-lg text-center`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Manejar cambio de orientación
    handleOrientationChange() {
        // Reajustar elementos que puedan verse afectados por el cambio de orientación
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            // Forzar recálculo del layout
            modal.style.display = 'none';
            modal.offsetHeight; // Trigger reflow
            modal.style.display = 'flex';
        });
    }

    // Mostrar loading overlay
    showLoading() {
        const overlay = debug.validateElement('#loadingOverlay', 'app');
        if (overlay) {
            overlay.classList.remove('hidden');
        }
    }

    // Ocultar loading overlay
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    // Verificar compatibilidad del navegador
    checkBrowserCompatibility() {
        const features = {
            localStorage: typeof Storage !== "undefined",
            fetch: typeof fetch !== "undefined",
            promise: typeof Promise !== "undefined",
            serviceWorker: 'serviceWorker' in navigator,
            camera: navigator.mediaDevices && navigator.mediaDevices.getUserMedia,
            geolocation: 'geolocation' in navigator
        };
        
        debug.log('Browser compatibility check', features);
        
        const incompatibleFeatures = Object.entries(features)
            .filter(([key, supported]) => !supported)
            .map(([key]) => key);
        
        if (incompatibleFeatures.length > 0) {
            debug.warn('Some features not supported', incompatibleFeatures);
            
            // Mostrar advertencia al usuario si hay características críticas no soportadas
            const criticalFeatures = ['localStorage', 'fetch', 'promise'];
            const criticalMissing = incompatibleFeatures.filter(f => criticalFeatures.includes(f));
            
            if (criticalMissing.length > 0) {
                this.showBrowserWarning(criticalMissing);
            }
        }
        
        return features;
    }

    // Mostrar advertencia de navegador
    showBrowserWarning(missingFeatures) {
        const warning = document.createElement('div');
        warning.className = 'fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4';
        warning.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-md text-center">
                <i class="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
                <h2 class="text-xl font-bold mb-4">Navegador No Compatible</h2>
                <p class="text-gray-600 mb-4">
                    Tu navegador no soporta algunas características necesarias: 
                    <strong>${missingFeatures.join(', ')}</strong>
                </p>
                <p class="text-sm text-gray-500 mb-4">
                    Para una mejor experiencia, actualiza tu navegador o usa Chrome, Firefox, Safari o Edge recientes.
                </p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Continuar de todos modos
                </button>
            </div>
        `;
        
        document.body.appendChild(warning);
    }

    // Obtener información del dispositivo
    getDeviceInfo() {
        const info = {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio,
            touch: 'ontouchstart' in window,
            orientation: screen.orientation?.type || 'unknown'
        };
        
        debug.log('Device info', info);
        return info;
    }
}

// Inicializar aplicación
window.app = new App();

// Verificar compatibilidad cuando se carga
document.addEventListener('DOMContentLoaded', () => {
    window.app.checkBrowserCompatibility();
    window.app.getDeviceInfo();
    
    // Ocultar loading después de inicialización
    setTimeout(() => {
        window.app.hideLoading();
    }, 1000);
});