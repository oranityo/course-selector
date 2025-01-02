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
    console.log('Generating token for user:', user.username);
    return jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '10m' });
}

function authenticateToken(req, res, next) {
    console.log('Authenticating token');
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

function authorizeProfessor(req, res, next) {
    console.log('Authorizing professor role');
    if (req.user.role !== 'professor') return res.sendStatus(403);
    next();
}

async function login(req, res) {
    console.log('Login attempt for username:', req.body.username);
    const { username, password } = req.body;
    const users = await db.User.find();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return res.status(401).json({ message: 'Wrong password!' });

    const token = generateToken(user);
    res.json({ accessToken: token });    
}

async function RegisterNewUser(req, res) {
    console.log('Registering new user:', req.body.username);
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
    console.log('Fetching all courses');
    const courses = await db.Course.find();
    res.json(courses);
}

async function GetCourseById(req, res) {
    console.log('Fetching course by ID:', req.params.id);
    const course = await db.Course.findOne({ id: req.params.id });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
}

async function AddCourse(req, res) {
    console.log('Adding new course:', req.body.courseName);
    const { courseName, professorName, points, maxStudents } = req.body;
    const id = (await db.Course.countDocuments()) + 1;
    const newCourse = new db.Course({ id, courseName, professorName, points, maxStudents });
    await newCourse.save();
    res.status(201).json({ message: 'Course added successfully' });
}

async function RemoveCourse(req, res) {
    console.log('Removing course with ID:', req.params.id);
    const course = await db.Course.findOneAndDelete({ id: req.params.id });
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course deleted successfully' });
}

async function GetStudent(req, res) {
    console.log('Fetching student with ID:', req.params.id);
    const student = await db.Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
}

async function AddCourseToStudent(req, res) {
    console.log('Adding course to student with ID:', req.params.id);
    if (req.user.id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: 'Unauthorized access to student data' });
    }

    const student = await db.Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const course = await db.Course.findOne({ id: req.body.courseId });
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const courses = await db.Course.find({ id: { $in: student.courses } });
    const totalPoints = courses.reduce((sum, c) => sum + c.points, 0) + course.points;
    if (totalPoints > 20) {
        return res.status(400).json({ message: 'Cannot add course, aggregated points exceed 20.' });
    }

    const enrolledStudents = await db.Student.find({ courses: req.body.courseId }).countDocuments();
    if (enrolledStudents >= course.maxStudents) {
        return res.status(400).json({ message: 'Cannot add course, max students reached.' });
    }

    student.courses.push(req.body.courseId);
    await student.save();
    res.json({ message: 'Course added to student successfully' });
}

async function RemoveCourseForStudent(req, res) {
    console.log('Removing course for student with ID:', req.params.id);
    if (req.user.id !== parseInt(req.params.id)) {
        return res.status(403).json({ message: 'Unauthorized access to student data' });
    }

    const student = await db.Student.findOne({ id: req.params.id });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    student.courses = student.courses.filter(c => c !== req.body.courseId);
    await student.save();
    res.json({ message: 'Course removed from student successfully' });
}

app.post('/login', login);
app.post('/signup', RegisterNewUser);
app.get('/courses', authenticateToken, GetAllCourses);
app.get('/courses/:id', authenticateToken, GetCourseById);
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
