// Test específico para verificar la corrección del tracking
console.log('🧪 Test de corrección de tracking iniciado...');

// Simular un delay para esperar que la aplicación cargue
setTimeout(() => {
    if (typeof window !== 'undefined' && window.app) {
        console.log('✅ App cargada, iniciando pruebas de tracking...');
        
        const app = window.app;
        const tracker = app.tracker;
        const ui = app.ui;
        const tasks = app.tasks;
        
        // Test 1: Verificar que los métodos necesarios existen
        console.log('\n📋 Test 1: Verificando métodos...');
        
        if (tracker.isTracking && tracker.getCurrentTaskId && tracker.getCurrentDuration) {
            console.log('✅ Métodos del tracker disponibles');
        } else {
            console.log('❌ Faltan métodos del tracker');
        }
        
        if (ui.updateTaskElement && ui.getTrackingButtons) {
            console.log('✅ Métodos de UI disponibles');
        } else {
            console.log('❌ Faltan métodos de UI');
        }
        
        if (tasks.updateTaskTrackingState) {
            console.log('✅ Método updateTaskTrackingState disponible');
        } else {
            console.log('❌ Falta método updateTaskTrackingState');
        }
        
        // Test 2: Verificar estado inicial
        console.log('\n📋 Test 2: Verificando estado inicial...');
        console.log(`Tracker running: ${tracker.isTracking()}`);
        console.log(`Current task: ${tracker.getCurrentTaskId()}`);
        console.log(`Current tab: ${ui.currentTab}`);
        
        // Test 3: Simular inicio de tracking si hay tareas disponibles
        console.log('\n📋 Test 3: Verificando sincronización...');
        
        const myTasks = tasks.getMyTasks();
        console.log(`Mis tareas disponibles: ${myTasks.length}`);
        
        if (myTasks.length > 0) {
            const firstTask = myTasks[0];
            console.log(`Primera tarea: ${firstTask.name}`);
            console.log(`Estado de tracking: ${firstTask.trackingState || 'no definido'}`);
            
            // Verificar si los botones se muestran correctamente
            const buttonsHtml = ui.getTrackingButtons(firstTask);
            const isStartButton = buttonsHtml.includes('tracking-button start');
            const isStopButton = buttonsHtml.includes('tracking-button stop');
            
            console.log(`Botón start visible: ${isStartButton}`);
            console.log(`Botón stop visible: ${isStopButton}`);
            
            // Si hay una sesión activa, verificar que se muestre correctamente
            if (tracker.isTracking() && tracker.getCurrentTaskId() === firstTask.id) {
                console.log('✅ Sesión activa detectada correctamente');
                console.log(`Duración actual: ${tracker.getCurrentDuration()}s`);
            }
        }
        
        // Test 4: Verificar eventos
        console.log('\n📋 Test 4: Verificando eventos...');
        
        // Agregar listeners temporales para monitorear eventos
        let eventsReceived = 0;
        
        const testEvents = ['started', 'stopped', 'tick', 'sessionRestored'];
        testEvents.forEach(eventName => {
            tracker.on(eventName, (data) => {
                eventsReceived++;
                console.log(`📡 Evento recibido: ${eventName}`, data);
            });
        });
        
        const testUIEvents = ['tabChanged', 'startTaskRequested', 'stopTaskRequested'];
        testUIEvents.forEach(eventName => {
            ui.on(eventName, (data) => {
                eventsReceived++;
                console.log(`📡 Evento UI recibido: ${eventName}`, data);
            });
        });
        
        console.log('✅ Listeners de eventos configurados');
        
        // Test 5: Verificar sincronización en cambio de tabs
        console.log('\n📋 Test 5: Verificando sincronización de tabs...');
        
        // Simular cambio de tab
        const originalTab = ui.currentTab;
        console.log(`Tab actual: ${originalTab}`);
        
        // Si estamos en search, cambiar a my-tasks
        if (originalTab === 'search') {
            ui.switchTab('my-tasks');
            setTimeout(() => {
                console.log(`Tab después del cambio: ${ui.currentTab}`);
                
                // Verificar que las tareas se muestran correctamente
                const tasksContainer = document.querySelector('#my-tasks-list');
                if (tasksContainer) {
                    const taskElements = tasksContainer.querySelectorAll('.task-card');
                    console.log(`Elementos de tarea en UI: ${taskElements.length}`);
                    
                    taskElements.forEach((element, index) => {
                        const hasTrackingClass = element.classList.contains('tracking');
                        const taskId = element.dataset.taskId;
                        const isCurrentTask = tracker.getCurrentTaskId() === taskId;
                        
                        console.log(`Tarea ${index + 1}: ID=${taskId}, tracking class=${hasTrackingClass}, es actual=${isCurrentTask}`);
                    });
                }
                
                // Cambiar de vuelta
                ui.switchTab(originalTab);
            }, 500);
        }
        
        console.log('\n🎉 Tests completados. Monitorea la consola para eventos en tiempo real.');
        
    } else {
        console.log('❌ App no disponible para testing');
    }
}, 3000);
