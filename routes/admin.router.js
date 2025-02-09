const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const verifyToken = require('../middleware/verify');
require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const bot = new TelegramBot('8101675940:AAFtsicpUsQmk21cW_wmiHrg_Q7M5HGjgck', { polling: false }); // Tokeningizni o'zgartiring

const TELEGRAM_USER_IDS = ['196989326', '6433553772']; // Statik Telegram user ID-larini kiriting
const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        if (result.rows.length > 0) {
            const admin = result.rows[0];
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                const token = jwt.sign({ adminId: admin.id }, process.env.SECRET_KEY, { expiresIn: '1d' });
                res.status(200).json({ message: 'Login successful', token });
            } else {
                res.status(401).json({ message: 'Invalid username or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.post('/create', async (req, res) => {
    const { username, password } = req.body;
    const newAdminId = uuidv4();
    try {
        if (username.length > 255 || password.length > 255) {
            return res.status(400).json({ message: 'Username or password exceeds maximum length of 255 characters' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO admins (id, username, password) VALUES ($1, $2, $3)', [newAdminId, username, hashedPassword]);
        res.status(201).json({ message: 'Admin created successfully', adminId: newAdminId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.put('/update', verifyToken, async (req, res) => {
    const { username, currentPassword, newPassword } = req.body;
    console.log(req.body)
    try {
        if (username.length > 255 || newPassword.length > 255) {
            return res.status(400).json({ message: 'Username or password exceeds maximum length of 255 characters' });
        }

        const userQuery = await pool.query('SELECT username, password FROM admins WHERE id = $1', [req.user.adminId]);

        if (userQuery.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const user = userQuery.rows[0];
        console.log(currentPassword, user.password)
        if (!currentPassword || !user.password) {
            return res.status(400).json({ message: 'Current password is required' });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query(
            'UPDATE admins SET username = $1, password = $2 WHERE id = $3',
            [username, hashedPassword, req.user.adminId]
        );

        const message = `Sizning profilingiz yangilandi:\n\nYangi username: ${username}\nYangi parol: ${newPassword}`;
        for (const telegramId of TELEGRAM_USER_IDS) {
            await bot.sendMessage(telegramId, message);
        }

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

module.exports = router;