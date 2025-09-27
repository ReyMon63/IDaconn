/**
 * Sistema de Gestión de Proyectos con Debugging Completo
 * Soluciona el bug crítico del botón crear proyecto y maneja todas las operaciones
 */

class ProjectManager {
    constructor() {
        this.selectedProject = null;
        this.projects = [];
        debug.log('ProjectManager initialized');
        
        // Configurar eventos cuando el DOM esté listo
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupEventListeners());
        } else {
            this.setupEventListeners();
        }
    }

    // Configurar todos los event listeners con debugging
    setupEventListeners() {
        debug.log('Setting up project event listeners');
        
        try {
            // Botón crear proyecto - FIX CRÍTICO
            this.setupCreateProjectButton();
            
            // Modal de crear proyecto
            this.setupCreateProjectModal();
            
            // Selector de proyecto
            this.setupProjectSelector();
            
            // Navegación
            this.setupNavigation();
            
            debug.log('Project event listeners configured successfully');
            
        } catch (error) {
            debug.error('Failed to setup project event listeners', error);
        }
    }

    // FIX CRÍTICO: Configurar botón crear proyecto con debugging completo
    setupCreateProjectButton() {
        const createBtn = document.getElementById('createProjectBtn');
        
        if (!createBtn) {
            debug.warn('Create project button not found in DOM');
            return;
        }
        
        debug.log('Setting up create project button');
        
        // Remover listeners anteriores para evitar duplicados
        createBtn.removeEventListener('click', this.handleCreateProjectClick);
        
        // Agregar nuevo listener con debugging
        const clickHandler = (e) => {
            debug.log('Create project button clicked', e);
            this.handleCreateProjectClick(e);
        };
        
        createBtn.addEventListener('click', clickHandler, { passive: false });
        
        // Verificar que el botón es clickeable
        const computedStyle = window.getComputedStyle(createBtn);
        debug.log('Create button state', {
            display: computedStyle.display,
            visibility: computedStyle.visibility,
            pointerEvents: computedStyle.pointerEvents,
            disabled: createBtn.disabled,
            classList: createBtn.className
        });
        
        // Agregar feedback visual para debugging
        createBtn.addEventListener('mousedown', () => {
            debug.log('Create button mousedown event');
            createBtn.style.transform = 'scale(0.98)';
        });
        
        createBtn.addEventListener('mouseup', () => {
            debug.log('Create button mouseup event');
            createBtn.style.transform = 'scale(1)';
        });
        
        // Para dispositivos móviles
        createBtn.addEventListener('touchstart', () => {
            debug.log('Create button touchstart event');
            createBtn.style.transform = 'scale(0.98)';
        });
        
        createBtn.addEventListener('touchend', () => {
            debug.log('Create button touchend event');
            createBtn.style.transform = 'scale(1)';
        });
        
        debug.log('Create project button configured successfully');
    }

    // Manejar click del botón crear proyecto
    handleCreateProjectClick(e) {
        debug.log('Processing create project click', e);
        
        try {
            // Prevenir comportamiento default
            e.preventDefault();
            e.stopPropagation();
            
            // Verificar autenticación
            if (!auth.isAuthenticated()) {
                debug.error('User not authenticated for project creation');
                throw new Error('Usuario no autenticado');
            }
            
            // Verificar permisos de admin
            if (!auth.isAdmin()) {
                debug.error('User does not have admin permissions');
                throw new Error('Solo los administradores pueden crear proyectos');
            }
            
            // Mostrar modal
            this.showCreateProjectModal();
            
        } catch (error) {
            debug.error('Create project click failed', error);
            auth.showErrorMessage(error.message);
        }
    }

    // Mostrar modal de crear proyecto
    showCreateProjectModal() {
        debug.log('Showing create project modal');
        
        const modal = debug.validateElement('#createProjectModal', 'projects');
        if (!modal) return;
        
        // Limpiar formulario
        this.resetCreateProjectForm();
        
        // Mostrar modal
        modal.classList.add('show');
        
        // Focus en el primer campo
        const nameField = document.getElementById('projectName');
        if (nameField) {
            setTimeout(() => nameField.focus(), 100);
        }
        
        debug.log('Create project modal shown');
    }

    // Ocultar modal de crear proyecto
    hideCreateProjectModal() {
        debug.log('Hiding create project modal');
        
        const modal = document.getElementById('createProjectModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Configurar modal de crear proyecto
    setupCreateProjectModal() {
        debug.log('Setting up create project modal');
        
        // Botón cerrar modal
        const closeBtn = document.getElementById('closeProjectModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideCreateProjectModal());
        }
        
        // Botón cancelar
        const cancelBtn = document.getElementById('cancelProjectBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreateProjectModal());
        }
        
        // Formulario de crear proyecto
        const form = document.getElementById('createProjectForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateProjectSubmit(e));
        }
        
        // Cerrar modal al hacer click fuera
        const modal = document.getElementById('createProjectModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCreateProjectModal();
                }
            });
        }
        
        debug.log('Create project modal configured');
    }

    // Resetear formulario de crear proyecto
    resetCreateProjectForm() {
        debug.log('Resetting create project form');
        
        const fields = ['projectName', 'projectDescription', 'projectBudget'];
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });
    }

    // Manejar envío de formulario crear proyecto
    async handleCreateProjectSubmit(e) {
        e.preventDefault();
        
        const saveBtn = debug.validateElement('#saveProjectBtn', 'projects');
        if (!saveBtn) return;
        
        try {
            debug.log('Processing create project form submission');
            
            // Mostrar estado de carga
            auth.setButtonLoading(saveBtn, true);
            
            // Obtener datos del formulario
            const name = document.getElementById('projectName')?.value?.trim();
            const description = document.getElementById('projectDescription')?.value?.trim();
            const budget = parseFloat(document.getElementById('projectBudget')?.value) || 0;
            
            // Validar datos
            const validation = debug.validateFormData({ name, budget }, ['name']);
            if (!validation.valid) {
                throw new Error(validation.errors.join(', '));
            }
            
            // Validaciones adicionales
            if (name.length < 3) {
                throw new Error('El nombre del proyecto debe tener al menos 3 caracteres');
            }
            
            if (budget < 0) {
                throw new Error('El presupuesto no puede ser negativo');
            }
            
            // Crear proyecto
            const projectData = {
                name,
                description: description || '',
                budget,
                status: 'active',
                created_by: auth.getCurrentUser().id
            };
            
            const newProject = await debug.timeAsyncFunction('Create Project', 
                () => db.createRecord('projects', projectData)
            );
            
            debug.log('Project created successfully', newProject);
            
            // Actualizar lista de proyectos
            await this.loadProjects();
            
            // Seleccionar el nuevo proyecto
            this.selectProject(newProject.id);
            
            // Cerrar modal
            this.hideCreateProjectModal();
            
            // Mostrar mensaje de éxito
            auth.showSuccessMessage('Proyecto creado exitosamente');
            
        } catch (error) {
            debug.error('Create project form submission failed', error);
            auth.showErrorMessage('Error al crear proyecto: ' + error.message);
        } finally {
            auth.setButtonLoading(saveBtn, false);
        }
    }

    // Configurar selector de proyecto
    setupProjectSelector() {
        const selector = document.getElementById('headerProjectSelect');
        if (!selector) {
            debug.warn('Project selector not found');
            return;
        }
        
        selector.addEventListener('change', (e) => {
            debug.log('Project selector changed', e.target.value);
            this.selectProject(e.target.value);
        });
        
        debug.log('Project selector configured');
    }

    // Cargar proyectos
    async loadProjects() {
        try {
            debug.log('Loading projects');
            
            const selector = debug.validateElement('#headerProjectSelect', 'projects');
            if (!selector) return;
            
            // Mostrar cargando
            selector.innerHTML = '<option value="">Cargando proyectos...</option>';
            
            // Obtener proyectos activos
            this.projects = await debug.timeAsyncFunction('Load Active Projects',
                () => db.getActiveProjects()
            );
            
            // Actualizar selector
            selector.innerHTML = '<option value="">Seleccionar proyecto...</option>';
            
            this.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project.id;
                option.textContent = `${project.name} (Presupuesto: $${project.budget.toLocaleString('es-MX')})`;
                selector.appendChild(option);
            });
            
            debug.log(`Loaded ${this.projects.length} projects`);
            
        } catch (error) {
            debug.error('Failed to load projects', error);
            
            const selector = document.getElementById('headerProjectSelect');
            if (selector) {
                selector.innerHTML = '<option value="">Error al cargar proyectos</option>';
            }
        }
    }

    // Seleccionar proyecto
    async selectProject(projectId) {
        try {
            debug.log('Selecting project', projectId);
            
            if (!projectId) {
                this.selectedProject = null;
                this.hideProjectActions();
                return;
            }
            
            // Buscar proyecto en la lista cargada
            this.selectedProject = this.projects.find(p => p.id === projectId);
            
            if (!this.selectedProject) {
                debug.error('Project not found in loaded projects', projectId);
                return;
            }
            
            // Mostrar acciones del proyecto
            this.showProjectActions();
            
            // Actualizar saldo
            await this.updateProjectBalance();
            
            // Cargar gastos recientes
            await this.loadRecentExpenses();
            
            debug.log('Project selected successfully', this.selectedProject);
            
        } catch (error) {
            debug.error('Failed to select project', error);
        }
    }

    // Mostrar acciones del proyecto
    showProjectActions() {
        const actions = debug.validateElement('#projectActions', 'projects');
        if (actions) {
            actions.classList.remove('hidden');
        }
        
        // Mostrar botones rápidos en header
        const headerQuickActions = document.getElementById('headerQuickActions');
        if (headerQuickActions) {
            headerQuickActions.classList.remove('hidden');
        }
        
        debug.log('Project actions shown');
    }

    // Ocultar acciones del proyecto
    hideProjectActions() {
        const actions = document.getElementById('projectActions');
        if (actions) {
            actions.classList.add('hidden');
        }
        
        // Ocultar botones rápidos en header
        const headerQuickActions = document.getElementById('headerQuickActions');
        if (headerQuickActions) {
            headerQuickActions.classList.add('hidden');
        }
        
        debug.log('Project actions hidden');
    }

    // Actualizar saldo del proyecto
    async updateProjectBalance() {
        try {
            if (!this.selectedProject) return;
            
            debug.log('Updating project balance', this.selectedProject.id);
            
            const balance = await debug.timeAsyncFunction('Calculate Project Balance',
                () => db.calculateProjectBalance(this.selectedProject.id)
            );
            
            // Actualizar UI
            const balanceElement = document.getElementById('currentBalance');
            const saldoInfo = document.getElementById('saldoInfo');
            
            if (balanceElement) {
                balanceElement.textContent = `$${balance.balance.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
                
                // Cambiar color según el saldo
                if (balance.balance < 0) {
                    balanceElement.className = 'text-3xl font-bold text-red-200';
                } else if (balance.balance < balance.budget * 0.1) {
                    balanceElement.className = 'text-3xl font-bold text-yellow-200';
                } else {
                    balanceElement.className = 'text-3xl font-bold text-white';
                }
            }
            
            if (saldoInfo) {
                saldoInfo.textContent = `Saldo: $${balance.balance.toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })}`;
            }
            
            debug.log('Project balance updated', balance);
            
        } catch (error) {
            debug.error('Failed to update project balance', error);
        }
    }

    // Cargar gastos recientes
    async loadRecentExpenses() {
        try {
            if (!this.selectedProject) return;
            
            debug.log('Loading recent expenses', this.selectedProject.id);
            
            const expenses = await debug.timeAsyncFunction('Load Recent Expenses',
                () => db.getRecentExpenses(this.selectedProject.id, 5)
            );
            
            // Actualizar UI
            const container = document.getElementById('recentExpenses');
            if (!container) return;
            
            if (expenses.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">No hay gastos registrados</p>';
                return;
            }
            
            container.innerHTML = expenses.map(expense => `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium">${expense.description || 'Sin descripción'}</p>
                        <p class="text-sm text-gray-600">${expense.category}</p>
                        <p class="text-xs text-gray-500">
                            ${new Date(expense.created_at || 0).toLocaleDateString('es-MX')}
                        </p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-red-600">
                            -$${(expense.amount || 0).toLocaleString('es-MX', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                    </div>
                </div>
            `).join('');
            
            debug.log(`Loaded ${expenses.length} recent expenses`);
            
        } catch (error) {
            debug.error('Failed to load recent expenses', error);
        }
    }

    // Configurar navegación
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const screen = e.currentTarget.dataset.screen;
                debug.log('Navigation clicked', screen);
                
                // Actualizar estados visuales
                navButtons.forEach(b => b.classList.remove('text-blue-600'));
                navButtons.forEach(b => b.classList.add('text-gray-400'));
                
                btn.classList.remove('text-gray-400');
                btn.classList.add('text-blue-600');
            });
        });
    }

    // Obtener proyecto seleccionado
    getSelectedProject() {
        return this.selectedProject;
    }

    // Obtener todos los proyectos
    getProjects() {
        return this.projects;
    }
}

// Crear instancia global
window.projectManager = new ProjectManager();