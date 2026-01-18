require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const User = require('./models/User');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// Security
app.use(helmet());
app.use(express.json());       // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// CORS Setup - Allow both local dev and production
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    // Add your Vercel URL here later, e.g., "https://my-chat-app.vercel.app"
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST"],
    credentials: true
};

app.use(cors(corsOptions));
const io = new Server(server, { cors: corsOptions });


// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/chat_app';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));


const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Root Route
app.get('/', (req, res) => {
    res.send('<h1>✅ Chat API Server is Running (MongoDB)</h1>');
});

// --- Authentication Routes ---
app.post('/api/signup', async (req, res) => {
    const { type, value, password } = req.body;
    if (!value || !password || !type) return res.status(400).json({ error: 'All fields required' });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = type === 'email' ? { email: value } : { phone: value };

        // Check existing
        const existingUser = await User.findOne(query);
        if (existingUser) return res.status(409).json({ error: 'User already exists' });

        // Create new
        const newUser = new User({
            [type]: value,
            password_hash: hashedPassword
        });

        await newUser.save();

        const token = jwt.sign({ id: newUser._id, [type]: value }, JWT_SECRET);
        res.status(201).json({
            token,
            user: { id: newUser._id, [type]: value }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { type, value, password } = req.body;
    const query = type === 'email' ? { email: value } : { phone: value };

    try {
        const user = await User.findOne(query);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, [type]: value }, JWT_SECRET);
        res.json({
            token,
            user: { id: user._id, email: user.email, phone: user.phone }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}, 'email phone _id');
        // Map _id to id for frontend compatibility
        const formattedUsers = users.map(u => ({
            id: u._id,
            email: u.email,
            phone: u.phone
        }));
        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages/:userId/:otherId', async (req, res) => {
    const { userId, otherId } = req.params;
    try {
        const messages = await Message.find({
            $or: [
                { sender_id: userId, receiver_id: otherId },
                { sender_id: otherId, receiver_id: userId }
            ]
        }).sort({ timestamp: 1 });

        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Socket.io ---
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_user', (userId) => {
        socket.join(userId.toString());
    });

    socket.on('send_message', async (data) => {
        const { sender_id, receiver_id, content } = data;

        try {
            const newMessage = new Message({ sender_id, receiver_id, content });
            await newMessage.save();

            const msgPayload = {
                id: newMessage._id, // use _id
                sender_id,
                receiver_id,
                content,
                timestamp: newMessage.timestamp
            };

            // Emit to both
            io.to(receiver_id.toString()).emit('receive_message', msgPayload);
            io.to(sender_id.toString()).emit('receive_message', msgPayload);
        } catch (err) {
            console.error("Msg Error", err);
        }
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
