const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

async function login(req, res) {
    const { username, password } = req.body;
    const users = await db.User.find();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: 'Wrong password!' });

    const token = generateToken(user);
    res.json({ accessToken: token });    
}

async function RegisterNewUser(req, res) {
    const { username, password, role, user_id } = req.body;
    if (!username || !password || !role || !user_id) return res.status(400).json({ message: 'Missing fields' });
    const exists = await db.User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const id = (await db.User.countDocuments()) + 1;
    const newUser = new db.User({ id, user_id, username, password, role });
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
}

async function GetAllCourses(req, res) {
    const courses = await db.Course.find();
    res.json(courses);
}

async function AddCourse(req, res) {
    const { courseName, professorName, points, maxStudents } = req.body;
    const id = (await db.Course.countDocuments()) + 1;
    const newCourse = new db.Course({ id, courseName, professorName, points, maxStudents });
    await newCourse.save();
    res.status(201).json({ message: 'Course added successfully' });
}

async function RemoveCourse(req, res) {
    const course = await db.Course.findOneAndDelete({ id: req.params.id });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
}

async function GetStudent(req, res) {
    const student = await db.Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
}

async function AddCourseToStudent(req, res) {
    const student = await db.Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.courses.push(req.body.courseId);
    await student.save();
    res.json({ message: 'Course added to student successfully' });
}

async function RemoveCourseForStudent(req, res) {
    const student = await db.Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.courses = student.courses.filter(c => c !== req.body.courseId);
    await student.save();
    res.json({ message: 'Course removed from student successfully' });
}

// Routes
app.post('/login', login);
app.post('/signup', RegisterNewUser);
app.get('/courses', authenticateToken, GetAllCourses);
app.post('/courses', authenticateToken, authorizeProfessor, AddCourse);
app.delete('/courses/:id', authenticateToken, authorizeProfessor, RemoveCourse);
app.get('/students/:id', authenticateToken, GetStudent);
app.post('/students/:id/courses', authenticateToken, AddCourseToStudent);
app.delete('/students/:id/courses', authenticateToken, RemoveCourseForStudent);
app.get('/', (req, res) => {
    res.send('Course Selector API is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
