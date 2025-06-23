// Test Script para verificar la funcionalidad de ordenamiento
console.log('🧪 Iniciando test de funcionalidad de ordenamiento...');

// Esperar a que la aplicación se cargue
setTimeout(() => {
    if (window.app) {
        const { tasks, ui } = window.app;
        
        console.log('\n📋 Test 1: Verificando métodos de ordenamiento...');
        
        // Verificar que el método sortMyTasks existe
        if (tasks.sortMyTasks) {
            console.log('✅ Método sortMyTasks disponible');
        } else {
            console.log('❌ Falta método sortMyTasks');
        }
        
        // Verificar que el elemento select existe
        const sortSelect = document.getElementById('sort-tasks-select');
        if (sortSelect) {
            console.log('✅ Elemento sort-tasks-select encontrado');
        } else {
            console.log('❌ Elemento sort-tasks-select no encontrado');
        }
        
        // Test 2: Verificar que hay tareas para ordenar
        console.log('\n📋 Test 2: Verificando tareas disponibles...');
        const myTasks = tasks.getMyTasks();
        console.log(`Mis tareas disponibles: ${myTasks.length}`);
        
        if (myTasks.length === 0) {
            console.log('⚠️ No hay tareas para ordenar. Agregando tareas de ejemplo...');
              // Agregar algunas tareas de ejemplo para testing
            const exampleTasks = [
                {
                    id: 'test_001',
                    name: 'Zebra Task',
                    project: { name: 'Project B' },
                    addedAt: new Date('2024-01-01').toISOString()
                },
                {
                    id: 'test_002', 
                    name: 'Alpha Task',
                    project: { name: 'Project A' },
                    addedAt: new Date('2024-01-15').toISOString()
                },
                {
                    id: 'test_003', 
                    name: 'Beta Task',
                    project: { name: 'Project C' },
                    addedAt: new Date('2024-01-30').toISOString()
                }
            ];
            
            // Simular agregar tareas (solo para testing)
            exampleTasks.forEach(task => {
                tasks.myTasks.push({
                    ...task,
                    status: { status: 'open', color: '#808080' },
                    priority: { priority: 'normal', color: '#808080' },
                    list: { id: 'test', name: 'Test List' },
                    assignees: [],
                    due_date: null,
                    time_estimate: null,
                    description: 'Test task',
                    totalTrackedTime: 0,
                    lastTracked: null,
                    trackingState: 'stopped',
                    currentSessionTime: 0
                });
            });
            
            console.log(`✅ Agregadas ${exampleTasks.length} tareas de ejemplo`);
        }
          // Test 3: Probar diferentes tipos de ordenamiento
        console.log('\n📋 Test 3: Probando diferentes tipos de ordenamiento...');
        
        const sortOptions = ['newest', 'oldest', 'project', 'name'];
        
        sortOptions.forEach(sortBy => {
            console.log(`\n🔄 Ordenando por: ${sortBy}`);
            try {
                const beforeSort = tasks.getMyTasks().map(t => ({ 
                    name: t.name, 
                    project: t.project.name,
                    addedAt: t.addedAt || 'sin fecha'
                }));
                console.log('Antes:', beforeSort);
                
                tasks.sortMyTasks(sortBy);
                
                const afterSort = tasks.getMyTasks().map(t => ({ 
                    name: t.name, 
                    project: t.project.name,
                    addedAt: t.addedAt || 'sin fecha'
                }));
                console.log('Después:', afterSort);
                
                console.log(`✅ Ordenamiento por ${sortBy} completado`);
            } catch (error) {
                console.log(`❌ Error ordenando por ${sortBy}:`, error);
            }
        });
          // Test 4: Probar el evento del select
        console.log('\n📋 Test 4: Probando evento del select...');
        
        if (sortSelect) {
            // Simular cambio en el select - usar 'newest' como primera opción
            sortSelect.value = 'newest';
            sortSelect.dispatchEvent(new Event('change'));
            
            setTimeout(() => {
                console.log('✅ Evento de cambio del select disparado (newest)');
                
                // Probar también con 'oldest'
                setTimeout(() => {
                    sortSelect.value = 'oldest';
                    sortSelect.dispatchEvent(new Event('change'));
                    console.log('✅ Evento de cambio del select disparado (oldest)');
                }, 500);
            }, 100);
        }
        
        // Test 5: Verificar que la UI se actualiza
        console.log('\n📋 Test 5: Verificando actualización de UI...');
        
        // Cambiar a la tab de mis tareas para ver el resultado
        if (ui.currentTab !== 'my-tasks') {
            ui.switchTab('my-tasks');
            console.log('✅ Cambiado a tab "my-tasks"');
        }
        
        setTimeout(() => {
            const taskElements = document.querySelectorAll('[data-task-id]');
            console.log(`UI actualizada: ${taskElements.length} elementos de tarea encontrados`);
        }, 200);
        
        console.log('\n🎉 Tests de ordenamiento completados. Verifica la consola para detalles.');
        
    } else {
        console.log('❌ App no disponible para testing');
    }
}, 3000);
