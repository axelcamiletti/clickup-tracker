// Gestión de almacenamiento usando Electron Store
export class StorageManager {
    constructor() {
        this.electronAPI = window.electronAPI;
        this.cache = new Map();
    }

    async init() {
        console.log('🗃️ Inicializando StorageManager...');
        // Cargar configuración inicial en cache
        await this.loadInitialData();
    }

    async loadInitialData() {
        try {
            const keys = ['clickupToken', 'darkMode', 'windowBounds', 'lastSelectedTask'];
            for (const key of keys) {
                const value = await this.electronAPI.store.get(key);
                if (value !== undefined) {
                    this.cache.set(key, value);
                }
            }
        } catch (error) {
            console.warn('⚠️ Error cargando datos iniciales:', error);
        }
    }

    async get(key, defaultValue = null) {
        try {
            // Intentar obtener del cache primero
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            // Si no está en cache, obtener del almacenamiento persistente
            const value = await this.electronAPI.store.get(key);
            
            if (value !== undefined) {
                this.cache.set(key, value);
                return value;
            }
            
            return defaultValue;
        } catch (error) {
            console.error(`❌ Error obteniendo ${key}:`, error);
            return defaultValue;
        }
    }

    async set(key, value) {
        try {
            // Actualizar cache
            this.cache.set(key, value);
            
            // Guardar en almacenamiento persistente
            await this.electronAPI.store.set(key, value);
            
            return true;
        } catch (error) {
            console.error(`❌ Error guardando ${key}:`, error);
            return false;
        }
    }

    async delete(key) {
        try {
            // Remover del cache
            this.cache.delete(key);
            
            // Remover del almacenamiento persistente
            await this.electronAPI.store.delete(key);
            
            return true;
        } catch (error) {
            console.error(`❌ Error eliminando ${key}:`, error);
            return false;
        }
    }

    async clear() {
        try {
            this.cache.clear();
            
            // Para electron-store, necesitamos eliminar claves específicas
            const keys = ['clickupToken', 'darkMode', 'lastSelectedTask'];
            for (const key of keys) {
                await this.electronAPI.store.delete(key);
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error limpiando almacenamiento:', error);
            return false;
        }
    }

    // Métodos específicos para datos de la aplicación
    async saveUserSettings(settings) {
        const settingsKey = 'userSettings';
        return await this.set(settingsKey, {
            ...await this.get(settingsKey, {}),
            ...settings,
            lastUpdated: new Date().toISOString()
        });
    }

    async getUserSettings() {
        return await this.get('userSettings', {
            theme: 'light',
            autoStartTracking: false,
            notificationsEnabled: true,
            defaultWorkspace: null
        });
    }

    async saveTaskHistory(taskId, duration, startTime, endTime) {
        const historyKey = 'taskHistory';
        const history = await this.get(historyKey, []);
        
        const entry = {
            taskId,
            duration,
            startTime,
            endTime,
            date: new Date().toISOString().split('T')[0] // YYYY-MM-DD
        };
        
        history.push(entry);
        
        // Mantener solo los últimos 100 registros
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        
        return await this.set(historyKey, history);
    }

    async getTaskHistory(days = 30) {
        const history = await this.get('taskHistory', []);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return history.filter(entry => {
            const entryDate = new Date(entry.date);
            return entryDate >= cutoffDate;
        });
    }

    async getTimeStatistics() {
        const history = await this.getTaskHistory(30);
        const now = new Date();
        
        // Tiempo de hoy
        const today = now.toISOString().split('T')[0];
        const todayTime = history
            .filter(entry => entry.date === today)
            .reduce((total, entry) => total + entry.duration, 0);
        
        // Tiempo de esta semana
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekTime = history
            .filter(entry => new Date(entry.date) >= weekStart)
            .reduce((total, entry) => total + entry.duration, 0);
        
        // Tiempo total (últimos 30 días)
        const totalTime = history
            .reduce((total, entry) => total + entry.duration, 0);
        
        return {
            today: todayTime,
            week: weekTime,
            total: totalTime
        };
    }

    // Gestión de tareas favoritas
    async addFavoriteTask(taskId) {
        const favorites = await this.get('favoriteTasks', []);
        if (!favorites.includes(taskId)) {
            favorites.push(taskId);
            await this.set('favoriteTasks', favorites);
        }
    }

    async removeFavoriteTask(taskId) {
        const favorites = await this.get('favoriteTasks', []);
        const index = favorites.indexOf(taskId);
        if (index > -1) {
            favorites.splice(index, 1);
            await this.set('favoriteTasks', favorites);
        }
    }

    async getFavoriteTasks() {
        return await this.get('favoriteTasks', []);
    }

    // Validación de datos
    isValidToken(token) {
        return typeof token === 'string' && 
               token.length > 10 && 
               /^pk_[a-zA-Z0-9_]+$/.test(token);
    }

    isValidTaskId(taskId) {
        return typeof taskId === 'string' && taskId.length > 0;
    }

    // Métodos de utilidad
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async getStorageInfo() {
        const cacheSize = this.cache.size;
        const settings = await this.getUserSettings();
        const history = await this.get('taskHistory', []);
        
        return {
            cacheEntries: cacheSize,
            historyEntries: history.length,
            lastUpdated: settings.lastUpdated || 'Never',
            estimatedSize: this.formatBytes(JSON.stringify({
                cache: Array.from(this.cache.entries()),
                history,
                settings
            }).length)
        };
    }
}
