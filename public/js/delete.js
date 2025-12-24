// Auto Delete Functions
const checkVpsStatus = async (vps) => {
    return new Promise((resolve) => {
        // Simulate VPS status check
        setTimeout(() => {
            // Random status for demo - in real implementation, this would ping the VPS
            const isAlive = Math.random() > 0.3; // 70% chance of being online
            resolve(isAlive);
        }, 1000);
    });
};

const removeInvalidVps = async () => {
    let vpsList = JSON.parse(localStorage.getItem('kelvinvmxz_vps') || '[]');
    const unique = [];
    const seen = new Set();
    
    for (const v of vpsList) {
        if (!seen.has(v.host)) {
            seen.add(v.host);
            unique.push(v);
        }
    }
    
    let aliveVps = [];
    let statusMessage = 'VPS Status Report\n\n';
    
    for (const [index, vps] of unique.entries()) {
        const isAlive = await checkVpsStatus(vps);
        const vpsStatus = isAlive
            ? `VPS ${String(index + 1).padStart(2, '0')} : ✅ Online`
            : `VPS ${String(index + 1).padStart(2, '0')} : 🔴 Offline`;
        statusMessage += vpsStatus + '\n';
        if (isAlive) aliveVps.push(vps);
    }
    
    localStorage.setItem('kelvinvmxz_vps', JSON.stringify(aliveVps));
    
    // Return status for display
    return {
        aliveVps,
        totalVps: unique.length,
        statusMessage
    };
};

const autoDeleteInactiveVps = () => {
    setInterval(async () => {
        console.log('Checking VPS status for auto-deletion...');
        const result = await removeInvalidVps();
        console.log(`Auto-deletion complete. Active VPS: ${result.aliveVps.length}/${result.totalVps}`);
    }, 300000); // Check every 5 minutes
};

// Export functions
window.vpsManager = {
    checkVpsStatus,
    removeInvalidVps,
    autoDeleteInactiveVps
};
