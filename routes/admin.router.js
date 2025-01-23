const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/verify');
require('dotenv').config();

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM admins WHERE username = $1 AND password = $2', [username, password]);
        if (result.rows.length > 0) {
            const token = jwt.sign({ adminId: result.rows[0].id }, process.env.SECRET_KEY, { expiresIn: '1d' });
            res.status(200).json({ message: 'Login successful', token });
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
        await pool.query('INSERT INTO admins (id, username, password) VALUES ($1, $2, $3)', [newAdminId, username, password]);
        res.status(201).json({ message: 'Admin created successfully', adminId: newAdminId });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.put('/update', verifyToken, async (req, res) => {
    const { username, password } = req.body;
    try {
        await pool.query('UPDATE admins SET username = $1, password = $2 WHERE id = $3', [username, password, req.adminId]);
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

module.exports = router;