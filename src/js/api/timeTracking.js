// API functions for ClickUp Time Tracking
const API_BASE_URL = 'https://api.clickup.com/api/v2';

/**
 * Obtiene el tiempo tracked de la semana actual desde ClickUp
 * @param {string} teamId - ID del equipo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} Datos del tiempo de la semana
 */
export async function getWeekTimeTracking(teamId, token) {
    if (!token) throw new Error('Token no encontrado');

    // Calcular fechas de inicio y fin de la semana (lunes a domingo)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo, retroceder 6 días
    
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + mondayOffset);
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Convertir a timestamps en milisegundos
    const startTimestamp = startOfWeek.getTime();
    const endTimestamp = endOfWeek.getTime();

    try {
        console.log(`🔍 Obteniendo time entries de la semana - Team: ${teamId}, Start: ${startOfWeek.toISOString()}, End: ${endOfWeek.toISOString()}`);
        
        const url = `${API_BASE_URL}/team/${teamId}/time_entries?start_date=${startTimestamp}&end_date=${endTimestamp}`;
        console.log(`📡 URL de la API: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error en API (${response.status}):`, errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📊 Respuesta de ClickUp (semana):`, data);
        
        // Calcular tiempo total en milisegundos, excluyendo timers activos (duración negativa)
        const totalTime = data.data.reduce((total, entry) => {
            const duration = parseInt(entry.duration);
            // Solo sumar duraciones positivas (timers completados)
            return duration > 0 ? total + duration : total;
        }, 0);

        console.log(`⏱️ Tiempo total de la semana: ${totalTime}ms (${Math.floor(totalTime / 1000)}s)`);

        return {
            totalTime: totalTime, // en milisegundos
            startDate: startOfWeek,
            endDate: endOfWeek,
            entries: data.data
        };
    } catch (error) {
        console.error('❌ Error fetching week time tracking:', error);
        throw error;
    }
}

/**
 * Obtiene el tiempo tracked del día actual
 * @param {string} teamId - ID del equipo
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} Datos del tiempo del día
 */
export async function getTodayTimeTracking(teamId, token) {
    if (!token) throw new Error('Token no encontrado');

    // Calcular inicio y fin del día actual
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = startOfDay.getTime();
    const endTimestamp = endOfDay.getTime();

    try {
        console.log(`🔍 Obteniendo time entries de hoy - Team: ${teamId}, Start: ${startOfDay.toISOString()}, End: ${endOfDay.toISOString()}`);
        
        const url = `${API_BASE_URL}/team/${teamId}/time_entries?start_date=${startTimestamp}&end_date=${endTimestamp}`;
        console.log(`📡 URL de la API: ${url}`);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Error en API (${response.status}):`, errorText);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`📊 Respuesta de ClickUp (hoy):`, data);
        
        // Calcular tiempo total en milisegundos, excluyendo timers activos (duración negativa)
        const totalTime = data.data.reduce((total, entry) => {
            const duration = parseInt(entry.duration);
            // Solo sumar duraciones positivas (timers completados)
            return duration > 0 ? total + duration : total;
        }, 0);

        console.log(`⏱️ Tiempo total de hoy: ${totalTime}ms (${Math.floor(totalTime / 1000)}s)`);

        return {
            totalTime: totalTime,
            date: today,
            entries: data.data
        };
    } catch (error) {
        console.error('❌ Error fetching today time tracking:', error);
        throw error;
    }
}

/**
 * Convierte milisegundos a formato HH:MM:SS
 * @param {number} milliseconds - Tiempo en milisegundos
 * @returns {string} Tiempo formateado
 */
export function formatTime(milliseconds) {
    if (!milliseconds || milliseconds < 0) return '00:00:00';
    
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Formatea el rango de fechas de la semana
 * @param {Date} startDate - Fecha de inicio
 * @param {Date} endDate - Fecha de fin
 * @returns {string} Rango formateado
 */
export function formatWeekRange(startDate, endDate) {
    const options = { month: 'short', day: 'numeric' };
    const startFormatted = startDate.toLocaleDateString('es-ES', options);
    const endFormatted = endDate.toLocaleDateString('es-ES', options);
    
    return `${startFormatted} - ${endFormatted}`;
}
