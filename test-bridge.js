const BridgeManager = require('./BridgeManager');
const DatabaseManager = require('./DatabaseManager');
const path = require('path');

// Mock vscode API
const vscode = {
    window: {
        showInformationMessage: (msg) => console.log(`[VSCode Info] ${msg}`),
        activeTerminal: null,
        createTerminal: () => ({
            show: () => console.log(`[VSCode Terminal] Showing terminal`),
            sendText: (text) => console.log(`[VSCode Terminal] Executing: ${text}`)
        })
    },
    commands: {
        executeCommand: (cmd, ...args) => console.log(`[VSCode Command] Executing ${cmd} with ${args}`)
    }
};

// Map 'vscode' to our mock in the require cache if possible, or just pass it in
// Since we are node, we can't easily mock require('vscode') globally without a helper
// so we'll just modify BridgeManager to accept it or rely on a global mock if needed.
// For this test, we'll just mock it as a global or similar.

async function startTest() {
    const extensionPath = __dirname;
    const dbManager = new DatabaseManager(extensionPath);
    await dbManager.init();

    const mockContext = { extensionPath };
    const bridge = new BridgeManager(mockContext, dbManager);

    console.log("Starting Mobile Bridge in TEST MODE...");
    await bridge.start();
}

startTest().catch(console.error);
