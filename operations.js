const fs = require('fs');
const path = './users.json';

const readUsers = () => {
    if (fs.existsSync(path)) {
        const data = fs.readFileSync(path);
        return JSON.parse(data);
    }
    return [];
};

const writeUsers = (users) => {
    fs.writeFileSync(path, JSON.stringify(users, null, 2));
};

module.exports = {
    add: (user) => {
        const users = readUsers();
        users.push(user);
        writeUsers(users);
    },
    update: (id, updatedUser) => {
        const users = readUsers();
        const index = users.findIndex(user => user.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updatedUser };
            writeUsers(users);
        }
    },
    delete: (id) => {
        let users = readUsers();
        users = users.filter(user => user.id !== id);
        writeUsers(users);
    },
    get: (id) => {
        const users = readUsers();
        return users.find(user => user.id === id);
    },
    getAll: () => {
        return readUsers();
    }
};
