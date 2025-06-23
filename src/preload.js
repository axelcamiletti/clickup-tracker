const { contextBridge, ipcRenderer } = require('electron');

// API expuesta al renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Operaciones de almacenamiento
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, value) => ipcRenderer.invoke('store-set', key, value),
    delete: (key) => ipcRenderer.invoke('store-delete', key)
  },
  
  // Utilidades
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  
  // Eventos personalizados para el tracker
  on: (channel, callback) => {
    const validChannels = ['timer-update', 'task-changed', 'connection-status'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, callback);
    }
  },
  
  removeListener: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});

// API específica para ClickUp
contextBridge.exposeInMainWorld('clickupAPI', {
  // Métodos que implementaremos más adelante
  authenticate: (token) => {
    // Placeholder para autenticación
    return Promise.resolve({ success: true, token });
  },
  
  getTasks: () => {
    // Placeholder para obtener tareas
    return Promise.resolve([]);
  },
  
  startTimeTracking: (taskId) => {
    // Placeholder para iniciar tracking
    return Promise.resolve({ success: true, taskId });
  },
  
  stopTimeTracking: (taskId, duration) => {
    // Placeholder para detener tracking
    return Promise.resolve({ success: true, taskId, duration });
  }
});
