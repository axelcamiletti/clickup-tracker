// Gestión de tracking de tiempo
export class TimeTracker {
    constructor(storage) {
        this.storage = storage;
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
    }

    async restorePreviousSession() {
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
    }

    formatSeconds(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Estadísticas de productividad
    async getProductivityStats() {
        const stats = await this.storage.getTimeStatistics();
        
        return {
            today: this.formatSeconds(stats.today),
            week: this.formatSeconds(stats.week),
            total: this.formatSeconds(stats.total),
            todaySeconds: stats.today,
            weekSeconds: stats.week,
            totalSeconds: stats.total
        };
    }

    // Integración real con la API de ClickUp para time entries
    async createTimeEntryInClickUp(taskId, duration, description = '') {
        console.log(`🔗 Creando time entry en ClickUp para tarea ${taskId}, duración: ${duration}s`);
        
        try {
            // Obtener el token de autenticación
            const token = await this.storage.get('clickupToken');
            if (!token) {
                throw new Error('No hay token de autenticación disponible');
            }

            // Convertir duración de segundos a milisegundos
            const durationMs = duration * 1000;
            const startTimeMs = this.startTime ? this.startTime.getTime() : Date.now() - durationMs;
            
            // Crear time entry en ClickUp
            const response = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/time`, {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: description || `Tiempo registrado desde ClickUp Tracker`,
                    time: durationMs,
                    start: startTimeMs,
                    billable: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Error creando time entry: ${response.status} - ${errorData.err || response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Time entry creado exitosamente en ClickUp:', data.data?.id);
            
            return { 
                success: true, 
                timeEntryId: data.data?.id,
                duration: duration,
                taskId: taskId
            };

        } catch (error) {
            console.error('❌ Error creando time entry en ClickUp:', error);
            throw error;
        }
    }
}
