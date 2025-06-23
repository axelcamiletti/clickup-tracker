#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando ClickUp Tracker en modo desarrollo...\n');

// Proceso para compilar CSS en modo watch
const cssWatcher = spawn('npm', ['run', 'watch-css'], {
  cwd: process.cwd(),
  stdio: 'pipe',
  shell: true
});

cssWatcher.stdout.on('data', (data) => {
  console.log(`📦 CSS: ${data.toString().trim()}`);
});

cssWatcher.stderr.on('data', (data) => {
  console.log(`⚠️ CSS Warning: ${data.toString().trim()}`);
});

// Esperar un poco para que el CSS se compile inicialmente
setTimeout(() => {
  console.log('⚡ Iniciando Electron...\n');
  
  // Proceso de Electron
  const electronProcess = spawn('npx', ['electron', '.'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electronProcess.on('close', (code) => {
    console.log(`\n🔚 Electron cerrado con código ${code}`);
    console.log('🛑 Deteniendo watcher de CSS...');
    cssWatcher.kill();
    process.exit(code);
  });

  electronProcess.on('error', (err) => {
    console.error('❌ Error iniciando Electron:', err);
    cssWatcher.kill();
    process.exit(1);
  });
}, 2000);

// Manejar cierre del proceso
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando aplicación...');
  cssWatcher.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminando aplicación...');
  cssWatcher.kill();
  process.exit(0);
});
