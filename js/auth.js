/**
 * Sistema de Autenticación con Validaciones Robustas
 * Maneja login, registro y gestión de sesiones
 */

class Auth {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 horas
        this.initializeAuth();
        debug.log('Auth system initialized');
    }

    // Inicializar sistema de autenticación
    initializeAuth() {
        try {
            // Verificar sesión existente
            const savedSession = localStorage.getItem('userSession');
            if (savedSession) {
                const session = JSON.parse(savedSession);
                
                // Verificar si la sesión no ha expirado
                if (Date.now() - session.timestamp < this.sessionTimeout) {
                    this.currentUser = session.user;
                    debug.log('Session restored', { userId: this.currentUser.id });
                    this.showDashboard();
                    return;
                }
            }
            
            // No hay sesión válida, mostrar login
            this.showLogin();
            
        } catch (error) {
            debug.error('Failed to initialize auth', error);
            this.showLogin();
        }
    }

    // Mostrar pantalla de login
    showLogin() {
        debug.log('Showing login screen');
        
        this.hideAllScreens();
        const loginScreen = debug.validateElement('#loginScreen', 'auth');
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
        }
        
        this.setupLoginForm();
    }

    // Mostrar pantalla de registro
    showRegister() {
        debug.log('Showing register screen');
        
        this.hideAllScreens();
        const registerScreen = debug.validateElement('#registerScreen', 'auth');
        if (registerScreen) {
            registerScreen.classList.remove('hidden');
        }
        
        this.setupRegisterForm();
    }

    // Mostrar dashboard
    showDashboard() {
        debug.log('Showing dashboard');
        
        this.hideAllScreens();
        
        const dashboardScreen = debug.validateElement('#dashboardScreen', 'auth');
        const navbar = debug.validateElement('#navbar', 'auth');
        const bottomNav = debug.validateElement('#bottomNav', 'auth');
        
        if (dashboardScreen) dashboardScreen.classList.remove('hidden');
        if (navbar) navbar.classList.remove('hidden');
        if (bottomNav) bottomNav.classList.remove('hidden');
        
        this.updateUserInfo();
        this.loadUserData();
    }

    // Ocultar todas las pantallas
    hideAllScreens() {
        const screens = ['#loginScreen', '#registerScreen', '#dashboardScreen'];
        screens.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        const navbar = document.querySelector('#navbar');
        const bottomNav = document.querySelector('#bottomNav');
        if (navbar) navbar.classList.add('hidden');
        if (bottomNav) bottomNav.classList.add('hidden');
    }

    // Configurar formulario de login
    setupLoginForm() {
        const form = debug.validateElement('#loginForm', 'auth');
        const submitBtn = debug.validateElement('#loginSubmit', 'auth');
        const showRegisterBtn = debug.validateElement('#showRegisterBtn', 'auth');
        
        if (!form || !submitBtn) return;

        // Remover listeners anteriores
        form.removeEventListener('submit', this.handleLogin);
        
        // Agregar listener de submit
        form.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Mostrar registro
        if (showRegisterBtn) {
            showRegisterBtn.removeEventListener('click', () => this.showRegister());
            showRegisterBtn.addEventListener('click', () => this.showRegister());
        }
    }

    // Configurar formulario de registro
    setupRegisterForm() {
        const form = debug.validateElement('#registerForm', 'auth');
        const backBtn = debug.validateElement('#backToLoginBtn', 'auth');
        
        if (!form) return;

        // Remover listeners anteriores
        form.removeEventListener('submit', this.handleRegister);
        
        // Agregar listener de submit
        form.addEventListener('submit', (e) => this.handleRegister(e));
        
        // Volver al login
        if (backBtn) {
            backBtn.removeEventListener('click', () => this.showLogin());
            backBtn.addEventListener('click', () => this.showLogin());
        }
    }

    // Manejar login
    async handleLogin(e) {
        e.preventDefault();
        
        const submitBtn = debug.validateElement('#loginSubmit', 'auth');
        if (!submitBtn) return;
        
        try {
            debug.log('Processing login attempt');
            
            // Mostrar estado de carga
            this.setButtonLoading(submitBtn, true);
            
            // Obtener datos del formulario
            const email = document.getElementById('loginEmail')?.value?.trim();
            const password = document.getElementById('loginPassword')?.value;
            
            // Validar datos
            const validation = debug.validateFormData({ email, password }, ['email', 'password']);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Validar formato de email
            if (!/\S+@\S+\.\S+/.test(email)) {
                throw new Error('Formato de email inválido');
            }
            
            // Intentar autenticar
            const user = await debug.timeAsyncFunction('User Authentication', 
                () => db.authenticateUser(email, password)
            );
            
            // Guardar sesión
            this.setSession(user);
            
            // Mostrar dashboard
            this.showDashboard();
            
            debug.log('Login successful', { userId: user.id, role: user.role });
            
        } catch (error) {
            debug.error('Login failed', error);
            this.showErrorMessage('Error de inicio de sesión: ' + error.message);
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Manejar registro
    async handleRegister(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (!submitBtn) return;
        
        try {
            debug.log('Processing registration attempt');
            
            // Mostrar estado de carga
            this.setButtonLoading(submitBtn, true);
            
            // Obtener datos del formulario
            const name = document.getElementById('regName')?.value?.trim();
            const email = document.getElementById('regEmail')?.value?.trim();
            const password = document.getElementById('regPassword')?.value;
            
            // Validar datos
            const validation = debug.validateFormData({ name, email, password }, ['name', 'email', 'password']);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Validaciones adicionales
            if (name.length < 2) {
                throw new Error('El nombre debe tener al menos 2 caracteres');
            }
            
            if (!/\S+@\S+\.\S+/.test(email)) {
                throw new Error('Formato de email inválido');
            }
            
            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }
            
            // Verificar que el email no esté registrado
            const existingUsers = await db.getRecords('users', { search: email });
            if (existingUsers.data.some(u => u.email === email)) {
                throw new Error('Este email ya está registrado');
            }
            
            // Crear nuevo usuario
            const newUser = {
                name,
                email,
                password,
                role: 'user',
                status: 'pending'
            };
            
            await debug.timeAsyncFunction('User Registration', 
                () => db.createRecord('users', newUser)
            );
            
            // Mostrar mensaje de éxito
            this.showSuccessMessage('Registro exitoso. Tu cuenta está pendiente de aprobación por el administrador.');
            
            // Volver al login
            setTimeout(() => this.showLogin(), 2000);
            
            debug.log('Registration successful', { email });
            
        } catch (error) {
            debug.error('Registration failed', error);
            this.showErrorMessage('Error de registro: ' + error.message);
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Establecer sesión
    setSession(user) {
        this.currentUser = user;
        
        const session = {
            user: user,
            timestamp: Date.now()
        };
        
        localStorage.setItem('userSession', JSON.stringify(session));
        debug.log('Session established', { userId: user.id });
    }

    // Cerrar sesión
    logout() {
        debug.log('Logging out user', { userId: this.currentUser?.id });
        
        this.currentUser = null;
        localStorage.removeItem('userSession');
        
        // Limpiar cache
        db.clearCache();
        
        this.showLogin();
    }

    // Actualizar información del usuario en la UI
    updateUserInfo() {
        if (!this.currentUser) return;
        
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            userInfo.textContent = `${this.currentUser.name} (${this.currentUser.role})`;
        }
        
        // Mostrar controles de admin si es necesario
        const adminControls = document.getElementById('adminControls');
        if (adminControls) {
            if (this.currentUser.role === 'admin') {
                adminControls.classList.remove('hidden');
            } else {
                adminControls.classList.add('hidden');
            }
        }
    }

    // Cargar datos del usuario
    async loadUserData() {
        try {
            debug.log('Loading user data');
            
            // Cargar proyectos
            if (window.projectManager) {
                await window.projectManager.loadProjects();
            }
            
        } catch (error) {
            debug.error('Failed to load user data', error);
        }
    }

    // Establecer estado de carga en botón
    setButtonLoading(button, loading) {
        if (!button) return;
        
        if (loading) {
            button.classList.add('btn-loading');
            button.disabled = true;
            button.style.pointerEvents = 'none';
        } else {
            button.classList.remove('btn-loading');
            button.disabled = false;
            button.style.pointerEvents = 'auto';
        }
    }

    // Mostrar mensaje de error
    showErrorMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-4 right-4 bg-red-500 text-white p-4 rounded-lg z-50 shadow-lg';
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    <span>${message}</span>
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

    // Mostrar mensaje de éxito
    showSuccessMessage(message) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 left-4 right-4 bg-green-500 text-white p-4 rounded-lg z-50 shadow-lg';
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <i class="fas fa-check-circle mr-2"></i>
                    <span>${message}</span>
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

    // Verificar si el usuario actual es admin
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // Obtener usuario actual
    getCurrentUser() {
        return this.currentUser;
    }

    // Verificar si hay sesión activa
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Crear instancia global
window.auth = new Auth();

// Configurar logout cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                auth.logout();
            }
        });
    }
});