const express = require('express');
const fs = require('fs');
const http = require('http');
const os = require('os');
const { exec } = require('child_process');
const { Server } = require('socket.io');
const sharedsession = require("express-socket.io-session");
const session = require('express-session');
const path = require('path');
const vscode = require('vscode');
const crypto = require('crypto');
const ContextManager = require('./ContextManager');
const QRManager = require('./QRManager');

class BridgeManager {
    constructor(context, dbManager) {
        this.context = context;
        this.dbManager = dbManager;
        this.contextManager = new ContextManager();
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        this.port = 3000;
        this.isRunning = false;
        
        // Usaremos un archivo oculto en la raíz del espacio de trabajo para máxima compatibilidad
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : os.tmpdir();
        this.responseFile = path.join(workspaceFolder, '.ag_bridge.json');
        this.nativeWatcher = null;

        // Token de sesión único
        this.sessionToken = crypto.randomBytes(16).toString('hex');
        this.qrPanel = null;
    }

    async start() {
        if (this.isRunning) return;

        const sessionMiddleware = session({
            secret: "antigravity_secret_key",
            resave: true,
            saveUninitialized: true,
            cookie: { secure: false }
        });

        this.app.use(express.json());
        this.app.use(sessionMiddleware);
        this.io.use(sharedsession(sessionMiddleware, { autoSave: true }));

        // Static files from the extension's public folder
        const publicPath = path.join(this.context.extensionPath, 'public');
        this.app.use(express.static(publicPath));

        this.app.get('/', (req, res) => {
            res.sendFile(path.join(publicPath, 'index.html'));
        });

        this.app.post('/api/login', (req, res) => {
            const { password } = req.body;
            // For now, simple check or use context secrets
            if (password === "antigravity") {
                req.session.isLoggedIn = true;
                return res.json({ status: 'ok' });
            }
            res.status(401).json({ status: 'error' });
        });

        this.setupSocket();
        this.startWatcher();

        this.ip = this.getLocalIP();

        this.server.listen(this.port, '0.0.0.0', () => {
            console.log(`[Bridge] Listening on http://${this.ip}:${this.port}`);
            vscode.window.showInformationMessage(`Antigravity Bridge active on http://${this.ip}:${this.port}`);
        });

        this.isRunning = true;
    }

    setupSocket() {
        // Middleware de autenticación por Token
        this.io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.query.token;
            if (token === this.sessionToken) {
                return next();
            }
            console.log(`[WS] Intento de conexión con token inválido: ${token}`);
            return next(new Error("Autenticación fallida: Token inválido"));
        });

        this.io.on('connection', async (socket) => {
            console.log(`[WS] Client connected: ${socket.id}`);

            // Notificar al panel QR si está abierto
            if (this.qrPanel) {
                this.qrPanel.webview.postMessage({ command: 'connected' });
            }

            // Load history
            try {
                const history = await this.dbManager.getHistory();
                socket.emit('chat_history', history);
            } catch (err) {
                console.error('[WS] History error:', err);
            }

            socket.on('send_prompt', async ({ prompt }) => {
                if (!prompt) return;
                
                console.log(`[WS] Prompt recibido: "${prompt}"`);
                this.injectToIDE(socket, prompt, 'Prompt enviado');
            });

            socket.on('execute_terminal_command', ({ command, cwd }) => {
                if (!command) return;
                
                // 1. Mostrar en la terminal física de VS Code (opcional, para visualización)
                const terminal = vscode.window.activeTerminal || vscode.window.createTerminal();
                terminal.show();
                terminal.sendText(command);

                // 2. Ejecutar de forma capturable para el agente
                const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : os.tmpdir();
                const execCwd = cwd || workspaceFolder;

                exec(command, { cwd: execCwd }, async (error, stdout, stderr) => {
                    const output = stdout || stderr || (error ? error.message : 'Comando ejecutado sin salida.');
                    
                    // Enviar a la terminal del móvil
                    socket.emit('terminal_output', { 
                        output: output, 
                        isError: !!error 
                    });

                    // 3. AUTO-FEEDBACK: Enviar al Agente para análisis
                    const analysisPrompt = `El usuario ejecutó un comando sugerido: \`${command}\`\nResultado:\n\`\`\`\n${output}\n\`\`\`\nPor favor, analiza el resultado y confirma si se logró el objetivo o si hay errores.`;
                    
                    this.injectToIDE(socket, analysisPrompt, 'Analizando resultado');
                });
            });

            socket.on('disconnect', () => {
                console.log(`[WS] Client disconnected: ${socket.id}`);
            });
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            if (this.nativeWatcher) {
                this.nativeWatcher.dispose();
                this.nativeWatcher = null;
            }
            this.isRunning = false;
        }
    }

    startWatcher() {
        if (this.nativeWatcher) return;

        console.log(`[Watcher] Iniciando vigilancia nativa en: ${this.responseFile}`);

        // Crear archivo inicial si no existe
        if (!fs.existsSync(this.responseFile)) {
            fs.writeFileSync(this.responseFile, '');
        }

        // Crear el watcher nativo de VS Code
        this.nativeWatcher = vscode.workspace.createFileSystemWatcher(this.responseFile);

        this.nativeWatcher.onDidChange(async () => {
            console.log(`[Watcher Nativo] Detectado cambio en el archivo.`);
            try {
                // Pequeño delay para asegurar que el archivo terminó de escribirse
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const content = fs.readFileSync(this.responseFile, 'utf8').trim();
                if (content) {
                    console.log(`[Watcher] Enviando al móvil (${content.length} bytes)`);
                    
                    // El frontend espera { response: "string_del_json" }
                    this.io.emit('agent_response', { response: content });
                    
                    this.dbManager.saveMessage('agent', content);
                    
                    // Limpiar el archivo para la próxima respuesta
                    fs.writeFileSync(this.responseFile, '');
                }
            } catch (e) {
                console.error(`[Watcher] Error procesando response: ${e.message}`);
            }
        });
    }

    getLocalIP() {
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    }

    async injectToIDE(socket, prompt, label) {
        // 1. Get IDE Context
        const ideContext = this.contextManager.getSystemPromptWithContext();
        
        // 2. Hidden Instructions
        const hiddenInstruction = `\n\n[SISTEMA: Formatea tu respuesta estrictamente como JSON (con campos "mensaje", "estado", "plan", opcionalmente "comando_sugerido" y opcionalmente "directorio_objetivo" indicando la ruta absoluta del workspace si el comando lo requiere). SIEMPRE que desees ejecutar un comando de terminal, NO uses tus herramientas internas; envíalo ÚNICAMENTE mediante el campo "comando_sugerido" para que el usuario sea quien lo ejecute desde su móvil. Guarda este JSON completo en el archivo "${this.responseFile}" usando el tool de escritura de archivos.]`;
        
        const fullPrompt = prompt + ideContext + hiddenInstruction;

        // 3. Save to History
        await this.dbManager.saveMessage('user', prompt);

        // 4. Trigger Injection Script
        let command = '';
        const scriptsPath = path.join(this.context.extensionPath, 'scripts');
        
        // Intentamos enfocar el chat mediante API nativa (varios IDs posibles)
        try {
            await vscode.commands.executeCommand('workbench.action.chat.focusInput');
        } catch (e) {
            try {
                await vscode.commands.executeCommand('workbench.panel.chat.view.focus');
            } catch (e2) {
                console.log("[Bridge] No se encontró comando nativo de foco para Chat. Usando solo script.");
            }
        }
        
        if (process.platform === 'win32') {
            const scriptPath = path.join(scriptsPath, 'inject.ps1');
            command = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
            socket.emit('prompt_sent', { message: `${label} (Windows)...` });
        } else if (process.platform === 'linux') {
            const scriptPath = path.join(scriptsPath, 'inject.sh');
            command = `bash "${scriptPath}"`;
            socket.emit('prompt_sent', { message: `${label} (Linux)...` });
        } else {
            return console.error(`[WS] Plataforma no soportada`);
        }

        exec(command, { env: { ...process.env, PROMPT_TEXT: fullPrompt } }, (error) => {
            if (error) {
                console.error(`[WS] Error al inyectar: ${error.message}`);
                socket.emit('terminal_status', { message: `❌ Error de inyección.` });
            } else {
                console.log(`[WS] ${label} inyectado.`);
                socket.emit('terminal_status', { message: `✅ Prompt inyectado al IDE.` });
            }
        });
    }

    async showQR() {
        if (!this.isRunning) {
            vscode.window.showErrorMessage("El puente no está iniciado. Inícialo primero.");
            return;
        }

        const url = `http://${this.ip}:${this.port}?token=${this.sessionToken}`;
        const qrDataUri = await QRManager.generateQR(url);
        
        if (this.qrPanel) {
            this.qrPanel.reveal(vscode.ViewColumn.Two);
        } else {
            this.qrPanel = vscode.window.createWebviewPanel(
                'antigravityQR',
                'Antigravity Connect',
                vscode.ViewColumn.Two,
                {
                    enableScripts: true
                }
            );

            this.qrPanel.onDidDispose(() => {
                this.qrPanel = null;
            }, null, this.context.subscriptions);
        }

        this.qrPanel.webview.html = QRManager.getWebviewContent(qrDataUri, url);
    }
}

module.exports = BridgeManager;
