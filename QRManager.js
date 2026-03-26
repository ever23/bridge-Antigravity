const QRCode = require('qrcode');

class QRManager {
    static async generateQR(data) {
        try {
            return await QRCode.toDataURL(data);
        } catch (err) {
            console.error('[QR] Error generating QR:', err);
            return null;
        }
    }

    static getWebviewContent(qrDataUri, url) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antigravity Connection</title>
    <style>
        :root {
            --bg: #0d0d12;
            --card-bg: rgba(255, 255, 255, 0.05);
            --accent: #6366f1;
            --success: #22c55e;
            --text: #f8fafc;
            --text-muted: #94a3b8;
        }
        body { 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
            height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', -apple-system, sans-serif; 
            margin: 0; overflow: hidden;
        }
        .container { 
            text-align: center; padding: 2.5rem; border-radius: 1.5rem; 
            background: var(--card-bg); border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            max-width: 400px; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        h1 { font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 700; }
        p { color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem; }
        
        .qr-wrapper { position: relative; display: inline-block; margin: 1rem 0; }
        img { 
            border: 8px solid white; border-radius: 1rem; width: 240px; height: 240px; 
            transition: transform 0.3s ease, opacity 0.5s ease;
        }
        
        .url { 
            font-family: 'JetBrains Mono', monospace; font-size: 0.8rem;
            color: var(--accent); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            background: rgba(99, 102, 241, 0.1); padding: 0.5rem 1rem; border-radius: 2rem;
            margin-top: 1.5rem; border: 1px solid rgba(99, 102, 241, 0.2);
        }
        
        /* Success State */
        #status-container { display: none; flex-direction: column; align-items: center; justify-content: center; }
        .checkmark-circle {
            width: 80px; height: 80px; border-radius: 50%; display: block;
            stroke-width: 2; stroke: var(--success); stroke-miterlimit: 10;
            margin: 1rem auto; box-shadow: inset 0px 0px 0px var(--success);
            animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out .9s both;
        }
        .checkmark-check { transform-origin: 50% 50%; stroke-dasharray: 48; stroke-dashoffset: 48; animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards; }
        
        @keyframes stroke { 100% { stroke-dashoffset: 0; } }
        @keyframes scale { 0%, 100% { transform: none; } 50% { transform: scale3d(1.1, 1.1, 1); } }
        @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 40px rgba(34, 197, 94, 0.1); } }

        .connected .qr-wrapper, .connected p, .connected .url { display: none; }
        .connected #status-container { display: flex; animation: fadeIn 0.5s ease forwards; }
        .connected h1 { color: var(--success); }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
</head>
<body>
    <div class="container" id="main-container">
        <h1 id="title">Conectar Móvil</h1>
        <p id="instruction">Escanea este código para vincular tu dispositivo de forma segura:</p>
        
        <div class="qr-wrapper">
            <img src="${qrDataUri}" alt="QR Code" id="qr-image">
        </div>

        <div id="status-container">
            <svg class="checkmark-circle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <p style="color: var(--success); margin: 0; font-weight: 600;">¡Dispositivo vinculado!</p>
        </div>

        <div class="url">${url}</div>
    </div>

    <script>
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'connected') {
                document.getElementById('main-container').classList.add('connected');
                document.getElementById('title').innerText = 'Conectado';
                
                // Efecto de feedback visual opcional
                setTimeout(() => {
                    // Podríamos cerrar la ventana automáticamente después de unos segundos si se desea
                }, 2000);
            }
        });
    </script>
</body>
</html>`;
    }

}

module.exports = QRManager;
