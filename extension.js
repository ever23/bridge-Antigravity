const vscode = require('vscode');
const DatabaseManager = require('./DatabaseManager');
const BridgeManager = require('./BridgeManager');

/** @type {BridgeManager} */
let bridgeManager;

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Antigravity Mobile Bridge activating...');

    const dbManager = new DatabaseManager(context.extensionPath);
    await dbManager.init();

    bridgeManager = new BridgeManager(context, dbManager);
    
    // Iniciar el puente y mostrar el QR automáticamente al arrancar
    bridgeManager.start();
    // Un pequeño delay para que el Webview tenga tiempo de renderizarse una vez cargado el IDE
    setTimeout(() => {
        bridgeManager.showQR();
    }, 2000);

	let startCommand = vscode.commands.registerCommand('antigravity.start', () => {
		bridgeManager.start();
	});

    let stopCommand = vscode.commands.registerCommand('antigravity.stop', () => {
		bridgeManager.stop();
        vscode.window.showInformationMessage('Antigravity Bridge stopped.');
	});

    let showQRCommand = vscode.commands.registerCommand('antigravity.showQR', () => {
        bridgeManager.showQR();
    });

	context.subscriptions.push(startCommand, stopCommand, showQRCommand);
}

function deactivate() {
    if (bridgeManager) {
        bridgeManager.stop();
    }
}

module.exports = {
	activate,
	deactivate
}
