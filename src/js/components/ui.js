// Gestión de la interfaz de usuario
export class UIManager {
    constructor() {
        this.listeners = new Map();
        this.elements = {};
        this.currentTheme = 'light';
        this.notifications = [];
    }

    async init() {
        console.log('🎨 Inicializando UIManager...');
        
        // Cachear elementos del DOM
        this.cacheElements();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Configurar tema inicial
        this.initTheme();
        
        // Configurar notificaciones
        this.initNotifications();
    }    cacheElements() {
        // Helper function para obtener elementos de forma segura
        const safeGetElement = (id) => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`⚠️ Elemento con ID '${id}' no encontrado`);
            }
            return element;
        };        // Connection status (solo disponibles en la app principal)
        this.elements.statusIndicator = safeGetElement('status-indicator');
        this.elements.statusText = safeGetElement('status-text');
        this.elements.userName = safeGetElement('user-name');
          // Header statistics (solo disponibles en la app principal)
        this.elements.todayTimeHeader = safeGetElement('today-time-header');
        this.elements.weekTimeHeader = safeGetElement('week-time-header');
        this.elements.weekRange = safeGetElement('week-range');
        
        // Tab navigation (solo disponibles en la app principal)
        this.elements.tabSearch = safeGetElement('tab-search');
        this.elements.tabMyTasks = safeGetElement('tab-my-tasks');
        this.elements.myTasksCount = safeGetElement('my-tasks-count');
        
        // Tab contents (solo disponibles en la app principal)
        this.elements.searchTasksContent = safeGetElement('search-tasks-content');
        this.elements.myTasksContent = safeGetElement('my-tasks-content');
        
        // Search functionality (solo disponibles en la app principal)
        this.elements.searchInput = safeGetElement('search-input');
        this.elements.searchResults = safeGetElement('search-results');
        this.elements.searchLoading = safeGetElement('search-loading');
        this.elements.refreshAllTasksBtn = safeGetElement('refresh-all-tasks-btn');        // My tasks functionality (solo disponibles en la app principal)
        this.elements.myTasksList = safeGetElement('my-tasks-list');
        this.elements.sortTasksSelect = safeGetElement('sort-tasks-select');
        
        // Session summary (solo disponibles en la app principal)
        this.elements.sessionTasksCount = safeGetElement('session-tasks-count');
        this.elements.sessionTotalTime = safeGetElement('session-total-time');
        this.elements.sessionAvgTime = safeGetElement('session-avg-time');
        
        // Theme toggle (disponible en ambas pantallas)
        this.elements.themeToggle = safeGetElement('theme-toggle');
        this.elements.themeIconDark = safeGetElement('theme-icon-dark');
        this.elements.themeIconLight = safeGetElement('theme-icon-light');
        
        // Current active tab
        this.currentTab = 'search';
    }
    
    setupEventListeners() {
        // Tab navigation
        this.elements.tabSearch?.addEventListener('click', () => {
            this.switchTab('search');
        });
        
        this.elements.tabMyTasks?.addEventListener('click', () => {
            this.switchTab('my-tasks');
        });
        
        // Search functionality
        this.elements.searchInput?.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });        this.elements.refreshAllTasksBtn?.addEventListener('click', () => {
            this.emit('refreshAllTasksRequested');
        });
        
        // Sorting functionality
        this.elements.sortTasksSelect?.addEventListener('change', (e) => {
            this.emit('sortTasksRequested', e.target.value);
        });
        
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    // Event system
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(callback);
            if (index > -1) {
                eventListeners.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }      // Connection status
    setConnectionStatus(isConnected, userInfo = null) {
        // Verificar que los elementos existan antes de modificarlos
        if (!this.elements.statusIndicator || !this.elements.statusText) {
            console.warn('⚠️ Elementos de estado de conexión no encontrados, probablemente en pantalla de setup');
            return;
        }
        
        if (isConnected) {
            this.elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-green-500';
            this.elements.statusText.textContent = 'Conectado';
            
            // Actualizar nombre del usuario si está disponible
            if (userInfo && userInfo.username && this.elements.userName) {
                this.elements.userName.textContent = `${userInfo.username}`;
                this.elements.userName.classList.remove('hidden');
            }
        } else {
            this.elements.statusIndicator.className = 'w-2 h-2 rounded-full bg-red-500';
            this.elements.statusText.textContent = 'Desconectado';
            
            // Ocultar nombre del usuario cuando se desconecta
            if (this.elements.userName) {
                this.elements.userName.classList.add('hidden');
            }
        }
    }// Statistics in header
    updateHeaderStatistics(stats) {
        if (!this.elements.todayTimeHeader || !this.elements.weekTimeHeader) {
            console.warn('⚠️ Elementos de estadísticas del header no encontrados');
            return;
        }
        
        this.elements.todayTimeHeader.textContent = stats.today || '00:00:00';
        this.elements.weekTimeHeader.textContent = stats.week || '00:00:00';
        
        // Actualizar rango de fechas de la semana si está disponible
        if (this.elements.weekRange && stats.weekRange) {
            this.elements.weekRange.textContent = stats.weekRange;
        }
    }    // Mostrar estado de carga para las estadísticas
    setStatisticsLoading(isLoading) {
        if (isLoading) {
            if (this.elements.todayTimeHeader) {
                this.elements.todayTimeHeader.textContent = 'Cargando...';
            }
            if (this.elements.weekTimeHeader) {
                this.elements.weekTimeHeader.textContent = 'Cargando...';
            }
            if (this.elements.weekRange) {
                this.elements.weekRange.textContent = 'Cargando fechas...';
            }
        } else {
            // Restaurar valores por defecto cuando no está cargando
            if (this.elements.todayTimeHeader && this.elements.todayTimeHeader.textContent === 'Cargando...') {
                this.elements.todayTimeHeader.textContent = '00:00:00';
            }
            if (this.elements.weekTimeHeader && this.elements.weekTimeHeader.textContent === 'Cargando...') {
                this.elements.weekTimeHeader.textContent = '00:00:00';
            }
            if (this.elements.weekRange && this.elements.weekRange.textContent === 'Cargando fechas...') {
                this.elements.weekRange.textContent = '';
            }
        }
    }// Task timer updates
    updateTaskTime(taskId, seconds) {
        // Actualizar el tiempo en el área de información de la sesión
        const timeElement = document.getElementById(`task-time-${taskId}`);
        if (timeElement) {
            timeElement.textContent = this.formatTime(seconds);
        }
        
        // Actualizar el tiempo en el botón de detener
        const buttonTimeElement = document.getElementById(`button-time-${taskId}`);
        if (buttonTimeElement) {
            buttonTimeElement.textContent = this.formatTime(seconds);
        }
    }

    // Loading states
    setSearchLoading(isLoading) {
        if (isLoading) {
            this.elements.searchLoading.classList.remove('hidden');
            this.elements.searchResults.classList.add('hidden');
        } else {
            this.elements.searchLoading.classList.add('hidden');
            this.elements.searchResults.classList.remove('hidden');
        }
    }

    // Theme management
    initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme === 'dark');
    }    setTheme(isDark) {
        this.currentTheme = isDark ? 'dark' : 'light';
        
        // Aplicar tema al documento (siempre disponible)
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        
        // Actualizar iconos del tema si están disponibles
        if (this.elements.themeIconDark && this.elements.themeIconLight) {
            if (isDark) {
                this.elements.themeIconDark.classList.remove('hidden');
                this.elements.themeIconLight.classList.add('hidden');
            } else {
                this.elements.themeIconDark.classList.add('hidden');
                this.elements.themeIconLight.classList.remove('hidden');
            }
        }
        
        localStorage.setItem('theme', this.currentTheme);
    }

    toggleTheme() {
        const isDark = this.currentTheme === 'light';
        this.setTheme(isDark);
        this.emit('themeToggled', isDark);
    }

    // Notifications
    initNotifications() {
        // Crear container para notificaciones si no existe
        if (!document.getElementById('notifications-container')) {
            const container = document.createElement('div');
            container.id = 'notifications-container';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications-container');
        const notification = document.createElement('div');
        
        const typeClasses = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        
        notification.className = `
            px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 
            ${typeClasses[type] || typeClasses.info}
            translate-x-full opacity-0
        `;
        
        notification.innerHTML = `
            <div class="flex items-center justify-between">
                <span class="text-sm font-medium">${message}</span>
                <button class="ml-3 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                    </svg>
                </button>
            </div>
        `;
        
        container.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 100);
        
        // Auto-remove después del tiempo especificado
        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification);
            }, duration);
        }
        
        return notification;
    }

    removeNotification(notification) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    showSuccess(message, duration = 3000) {
        return this.showNotification(message, 'success', duration);
    }

    showError(message, duration = 5000) {
        return this.showNotification(message, 'error', duration);
    }

    showWarning(message, duration = 4000) {
        return this.showNotification(message, 'warning', duration);
    }

    showInfo(message, duration = 3000) {
        return this.showNotification(message, 'info', duration);
    }

    // Utility methods
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Loading states
    setLoadingState(element, isLoading, originalText = '') {
        if (isLoading) {
            element.disabled = true;
            element.dataset.originalText = element.textContent;
            element.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Cargando...
                </div>
            `;
        } else {
            element.disabled = false;
            element.textContent = element.dataset.originalText || originalText;
        }
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Space: Start/Stop tracking
            if (e.ctrlKey && e.code === 'Space') {
                e.preventDefault();
                if (this.elements.startBtn.style.display !== 'none') {
                    this.emit('startTrackingRequested');
                } else {
                    this.emit('stopTrackingRequested');
                }
            }
            
            // Ctrl+P: Pause/Resume tracking
            if (e.ctrlKey && e.key === 'p') {
                e.preventDefault();
                this.emit('pauseTrackingRequested');
            }
            
            // Ctrl+R: Refresh tasks
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.emit('refreshTasksRequested');
            }
        });
    }

    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        this.elements.tabSearch.classList.remove('active');
        this.elements.tabMyTasks.classList.remove('active');
        
        // Hide all tab contents
        this.elements.searchTasksContent.classList.add('hidden');
        this.elements.myTasksContent.classList.add('hidden');
        
        // Show selected tab
        if (tabName === 'search') {
            this.elements.tabSearch.classList.add('active');
            this.elements.searchTasksContent.classList.remove('hidden');
            this.currentTab = 'search';
        } else if (tabName === 'my-tasks') {
            this.elements.tabMyTasks.classList.add('active');
            this.elements.myTasksContent.classList.remove('hidden');
            this.currentTab = 'my-tasks';
        }
        
        this.emit('tabChanged', tabName);
    }

    // Search functionality
    handleSearchInput(query) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.emit('searchRequested', query);
        }, 300);
    }

    showSearchResults(tasks, query = '') {
        const container = this.elements.searchResults;
        container.innerHTML = '';
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <p>${query ? `No se encontraron tareas para "${query}"` : 'No hay tareas disponibles'}</p>
                </div>
            `;
            return;
        }
        
        tasks.forEach(task => {
            const taskElement = this.createSearchTaskElement(task);
            container.appendChild(taskElement);
        });
    }

    createSearchTaskElement(task) {
        const isInMyTasks = window.app?.tasks?.isInMyTasks(task.id) || false;
        
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">${task.name}</h3>
                    <div class="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span class="flex items-center">
                            <div class="w-2 h-2 rounded-full mr-1" style="background-color: ${task.status.color}"></div>
                            ${task.status.status}
                        </span>
                        <span>${task.list.name}</span>
                        <span>${task.project.name}</span>
                    </div>
                    ${task.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">${task.description}</p>` : ''}
                </div>
                <div class="ml-4 flex-shrink-0">
                    ${isInMyTasks ? 
                        `<button class="btn-secondary text-xs py-1 px-3" disabled title="Ya está en tu lista">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                            </svg>
                        </button>` :
                        `<button class="btn-primary text-xs py-1 px-3" onclick="window.app.ui.addTaskToMyTasks('${task.id}')" title="Agregar a mi lista">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                        </button>`
                    }
                </div>
            </div>
        `;
        
        return taskElement;
    }

    addTaskToMyTasks(taskId) {
        this.emit('addToMyTasksRequested', taskId);
    }
      // My Tasks functionality
    showMyTasks(tasks) {
        const container = this.elements.myTasksList;
        if (!container) {
            console.warn('⚠️ Container my-tasks-list not found, probablemente en pantalla de setup');
            return;
        }
        container.innerHTML = '';
        
        // Update count badge - verificar que el elemento exista
        if (this.elements.myTasksCount) {
            if (tasks.length > 0) {
                this.elements.myTasksCount.textContent = tasks.length;
                this.elements.myTasksCount.classList.remove('hidden');
            } else {
                this.elements.myTasksCount.classList.add('hidden');
            }
        }
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                    <p class="mb-2">No tienes tareas en tu lista personal</p>
                    <p class="text-sm">Ve a "Buscar Tareas" para agregar algunas</p>
                </div>
            `;
            return;
        }
          tasks.forEach(task => {
            const taskElement = this.createMyTaskElement(task);
            container.appendChild(taskElement);
        });
    }
      createMyTaskElement(task) {
        // Obtener el estado real del tracker si es la tarea activa
        let trackingState = task.trackingState || 'stopped';
        
        // Verificar si esta tarea está siendo trackeada actualmente
        if (window.app?.tracker?.getCurrentTaskId() === task.id && window.app?.tracker?.isTracking()) {
            trackingState = 'running';
        }
        
        const taskElement = document.createElement('div');
        taskElement.className = `task-card ${trackingState === 'running' ? 'tracking' : ''}`;
        taskElement.dataset.taskId = task.id;
        
        taskElement.innerHTML = `
            <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-2">
                        <h3 class="font-medium text-gray-900 dark:text-gray-100 truncate">${task.name}</h3>
                    </div>
                    <div class="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span class="flex items-center">
                            <div class="w-2 h-2 rounded-full mr-1" style="background-color: ${task.status.color}"></div>
                            ${task.status.status}
                        </span>
                        <span> | </span>
                        <span>${task.project.name}</span>
                    </div>
                </div>
                <div class="ml-4 flex-shrink-0 flex items-center space-x-2">
                    ${this.getTrackingButtons(task)}
                    <button class="text-gray-400 hover:text-red-500" onclick="window.app.ui.removeTaskFromMyTasks('${task.id}')" title="Remover de mi lista">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        return taskElement;
    }getTrackingButtons(task) {
        // Obtener el estado real del tracker si es la tarea activa
        let state = task.trackingState || 'stopped';
        let currentTime = task.currentSessionTime || 0;
        
        // Verificar si esta tarea está siendo trackeada actualmente
        if (window.app?.tracker?.getCurrentTaskId() === task.id && window.app?.tracker?.isTracking()) {
            state = 'running';
            currentTime = window.app.tracker.getCurrentDuration() || currentTime;
        }
        
        const formattedTime = this.formatTime(currentTime);
        
        switch (state) {
            case 'running':
                return `
                    <button class="tracking-button stop px-3 py-1 flex items-center justify-center" onclick="window.app.ui.stopTask('${task.id}')">
                        <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd"></path>
                        </svg>
                        <span id="button-time-${task.id}" class="font-mono">${formattedTime}</span>
                    </button>
                `;
            default:
                return `
                    <button class="tracking-button start w-8 h-8 min-w-8 min-h-8 flex items-center justify-center" onclick="window.app.ui.startTask('${task.id}')">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path>
                        </svg>
                    </button>
                `;
        }
    }// Task management methods
    updateMyTasksCount(count) {
        if (!this.elements.myTasksCount) {
            console.warn('⚠️ Elemento myTasksCount no encontrado');
            return;
        }
        
        if (count > 0) {
            this.elements.myTasksCount.textContent = count;
            this.elements.myTasksCount.classList.remove('hidden');
        } else {
            this.elements.myTasksCount.classList.add('hidden');
        }
    }    showSearchLoading(isLoading) {
        if (!this.elements.searchLoading || !this.elements.searchResults) {
            console.warn('⚠️ Elementos de búsqueda no encontrados');
            return;
        }
        
        if (isLoading) {
            this.elements.searchLoading.classList.remove('hidden');
            this.elements.searchResults.classList.add('opacity-50');
        } else {
            this.elements.searchLoading.classList.add('hidden');
            this.elements.searchResults.classList.remove('opacity-50');
        }
    }
    
    // Task action handlers
    startTask(taskId) {
        this.emit('startTaskRequested', taskId);
    }

    stopTask(taskId) {
        this.emit('stopTaskRequested', taskId);
    }

    removeTaskFromMyTasks(taskId) {
        this.emit('removeFromMyTasksRequested', taskId);
    }

    // Helper method to get task tracking state
    getTaskTrackingState(taskId) {
        // Check if the tracker has this task active
        if (window.app?.tracker?.getCurrentTaskId() === taskId && window.app?.tracker?.isTracking()) {
            return 'running';
        }
        return 'stopped';
   }

    // Método para actualizar una tarea específica en la UI sin re-renderizar toda la lista
    updateTaskElement(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement && this.currentTab === 'my-tasks') {
            // Si no encontramos el elemento, re-renderizar toda la lista
            console.log('🔄 Re-renderizando lista de tareas para actualizar estado');
            if (window.app?.tasks?.getMyTasks) {
                this.showMyTasks(window.app.tasks.getMyTasks());
            }
            return;
        }
        
        if (taskElement) {
            const task = window.app?.tasks?.getMyTasks()?.find(t => t.id === taskId);
            if (task) {
                // Actualizar la clase CSS
                let trackingState = task.trackingState || 'stopped';
                if (window.app?.tracker?.getCurrentTaskId() === task.id && window.app?.tracker?.isTracking()) {
                    trackingState = 'running';
                }
                
                taskElement.className = `task-card ${trackingState === 'running' ? 'tracking' : ''}`;
                
                // Actualizar los botones de tracking
                const buttonsContainer = taskElement.querySelector('.ml-4.flex-shrink-0');
                if (buttonsContainer) {
                    const trackingButtonsHtml = this.getTrackingButtons(task);
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = trackingButtonsHtml;
                    const newTrackingButton = tempDiv.firstElementChild;
                    
                    const oldTrackingButton = buttonsContainer.querySelector('.tracking-button');
                    if (oldTrackingButton && newTrackingButton) {
                        buttonsContainer.replaceChild(newTrackingButton, oldTrackingButton);
                    }
                }
                
                console.log(`✅ Elemento de tarea ${taskId} actualizado con estado: ${trackingState}`);
            }
        }
    }
}
