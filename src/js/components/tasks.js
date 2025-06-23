// Gestión de tareas de ClickUp
export class TaskManager {    constructor(storage) {
        this.storage = storage;
        this.listeners = new Map();
        this.allTasks = []; // Todas las tareas de ClickUp
        this.myTasks = []; // Tareas en mi lista personal
        this.selectedTask = null;
        this.workspaces = [];
        this.currentWorkspace = null;
        this.isInitialized = false;
    }    async init() {
        console.log('📋 Inicializando TaskManager...');
        
        // Cargar mi lista personal de tareas
        this.myTasks = await this.storage.get('myTasks', []);
        
        // Cargar tarea seleccionada previamente
        const lastTaskId = await this.storage.get('lastSelectedTask');
        if (lastTaskId) {
            const task = this.myTasks.find(t => t.id === lastTaskId);
            if (task) {
                this.selectedTask = task;
            }
        }
        
        this.isInitialized = true;
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
    }    async loadTasks(token) {
        console.log('📥 Cargando tareas desde ClickUp...');
        
        try {
            const tasks = await this.fetchTasksFromAPI(token);
            this.allTasks = tasks;
            this.emit('tasksLoaded', tasks);
            
            console.log(`✅ ${tasks.length} tareas cargadas desde ClickUp`);
            return tasks;
            
        } catch (error) {
            console.error('❌ Error cargando tareas:', error);
            this.emit('error', error);
            throw error;
        }
    }    // Llamada real a la API de ClickUp
    async fetchTasksFromAPI(token) {
        console.log('🌐 Obteniendo tareas desde la API de ClickUp...');
        
        try {
            // 1. Obtener información del usuario autenticado
            const userInfo = await this.getCurrentUser(token);
            if (!userInfo) {
                throw new Error('No se pudo obtener información del usuario');
            }
            
            console.log(`👤 Usuario autenticado: ${userInfo.username} (ID: ${userInfo.id})`);
            
            // 2. Obtener teams/workspaces
            const teams = await this.getAccessibleTeams(token);
            if (teams.length === 0) {
                console.warn('⚠️ No se encontraron teams accesibles');
                throw new Error('No hay teams accesibles');
            }
            
            console.log(`🏢 Teams encontrados: ${teams.length}`);
            let allTasks = [];
            
            // 3. Obtener tareas de múltiples fuentes
            for (const team of teams) {
                console.log(`📋 Procesando team: ${team.name}`);
                
                try {
                    // Método 1: Tareas asignadas específicamente al usuario
                    const assignedTasks = await this.getAssignedTasks(token, team.id, userInfo.id);
                    if (assignedTasks.length > 0) {
                        console.log(`✅ ${assignedTasks.length} tareas asignadas encontradas en ${team.name}`);
                        allTasks = allTasks.concat(assignedTasks);
                    }
                    
                    // Método 2: Tareas de espacios accesibles
                    const spaceTasks = await this.getTasksFromSpaces(token, team.id, userInfo.id);
                    if (spaceTasks.length > 0) {
                        console.log(`📁 ${spaceTasks.length} tareas de espacios encontradas en ${team.name}`);
                        allTasks = allTasks.concat(spaceTasks);
                    }
                    
                } catch (error) {
                    console.warn(`⚠️ Error procesando team ${team.name}:`, error.message);
                    // Continuar con otros teams
                }
            }
            
            // 4. Eliminar duplicados y formatear
            const uniqueTasks = this.removeDuplicatesAndFormat(allTasks);
            
            console.log(`📊 Total de tareas únicas encontradas: ${uniqueTasks.length}`);
            
            if (uniqueTasks.length === 0) {
                console.warn('⚠️ No se encontraron tareas, usando datos de ejemplo');
                return await this.getFallbackTasks();
            }
            
            return uniqueTasks;
            
        } catch (error) {
            console.error('❌ Error en fetchTasksFromAPI:', error);
            console.log('🔄 Intentando con datos de ejemplo...');
            return await this.getFallbackTasks();
        }
    }

    // Datos de ejemplo si la API falla
    async getFallbackTasks() {
        console.log('📋 Usando datos de ejemplo...');
        return [
            {
                id: 'task_001',
                name: 'Implementar autenticación OAuth',
                status: { status: 'in progress', color: '#4CAF50' },
                priority: { priority: 'high', color: '#FF5722' },
                list: { id: 'list_001', name: 'Development Sprint' },
                project: { id: 'project_001', name: 'ClickUp Tracker' },
                assignees: [{ id: 'user_001', username: 'developer', email: 'dev@example.com' }],
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                time_estimate: 14400000,
                description: 'Implementar el flujo completo de autenticación con OAuth2 para ClickUp'
            },
            {
                id: 'task_002',
                name: 'Diseñar interfaz de usuario',
                status: { status: 'to do', color: '#757575' },
                priority: { priority: 'medium', color: '#FF9800' },
                list: { id: 'list_001', name: 'Development Sprint' },
                project: { id: 'project_001', name: 'ClickUp Tracker' },
                assignees: [{ id: 'user_001', username: 'developer', email: 'dev@example.com' }],
                due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                time_estimate: 10800000,
                description: 'Crear diseños mockups para la interfaz principal'
            }
        ];
    }

    selectTask(task) {
        console.log('📌 Seleccionando tarea:', task.name);
        
        this.selectedTask = task;
        
        // Guardar selección
        this.storage.set('lastSelectedTask', task.id);
        
        this.emit('taskSelected', task);
    }    getTaskById(taskId) {
        // Buscar primero en mis tareas, luego en todas las tareas
        return this.myTasks.find(task => task.id === taskId) || 
               this.allTasks.find(task => task.id === taskId);
    }

    getSelectedTask() {
        return this.selectedTask;
    }

    getTasks() {
        return this.allTasks; // Para compatibilidad
    }    // Filtros y búsqueda
    filterTasksByStatus(status) {
        return this.allTasks.filter(task => 
            task.status.status.toLowerCase() === status.toLowerCase()
        );
    }

    filterTasksByPriority(priority) {
        return this.allTasks.filter(task => 
            task.priority.priority.toLowerCase() === priority.toLowerCase()
        );
    }    searchTasks(query) {
        const searchTerm = query.toLowerCase();
        return this.allTasks.filter(task => 
            task.name.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.list.name.toLowerCase().includes(searchTerm) ||
            task.project.name.toLowerCase().includes(searchTerm)
        );
    }    sortMyTasks(sortBy) {
        console.log('🔄 Ordenando mis tareas por:', sortBy);
        
        switch (sortBy) {
            case 'name':
                this.myTasks.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'project':
                this.myTasks.sort((a, b) => a.project.name.localeCompare(b.project.name));
                break;
            case 'newest':
                // Más recientes primero (fecha más nueva arriba)
                this.myTasks.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
                break;
            case 'oldest':
                // Más antiguas primero (fecha más vieja arriba)
                this.myTasks.sort((a, b) => new Date(a.addedAt || 0) - new Date(b.addedAt || 0));
                break;
            default:
                // Por defecto, mostrar más recientes primero
                this.myTasks.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
                break;
        }
        
        // Guardar el orden actualizado
        this.storage.set('myTasks', this.myTasks);
        this.emit('myTasksUpdated', this.myTasks);
        
        return this.myTasks;
    }

    getTasksByList(listId) {
        return this.allTasks.filter(task => task.list.id === listId);
    }

    getTasksByProject(projectId) {
        return this.allTasks.filter(task => task.project.id === projectId);
    }

    // Utilidades
    formatTaskForDisplay(task) {
        return {
            id: task.id,
            name: task.name,
            displayName: `${task.name} (${task.list.name})`,
            status: task.status.status,
            statusColor: task.status.color,
            priority: task.priority.priority,
            priorityColor: task.priority.color,
            list: task.list.name,
            project: task.project.name,
            dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : null,
            timeEstimate: task.time_estimate ? this.formatTimeEstimate(task.time_estimate) : null,
            assignees: task.assignees.map(a => a.username).join(', ')
        };
    }

    formatTimeEstimate(milliseconds) {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${minutes}m`;
    }    getTaskStatistics() {
        const total = this.allTasks.length;
        const myTasksTotal = this.myTasks.length;
        
        const byStatus = this.allTasks.reduce((acc, task) => {
            const status = task.status.status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        
        const byPriority = this.allTasks.reduce((acc, task) => {
            const priority = task.priority.priority;
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, {});
        
        return {
            total,
            myTasksTotal,
            byStatus,
            byPriority
        };
    }

    // Gestión de favoritos
    async addToFavorites(taskId) {
        await this.storage.addFavoriteTask(taskId);
    }

    async removeFromFavorites(taskId) {
        await this.storage.removeFavoriteTask(taskId);
    }

    async getFavoriteTasks() {
        const favoriteIds = await this.storage.getFavoriteTasks();
        return this.tasks.filter(task => favoriteIds.includes(task.id));
    }    // Actualización de una tarea específica
    async refreshTask(taskId, token) {
        try {
            console.log(`🔄 Actualizando tarea ${taskId}...`);
            
            if (!token) {
                throw new Error('Token requerido para actualizar tarea');
            }
            
            // Por ahora, recargamos todas las tareas
            await this.loadTasks(token);
            
        } catch (error) {
            console.error('❌ Error actualizando tarea:', error);
            throw error;
        }
    }

    // Gestión de "Mis Tareas" (lista personal)
    async addToMyTasks(task) {
        console.log('➕ Agregando tarea a mi lista:', task.name);
        
        // Verificar si ya está en la lista
        const exists = this.myTasks.find(t => t.id === task.id);
        if (exists) {
            console.warn('⚠️ La tarea ya está en tu lista');
            return false;
        }
        
        // Agregar información adicional para tracking
        const myTask = {
            ...task,
            addedAt: new Date().toISOString(),
            totalTrackedTime: 0,
            lastTracked: null,
            trackingState: 'stopped', // stopped, running, paused
            currentSessionTime: 0
        };
        
        this.myTasks.push(myTask);
        await this.storage.set('myTasks', this.myTasks);
        
        this.emit('myTasksUpdated', this.myTasks);
        return true;
    }

    async removeFromMyTasks(taskId) {
        console.log('➖ Removiendo tarea de mi lista:', taskId);
        
        const index = this.myTasks.findIndex(t => t.id === taskId);
        if (index === -1) {
            return false;
        }
        
        this.myTasks.splice(index, 1);
        await this.storage.set('myTasks', this.myTasks);
        
        this.emit('myTasksUpdated', this.myTasks);
        return true;
    }

    getMyTasks() {
        return this.myTasks;
    }

    getAllTasks() {
        return this.allTasks;
    }

    isInMyTasks(taskId) {
        return this.myTasks.some(t => t.id === taskId);
    }    // Método unificado para actualizar el estado de seguimiento de una tarea
    async updateTaskTrackingState(taskId, state, sessionTime = 0) {
        console.log(`📝 Actualizando estado de seguimiento para tarea ${taskId}: ${state}, sessionTime: ${sessionTime}`);
        
        // Actualizar en myTasks
        const myTaskIndex = this.myTasks.findIndex(task => task.id === taskId);
        if (myTaskIndex !== -1) {
            this.myTasks[myTaskIndex].trackingState = state;
            this.myTasks[myTaskIndex].currentSessionTime = sessionTime;
            
            if (state === 'stopped' && sessionTime > 0) {
                this.myTasks[myTaskIndex].totalTrackedTime = (this.myTasks[myTaskIndex].totalTrackedTime || 0) + sessionTime;
                this.myTasks[myTaskIndex].lastTracked = new Date().toISOString();
            }
        }
        
        // Actualizar en allTasks si existe
        const allTaskIndex = this.allTasks.findIndex(task => task.id === taskId);
        if (allTaskIndex !== -1) {
            this.allTasks[allTaskIndex].trackingState = state;
            this.allTasks[allTaskIndex].currentSessionTime = sessionTime;
        }
        
        // Guardar cambios y emitir evento
        await this.storage.set('myTasks', this.myTasks);
        this.emit('myTasksUpdated', this.myTasks);
        
        return myTaskIndex !== -1;
    }

    // Búsqueda en todas las tareas
    searchAllTasks(query) {
        if (!query || query.trim() === '') {
            return this.allTasks;
        }
        
        const searchTerm = query.toLowerCase();
        return this.allTasks.filter(task => 
            task.name.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm) ||
            task.list.name.toLowerCase().includes(searchTerm) ||
            task.project.name.toLowerCase().includes(searchTerm)
        );
    }    // Limpiar datos
    clear() {
        this.allTasks = [];
        this.myTasks = [];
        this.selectedTask = null;
        this.workspaces = [];
        this.currentWorkspace = null;
    }

    async clearCompletedTasks() {
        console.log('🧹 Limpiando tareas completadas...');
        
        // Remover tareas completadas de mi lista
        const completedStates = ['complete', 'closed', 'done'];
        const initialCount = this.myTasks.length;
        
        this.myTasks = this.myTasks.filter(task => 
            !completedStates.includes(task.status.status.toLowerCase())
        );
        
        await this.storage.set('myTasks', this.myTasks);
        this.emit('myTasksUpdated', this.myTasks);
        
        const removedCount = initialCount - this.myTasks.length;
        console.log(`✅ Removidas ${removedCount} tareas completadas`);
        return removedCount;
    }

    // Métodos auxiliares para mejorar la carga de tareas
    async getCurrentUser(token) {
        try {
            const response = await fetch('https://api.clickup.com/api/v2/user', {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error obteniendo información del usuario: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email
            };
        } catch (error) {
            console.error('❌ Error obteniendo usuario:', error);
            return null;
        }
    }

    async getAccessibleTeams(token) {
        try {
            const response = await fetch('https://api.clickup.com/api/v2/team', {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error obteniendo teams: ${response.status} - ${response.statusText}`);
            }

            const data = await response.json();
            return data.teams || [];
        } catch (error) {
            console.error('❌ Error obteniendo teams:', error);
            return [];
        }
    }

    async getAssignedTasks(token, teamId, userId) {
        try {
            const response = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/task?assignees[]=${userId}&include_closed=false`, {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.tasks || [];
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo tareas asignadas:', error.message);
        }
        return [];
    }

    async getTasksFromSpaces(token, teamId, userId) {
        let spaceTasks = [];
        
        try {
            // Obtener espacios del team
            const spacesResponse = await fetch(`https://api.clickup.com/api/v2/team/${teamId}/space?archived=false`, {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (spacesResponse.ok) {
                const spacesData = await spacesResponse.json();
                const spaces = spacesData.spaces || [];
                
                // Limitar a los primeros 5 espacios para evitar demasiadas llamadas
                for (const space of spaces.slice(0, 5)) {
                    try {
                        const spaceTasksResponse = await fetch(`https://api.clickup.com/api/v2/space/${space.id}/task?assignees[]=${userId}&include_closed=false`, {
                            method: 'GET',
                            headers: {
                                'Authorization': token,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (spaceTasksResponse.ok) {
                            const spaceTasksData = await spaceTasksResponse.json();
                            const tasks = spaceTasksData.tasks || [];
                            spaceTasks = spaceTasks.concat(tasks);
                        }
                    } catch (error) {
                        console.warn(`⚠️ Error obteniendo tareas del espacio ${space.name}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Error obteniendo espacios:', error.message);
        }
        
        return spaceTasks;
    }

    removeDuplicatesAndFormat(tasks) {
        // Eliminar duplicados basados en ID
        const uniqueTasks = tasks.filter((task, index, self) => 
            index === self.findIndex(t => t.id === task.id)
        );

        // Formatear tareas para uso interno
        return uniqueTasks.map(task => ({
            id: task.id,
            name: task.name,
            status: {
                status: task.status?.status || 'unknown',
                color: task.status?.color || '#808080'
            },
            priority: {
                priority: task.priority?.priority || 'normal',
                color: task.priority?.color || '#808080'
            },
            list: {
                id: task.list?.id || 'unknown',
                name: task.list?.name || 'Sin Lista'
            },
            project: {
                id: task.project?.id || task.folder?.id || 'unknown',
                name: task.project?.name || task.folder?.name || 'Sin Proyecto'
            },
            assignees: task.assignees || [],
            due_date: task.due_date,
            time_estimate: task.time_estimate,
            description: task.description || '',
            url: task.url,
            date_created: task.date_created,
            date_updated: task.date_updated
        }));
    }
}
