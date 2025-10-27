const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkForUpdates: () => ipcRenderer.send('check-for-updates'),
    onUpdateCheckResult: (callback) => {
        ipcRenderer.on('update-check-result', (event, result) => {
            callback(result);
        });
    },
    proceedToMainApp: () => ipcRenderer.send('proceed-to-main-app')
});