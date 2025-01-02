const mongoose = require('mongoose');

const mongoUri = 'mongodb://127.0.0.1:27017/projDatabase'

mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));


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
