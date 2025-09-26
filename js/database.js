/**
 * Sistema de Base de Datos con Validaciones Robustas
 * Maneja todas las operaciones CRUD con el RESTful Table API
 */

class Database {
    constructor() {
        this.baseUrl = '';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        
        // Asegurar inicialización correcta
        setTimeout(() => {
            this.initializeLocalData();
        }, 100);
        
        debug.log('Database system initialized with localStorage');
    }

    // Inicializar datos demo en localStorage
    initializeLocalData() {
        debug.log('Initializing demo data in localStorage');
        
        // Forzar reinicialización si los datos están corruptos
        const forceInit = !this.validateLocalData();
        
        // Inicializar usuarios
        if (!localStorage.getItem('table_users') || forceInit) {
            this.createDemoUsers();
        }
        
        if (!localStorage.getItem('table_projects') || forceInit) {
            this.createDemoProjects();
        }
        
        if (!localStorage.getItem('table_deposits') || forceInit) {
            this.createDemoDeposits();
        }
        
        // Expenses se crean dinámicamente
        if (!localStorage.getItem('table_expenses')) {
            localStorage.setItem('table_expenses', JSON.stringify([]));
        }
        
        debug.log('Local data initialization complete');
    }

    // Validar que los datos locales sean correctos
    validateLocalData() {
        try {
            const users = JSON.parse(localStorage.getItem('table_users') || '[]');
            const hasAdmin = users.some(u => u.role === 'admin' && u.status === 'active');
            
            if (!hasAdmin) {
                debug.warn('No active admin found, forcing data reinitialization');
                return false;
            }
            
            return users.length > 0;
        } catch (error) {
            debug.error('Local data validation failed', error);
            return false;
        }
    }

    // Crear usuarios demo
    createDemoUsers() {
        const users = [
            {
                id: "admin-001",
                email: "ramon.rivas@me.com",
                password: "admin123",
                name: "Ramón Rivas",
                role: "admin",
                status: "active",
                created_at: 1640995200000
            },
            {
                id: "admin-002",
                email: "admin@sistema.com",
                password: "admin123",
                name: "Administrador Sistema",
                role: "admin",
                status: "active",
                created_at: 1640995200000
            },
            {
                id: "user-001",
                email: "maria@empresa.com", 
                password: "user123",
                name: "María González",
                role: "user",
                status: "active",
                created_at: 1640995200000
            },
            {
                id: "user-002",
                email: "juan@empresa.com",
                password: "user123", 
                name: "Juan Pérez",
                role: "user",
                status: "pending",
                created_at: 1640995200000
            }
        ];
        
        localStorage.setItem('table_users', JSON.stringify(users));
        debug.log('Demo users created', users.length);
    }

    // Crear proyectos demo
    createDemoProjects() {
        const projects = [
            {
                id: "proj-001",
                name: "Proyecto Alpha",
                description: "Desarrollo de nueva aplicación web para el cliente ABC",
                budget: 50000,
                status: "active",
                created_by: "admin-001",
                created_at: 1640995200000
            },
            {
                id: "proj-002", 
                name: "Campaña Beta",
                description: "Campaña de marketing digital para lanzamiento de producto",
                budget: 75000,
                status: "active",
                created_by: "admin-001",
                created_at: 1640995200000
            },
            {
                id: "proj-003",
                name: "Oficinas 2024", 
                description: "Renovación de oficinas centrales",
                budget: 30000,
                status: "active",
                created_by: "admin-001",
                created_at: 1640995200000
            }
        ];
        
        localStorage.setItem('table_projects', JSON.stringify(projects));
        debug.log('Demo projects created', projects.length);
    }

    // Crear depósitos demo
    createDemoDeposits() {
        const deposits = [
            {
                id: "dep-001",
                project_id: "proj-001",
                amount: 10000,
                description: "Depósito inicial proyecto Alpha",
                created_by: "admin-001",
                created_at: 1640995200000
            },
            {
                id: "dep-002",
                project_id: "proj-002", 
                amount: 15000,
                description: "Primer adelanto campaña Beta",
                created_by: "admin-001",
                created_at: 1640995200000
            }
        ];
        
        localStorage.setItem('table_deposits', JSON.stringify(deposits));
        debug.log('Demo deposits created', deposits.length);
    }

    // Generar ID único
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Simulación de petición HTTP usando localStorage
    async makeRequest(endpoint, options = {}) {
        const monitor = debug.monitorApiCall(endpoint, options.method || 'GET', options.body);
        
        try {
            debug.log(`Making localStorage request to: ${endpoint}`, options);
            
            // Simular delay de red
            await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
            
            const method = options.method || 'GET';
            const tableName = this.extractTableName(endpoint);
            
            let result;
            
            switch (method) {
                case 'GET':
                    if (endpoint.includes('/') && endpoint.split('/').length > 2) {
                        // GET single record
                        const recordId = endpoint.split('/').pop();
                        result = this.getLocalRecord(tableName, recordId);
                    } else {
                        // GET all records
                        result = this.getLocalRecords(tableName);
                    }
                    break;
                    
                case 'POST':
                    const createData = JSON.parse(options.body);
                    result = this.createLocalRecord(tableName, createData);
                    break;
                    
                case 'PUT':
                    const updateData = JSON.parse(options.body);
                    const updateId = endpoint.split('/').pop();
                    result = this.updateLocalRecord(tableName, updateId, updateData);
                    break;
                    
                case 'PATCH':
                    const patchData = JSON.parse(options.body);
                    const patchId = endpoint.split('/').pop();
                    result = this.patchLocalRecord(tableName, patchId, patchData);
                    break;
                    
                case 'DELETE':
                    const deleteId = endpoint.split('/').pop();
                    result = this.deleteLocalRecord(tableName, deleteId);
                    break;
                    
                default:
                    throw new Error(`Method ${method} not supported`);
            }

            monitor.success(result);
            return result;
            
        } catch (error) {
            monitor.error(error);
            throw new Error(`Database request failed: ${error.message}`);
        }
    }

    // Extraer nombre de tabla del endpoint
    extractTableName(endpoint) {
        if (endpoint.startsWith('tables/')) {
            return endpoint.split('/')[1];
        }
        return endpoint.split('/')[0];
    }

    // Obtener datos locales de una tabla
    getLocalRecords(tableName) {
        const data = JSON.parse(localStorage.getItem(`table_${tableName}`) || '[]');
        return {
            data: data,
            total: data.length,
            page: 1,
            limit: 1000,
            table: tableName
        };
    }

    // Obtener un registro local
    getLocalRecord(tableName, recordId) {
        const data = JSON.parse(localStorage.getItem(`table_${tableName}`) || '[]');
        const record = data.find(r => r.id === recordId);
        if (!record) {
            throw new Error(`Record ${recordId} not found in ${tableName}`);
        }
        return record;
    }

    // Crear registro local
    createLocalRecord(tableName, data) {
        const records = JSON.parse(localStorage.getItem(`table_${tableName}`) || '[]');
        
        // Agregar campos del sistema
        const newRecord = {
            ...data,
            id: data.id || this.generateId(),
            created_at: data.created_at || Date.now(),
            updated_at: Date.now()
        };
        
        records.push(newRecord);
        localStorage.setItem(`table_${tableName}`, JSON.stringify(records));
        
        return newRecord;
    }

    // Actualizar registro local completo
    updateLocalRecord(tableName, recordId, data) {
        const records = JSON.parse(localStorage.getItem(`table_${tableName}`) || '[]');
        const index = records.findIndex(r => r.id === recordId);
        
        if (index === -1) {
            throw new Error(`Record ${recordId} not found in ${tableName}`);
        }
        
        const updatedRecord = {
            ...data,
            id: recordId,
            updated_at: Date.now()
        };
        
        records[index] = updatedRecord;
        localStorage.setItem(`table_${tableName}`, JSON.stringify(records));
        
        return updatedRecord;
    }

    // Actualizar registro local parcialmente
    patchLocalRecord(tableName, recordId, data) {
        const records = JSON.parse(localStorage.getItem(`table_${tableName}`) || '[]');
        const index = records.findIndex(r => r.id === recordId);
        
        if (index === -1) {
            throw new Error(`Record ${recordId} not found in ${tableName}`);
        }
        
        const updatedRecord = {
            ...records[index],
            ...data,
            updated_at: Date.now()
        };
        
        records[index] = updatedRecord;
        localStorage.setItem(`table_${tableName}`, JSON.stringify(records));
        
        return updatedRecord;
    }

    // Eliminar registro local
    deleteLocalRecord(tableName, recordId) {
        const records = JSON.parse(localStorage.getItem(`table_${tableName}`) || '[]');
        const filteredRecords = records.filter(r => r.id !== recordId);
        
        if (filteredRecords.length === records.length) {
            throw new Error(`Record ${recordId} not found in ${tableName}`);
        }
        
        localStorage.setItem(`table_${tableName}`, JSON.stringify(filteredRecords));
        return null;
    }

    // Validar datos antes de enviar
    validateData(tableName, data, isUpdate = false) {
        debug.log(`Validating data for table: ${tableName}`, data);
        
        const errors = [];
        
        // Validaciones específicas por tabla
        switch (tableName) {
            case 'users':
                if (!isUpdate || data.email) {
                    if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) {
                        errors.push('Email válido es requerido');
                    }
                }
                if (!isUpdate || data.password) {
                    if (!data.password || data.password.length < 6) {
                        errors.push('Contraseña debe tener al menos 6 caracteres');
                    }
                }
                if (!isUpdate || data.name) {
                    if (!data.name || data.name.trim().length < 2) {
                        errors.push('Nombre debe tener al menos 2 caracteres');
                    }
                }
                break;
                
            case 'projects':
                if (!isUpdate || data.name) {
                    if (!data.name || data.name.trim().length < 3) {
                        errors.push('Nombre del proyecto debe tener al menos 3 caracteres');
                    }
                }
                if (!isUpdate || data.budget !== undefined) {
                    if (data.budget === undefined || data.budget < 0) {
                        errors.push('Presupuesto debe ser un número positivo');
                    }
                }
                break;
                
            case 'expenses':
                if (!isUpdate || data.project_id) {
                    if (!data.project_id) {
                        errors.push('ID del proyecto es requerido');
                    }
                }
                if (!isUpdate || data.amount !== undefined) {
                    if (data.amount === undefined || data.amount <= 0) {
                        errors.push('Monto debe ser mayor a cero');
                    }
                }
                if (!isUpdate || data.category) {
                    const validCategories = ['Producción', 'Comercial', 'Administración'];
                    if (!data.category || !validCategories.includes(data.category)) {
                        errors.push('Categoría debe ser: Producción, Comercial o Administración');
                    }
                }
                break;
                
            case 'deposits':
                if (!isUpdate || data.project_id) {
                    if (!data.project_id) {
                        errors.push('ID del proyecto es requerido');
                    }
                }
                if (!isUpdate || data.amount !== undefined) {
                    if (data.amount === undefined || data.amount <= 0) {
                        errors.push('Monto debe ser mayor a cero');
                    }
                }
                break;
        }
        
        if (errors.length > 0) {
            debug.error('Data validation failed', errors);
            return { valid: false, errors };
        }
        
        debug.log('Data validation passed');
        return { valid: true, errors: [] };
    }

    // Obtener registros con paginación
    async getRecords(tableName, params = {}) {
        try {
            const cacheKey = `${tableName}_${JSON.stringify(params)}`;
            
            // Verificar cache
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    debug.log(`Returning cached data for: ${tableName}`);
                    return cached.data;
                }
            }
            
            const queryString = new URLSearchParams(params).toString();
            const endpoint = `tables/${tableName}${queryString ? '?' + queryString : ''}`;
            
            const data = await this.makeRequest(endpoint);
            
            // Guardar en cache
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            debug.error(`Failed to get records from ${tableName}`, error);
            throw error;
        }
    }

    // Obtener un registro por ID
    async getRecord(tableName, id) {
        try {
            const cacheKey = `${tableName}_${id}`;
            
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    debug.log(`Returning cached record: ${tableName}/${id}`);
                    return cached.data;
                }
            }
            
            const endpoint = `tables/${tableName}/${id}`;
            const data = await this.makeRequest(endpoint);
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            debug.error(`Failed to get record ${id} from ${tableName}`, error);
            throw error;
        }
    }

    // Crear nuevo registro
    async createRecord(tableName, data) {
        try {
            const validation = this.validateData(tableName, data);
            if (!validation.valid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }
            
            // Agregar ID y timestamp si no existen
            if (!data.id) {
                data.id = this.generateId();
            }
            if (!data.created_at) {
                data.created_at = Date.now();
            }
            
            const endpoint = `tables/${tableName}`;
            const result = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            // Limpiar cache relacionado
            this.clearTableCache(tableName);
            
            debug.log(`Record created in ${tableName}`, result);
            return result;
            
        } catch (error) {
            debug.error(`Failed to create record in ${tableName}`, error);
            throw error;
        }
    }

    // Actualizar registro completo
    async updateRecord(tableName, id, data) {
        try {
            const validation = this.validateData(tableName, data, false);
            if (!validation.valid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }
            
            // Agregar timestamp de actualización
            data.updated_at = Date.now();
            
            const endpoint = `tables/${tableName}/${id}`;
            const result = await this.makeRequest(endpoint, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
            
            // Limpiar cache
            this.clearTableCache(tableName);
            this.cache.delete(`${tableName}_${id}`);
            
            debug.log(`Record updated in ${tableName}`, result);
            return result;
            
        } catch (error) {
            debug.error(`Failed to update record ${id} in ${tableName}`, error);
            throw error;
        }
    }

    // Actualizar registro parcialmente
    async patchRecord(tableName, id, data) {
        try {
            const validation = this.validateData(tableName, data, true);
            if (!validation.valid) {
                throw new Error('Validation failed: ' + validation.errors.join(', '));
            }
            
            data.updated_at = Date.now();
            
            const endpoint = `tables/${tableName}/${id}`;
            const result = await this.makeRequest(endpoint, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            
            // Limpiar cache
            this.clearTableCache(tableName);
            this.cache.delete(`${tableName}_${id}`);
            
            debug.log(`Record patched in ${tableName}`, result);
            return result;
            
        } catch (error) {
            debug.error(`Failed to patch record ${id} in ${tableName}`, error);
            throw error;
        }
    }

    // Eliminar registro
    async deleteRecord(tableName, id) {
        try {
            const endpoint = `tables/${tableName}/${id}`;
            await this.makeRequest(endpoint, {
                method: 'DELETE'
            });
            
            // Limpiar cache
            this.clearTableCache(tableName);
            this.cache.delete(`${tableName}_${id}`);
            
            debug.log(`Record deleted from ${tableName}: ${id}`);
            return true;
            
        } catch (error) {
            debug.error(`Failed to delete record ${id} from ${tableName}`, error);
            throw error;
        }
    }

    // Limpiar cache de una tabla
    clearTableCache(tableName) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(tableName)) {
                this.cache.delete(key);
            }
        }
        debug.log(`Cache cleared for table: ${tableName}`);
    }

    // Limpiar todo el cache
    clearCache() {
        this.cache.clear();
        debug.log('All cache cleared');
    }

    // Métodos específicos para el negocio

    // Autenticar usuario
    async authenticateUser(email, password) {
        try {
            debug.log('Attempting user authentication', { email });
            
            // Obtener usuarios de localStorage
            const usersData = JSON.parse(localStorage.getItem('table_users') || '[]');
            debug.log('Users in localStorage', usersData.length);
            
            // Buscar usuario por email y password
            const user = usersData.find(u => {
                const emailMatch = u.email && u.email.toLowerCase() === email.toLowerCase();
                const passwordMatch = u.password === password;
                debug.log('Checking user', { 
                    userEmail: u.email, 
                    emailMatch, 
                    passwordMatch,
                    userStatus: u.status 
                });
                return emailMatch && passwordMatch;
            });
            
            if (!user) {
                debug.error('No user found with matching credentials', { 
                    email, 
                    availableUsers: usersData.map(u => ({ email: u.email, status: u.status }))
                });
                throw new Error('Credenciales inválidas');
            }
            
            if (user.status !== 'active') {
                throw new Error('Cuenta no activa. Contacta al administrador.');
            }
            
            debug.log('User authenticated successfully', { 
                id: user.id, 
                role: user.role, 
                name: user.name 
            });
            return user;
            
        } catch (error) {
            debug.error('Authentication failed', error);
            throw error;
        }
    }

    // Obtener proyectos activos
    async getActiveProjects() {
        try {
            const projects = await this.getRecords('projects');
            return projects.data.filter(p => p.status === 'active');
        } catch (error) {
            debug.error('Failed to get active projects', error);
            throw error;
        }
    }

    // Calcular saldo de un proyecto
    async calculateProjectBalance(projectId) {
        try {
            debug.log(`Calculating balance for project: ${projectId}`);
            
            // Obtener proyecto para presupuesto inicial
            const project = await this.getRecord('projects', projectId);
            const budget = project.budget || 0;
            
            // Obtener depósitos
            const depositsResult = await this.getRecords('deposits');
            const deposits = depositsResult.data
                .filter(d => d.project_id === projectId)
                .reduce((sum, d) => sum + (d.amount || 0), 0);
            
            // Obtener gastos (solo del usuario actual)
            const expensesResult = await this.getRecords('expenses');
            const currentUser = auth?.getCurrentUser();
            const expenses = expensesResult.data
                .filter(e => e.project_id === projectId)
                .filter(e => currentUser ? e.user_id === currentUser.id : true)
                .reduce((sum, e) => sum + (e.amount || 0), 0);
            
            const balance = budget + deposits - expenses;
            
            debug.log(`Project balance calculated`, {
                projectId,
                budget,
                deposits,
                expenses,
                balance
            });
            
            return {
                budget,
                deposits,
                expenses,
                balance
            };
            
        } catch (error) {
            debug.error(`Failed to calculate balance for project ${projectId}`, error);
            throw error;
        }
    }

    // Obtener gastos recientes de un proyecto
    async getRecentExpenses(projectId, limit = 5) {
        try {
            const expenses = await this.getRecords('expenses', { 
                limit,
                sort: 'created_at'
            });
            
            // FILTRO POR USUARIO: Solo gastos del usuario actual
            const currentUser = auth?.getCurrentUser();
            
            return expenses.data
                .filter(e => e.project_id === projectId)
                .filter(e => currentUser ? e.user_id === currentUser.id : true)
                .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
                .slice(0, limit);
                
        } catch (error) {
            debug.error(`Failed to get recent expenses for project ${projectId}`, error);
            throw error;
        }
    }
}

// Crear instancia global
window.db = new Database();

// Función global de debugging para verificar login
window.checkLoginStatus = function(email = 'ramon.rivas@me.com', password = 'admin123') {
    console.log('🔍 Checking login status...');
    
    const users = JSON.parse(localStorage.getItem('table_users') || '[]');
    console.log('👥 Total users in storage:', users.length);
    
    const adminUsers = users.filter(u => u.role === 'admin');
    console.log('👨‍💼 Admin users:', adminUsers);
    
    const targetUser = users.find(u => 
        u.email?.toLowerCase() === email.toLowerCase() && 
        u.password === password
    );
    
    if (targetUser) {
        console.log('✅ User found:', targetUser);
        console.log('📊 User status:', targetUser.status);
        return targetUser;
    } else {
        console.log('❌ User NOT found with credentials:', { email, password });
        console.log('📋 Available emails:', users.map(u => u.email));
        return null;
    }
};