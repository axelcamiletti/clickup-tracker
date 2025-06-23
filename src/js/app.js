// Aplicación principal - Punto de entrada
import { AuthManager } from './components/auth.js';
import { TaskManager } from './components/tasks.js';
import { TimeTracker } from './components/tracker.js';
import { UIManager } from './components/ui.js';
import { StorageManager } from './components/storage.js';

class ClickUpTrackerApp {
    constructor() {
        this.storage = new StorageManager();
        this.auth = new AuthManager(this.storage);
        this.tasks = new TaskManager(this.storage);
        this.tracker = new TimeTracker(this.storage, this.auth);
        this.ui = new UIManager();
        
        this.isConnected = false;
        this.currentTask = null;
        this.isTracking = false;
        
        this.init();
    }
      async init() {
        console.log('🚀 Inicializando ClickUp Tracker...');
        
        try {
            // Inicializar componentes básicos primero
            await this.storage.init();
            await this.ui.init();
              // Configurar tema
            this.setupTheme();
            
            // Configurar event listeners ANTES de inicializar AuthManager
            this.setupEventListeners();
            
            // El AuthManager decidirá si mostrar setup o main app
            await this.auth.init();
            
            console.log('✅ Aplicación inicializada correctamente');
            
        } catch (error) {
            console.error('❌ Error al inicializar la aplicación:', error);
            if (this.ui && this.ui.showError) {
                this.ui.showError('Error al inicializar la aplicación');
            }
        }    }    async initializeComponents() {
        // Inicializar componentes que dependen de la autenticación
        await this.tasks.init();
        await this.tracker.init();
        
        // Sincronizar estado de sesión restaurada si existe
        await this.handleSessionRestored();
        
        // Las estadísticas se cargarán después de la autenticación
        console.log('📊 Estadísticas se cargarán después de la autenticación');
    }

    setupEventListeners() {
        // Auth events
        this.auth.on('authenticated', (data) => this.handleAuthenticated(data));
        this.auth.on('disconnected', () => this.handleDisconnected());
        this.auth.on('error', (error) => this.handleAuthError(error));

        // Task events
        this.tasks.on('tasksLoaded', (tasks) => this.handleTasksLoaded(tasks));
        this.tasks.on('myTasksUpdated', (tasks) => this.handleMyTasksUpdated(tasks));
        this.tasks.on('taskSelected', (task) => this.handleTaskSelected(task));
        this.tasks.on('error', (error) => this.handleTaskError(error));        // Tracker events
        this.tracker.on('started', (data) => this.handleTrackingStarted(data));
        this.tracker.on('stopped', (data) => this.handleTrackingStopped(data));
        this.tracker.on('tick', (time) => this.handleTimerTick(time));
        this.tracker.on('error', (error) => this.handleTrackerError(error));
        this.tracker.on('sessionRestored', (data) => this.handleTrackerSessionRestored(data));        // UI events
        this.ui.on('tabChanged', (tabName) => this.handleTabChange(tabName));
        this.ui.on('searchRequested', (query) => this.handleSearchRequest(query));
        this.ui.on('refreshAllTasksRequested', () => this.handleRefreshAllTasks());
        this.ui.on('addToMyTasksRequested', (taskId) => this.handleAddToMyTasks(taskId));
        this.ui.on('removeFromMyTasksRequested', (taskId) => this.handleRemoveFromMyTasks(taskId));
        this.ui.on('startTaskRequested', (taskId) => this.handleStartTask(taskId));
        this.ui.on('stopTaskRequested', (taskId) => this.handleStopTask(taskId));
        this.ui.on('sortTasksRequested', (sortBy) => this.handleSortTasksRequest(sortBy));
        this.ui.on('themeToggled', (isDark) => this.handleThemeToggle(isDark));
        
        // Disconnect button event
        this.setupDisconnectButton();
    }async checkSavedAuth() {
        // La autenticación ahora es manejada por AuthManager
        console.log('🔑 Verificación de autenticación delegada a AuthManager...');
    }

    setupTheme() {
        const isDark = this.storage.get('darkMode') || false;
        this.ui.setTheme(isDark);
    }
    
    setupDisconnectButton() {
        const disconnectBtn = document.getElementById('disconnect-btn');
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', async () => {
                await this.handleDisconnectRequest();
            });
        }
    }
      // Event Handlers
    async handleAuthenticated(data) {
        console.log('✅ Autenticado exitosamente:', data);
        this.isConnected = true;
        
        // Inicializar componentes que dependen de la autenticación
        if (!this.tasks.isInitialized) {
            await this.initializeComponents();
        }
        
        // Ocultar pantalla de setup y mostrar aplicación principal
        this.auth.hideSetupScreen();
        
        // Configurar estado de conexión con información del usuario
        this.ui.setConnectionStatus(true, data.user);
        
        // Cargar todas las tareas automáticamente con el token
        await this.tasks.loadTasks(data.token);
        
        // Mostrar mis tareas
        this.ui.showMyTasks(this.tasks.getMyTasks());
        
        // Actualizar estadísticas
        await this.updateStatistics();
    }    handleDisconnected() {
        console.log('🔌 Desconectado de ClickUp');
        this.isConnected = false;
        this.currentTask = null;
        this.isTracking = false;
        
        // Resetear el tracker si estaba corriendo
        if (this.tracker && this.tracker.isTracking()) {
            this.tracker.reset();
        }
        
        this.ui.setConnectionStatus(false);
    }

    handleAuthError(error) {
        console.error('❌ Error de autenticación:', error);
        this.ui.showError('Error de autenticación: ' + error.message);
    }

    async handleDisconnectRequest() {
        console.log('🔄 Solicitud de desconexión/cambio de API...');
        
        try {
            // Detener cualquier tracking activo
            if (this.isTracking && this.currentTask) {
                await this.tracker.stopTracking(this.currentTask.id);
            }
            
            // Desconectar y volver a la pantalla de setup
            await this.auth.changeApiKey();
            
            // Resetear estado de la aplicación
            this.isConnected = false;
            this.currentTask = null;
            this.isTracking = false;
            
            console.log('✅ Desconexión completada, listo para nueva API');
            
        } catch (error) {
            console.error('❌ Error en desconexión:', error);
            this.ui.showError('Error al desconectar: ' + error.message);
        }
    }

    handleTasksLoaded(tasks) {
        console.log('📋 Tareas cargadas:', tasks.length);
        this.ui.showSearchResults(tasks);
    }    handleMyTasksUpdated(tasks) {
        console.log('📋 Mis tareas actualizadas:', tasks.length);
        
        // Solo re-renderizar si estamos en la pestaña de mis tareas
        if (this.ui.currentTab === 'my-tasks') {
            this.ui.showMyTasks(tasks);
        }
        
        this.ui.updateMyTasksCount(tasks.length);
    }

    async handleTaskSelected(task) {
        console.log('📌 Tarea seleccionada:', task.name);
        this.currentTask = task;
        
        // Actualizar estadísticas
        await this.updateStatistics();
    }

    handleTaskError(error) {
        console.error('❌ Error de tareas:', error);
        this.ui.showError('Error al cargar tareas: ' + error.message);
    }    async handleTrackingStarted(data) {
        console.log('▶️ Tracking iniciado:', data);
        this.isTracking = true;
        this.currentTask = data.task;
        
        // Actualizar estado de la tarea en el TaskManager
        await this.tasks.updateTaskTrackingState(data.task.id, 'running', 0);
        
        // Actualizar estadísticas
        await this.updateStatistics();
        
        // Actualizar inmediatamente el elemento específico de la tarea
        this.ui.updateTaskElement(data.task.id);
    }    async handleTrackingStopped(data) {
        console.log('⏹️ Tracking detenido:', data);
        this.isTracking = false;
        this.currentTask = null;
        
        // Actualizar estado de la tarea en el TaskManager
        await this.tasks.updateTaskTrackingState(data.taskId, 'stopped', data.duration);
        
        // Mostrar notificación de sesión completada
        this.ui.showNotification(`Sesión completada: ${this.formatTime(data.duration)}`);
        
        // Actualizar estadísticas
        await this.updateStatistics();
        
        // Actualizar inmediatamente el elemento específico de la tarea
        this.ui.updateTaskElement(data.taskId);
    }
      handleTimerTick(time) {
        // Actualizar el tiempo en la UI de la tarea activa
        if (this.currentTask) {
            this.ui.updateTaskTime(this.currentTask.id, time);
            
            // Actualizar el tiempo de sesión actual en el TaskManager (sin persistir constantemente)
            const myTaskIndex = this.tasks.myTasks.findIndex(task => task.id === this.currentTask.id);
            if (myTaskIndex !== -1) {
                this.tasks.myTasks[myTaskIndex].currentSessionTime = time;
            }
        }
    }

    handleTrackerError(error) {
        console.error('❌ Error de tracking:', error);
        this.ui.showError('Error en tracking: ' + error.message);
    }    handleTabChange(tabName) {
        console.log('🔄 Cambio de tab:', tabName);
        
        if (tabName === 'my-tasks') {
            // Sincronizar el estado actual del tracker con las tareas antes de mostrarlas
            this.syncTrackerStateWithTasks();
            this.ui.showMyTasks(this.tasks.getMyTasks());
        }
    }
    
    // Método auxiliar para sincronizar el estado del tracker con las tareas
    syncTrackerStateWithTasks() {
        if (this.tracker.isTracking() && this.currentTask) {
            const currentTaskId = this.tracker.getCurrentTaskId();
            const currentDuration = this.tracker.getCurrentDuration();
            
            // Actualizar el estado de la tarea activa sin persistir
            const myTaskIndex = this.tasks.myTasks.findIndex(task => task.id === currentTaskId);
            if (myTaskIndex !== -1) {
                this.tasks.myTasks[myTaskIndex].trackingState = 'running';
                this.tasks.myTasks[myTaskIndex].currentSessionTime = currentDuration;
            }
            
            console.log(`🔄 Estado sincronizado para tarea ${currentTaskId}: running, ${currentDuration}s`);
        }
    }
    
    async handleSearchRequest(query) {
        console.log('🔍 Búsqueda solicitada:', query);
        try {
            this.ui.showSearchLoading(true);
            const results = await this.tasks.searchTasks(query);
            this.ui.showSearchResults(results);
        } catch (error) {
            this.ui.showError('Error en búsqueda: ' + error.message);
        } finally {
            this.ui.showSearchLoading(false);
        }
    }
    
    async handleRefreshAllTasks() {
        console.log('🔄 Recargando todas las tareas...');
        try {
            this.ui.showSearchLoading(true);
            
            // Obtener el token del AuthManager
            const token = this.auth.getToken();
            if (!token) {
                throw new Error('No hay token de autenticación disponible');
            }
            
            await this.tasks.loadTasks(token);
            this.ui.showNotification('Tareas actualizadas');
        } catch (error) {
            this.ui.showError('Error al recargar tareas: ' + error.message);
        } finally {
            this.ui.showSearchLoading(false);
        }
    }

    async handleAddToMyTasks(taskId) {
        console.log('➕ Agregando tarea a mis tareas:', taskId);
        try {
            const task = await this.tasks.getTaskById(taskId);
            if (task) {
                await this.tasks.addToMyTasks(task);
                this.ui.showNotification('Tarea agregada a tu lista');
            }
        } catch (error) {
            this.ui.showError('Error al agregar tarea: ' + error.message);
        }
    }

    async handleRemoveFromMyTasks(taskId) {
        console.log('➖ Removiendo tarea de mis tareas:', taskId);
        try {
            await this.tasks.removeFromMyTasks(taskId);
            this.ui.showNotification('Tarea removida de tu lista');
        } catch (error) {
            this.ui.showError('Error al remover tarea: ' + error.message);
        }    }
    
    async handleSortTasksRequest(sortBy) {
        console.log('🔄 Solicitud de ordenamiento:', sortBy);
        try {
            const sortedTasks = this.tasks.sortMyTasks(sortBy);
            // La actualización de la UI se manejará a través del evento myTasksUpdated
            this.ui.showNotification(`Tareas ordenadas por ${sortBy}`);
        } catch (error) {
            this.ui.showError('Error al ordenar tareas: ' + error.message);
        }
    }
    
    async handleStartTask(taskId) {
        console.log('▶️ Iniciando tarea:', taskId);
        try {
            // Detener cualquier tarea activa
            if (this.isTracking && this.currentTask) {
                await this.tracker.stopTracking(this.currentTask.id);
            }
            
            // Iniciar nueva tarea
            const task = await this.tasks.getTaskById(taskId);
            if (task) {
                await this.tracker.startTracking(task);
            }
        } catch (error) {
            this.ui.showError('Error al iniciar tracking: ' + error.message);
        }
    }

    async handleStopTask(taskId) {
        console.log('⏹️ Deteniendo tarea:', taskId);
        try {
            await this.tracker.stopTracking(taskId);
        } catch (error) {
            this.ui.showError('Error al detener tracking: ' + error.message);
        }    }

    handleThemeToggle(isDark) {
        console.log('🎨 Cambiando tema:', isDark ? 'dark' : 'light');
        this.storage.set('darkMode', isDark);
        this.ui.setTheme(isDark);
    }

    // Utility methods
    async updateStatistics() {
        try {
            const stats = await this.tracker.getProductivityStats();
            this.ui.updateHeaderStatistics(stats);
        } catch (error) {
            console.warn('⚠️ Error actualizando estadísticas:', error);
        }
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }    // Método para sincronizar el estado después de restaurar una sesión
    async handleSessionRestored() {
        // El método handleTrackerSessionRestored ahora maneja la lógica de restauración
        // Este método se mantiene para compatibilidad pero la lógica principal está en el evento
        console.log('🔄 Verificando estado de sesión al inicializar...');
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ClickUpTrackerApp();
});

// Exportar para uso en otros módulos si es necesario
export { ClickUpTrackerApp };
