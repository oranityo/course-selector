const mongoose = require('mongoose');

const mongoUri = 'mongodb://127.0.0.1:27017/projDatabase'

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
    console.log('Connected to MongoDB')
    const Student = mongoose.model('Student', studentSchema);
    const Professor = mongoose.model('Professor', professorSchema);
    const User = mongoose.model('User', userSchema);
    const Course = mongoose.model('Course', courseSchema);

    const defaultStudents = [
        { id: 1, name: 'Yuval', address: 'Jerusalam', yearCount: 1, courses: [] },
        { id: 2, name: 'Liron', address: 'Tel Aviv', yearCount: 2, courses: []  }
    ];

    const defaultProfessors = [
        { id: 1, name: 'Dr. Maya', address: 'Tel Aviv' },
        { id: 2, name: 'Dr. Avraham', address: 'Haifa' }
    ];

    const defaultUsers = [
        { id: 1, user_id: 1, username: 'professor1', password: 'password123', role: 'professor' },
        { id: 2, user_id: 1, username: 'student1', password: 'password123', role: 'student' }
    ];

    const defaultCourses = [
        { id: 1, courseName: 'Math', professorName: 'Dr. Maya', points: 3, maxStudents: 30 },
        { id: 2, courseName: 'Physics', professorName: 'Dr. Avraham', points: 4, maxStudents: 25 }
    ];

    if ((await Student.countDocuments()) === 0) await Student.insertMany(defaultStudents);
    if ((await Professor.countDocuments()) === 0) await Professor.insertMany(defaultProfessors);
    if ((await User.countDocuments()) === 0) await User.insertMany(defaultUsers);
    if ((await Course.countDocuments()) === 0) await Course.insertMany(defaultCourses);

    console.log('Default data initialized');
});

const studentSchema = new mongoose.Schema({
    id: Number,
    name: String,
    address: String,
    yearCount: Number,
    courses: [Number]
});

const professorSchema = new mongoose.Schema({
    id: Number,
    name: String,
    address: String
});

const userSchema = new mongoose.Schema({
    id: Number,
    user_id: Number,
    username: String,
    password: String,
    role: String
});

const courseSchema = new mongoose.Schema({
    id: Number,
    courseName: String,
    professorName: String,
    points: Number,
    maxStudents: Number
});

const Student = mongoose.model('Student', studentSchema);
const Professor = mongoose.model('Professor', professorSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

module.exports = { Student, Professor, User, Course };
