// Gestión de tracking de tiempo
export class TimeTracker {
    constructor(storage, auth) {
        this.storage = storage;
        this.auth = auth;
        this.listeners = new Map();
        
        // Estado del tracker (simplificado - solo play/stop)
        this.isRunning = false;
        this.currentTaskId = null;
        this.currentTask = null; // Almacenar el objeto completo de la tarea
        this.startTime = null;
        this.elapsedTime = 0;
        
        // Timer
        this.timerInterval = null;
        this.tickInterval = 1000; // 1 segundo
    }

    async init() {
        console.log('⏱️ Inicializando TimeTracker...');
        
        // Recuperar estado previo si existe
        await this.restorePreviousSession();
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
    }

    async start(taskId) {
        console.log(`▶️ Iniciando tracking para tarea ${taskId}...`);
        
        try {
            if (this.isRunning && this.currentTaskId !== taskId) {
                // Si hay otro tracking activo, detenerlo primero
                await this.stop();
            }
            
            // Configurar nuevo tracking
            this.currentTaskId = taskId;
            this.startTime = new Date();
            this.isRunning = true;
            this.elapsedTime = 0;
            
            // Guardar estado
            await this.saveCurrentState();
            
            // Iniciar timer
            this.startTimer();
            
            this.emit('started', {
                taskId: this.currentTaskId,
                task: this.currentTask,
                startTime: this.startTime
            });
            
            console.log('✅ Tracking iniciado');
            
        } catch (error) {
            console.error('❌ Error iniciando tracking:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async stop() {
        console.log('⏹️ Deteniendo tracking...');
        
        try {
            if (!this.isRunning) {
                throw new Error('No hay tracking activo');
            }
            
            // Detener timer
            this.stopTimer();
            
            const endTime = new Date();
            const totalDuration = this.calculateTotalDuration();
            const durationInSeconds = Math.floor(totalDuration / 1000);
            
            // Crear time entry en ClickUp
            try {
                await this.createTimeEntryInClickUp(
                    this.currentTaskId, 
                    durationInSeconds,
                    `Sesión de ${this.formatDuration(totalDuration)} desde ClickUp Tracker`
                );
                console.log('✅ Tiempo registrado en ClickUp exitosamente');
            } catch (apiError) {
                console.warn('⚠️ Error enviando tiempo a ClickUp, guardando solo localmente:', apiError.message);
                // Continuar con el guardado local aunque falle la API
            }
            
            // Guardar en historial local (backup)
            await this.storage.saveTaskHistory(
                this.currentTaskId,
                durationInSeconds,
                this.startTime.toISOString(),
                endTime.toISOString()
            );

            const stoppedData = {
                taskId: this.currentTaskId,
                task: this.currentTask, // Enviar el objeto completo de la tarea
                startTime: this.startTime,
                endTime: endTime,
                duration: durationInSeconds
            };
            
            // Limpiar estado
            this.reset();
            await this.clearSavedState();
            
            this.emit('stopped', stoppedData);
            console.log(`✅ Tracking detenido. Duración: ${this.formatDuration(totalDuration)}`);
            
            return stoppedData;
            
        } catch (error) {
            console.error('❌ Error deteniendo tracking:', error);
            this.emit('error', error);
            throw error;
        }
    }

    // Métodos de interfaz simplificada para compatibilidad con app.js
    async startTracking(task) {
        console.log(`🎯 Iniciando tracking para tarea: ${task.name}`);
        
        try {
            // Almacenar el objeto completo de la tarea
            this.currentTask = task;
            await this.start(task.id);
            
            this.emit('started', {
                task: task,
                taskId: task.id,
                startTime: this.startTime
            });
            
            return { success: true, task: task };
            
        } catch (error) {
            console.error('❌ Error en startTracking:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async stopTracking(taskId) {
        console.log(`🛑 Deteniendo tracking para tarea: ${taskId}`);
        
        try {
            if (!this.isRunning || this.currentTaskId !== taskId) {
                throw new Error('No hay tracking activo para esta tarea');
            }
            
            const duration = this.getCurrentDuration();
            const result = await this.stop();
            
            return { success: true, duration: duration };
            
        } catch (error) {
            console.error('❌ Error en stopTracking:', error);
            this.emit('error', error);
            throw error;
        }
    }

    // Gestión del timer
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = this.calculateElapsedTime();
            this.emit('tick', Math.floor(this.elapsedTime / 1000));
        }, this.tickInterval);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // Cálculos de tiempo
    calculateElapsedTime() {
        if (!this.startTime) return 0;
        
        const now = new Date();
        return now - this.startTime;
    }

    calculateTotalDuration() {
        return this.calculateElapsedTime();
    }

    // Estado y persistencia
    async saveCurrentState() {
        const state = {
            isRunning: this.isRunning,
            currentTaskId: this.currentTaskId,
            startTime: this.startTime?.toISOString(),
            lastSaved: new Date().toISOString()
        };
        
        await this.storage.set('trackerState', state);
    }    async restorePreviousSession() {
        const savedState = await this.storage.get('trackerState');
        
        if (savedState && savedState.isRunning) {
            console.log('🔄 Restaurando sesión anterior...');
            
            this.isRunning = savedState.isRunning;
            this.currentTaskId = savedState.currentTaskId;
            this.startTime = savedState.startTime ? new Date(savedState.startTime) : null;
            
            // Verificar si la sesión es muy antigua (más de 24 horas)
            const lastSaved = new Date(savedState.lastSaved);
            const hoursSinceLastSave = (new Date() - lastSaved) / (1000 * 60 * 60);
            
            if (hoursSinceLastSave > 24) {
                console.log('⚠️ Sesión muy antigua, descartando...');
                await this.clearSavedState();
                this.reset();
                return;
            }
            
            this.startTimer();
            
            // Emitir evento de sesión restaurada
            this.emit('sessionRestored', {
                taskId: this.currentTaskId,
                startTime: this.startTime,
                duration: this.getCurrentDuration()
            });
            
            console.log('✅ Sesión restaurada');
        }
    }

    async clearSavedState() {
        await this.storage.delete('trackerState');
    }

    reset() {
        this.stopTimer();
        this.isRunning = false;
        this.currentTaskId = null;
        this.currentTask = null;
        this.startTime = null;
        this.elapsedTime = 0;
    }

    // Getters para el estado actual
    isTracking() {
        return this.isRunning;
    }

    getCurrentTaskId() {
        return this.currentTaskId;
    }

    getCurrentDuration() {
        return Math.floor(this.calculateElapsedTime() / 1000);
    }

    getStartTime() {
        return this.startTime;
    }

    getTrackingState() {
        return this.isRunning ? 'running' : 'stopped';
    }

    // Utilidades de formato
    formatDuration(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        return this.formatSeconds(seconds);
    }    formatSeconds(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    formatWeekRange(startDate, endDate) {
        const options = { month: 'short', day: 'numeric' };
        const startFormatted = startDate.toLocaleDateString('es-ES', options);
        const endFormatted = endDate.toLocaleDateString('es-ES', options);
        
        return `${startFormatted} - ${endFormatted}`;
    }// Estadísticas de productividad
    async getProductivityStats() {
        try {
            // Intentar obtener estadísticas actualizadas desde la API de ClickUp
            const token = this.auth.getToken();
            const userInfo = this.auth.getUserInfo();
            
            // Si tenemos token y userInfo, obtener directamente de la API
            if (token && userInfo && userInfo.id) {
                console.log(`🔍 Obteniendo estadísticas de tiempo para usuario ${userInfo.username} (${userInfo.id})...`);
                
                // Primero intentar obtener el teamId desde el storage
                let teamId = await this.storage.get('clickup_team_id');
                
                // Si no hay teamId guardado, obtener equipos y usar el primero
                if (!teamId) {
                    console.log('⚠️ No hay teamId guardado, obteniendo equipos...');
                    const teamsResponse = await fetch('https://api.clickup.com/api/v2/team', {
                        headers: {
                            'Authorization': token,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (teamsResponse.ok) {
                        const teamsData = await teamsResponse.json();
                        if (teamsData.teams && teamsData.teams.length > 0) {
                            teamId = teamsData.teams[0].id;
                            // Guardar para futuras consultas
                            await this.storage.set('clickup_team_id', teamId);
                            console.log(`✅ TeamId obtenido y guardado: ${teamId}`);
                        }
                    }
                }
                
                // Si tenemos teamId, obtener estadísticas desde la API
                if (teamId) {
                    // Importar la función desde timeTracking.js
                    const { getTimeStatisticsFromAPI } = await import('../api/timeTracking.js');
                    
                    // Obtener estadísticas directamente desde la API
                    const apiStats = await getTimeStatisticsFromAPI(teamId, token, userInfo);
                      try {
                        // Guardar en el almacenamiento para respaldo
                        await this.storage.saveTimeStatistics(apiStats.today, apiStats.week);
                    } catch (storageError) {
                        console.warn('⚠️ No se pudieron guardar las estadísticas:', storageError.message);
                        // Continuar, aunque no se hayan podido guardar
                    }
                    
                    // Retornar datos formateados
                    return {
                        today: this.formatSeconds(apiStats.today),
                        week: this.formatSeconds(apiStats.week),
                        weekRange: this.formatWeekRange(apiStats.startDate, apiStats.endDate),
                        todaySeconds: apiStats.today,
                        weekSeconds: apiStats.week
                    };
                }
            }
            
            // Si no se puede obtener desde la API, usar las estadísticas locales
            console.log('⚠️ Usando estadísticas locales...');
            return await this.getLocalProductivityStats();
        } catch (error) {
            console.error('❌ Error obteniendo estadísticas desde API:', error);
            // En caso de error, usar las estadísticas locales
            console.log('⚠️ Usando estadísticas locales debido a error...');
            return await this.getLocalProductivityStats();
        }
    }
    
    // Método para obtener estadísticas desde el almacenamiento local
    async getLocalProductivityStats() {
        const stats = await this.storage.getTimeStatistics();
        
        // Calcular el rango de fechas de la semana actual
        const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo, retroceder 6 días
        
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() + mondayOffset);
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        // Formatear el rango de fechas
        const weekRange = this.formatWeekRange(startOfWeek, endOfWeek);
        
        return {
            today: this.formatSeconds(stats.today),
            week: this.formatSeconds(stats.week),
            weekRange: weekRange,
            todaySeconds: stats.today,
            weekSeconds: stats.week
        };
    }    // Integración real con la API de ClickUp para time entries
    async createTimeEntryInClickUp(taskId, duration, description = '') {
        console.log(`🔗 Creando time entry en ClickUp para tarea ${taskId}, duración: ${duration}s`);
        
        try {
            // Obtener el token de autenticación del AuthManager
            const token = this.auth.getToken();
            if (!token) {
                throw new Error('No hay token de autenticación disponible');
            }

            // Calcular timestamps de inicio y fin en milisegundos (formato integer)
            const endTimeMs = Date.now(); // Tiempo actual en milisegundos
            const startTimeMs = this.startTime ? this.startTime.getTime() : (endTimeMs - (duration * 1000));
            
            console.log(`📊 Enviando time entry (solo start/end):`, {
                durationSeconds: duration,
                startTimeMs: startTimeMs,
                endTimeMs: endTimeMs,
                startTime: new Date(startTimeMs).toISOString(),
                endTime: new Date(endTimeMs).toISOString(),
                calculatedDuration: Math.round((endTimeMs - startTimeMs) / 1000) + 's'
            });
            
            // Crear time entry en ClickUp usando solo start y end (sin duration)
            const payload = {
                description: description || `Tiempo registrado desde ClickUp Tracker`,
                start: startTimeMs,  // Integer timestamp en milisegundos
                end: endTimeMs,      // Integer timestamp en milisegundos
                billable: false
            };
            
            console.log(`📤 Payload final:`, payload);
            
            const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/time`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`❌ Error response from ClickUp:`, {
                    status: response.status,
                    statusText: response.statusText,
                    errorData: errorData
                });
                throw new Error(`Error creando time entry: ${response.status} - ${errorData.err || response.statusText}`);
            }

            const data = await response.json();
            console.log('📥 Respuesta de ClickUp:', data);
            console.log(`✅ Time entry creado exitosamente. ID: ${data.data?.id || data.id}`);
            
            return { 
                success: true, 
                timeEntryId: data.data?.id || data.id,
                duration: duration,
                taskId: taskId,
                clickupResponse: data
            };

        } catch (error) {
            console.error('❌ Error creando time entry en ClickUp:', error);
            throw error;
        }
    }
}
