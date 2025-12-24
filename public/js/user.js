// User management functions
function createUser(username, password, role = 'user') {
    const users = loadData(USER_FILE).users;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const newUser = {
        id: Date.now().toString(),
        username,
        password: hashedPassword,
        role
    };
    
    users.push(newUser);
    saveData(USER_FILE, { users });
    return newUser;
}

function authenticateUser(username, password) {
    const users = loadData(USER_FILE).users;
    const user = users.find(u => u.username === username);
    
    if (!user) return null;
    
    const valid = bcrypt.compareSync(password, user.password);
    return valid ? user : null;
}
