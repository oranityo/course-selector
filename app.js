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

const courses = [
    { id: 1, courseName: 'Math', professorName: 'Dr. Maya', points: 3, maxStudents: 30 },
    { id: 2, courseName: 'Physics', professorName: 'Dr. Avraham', points: 4, maxStudents: 25 }
];

const students = [
    { id: 1, name: 'Yuval', address: 'Jerusalam', yearCount: 1, courses: [] },
    { id: 2, name: 'Liron', address: 'Tel Aviv', yearCount: 2, courses: []  },
];

const professors = [
    { id: 1, name: 'Dr. Maya', address: 'Tel Aviv' },
    { id: 2, name: 'Dr. Avraham', address: 'Haifa' }
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


app.post('/signup', (req, res) => {
    const { username, password, role } = req.body;
    if (!username || !password || !role) return res.status(400).json({ message: 'Missing fields' });
    if (users.find(u => u.username === username)) return res.status(400).json({ message: 'User already exists' });

    const id = users.length + 1;
    const newUser = { id, username, password, role };
    users.push(newUser);
    res.status(200).json({ message: 'User registered successfully' });
});

// APIs for Both Users
app.get('/courses', authenticateToken, (req, res) => {
    res.json(courses);
});

app.get('/courses/:name', authenticateToken, (req, res) => {
    const course = courses.find(c => c.courseName === req.params.name);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
});

// Professor APIs
app.post('/courses', authenticateToken, authorizeProfessor, (req, res) => {
    const { courseName, professorName, points, maxStudents } = req.body;
    const id = courses.length + 1;
    courses.push({ id, courseName, professorName, points, maxStudents });
    res.status(200).json({ message: 'Course added successfully' });
});

app.put('/courses/:id', authenticateToken, authorizeProfessor, (req, res) => {
    const course = courses.find(c => c.id === parseInt(req.params.id));
    if (!course) return res.status(404).json({ message: 'Course not found' });
    Object.assign(course, req.body);
    res.json({ message: 'Course updated successfully' });
});

app.delete('/courses/:id', authenticateToken, authorizeProfessor, (req, res) => {
    const index = courses.findIndex(c => c.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ message: 'Course not found' });
    courses.splice(index, 1);
    res.json({ message: 'Course deleted successfully' });
});

// Student APIs
app.post('/students/:id/courses', authenticateToken, (req, res) => {
    const student = students.find(s => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.courses.push(req.body.courseId);
    res.json({ message: 'Course added to student successfully' });
});

app.get('/students/:id/courses', authenticateToken, (req, res) => {
    const student = students.find(s => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student.courses);
});

app.delete('/students/:id/courses', authenticateToken, (req, res) => {
    const student = students.find(s => s.id === parseInt(req.params.id));
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.courses = student.courses.filter(c => c !== req.body.courseId);
    res.json({ message: 'Course removed from student successfully' });
});

app.get('/', (req, res) => {
    res.send('Course Selector API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
