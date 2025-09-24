/**
 * Sistema de Base de Datos con Validaciones Robustas
 * Maneja todas las operaciones CRUD con el RESTful Table API
 */

class Database {
    constructor() {
        this.baseUrl = '';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
        debug.log('Database system initialized');
    }

    // Generar ID único
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Hacer petición HTTP con manejo de errores
    async makeRequest(endpoint, options = {}) {
        const monitor = debug.monitorApiCall(endpoint, options.method || 'GET', options.body);
        
        try {
            debug.log(`Making request to: ${endpoint}`, options);
            
            const response = await fetch(endpoint, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            monitor.success(data);
            return data;
            
        } catch (error) {
            monitor.error(error);
            throw new Error(`Database request failed: ${error.message}`);
        }
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
            
            const users = await this.getRecords('users', { search: email });
            const user = users.data.find(u => u.email === email && u.password === password);
            
            if (!user) {
                throw new Error('Credenciales inválidas');
            }
            
            if (user.status !== 'active') {
                throw new Error('Cuenta no activa. Contacta al administrador.');
            }
            
            debug.log('User authenticated successfully', { id: user.id, role: user.role });
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
            
            // Obtener gastos
            const expensesResult = await this.getRecords('expenses');
            const expenses = expensesResult.data
                .filter(e => e.project_id === projectId)
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
            
            return expenses.data
                .filter(e => e.project_id === projectId)
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