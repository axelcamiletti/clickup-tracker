const { app, BrowserWindow, ipcMain, shell, globalShortcut } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Configuración de almacenamiento persistente
const store = new Store({
  defaults: {
    windowBounds: { width: 520, height: 800 },
    darkMode: true,
    clickupToken: null
  }
});

let mainWindow;

function createWindow() {
  // Obtener configuración guardada de la ventana
  const { width, height } = store.get('windowBounds');
  
  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 520,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },    titleBarStyle: 'default',
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false // No mostrar hasta que esté listo
  });  // Cargar la aplicación
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Mostrar ventana cuando esté lista
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Abrir DevTools en modo desarrollo
    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });
  // Guardar configuración de la ventana al cerrar
  mainWindow.on('close', (event) => {
    store.set('windowBounds', mainWindow.getBounds());
  });

  // Opcional: Ocultar ventana al minimizar (para mejor experiencia con atajo global)
  mainWindow.on('minimize', () => {
    // Comentado por defecto - descomenta si quieres que se oculte al minimizar
    // mainWindow.hide();
  });

  // Manejar links externos
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Eventos de la aplicación
app.whenReady().then(() => {  createWindow();
    // Registrar atajo global Ctrl + Shift + B
  const ret = globalShortcut.register('CommandOrControl+Shift+B', () => {
    console.log('🎯 Atajo Ctrl + Shift + B activado');
    
    if (mainWindow) {
      // Si la ventana está visible y enfocada, minimizarla
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        console.log('📦 Minimizando ventana (estaba visible y enfocada)');
        mainWindow.minimize();
      } 
      // Si está minimizada, restaurarla
      else if (mainWindow.isMinimized()) {
        console.log('📤 Restaurando ventana (estaba minimizada)');
        mainWindow.restore();
        mainWindow.focus();
        mainWindow.moveTop();
      }
      // Si está visible pero no enfocada, enfocarla
      else if (mainWindow.isVisible() && !mainWindow.isFocused()) {
        console.log('🎯 Enfocando ventana (estaba visible pero sin foco)');
        mainWindow.focus();
        mainWindow.moveTop();
      }
      // Si está oculta, mostrarla
      else if (!mainWindow.isVisible()) {
        console.log('👁️ Mostrando ventana (estaba oculta)');
        mainWindow.show();
        mainWindow.focus();
        mainWindow.moveTop();
      }
    } else {
      console.log('🆕 Creando nueva ventana');
      createWindow();
    }
  });if (!ret) {
    console.log('❌ Error: No se pudo registrar el atajo Ctrl + Shift + B');
  } else {
    console.log('✅ Atajo Ctrl + Shift + B registrado exitosamente');
  }
});

app.on('window-all-closed', () => {
  // Limpiar atajos globales
  globalShortcut.unregisterAll();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  // Limpiar atajos globales al salir
  globalShortcut.unregisterAll();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers para comunicación con el renderer
ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
  return true;
});

// Handler para abrir URLs externas
ipcMain.handle('open-external', (event, url) => {
  shell.openExternal(url);
});

// Handler para obtener información de la aplicación
ipcMain.handle('get-app-info', () => {
  return {
    name: app.getName(),
    version: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node
  };
});
