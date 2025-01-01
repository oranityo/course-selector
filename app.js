const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');


const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const users = [
    { id: 1, username: 'professor1', password: 'password123', role: 'professor' },
    { id: 2, username: 'student1', password: 'password123', role: 'student' }
];

const SECRET_KEY = 'secretkey';

function generateToken(user) {
    return jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '10m' });
}

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function authorizeProfessor(req, res, next) {
    if (req.user.role !== 'professor') return res.sendStatus(403);
    next();
}

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: 'Wrong password!' });

    const token = generateToken(user);
    res.json({ accessToken: token });
});

// General API
app.get('/general', authenticateToken, (req, res) => {
    res.json({ message: `Hello ${req.user.username}` });
});

// Professor only API
app.get('/professor', authenticateToken, authorizeProfessor, (req, res) => {
    res.json({ message: `Welcome Professor ${req.user.username}` });
});


app.get('/', (req, res) => {
    res.send('Course Selector API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
