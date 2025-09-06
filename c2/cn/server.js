const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cron = require('node-cron');
const dayjs = require("dayjs"); // for recurring tasks

const User = require('./models/User');
const Todo = require('./models/Todo');
const { sendDeadlineEmail } = require('./utils/mailer');

const app = express();
app.use(cors());
app.use(express.json());

// ===== MongoDB connection =====
const mongoUri = 'mongodb+srv://userr:6wBZot54GSTjYnSD@cluster0.iiuatyc.mongodb.net/';

mongoose.connect(mongoUri)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== Middleware: verify JWT =====
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, 'secretkey', (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
}

// ===== Auth Routes =====
// Register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashed });
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id }, 'secretkey', { expiresIn: '1d' });
  res.json({ token });
});

// ===== Todo Routes =====
// Get todos
app.get('/api/todos', auth, async (req, res) => {
  const todos = await Todo.find({ userId: req.userId });
  res.json(todos);
});

// Add todo (with repeatDays support)
app.post('/api/todos', auth, async (req, res) => {
  try {
    const { text, deadline, repeatDays } = req.body;
    const todo = new Todo({
      text,
      deadline,
      userId: req.userId,
      repeatDays: repeatDays || [], // save repeat days
    });
    const saved = await todo.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);a
    res.status(400).json({ error: 'Failed to add todo' });
  }
});

// Update todo
app.put('/api/todos/:id', auth, async (req, res) => {
  try {
    const { text, completed, deadline, repeatDays } = req.body;
    const updated = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { text, completed, deadline, repeatDays },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Todo not found' });
    res.json(updated);
  } catch {
    res.status(400).json({ error: 'Failed to update todo' });
  }
});

// Delete todo
app.delete('/api/todos/:id', auth, async (req, res) => {
  try {
    await Todo.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.sendStatus(204);
  } catch {
    res.status(400).json({ error: 'Failed to delete todo' });
  }
});

// ================= User Performance Route =================
app.get("/api/performance", auth, async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.userId });

    if (todos.length === 0) {
      return res.json({
        total: 0,
        completed: 0,
        completionRate: 0,
        overdue: 0,
        completedOnTime: 0,
        completedLate: 0,
      });
    }

    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const overdue = todos.filter(
      (t) => !t.completed && t.deadline && new Date(t.deadline) < new Date()
    ).length;

    const completedOnTime = todos.filter(
      (t) =>
        t.completed &&
        t.deadline &&
        new Date(t.updatedAt) <= new Date(t.deadline)
    ).length;

    const completedLate = todos.filter(
      (t) =>
        t.completed &&
        t.deadline &&
        new Date(t.updatedAt) > new Date(t.deadline)
    ).length;

    res.json({
      total,
      completed,
      completionRate: ((completed / total) * 100).toFixed(1),
      overdue,
      completedOnTime,
      completedLate,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch performance" });
  }
});

// ===== Cron Job: check deadlines =====
cron.schedule('*/5 * * * *', async () => {
  console.log("⏰ Checking deadlines...");
  const now = new Date();
  const soon = new Date(now.getTime() + 2 * 60 * 60 * 1000); // within 2 hours

  try {
    const todos = await Todo.find({
      completed: false,
      deadline: { $lte: soon, $gte: now }
    }).populate('userId');

    for (let todo of todos) {
      if (todo.userId && todo.userId.email) {
        await sendDeadlineEmail(todo.userId.email, todo);
        console.log(`📧 Reminder sent to ${todo.userId.email} for "${todo.text}"`);
      }
    }
  } catch (err) {
    console.error("Cron job error:", err);
  }
});

// ===== Cron Job: recurring tasks =====
cron.schedule("1 0 * * *", async () => {
  console.log("🔄 Checking for recurring tasks...");

  const today = dayjs().format("dddd").toLowerCase(); // e.g., "monday"

  try {
    const recurringTodos = await Todo.find({ repeatDays: today });

    for (let todo of recurringTodos) {
      // Check if today's copy already exists (avoid duplicates)
      const exists = await Todo.findOne({
        userId: todo.userId,
        text: todo.text,
        createdAt: {
          $gte: dayjs().startOf("day").toDate(),
          $lte: dayjs().endOf("day").toDate(),
        },
      });

      if (!exists) {
        const newTask = new Todo({
          text: todo.text,
          deadline: todo.deadline ? dayjs().endOf("day").toDate() : null,
          userId: todo.userId,
          repeatDays: todo.repeatDays,
        });
        await newTask.save();
        console.log(`✅ Created recurring task for ${today}: "${todo.text}"`);
      }
    }
  } catch (err) {
    console.error("Recurring tasks cron error:", err);
  }
});

// ===== Start Server =====
const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
