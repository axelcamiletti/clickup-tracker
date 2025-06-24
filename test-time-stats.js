// Test para verificar la corrección del tracking de tiempo
console.log('🧪 Test de corrección de tracking de tiempo iniciado...');

// Simular un delay para esperar que la aplicación cargue
setTimeout(async () => {
    if (typeof window !== 'undefined' && window.app) {
        console.log('✅ App cargada, iniciando pruebas de tracking de tiempo...');
        
        const app = window.app;
        const tracker = app.tracker;
        const auth = app.auth;
        const storage = app.storage;
        
        // Test 1: Verificar autenticación
        console.log('\n📋 Test 1: Verificando autenticación...');
        const token = auth.getToken();
        const userInfo = auth.getUserInfo();
        
        console.log('Token disponible:', !!token);
        console.log('User info disponible:', !!userInfo);
        
        if (token && userInfo) {
            console.log(`Usuario autenticado: ${userInfo.username} (ID: ${userInfo.id})`);
        } else {
            console.log('❌ No hay autenticación disponible');
            return;
        }
        
        // Test 2: Verificar obtención de equipo
        console.log('\n📋 Test 2: Verificando equipo...');
        let teamId = await storage.get('clickup_team_id');
        
        if (!teamId) {
            console.log('⚠️ No hay teamId guardado, obteniendo equipos...');
            try {
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
                        await storage.set('clickup_team_id', teamId);
                        console.log(`✅ TeamId obtenido y guardado: ${teamId}`);
                    }
                } else {
                    console.log('❌ Error obteniendo equipos:', await teamsResponse.text());
                }
            } catch (error) {
                console.error('❌ Error en la solicitud de equipos:', error);
            }
        } else {
            console.log(`✅ TeamId ya disponible: ${teamId}`);
        }
        
        if (!teamId) {
            console.log('❌ No se pudo obtener el teamId');
            return;
        }
        
        // Test 3: Probar obtención de estadísticas
        console.log('\n📋 Test 3: Obteniendo estadísticas desde API...');
        
        try {
            // Importar funciones de timeTracking
            const { getTimeStatisticsFromAPI } = await import('./src/js/api/timeTracking.js');
            
            // Obtener estadísticas directamente desde la API
            const apiStats = await getTimeStatisticsFromAPI(teamId, token, userInfo);
            
            console.log('Estadísticas desde API:');
            console.log(`- Hoy: ${apiStats.todayFormatted} (${apiStats.today}s)`);
            console.log(`- Semana: ${apiStats.weekFormatted} (${apiStats.week}s)`);
            console.log(`- Rango de semana: ${apiStats.startDate.toLocaleDateString()} - ${apiStats.endDate.toLocaleDateString()}`);
            console.log(`- Entradas de hoy: ${apiStats.todayEntries.length}`);
            console.log(`- Entradas de semana: ${apiStats.weekEntries.length}`);
              // Test 4: Comparar con estadísticas locales
            console.log('\n📋 Test 4: Guardando y comparando con estadísticas locales...');
            
            // Guardar en el storage para probar
            try {
                // Verificar si existe el método saveTimeStatistics
                if (typeof storage.saveTimeStatistics === 'function') {
                    await storage.saveTimeStatistics(apiStats.today, apiStats.week);
                    console.log('✅ Estadísticas guardadas correctamente');
                } else {
                    console.log('⚠️ Método saveTimeStatistics no disponible');
                }
            } catch (error) {
                console.error('❌ Error guardando estadísticas:', error);
            }
            
            // Obtener estadísticas
            const stats = await storage.getTimeStatistics();
            
            console.log('Estadísticas locales:');
            console.log(`- Hoy: ${stats.today}s`);
            console.log(`- Semana: ${stats.week}s`);
            
            console.log('\nDiferencias:');
            console.log(`- Hoy: ${apiStats.today - stats.today}s`);
            console.log(`- Semana: ${apiStats.week - stats.week}s`);
            
            // Test 5: Probar método actualizado en el tracker
            console.log('\n📋 Test 5: Probando método actualizado en tracker...');
            const trackerStats = await tracker.getProductivityStats();
            
            console.log('Estadísticas desde tracker:');
            console.log(`- Hoy: ${trackerStats.today} (${trackerStats.todaySeconds}s)`);
            console.log(`- Semana: ${trackerStats.week} (${trackerStats.weekSeconds}s)`);
            console.log(`- Rango de semana: ${trackerStats.weekRange}`);
            
            console.log('\n🎉 Tests completados exitosamente.');
        } catch (error) {
            console.error('❌ Error en las pruebas:', error);
        }
    } else {
        console.log('❌ App no disponible para testing');
    }
}, 3000);
