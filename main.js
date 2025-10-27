const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

let mainWindow;
let updateCheckWindow;

function createUpdateCheckWindow() {
    updateCheckWindow = new BrowserWindow({
        width: 450,
        height: 350,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        },
        show: false,
        frame: false,
        alwaysOnTop: true
    });

    updateCheckWindow.loadFile('update-check.html');
    updateCheckWindow.show();
    Menu.setApplicationMenu(null);
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');
    
    if (updateCheckWindow && !updateCheckWindow.isDestroyed()) {
        updateCheckWindow.close();
    }
    
    Menu.setApplicationMenu(null);
}

function copyFilesRecursively(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
        const srcPath = path.join(src, file);
        const destPath = path.join(dest, file);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyFilesRecursively(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
            console.log('Updated file:', file);
        }
    });
}

function checkForUpdates() {
    try {
        const versionFile = path.join(__dirname, 'version.json');
        const updatesDir = path.join(__dirname, 'updates');

        // Validate version.json exists and is readable
        if (!fs.existsSync(versionFile)) {
            throw new Error('version.json not found');
        }

        // Read current version with error handling
        let versionData;
        try {
            const versionContent = fs.readFileSync(versionFile, 'utf8').trim();
            versionData = JSON.parse(versionContent);
        } catch (e) {
            throw new Error('Invalid version.json format: ' + e.message);
        }

        let currentVersion = versionData.version;
        if (!currentVersion || typeof currentVersion !== 'string') {
            throw new Error('Invalid version format in version.json');
        }

        // Check if updates directory exists
        if (!fs.existsSync(updatesDir)) {
            console.log('No updates directory found');
            return { updated: false, message: 'No updates available' };
        }

        // Get all version directories with robust filtering
        let availableUpdates = [];
        try {
            availableUpdates = fs.readdirSync(updatesDir)
                .filter(f => {
                    try {
                        const fullPath = path.join(updatesDir, f);
                        const stats = fs.statSync(fullPath);
                        // Check if it's a directory and matches version pattern
                        return stats.isDirectory() && /^\d+\.\d+/.test(f);
                    } catch (e) {
                        console.warn('Skipping invalid directory:', f, e.message);
                        return false;
                    }
                })
                .sort((a, b) => {
                    const aParts = a.split('.').map(Number);
                    const bParts = b.split('.').map(Number);
                    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                        const aNum = aParts[i] || 0;
                        const bNum = bParts[i] || 0;
                        if (aNum > bNum) return 1;
                        if (aNum < bNum) return -1;
                    }
                    return 0;
                });
        } catch (e) {
            throw new Error('Error reading updates directory: ' + e.message);
        }

        console.log('Current version:', currentVersion);
        console.log('Available updates:', availableUpdates);

        // Find the latest version that's newer than current
        for (let update of availableUpdates) {
            if (compareVersions(update, currentVersion) > 0) {
                console.log('Update found - Updating from', currentVersion, 'to', update);
                const updatePath = path.join(updatesDir, update);
                
                try {
                    // Verify update path exists and has files
                    if (!fs.existsSync(updatePath)) {
                        throw new Error('Update path does not exist: ' + updatePath);
                    }

                    // Copy all files recursively from update folder
                    copyFilesRecursively(updatePath, __dirname);

                    console.log('Update copy completed, restarting application');
                    
                    // Restart application
                    app.relaunch();
                    app.exit();
                } catch (copyError) {
                    throw new Error('Failed to apply update: ' + copyError.message);
                }
                
                return { updated: true, message: `Updated to version ${update}` };
            }
        }

        return { updated: false, message: 'Already on latest version' };
    } catch (error) {
        console.error('Update check error:', error);
        return { updated: false, message: 'Update check failed: ' + error.message };
    }
}

function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    
    return 0;
}

app.on('ready', () => {
    checkForUpdates();
    createUpdateCheckWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createMainWindow();
    }
});

// IPC handler for checking updates from renderer
ipcMain.on('check-for-updates', (event) => {
    const result = checkForUpdates();
    event.reply('update-check-result', result);
});

// IPC handler to proceed to main app
ipcMain.on('proceed-to-main-app', (event) => {
    createMainWindow();
});