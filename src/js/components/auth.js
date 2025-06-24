// Gestión de autenticación con ClickUp API
export class AuthManager {
    constructor(storage) {
        this.storage = storage;
        this.listeners = new Map();
        
        // No hay token hardcodeado - se obtendrá del usuario
        this.currentToken = null;
        this.userInfo = null;
        this.isAuthenticated = false;
    }    async init() {
        console.log('🔐 Inicializando AuthManager...');
        
        // Intentar obtener token guardado
        const savedToken = await this.storage.get('clickup_api_token');
        
        if (savedToken) {
            console.log('🔑 Token encontrado en storage, validando...');
            try {
                await this.authenticate(savedToken);
                // Si la autenticación es exitosa, ocultar la pantalla de setup
                this.hideSetupScreen();
            } catch (error) {
                console.error('❌ Token guardado inválido:', error);
                // Limpiar token inválido
                await this.storage.delete('clickup_api_token');
                this.showSetupScreen();
            }
        } else {
            console.log('🔍 No hay token guardado, mostrando pantalla de setup');
            this.showSetupScreen();
        }
    }

    showSetupScreen() {
        const setupScreen = document.getElementById('setup-screen');
        const mainApp = document.getElementById('main-app');
        
        if (setupScreen) setupScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        
        // Configurar eventos del formulario de setup
        this.setupFormEvents();
    }

    hideSetupScreen() {
        const setupScreen = document.getElementById('setup-screen');
        const mainApp = document.getElementById('main-app');
        
        if (setupScreen) setupScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
    }

    setupFormEvents() {
        const form = document.getElementById('setup-form');
        const submitBtn = document.getElementById('setup-submit-btn');
        const apiKeyInput = document.getElementById('api-key-input');
        const errorDiv = document.getElementById('setup-error');
        const errorText = document.getElementById('setup-error-text');
        const loadingDiv = document.getElementById('setup-loading');
        const submitText = document.getElementById('setup-submit-text');

        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const apiKey = apiKeyInput.value.trim();
            if (!apiKey) {
                this.showSetupError('Por favor ingresa tu API key de ClickUp');
                return;
            }

            // Mostrar estado de carga
            submitBtn.disabled = true;
            loadingDiv.classList.remove('hidden');
            submitText.textContent = 'Conectando...';
            errorDiv.classList.add('hidden');            try {
                // Validar y guardar API key automáticamente
                await this.authenticate(apiKey);
                
                // Ocultar pantalla de setup
                this.hideSetupScreen();
                
                console.log('✅ Setup completado - API key guardada automáticamente');
                
            } catch (error) {
                console.error('❌ Error en setup:', error);
                this.showSetupError('API key inválida. Verifica que sea correcta.');
            } finally {
                // Restaurar estado del botón
                submitBtn.disabled = false;
                loadingDiv.classList.add('hidden');
                submitText.textContent = 'Conectar con ClickUp';
            }
        });
    }

    showSetupError(message) {
        const errorDiv = document.getElementById('setup-error');
        const errorText = document.getElementById('setup-error-text');
        
        if (errorText) errorText.textContent = message;
        if (errorDiv) errorDiv.classList.remove('hidden');
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
    }    async authenticate(token) {
        console.log('🔑 Intentando autenticar...');
        
        try {
            // Validar formato del token
            if (!this.isValidToken(token)) {
                throw new Error('Formato de token inválido');
            }

            // Validar token con la API de ClickUp
            const isValid = await this.validateTokenWithAPI(token);
            
            if (isValid) {
                this.currentToken = token;
                this.isAuthenticated = true;
                
                // Guardar token automáticamente una sola vez aquí
                await this.storage.set('clickup_api_token', token);
                
                // La información del usuario ya se obtuvo en validateTokenWithAPI
                
                this.emit('authenticated', {
                    token: this.currentToken,
                    user: this.userInfo
                });
                
                console.log('✅ Autenticación exitosa - Token guardado automáticamente');
                return { success: true, token: this.currentToken };
                
            } else {
                throw new Error('Token inválido');
            }
            
        } catch (error) {
            console.error('❌ Error en autenticación:', error);
            this.emit('error', error);
            throw error;
        }
    }

    async disconnect() {
        console.log('🔌 Desconectando...');
        
        try {
            // Limpiar datos locales
            this.currentToken = null;
            this.userInfo = null;
            this.isAuthenticated = false;
            
            // Eliminar token del almacenamiento
            await this.storage.delete('clickup_api_token');
            
            // Mostrar pantalla de setup nuevamente
            this.showSetupScreen();
            
            this.emit('disconnected');
            console.log('✅ Desconectado exitosamente');
            
        } catch (error) {
            console.error('❌ Error al desconectar:', error);
            this.emit('error', error);
            throw error;
        }
    }

    // Método para cambiar API Key (desconectar y mostrar setup)
    async changeApiKey() {
        console.log('🔄 Cambiando API Key...');
        
        try {
            await this.disconnect();
            
            // Limpiar el campo de input para que el usuario ingrese una nueva API key
            const apiKeyInput = document.getElementById('api-key-input');
            if (apiKeyInput) {
                apiKeyInput.value = '';
            }
            
            // Ocultar cualquier error previo
            const errorDiv = document.getElementById('setup-error');
            if (errorDiv) {
                errorDiv.classList.add('hidden');
            }
            
            console.log('✅ Listo para nueva API Key');
            
        } catch (error) {
            console.error('❌ Error cambiando API Key:', error);
            throw error;
        }
    }

    // Validaciones
    isValidToken(token) {
        if (!token || typeof token !== 'string') {
            return false;
        }
        
        // Los tokens de ClickUp generalmente empiezan con 'pk_' y tienen cierta longitud
        return token.length > 10 && token.trim() !== '';
    }    // Simulación de validación de token (TODO: implementar API real)
    async validateTokenWithAPI(token) {
        try {
            console.log('🔍 Validando token con ClickUp API...');
            
            const response = await fetch('https://api.clickup.com/api/v2/user', {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const userData = await response.json();
            console.log('✅ Token válido, usuario:', userData.user.username);
            
            // Guardar información del usuario
            this.userInfo = {
                id: userData.user.id,
                username: userData.user.username,
                email: userData.user.email,
                profilePicture: userData.user.profilePicture,
                initials: userData.user.initials
            };

            return true;
            
        } catch (error) {
            console.error('❌ Error validando token:', error);
            return false;
        }
    }

    // Obtener información del usuario desde la API real
    async getUserInfo(token) {
        try {
            const response = await fetch('https://api.clickup.com/api/v2/user', {
                method: 'GET',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return {
                id: data.user.id,
                username: data.user.username,
                email: data.user.email,
                profilePicture: data.user.profilePicture,
                initials: data.user.initials
            };
            
        } catch (error) {
            console.error('❌ Error obteniendo info del usuario:', error);
            // Fallback con datos por defecto
            return {
                id: 'user_default',
                username: 'Usuario ClickUp',
                email: 'usuario@clickup.com',
                profilePicture: null,
                initials: 'UC'
            };
        }
    }

    // Métodos de utilidad
    getToken() {
        return this.currentToken;
    }

    getUserInfo() {
        return this.userInfo;
    }

    isAuthenticated() {
        return this.isAuthenticated;
    }

    // Gestión de headers para API calls
    getAuthHeaders() {
        if (!this.currentToken) {
            throw new Error('No hay token de autenticación disponible');
        }
        
        return {
            'Authorization': this.currentToken,
            'Content-Type': 'application/json'
        };
    }

    // Método para renovar token (para implementación futura)
    async refreshToken() {
        if (!this.currentToken) {
            throw new Error('No hay token para renovar');
        }
        
        try {
            // TODO: Implementar lógica de renovación de token si ClickUp lo soporta
            console.log('🔄 Renovando token...');
            
            // Por ahora, simplemente validamos el token actual
            const isValid = await this.validateTokenWithAPI(this.currentToken);
            
            if (!isValid) {
                throw new Error('Token expirado o inválido');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Error renovando token:', error);
            await this.disconnect();
            throw error;
        }
    }

    // Método para validar si el token sigue siendo válido
    async validateCurrentToken() {
        if (!this.currentToken) {
            return false;
        }
        
        try {
            return await this.validateTokenWithAPI(this.currentToken);
        } catch (error) {
            console.error('❌ Error validando token actual:', error);
            return false;
        }
    }

    // Generar URL para obtener token manualmente
    getTokenInstructions() {
        return {
            url: 'https://app.clickup.com/settings/apps',
            steps: [
                '1. Ve a tu cuenta de ClickUp',
                '2. Navega a Settings → Apps',
                '3. Haz clic en "Generate" en la sección API Token',
                '4. Copia el token generado',
                '5. Pégalo en el campo de arriba'
            ]
        };
    }

    getCurrentUserId() {
        if (this.userInfo && this.userInfo.id) {
            return this.userInfo.id;
        }
        throw new Error('Usuario no autenticado o información de usuario no disponible');
    }
}
