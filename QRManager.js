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
        body { 
            display: flex; flex-direction: column; align-items: center; justify-content: center; 
            height: 100vh; background: #0d0d12; color: #f8fafc; font-family: sans-serif; 
        }
        .container { text-align: center; padding: 2rem; border-radius: 1rem; background: rgba(255,255,255,0.05); }
        img { border: 10px solid white; border-radius: 0.5rem; margin: 1rem 0; width: 256px; height: 256px; }
        .url { font-family: monospace; color: #6366f1; word-break: break-all; margin-top: 1rem; }
        .token-info { font-size: 0.8rem; color: #94a3b8; margin-top: 2rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Conectar Móvil</h1>
        <p>Escanea este código para vincular tu dispositivo de forma segura:</p>
        <img src="${qrDataUri}" alt="QR Code">
        <div class="url">${url}</div>
        <p class="token-info">Este código incluye un token de sesión único.</p>
    </div>
</body>
</html>`;
    }
}

module.exports = QRManager;
