# ClickUp Tracker

Una aplicación de escritorio moderna para trackear tiempo en tareas de ClickUp, desarrollada con Electron, JavaScript vanilla y TailwindCSS.

## 🚀 Características

- **Autenticación con ClickUp**: Conecta tu cuenta usando token de API
- **Gestión de Tareas**: Visualiza y selecciona tareas activas
- **Tracking de Tiempo**: Inicia, pausa y detiene el tracking con cronómetro en tiempo real
- **Estadísticas**: Ve tu tiempo de hoy y esta semana
- **Interfaz Moderna**: UI limpia con TailwindCSS y modo oscuro
- **Persistencia**: Guarda tu sesión y configuración automáticamente

## 🛠️ Tecnologías

- **Electron** - Framework para aplicaciones de escritorio
- **JavaScript Vanilla (ES6+)** - Sin frameworks frontend
- **TailwindCSS** - Framework de CSS utility-first
- **Electron Store** - Almacenamiento persistente
- **ClickUp API** - Integración con ClickUp

## 📦 Instalación

1. Clona el repositorio:
```bash
git clone <tu-repositorio>
cd clickup-tracker
```

2. Instala las dependencias:
```bash
npm install
```

3. Compila los estilos:
```bash
npm run build-css
```

## 🚀 Desarrollo

### Ejecutar en modo desarrollo:
```bash
npm run dev
```
Esto iniciará la aplicación y observará cambios en los archivos CSS.

### Ejecutar normalmente:
```bash
npm start
```

### Compilar CSS manualmente:
```bash
npm run build-css
```

### Compilar la aplicación para distribución:
```bash
npm run make
```
Esto generará los instaladores en la carpeta `out/make`.

## 🔧 Configuración

### Obtener Token de ClickUp

1. Ve a tu cuenta de ClickUp
2. Navega a **Settings → Apps**
3. En la sección **API Token**, haz clic en **Generate**
4. Copia el token generado
5. Pégalo en la aplicación al conectar

### Primera Vez

1. Ejecuta la aplicación con `npm start`
2. Ingresa tu token de ClickUp en el campo correspondiente
3. Haz clic en "Conectar con ClickUp"
4. Selecciona una tarea de la lista desplegable
5. ¡Comienza a trackear tiempo!

## 🎯 Uso

### Conectar con ClickUp
- Ingresa tu token de API en el campo correspondiente
- Haz clic en "Conectar con ClickUp"
- El indicador de estado mostrará "Conectado" en verde

### Trackear Tiempo
1. Selecciona una tarea de la lista desplegable
2. Haz clic en "Iniciar Tracking"
3. El cronómetro comenzará a contar
4. Usa "Pausar" para pausar temporalmente
5. Haz clic en "Detener Tracking" para finalizar y registrar el tiempo

### Atajos de Teclado
- `Ctrl + MAYUS + B`: Abrir/Minimizar App

## 🌙 Modo Oscuro

Haz clic en el ícono de tema en la esquina inferior derecha para alternar entre modo claro y oscuro.

## 🐛 Resolución de Problemas

### La aplicación no inicia
- Verifica que Node.js esté instalado
- Ejecuta `npm install` para instalar dependencias
- Verifica que no haya errores en la consola

### Token inválido
- Verifica que el token sea correcto
- Asegúrate de que el token tenga los permisos necesarios
- Regenera el token en ClickUp si es necesario

### Estilos no se muestran correctamente
- Ejecuta `npm run build-css` para recompilar los estilos

---

Desarrollado con ❤️ usando Electron y TailwindCSS
