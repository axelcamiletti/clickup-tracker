// Test de integración con ClickUp API
console.log('🧪 Iniciando test de ClickUp API...');

// Simular un test del time tracking
async function testClickUpIntegration() {
    console.log('🔍 Testeando integración con ClickUp...');
    
    // Verificar que la app esté cargada
    if (typeof window !== 'undefined' && window.app) {
        console.log('✅ App cargada correctamente');
        
        // Verificar si hay tareas en "Mis Tareas"
        const myTasks = window.app.tasks.getMyTasks();
        console.log(`📋 Tareas en mi lista: ${myTasks.length}`);
        
        if (myTasks.length > 0) {
            const testTask = myTasks[0];
            console.log(`🎯 Tarea de prueba: ${testTask.name} (ID: ${testTask.id})`);
            
            // Verificar que el tracker esté disponible
            if (window.app.tracker && typeof window.app.tracker.createTimeEntryInClickUp === 'function') {
                console.log('✅ Método createTimeEntryInClickUp disponible');
                
                // Verificar que hay token
                const token = await window.app.tracker.storage.get('clickupToken');
                if (token) {
                    console.log('✅ Token de ClickUp disponible');
                    console.log('📝 Tip: Inicia y detén el tracking de una tarea para probar la integración');
                } else {
                    console.log('❌ No hay token de ClickUp disponible');
                }
            } else {
                console.log('❌ Método createTimeEntryInClickUp no disponible');
            }
        } else {
            console.log('⚠️ No hay tareas en "Mis Tareas". Agrega algunas tareas primero.');
        }
    } else {
        console.log('❌ App no cargada');
        // Reintentir en 2 segundos
        setTimeout(testClickUpIntegration, 2000);
    }
}

// Ejecutar test cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testClickUpIntegration);
} else {
    testClickUpIntegration();
}
