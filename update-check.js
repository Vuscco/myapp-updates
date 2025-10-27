// Start checking for updates immediately
window.addEventListener('load', () => {
    checkForUpdates();
});

function checkForUpdates() {
    const statusEl = document.getElementById('status');
    
    try {
        window.electronAPI.checkForUpdates();
        
        window.electronAPI.onUpdateCheckResult((result) => {
            if (result.updated) {
                statusEl.textContent = 'Update found...';
                // App will restart automatically
            } else {
                statusEl.textContent = 'No updates';
                // Close this window and show main app after a short delay
                setTimeout(() => {
                    window.electronAPI.proceedToMainApp();
                }, 500);
            }
        });
    } catch (error) {
        console.error('Update check error:', error);
        statusEl.textContent = 'Check failed';
        setTimeout(() => {
            window.electronAPI.proceedToMainApp();
        }, 1000);
    }
}