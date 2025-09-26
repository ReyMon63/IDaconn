/**
 * Sistema de Reportes con Exportación
 * Genera reportes de gastos en PDF y Excel
 */

class ReportManager {
    constructor() {
        debug.log('ReportManager initialized');
        this.setupReportsModal();
    }

    // Configurar modal de reportes
    setupReportsModal() {
        this.createReportsModal();
        this.setupReportsEvents();
        debug.log('Reports modal configured');
    }

    // Crear modal de reportes
    createReportsModal() {
        const modalHTML = `
            <div id="reportsModal" class="modal">
                <div class="modal-content max-w-4xl">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold">Reportes de Gastos</h2>
                        <button id="closeReportsModal" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <!-- Filtros -->
                    <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <h3 class="font-medium mb-3">Filtros</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">Proyecto:</label>
                                <select id="reportProject" class="w-full px-3 py-2 border rounded text-sm">
                                    <option value="">Todos los proyectos</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">Categoría:</label>
                                <select id="reportCategory" class="w-full px-3 py-2 border rounded text-sm">
                                    <option value="">Todas las categorías</option>
                                    <option value="Producción">Producción</option>
                                    <option value="Comercial">Comercial</option>
                                    <option value="Administración">Administración</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm text-gray-600 mb-1">Periodo:</label>
                                <select id="reportPeriod" class="w-full px-3 py-2 border rounded text-sm">
                                    <option value="7">Últimos 7 días</option>
                                    <option value="30" selected>Últimos 30 días</option>
                                    <option value="90">Últimos 90 días</option>
                                    <option value="365">Último año</option>
                                    <option value="all">Todo el tiempo</option>
                                </select>
                            </div>
                        </div>
                        <div class="mt-4">
                            <button id="generateReportBtn" class="btn-touch bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                <i class="fas fa-chart-bar mr-2"></i> Generar Reporte
                            </button>
                        </div>
                    </div>

                    <!-- Resumen -->
                    <div id="reportSummary" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 hidden">
                        <div class="bg-blue-50 rounded-lg p-4 text-center">
                            <div id="totalExpenses" class="text-2xl font-bold text-blue-600">$0.00</div>
                            <div class="text-sm text-gray-600">Total Gastos</div>
                        </div>
                        <div class="bg-green-50 rounded-lg p-4 text-center">
                            <div id="expenseCount" class="text-2xl font-bold text-green-600">0</div>
                            <div class="text-sm text-gray-600">Registros</div>
                        </div>
                        <div class="bg-yellow-50 rounded-lg p-4 text-center">
                            <div id="avgExpense" class="text-2xl font-bold text-yellow-600">$0.00</div>
                            <div class="text-sm text-gray-600">Promedio</div>
                        </div>
                        <div class="bg-purple-50 rounded-lg p-4 text-center">
                            <div id="topCategory" class="text-lg font-bold text-purple-600">-</div>
                            <div class="text-sm text-gray-600">Categoría Principal</div>
                        </div>
                    </div>

                    <!-- Tabla de gastos -->
                    <div id="expensesTable" class="bg-white rounded-lg border hidden">
                        <div class="p-4 border-b">
                            <div class="flex justify-between items-center">
                                <h3 class="font-medium">Detalle de Gastos</h3>
                                <div class="flex gap-2">
                                    <button id="exportPdfBtn" class="btn-touch bg-red-600 hover:bg-red-700 text-white rounded text-sm px-3 py-2">
                                        <i class="fas fa-file-pdf mr-1"></i> PDF
                                    </button>
                                    <button id="exportExcelBtn" class="btn-touch bg-green-600 hover:bg-green-700 text-white rounded text-sm px-3 py-2">
                                        <i class="fas fa-file-excel mr-1"></i> Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full">
                                <thead class="bg-gray-50">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proyecto</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                        <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    </tr>
                                </thead>
                                <tbody id="expensesTableBody" class="divide-y divide-gray-200">
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Estado de carga -->
                    <div id="reportLoading" class="hidden text-center py-8">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p class="text-gray-600">Generando reporte...</p>
                    </div>

                    <!-- Sin datos -->
                    <div id="noDataMessage" class="hidden text-center py-8">
                        <i class="fas fa-chart-bar text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">No se encontraron gastos para los filtros seleccionados</p>
                    </div>
                </div>
            </div>
        `;

        if (!document.getElementById('reportsModal')) {
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }
    }

    // Configurar eventos de reportes
    setupReportsEvents() {
        // Cerrar modal
        const closeBtn = document.getElementById('closeReportsModal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeReportsModal());
        }

        // Generar reporte
        const generateBtn = document.getElementById('generateReportBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.generateReport());
        }

        // Exportar PDF
        const exportPdfBtn = document.getElementById('exportPdfBtn');
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', () => this.exportToPDF());
        }

        // Exportar Excel
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        }

        // Cerrar modal al hacer click fuera
        const modal = document.getElementById('reportsModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeReportsModal();
                }
            });
        }
    }

    // Mostrar modal de reportes
    async showReportsModal() {
        debug.log('Showing reports modal');

        const modal = document.getElementById('reportsModal');
        if (modal) {
            modal.classList.add('show');
            await this.loadProjectsForReport();
        }
    }

    // Cerrar modal de reportes
    closeReportsModal() {
        debug.log('Closing reports modal');
        
        const modal = document.getElementById('reportsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    // Cargar proyectos para el reporte
    async loadProjectsForReport() {
        try {
            const projects = await db.getActiveProjects();
            const select = document.getElementById('reportProject');
            
            if (select) {
                select.innerHTML = '<option value="">Todos los proyectos</option>';
                projects.forEach(project => {
                    const option = document.createElement('option');
                    option.value = project.id;
                    option.textContent = project.name;
                    select.appendChild(option);
                });
            }
        } catch (error) {
            debug.error('Failed to load projects for report', error);
        }
    }

    // Generar reporte
    async generateReport() {
        try {
            debug.log('Generating report');

            this.showLoading();

            // Obtener filtros
            const filters = this.getReportFilters();
            
            // Obtener datos
            const expenses = await this.getExpensesData(filters);
            const projects = await db.getActiveProjects();
            
            // Generar resumen
            const summary = this.calculateSummary(expenses);
            
            // Mostrar datos
            this.displayReportData(expenses, projects, summary);
            
        } catch (error) {
            debug.error('Failed to generate report', error);
            auth.showErrorMessage('Error al generar reporte: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    // Obtener filtros del reporte
    getReportFilters() {
        const projectId = document.getElementById('reportProject')?.value;
        const category = document.getElementById('reportCategory')?.value;
        const period = document.getElementById('reportPeriod')?.value;
        
        const filters = {};
        
        if (projectId) filters.project_id = projectId;
        if (category) filters.category = category;
        
        // Calcular fecha de inicio según periodo
        if (period && period !== 'all') {
            const days = parseInt(period);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            filters.start_date = startDate.getTime();
        }
        
        debug.log('Report filters', filters);
        return filters;
    }

    // Obtener datos de gastos
    async getExpensesData(filters) {
        const result = await db.getRecords('expenses', { limit: 1000 });
        let expenses = result.data || [];
        
        // FILTRO POR USUARIO: Solo mostrar gastos del usuario actual
        const currentUser = auth.getCurrentUser();
        if (currentUser) {
            expenses = expenses.filter(e => e.user_id === currentUser.id);
        }
        
        // Aplicar filtros adicionales
        if (filters.project_id) {
            expenses = expenses.filter(e => e.project_id === filters.project_id);
        }
        
        if (filters.category) {
            expenses = expenses.filter(e => e.category === filters.category);
        }
        
        if (filters.start_date) {
            expenses = expenses.filter(e => (e.created_at || 0) >= filters.start_date);
        }
        
        // Ordenar por fecha descendente
        expenses.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        
        debug.log(`Found ${expenses.length} expenses for report`);
        return expenses;
    }

    // Calcular resumen
    calculateSummary(expenses) {
        const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const count = expenses.length;
        const avg = count > 0 ? total / count : 0;
        
        // Categoría principal
        const categoryTotals = {};
        expenses.forEach(e => {
            if (e.category) {
                categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (e.amount || 0);
            }
        });
        
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, '-'
        );
        
        return { total, count, avg, topCategory };
    }

    // Mostrar datos del reporte
    displayReportData(expenses, projects, summary) {
        // Mostrar resumen
        document.getElementById('totalExpenses').textContent = 
            `$${summary.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById('expenseCount').textContent = summary.count.toString();
        document.getElementById('avgExpense').textContent = 
            `$${summary.avg.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
        document.getElementById('topCategory').textContent = summary.topCategory;
        
        // Crear mapa de proyectos
        const projectMap = {};
        projects.forEach(p => projectMap[p.id] = p.name);
        
        // Mostrar tabla
        const tbody = document.getElementById('expensesTableBody');
        if (tbody) {
            tbody.innerHTML = expenses.map(expense => `
                <tr>
                    <td class="px-4 py-3 text-sm">
                        ${new Date(expense.created_at || 0).toLocaleDateString('es-MX')}
                    </td>
                    <td class="px-4 py-3 text-sm">
                        ${projectMap[expense.project_id] || 'N/A'}
                    </td>
                    <td class="px-4 py-3 text-sm">
                        <span class="px-2 py-1 text-xs rounded-full ${this.getCategoryColor(expense.category)}">
                            ${expense.category || 'N/A'}
                        </span>
                    </td>
                    <td class="px-4 py-3 text-sm">
                        ${expense.description || 'Sin descripción'}
                    </td>
                    <td class="px-4 py-3 text-sm text-right font-medium">
                        $${(expense.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                </tr>
            `).join('');
        }
        
        // Mostrar elementos
        document.getElementById('reportSummary')?.classList.remove('hidden');
        document.getElementById('expensesTable')?.classList.remove('hidden');
        document.getElementById('noDataMessage')?.classList.add('hidden');
        
        // Guardar datos para exportación
        this.currentReportData = { expenses, projects, summary };
    }

    // Obtener color de categoría
    getCategoryColor(category) {
        switch (category) {
            case 'Producción': return 'bg-blue-100 text-blue-800';
            case 'Comercial': return 'bg-green-100 text-green-800';
            case 'Administración': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    // Mostrar estado de carga
    showLoading() {
        document.getElementById('reportLoading')?.classList.remove('hidden');
        document.getElementById('reportSummary')?.classList.add('hidden');
        document.getElementById('expensesTable')?.classList.add('hidden');
        document.getElementById('noDataMessage')?.classList.add('hidden');
    }

    // Ocultar estado de carga
    hideLoading() {
        document.getElementById('reportLoading')?.classList.add('hidden');
    }

    // Exportar a PDF (simulado)
    exportToPDF() {
        debug.log('Exporting to PDF');
        
        if (!this.currentReportData) {
            auth.showErrorMessage('Genera un reporte primero');
            return;
        }
        
        // Simular exportación
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,';
        link.download = `reporte-gastos-${Date.now()}.pdf`;
        
        auth.showSuccessMessage('Funcionalidad de PDF en desarrollo. Se descargaría: ' + link.download);
    }

    // Exportar a Excel (simulado)
    exportToExcel() {
        debug.log('Exporting to Excel');
        
        if (!this.currentReportData) {
            auth.showErrorMessage('Genera un reporte primero');
            return;
        }
        
        // Simular exportación
        const link = document.createElement('a');
        link.href = 'data:application/vnd.ms-excel;base64,';
        link.download = `reporte-gastos-${Date.now()}.xlsx`;
        
        auth.showSuccessMessage('Funcionalidad de Excel en desarrollo. Se descargaría: ' + link.download);
    }
}

// Crear instancia global
window.reportManager = new ReportManager();