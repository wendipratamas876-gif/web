// Auto delete functionality
function autoDeleteExpiredAttacks() {
    const now = Date.now();
    const expiredAttacks = [];
    
    for (let i = ongoingAttacks.length - 1; i >= 0; i--) {
        const attack = ongoingAttacks[i];
        const startTime = new Date(attack.StartTime).getTime();
        const duration = parseInt(attack.Time) * 1000;
        
        if (now - startTime > duration) {
            attack.Status = "EXPIRED";
            attack.EndTime = new Date().toISOString();
            attackHistory.push({...attack});
            ongoingAttacks.splice(i, 1);
            expiredAttacks.push(attack);
        }
    }
    
    if (attackHistory.length > 100) {
        attackHistory.splice(0, 50);
    }
    
    return expiredAttacks;
}

// Run auto delete every 15 seconds
setInterval(autoDeleteExpiredAttacks, 15000);
