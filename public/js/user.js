// User Management Functions
const loadUsers = () => {
    try {
        const usersData = localStorage.getItem('kelvinvmxz_users');
        return usersData ? JSON.parse(usersData) : { users: [] };
    } catch (error) {
        console.error('Error loading users:', error);
        return { users: [] };
    }
};

const saveUsers = (usersData) => {
    try {
        localStorage.setItem('kelvinvmxz_users', JSON.stringify(usersData));
    } catch (error) {
        console.error('Error saving users:', error);
    }
};

const addUser = (username, password, plan, reseller) => {
    const usersData = loadUsers();
    usersData.users.push({
        username,
        password,
        plan,
        reseller: reseller === 'true' || reseller === true
    });
    saveUsers(usersData);
    return usersData;
};

const authenticateUser = (username, password) => {
    const usersData = loadUsers();
    const user = usersData.users.find(u => u.username === username && u.password === password);
    return user || null;
};

const getUserByUsername = (username) => {
    const usersData = loadUsers();
    return usersData.users.find(u => u.username === username) || null;
};

const updateUser = (username, updates) => {
    const usersData = loadUsers();
    const userIndex = usersData.users.findIndex(u => u.username === username);
    if (userIndex !== -1) {
        usersData.users[userIndex] = { ...usersData.users[userIndex], ...updates };
        saveUsers(usersData);
        return usersData.users[userIndex];
    }
    return null;
};

const deleteUser = (username) => {
    const usersData = loadUsers();
    usersData.users = usersData.users.filter(u => u.username !== username);
    saveUsers(usersData);
    return usersData;
};

// Export functions
window.userManager = {
    loadUsers,
    saveUsers,
    addUser,
    authenticateUser,
    getUserByUsername,
    updateUser,
    deleteUser
};
