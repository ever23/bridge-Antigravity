const vscode = require('vscode');

class ContextManager {
    constructor() {
        this.activeEditor = vscode.window.activeTextEditor;
    }

    getCurrentContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return {
                hasEditor: false,
                workspace: vscode.workspace.name || 'No workspace'
            };
        }

        const document = editor.document;
        const selection = editor.selection;
        const text = document.getText(selection);

        return {
            hasEditor: true,
            fileName: document.fileName,
            languageId: document.languageId,
            lineCount: document.lineCount,
            currentLine: selection.active.line + 1,
            selectedText: text || 'No text selected',
            workspace: vscode.workspace.name || 'No workspace',
            activeFolder: vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || ''
        };
    }

    getSystemPromptWithContext() {
        const ctx = this.getCurrentContext();
        let prompt = `\n\n[CONTEXTO DEL IDE: `;
        if (ctx.hasEditor) {
            prompt += `Archivo: ${ctx.fileName}, Lenguaje: ${ctx.languageId}, Línea: ${ctx.currentLine}. `;
            if (ctx.selectedText && ctx.selectedText !== 'No text selected') {
                prompt += `Texto seleccionado: "${ctx.selectedText}". `;
            }
        } else {
            prompt += `No hay archivos abiertos. `;
        }
        prompt += `Workspace: ${ctx.workspace}]`;
        return prompt;
    }
}

module.exports = ContextManager;
