/**
 * Sistema de Debugging Completo para Webapp de Gastos
 * Incluye logging, error handling, y monitoreo de performance
 */

class Debug {
    constructor() {
        this.isEnabled = localStorage.getItem('debug_mode') === 'true';
        this.logs = [];
        this.maxLogs = 100;
        this.startTime = Date.now();
        
        // Configurar handlers globales de errores
        this.setupErrorHandlers();
        
        // Activar modo debug si está en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.enableDebug();
        }
        
        this.log('Debug system initialized');
    }

    setupErrorHandlers() {
        // Capturar errores JavaScript no manejados
        window.addEventListener('error', (event) => {
            this.error('JavaScript Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error?.stack
            });
        });

        // Capturar promesas rechazadas
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection:', event.reason);
        });
    }

    enableDebug() {
        this.isEnabled = true;
        localStorage.setItem('debug_mode', 'true');
        document.body.classList.add('debug-mode');
        this.log('Debug mode enabled');
        this.updateDebugPanel();
    }

    disableDebug() {
        this.isEnabled = false;
        localStorage.setItem('debug_mode', 'false');
        document.body.classList.remove('debug-mode');
        this.log('Debug mode disabled');
    }

    toggleDebug() {
        if (this.isEnabled) {
            this.disableDebug();
        } else {
            this.enableDebug();
        }
    }

    log(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: 'LOG',
            message,
            data,
            stack: new Error().stack
        };

        this.logs.push(logEntry);
        
        // Mantener solo los últimos logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        if (this.isEnabled) {
            console.log(`[${timestamp}] ${message}`, data || '');
            this.updateDebugPanel();
        }
    }

    warn(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: 'WARN',
            message,
            data,
            stack: new Error().stack
        };

        this.logs.push(logEntry);

        if (this.isEnabled) {
            console.warn(`[${timestamp}] ${message}`, data || '');
            this.updateDebugPanel();
        }
    }

    error(message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: 'ERROR',
            message,
            data,
            stack: new Error().stack
        };

        this.logs.push(logEntry);

        // Los errores siempre se muestran
        console.error(`[${timestamp}] ${message}`, data || '');
        
        if (this.isEnabled) {
            this.updateDebugPanel();
        }

        // Mostrar notificación de error al usuario
        this.showErrorNotification(message);
    }

    showErrorNotification(message) {
        // Crear notificación de error
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50 shadow-lg';
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    <span class="font-medium">Error:</span> ${message}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    updateDebugPanel() {
        const panel = document.getElementById('debugContent');
        if (!panel || !this.isEnabled) return;

        const recentLogs = this.logs.slice(-5).reverse();
        const content = recentLogs.map(log => 
            `[${log.level}] ${log.message} ${log.data ? JSON.stringify(log.data).substring(0, 50) : ''}`
        ).join('<br>');

        panel.innerHTML = content || 'No logs';
    }

    // Medir performance de funciones
    timeFunction(name, fn) {
        const start = performance.now();
        try {
            const result = fn();
            const end = performance.now();
            this.log(`${name} completed in ${(end - start).toFixed(2)}ms`);
            return result;
        } catch (error) {
            const end = performance.now();
            this.error(`${name} failed after ${(end - start).toFixed(2)}ms`, error);
            throw error;
        }
    }

    // Medir performance de funciones async
    async timeAsyncFunction(name, fn) {
        const start = performance.now();
        try {
            const result = await fn();
            const end = performance.now();
            this.log(`${name} completed in ${(end - start).toFixed(2)}ms`);
            return result;
        } catch (error) {
            const end = performance.now();
            this.error(`${name} failed after ${(end - start).toFixed(2)}ms`, error);
            throw error;
        }
    }

    // Validar que un elemento existe antes de usarlo
    validateElement(selector, context = 'general') {
        const element = document.querySelector(selector);
        if (!element) {
            this.error(`Element not found: ${selector} in context: ${context}`);
            return null;
        }
        this.log(`Element found: ${selector} in context: ${context}`);
        return element;
    }

    // Validar datos de formulario
    validateFormData(formData, requiredFields) {
        const errors = [];
        
        requiredFields.forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                errors.push(`Campo requerido: ${field}`);
            }
        });

        if (errors.length > 0) {
            this.error('Form validation failed', errors);
            return { valid: false, errors };
        }

        this.log('Form validation passed', formData);
        return { valid: true, errors: [] };
    }

    // Monitorear llamadas a API
    monitorApiCall(endpoint, method = 'GET', data = null) {
        this.log(`API Call: ${method} ${endpoint}`, data);
        
        return {
            success: (response) => {
                this.log(`API Success: ${method} ${endpoint}`, response);
            },
            error: (error) => {
                this.error(`API Error: ${method} ${endpoint}`, error);
            }
        };
    }

    // Exportar logs para debugging
    exportLogs() {
        const logsData = {
            logs: this.logs,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            uptime: Date.now() - this.startTime
        };

        const blob = new Blob([JSON.stringify(logsData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.log('Debug logs exported');
    }

    // Obtener información del sistema
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            screen: {
                width: screen.width,
                height: screen.height,
                availWidth: screen.availWidth,
                availHeight: screen.availHeight
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : 'Unknown',
            memory: navigator.deviceMemory || 'Unknown',
            cores: navigator.hardwareConcurrency || 'Unknown',
            touch: 'ontouchstart' in window,
            online: navigator.onLine,
            localStorage: this.checkLocalStorageSupport(),
            serviceWorker: 'serviceWorker' in navigator
        };
    }

    checkLocalStorageSupport() {
        try {
            const test = '__test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
}

// Crear instancia global
window.debug = new Debug();

// Shortcut para activar debug con Ctrl+Shift+D
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        window.debug.toggleDebug();
    }
});

// Shortcut para exportar logs con Ctrl+Shift+L
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        window.debug.exportLogs();
    }
});

// Shortcut para resetear datos demo con Ctrl+Shift+R
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (window.app && typeof window.app.resetDemoData === 'function') {
            window.app.resetDemoData();
        }
    }
});

console.log('Debug system loaded - Use Ctrl+Shift+D to toggle debug mode');
