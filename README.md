# Antigravity Mobile Bridge: Extensión Nativa 🌉

**Antigravity Mobile Bridge** es la evolución definitiva del puente de desarrollo móvil, ahora integrada como una **Extensión Nativa de VS Code**. Permite transformar cualquier smartphone en una potente estación de control para tu IDE, con ejecución remota, persistencia de datos y un ciclo de retroalimentación autónomo para la IA.

---

## ✨ Características Premium (v1.0.0)

- **🚀 Arquitectura Integrada:** Ya no requiere un servidor Node externo. Todo el motor (Express + Socket.io) corre dentro del proceso de la extensión de VS Code.
- **🎨 Interfaz Mobile "Tokyo Night":** Rediseño estético premium con estética *glassmorphism*, tipografía `Fira Code` para código y una paleta de colores coherente con los mejores temas oscuros actuales.
- **⚡ Terminal Remota con Auto-Feedback:**
  - Envía comandos sugeridos por la IA a la terminal del IDE con un toque.
  - **Captura de Salida:** El resultado (`stdout`/`stderr`) se muestra en el móvil y se re-inyecta automáticamente al Agente.
  - **Análisis Autónomo:** El Agente "ve" lo que pasó en la terminal y genera un análisis inmediato, permitiendo corregir errores de forma autónoma.
- **📱 Emparejamiento por QR:** Conexión ultrarrápida y segura mediante escaneo de código QR generado dinámicamente con tokens de sesión únicos.
- **💾 Persistencia con SQLite:** Todo el historial de chat se guarda permanentemente en la base de datos `antigravity.sqlite` dentro del almacenamiento interno de la extensión.
- **⚙️ Activación Automática:** El puente se inicia y muestra el QR de conexión automáticamente cada vez que abres tu IDE.

---

## 🚀 Instalación y Configuración

### Instalación vía VSIX
1. Descarga el archivo `antigravity-extension-1.0.0.vsix` de la carpeta `extencion/`.
2. En VS Code, ve a la vista de **Extensions** (`Ctrl+Shift+X`).
3. Haz clic en el menú superior de tres puntos (`...`) y selecciona **Install from VSIX...**.
4. Selecciona el archivo y espera a la notificación de éxito.

### Comandos de la Extensión
Puedes controlar el puente manualmente desde la paleta de comandos (`Ctrl+Shift+P`):
- `Antigravity: Start Mobile Bridge`: Inicia el servidor del puente.
- `Antigravity: Stop Mobile Bridge`: Detiene el servidor.
- `Antigravity: Show Connection QR`: Muestra el código QR de emparejamiento.

---

## 📱 Guía de Uso Rápido

1. **Inicia el IDE:** El puente se activará solo y mostrará un código QR.
2. **Escanea y Conecta:** Usa la cámara de tu móvil para abrir la URL con el token seguro.
3. **Interactúa:** Envía prompts desde tu móvil. El texto se inyectará directamente al chat del Agente en el IDE.
4. **Ejecuta Comandos:** Cuando el Agente sugiera un comando (ej. `npm run dev`), pulsa **"⚡ Usar en Terminal"**.
5. **Recibe el Análisis:** El servidor ejecutará el comando, verás la salida en tu celular y el Agente te confirmará el éxito o te indicará cómo corregir cualquier fallo.

---

## 🛠️ Desarrollo y Tecnologías

La versión de extensión moderna utiliza:
- **VS Code Extension API**: Para la integración profunda con el editor.
- **Express & Socket.io**: Para la comunicación de baja latencia con el móvil.
- **sqlite3-tab & tabla-model**: Para la gestión de datos persistentes.
- **PowerShell Injection**: Para el enfoque dinámico y pegado de prompts en el IDE host.

---

*Desarrollado con ❤️ para el ecosistema Antigravity.*
