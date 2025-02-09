const express = require('express');
const rateLimit = require('express-rate-limit');
const verifyToken = require('../middleware/verify');
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1,
    keyGenerator: (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    message: 'You can only send one message every 10 minutes'
});

router.post('/create', contactLimiter, async (req, res) => {
    const { fullname, email, message, latitude, longitude } = req.body;
    const ip_address = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const device = req.headers['user-agent'];

    if (!fullname || !email || !message) {
        return res.status(400).json({ message: 'Fullname, email, and message are required' });
    }

    if (message.length > 250) {
        return res.status(400).json({ message: 'Message cannot exceed 250 characters' });
    }

    try {
        await pool.query(
            `INSERT INTO contacts (id, fullname, email, message, ip_address, device, latitude, longitude) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [uuidv4(), fullname, email, message, ip_address, device, latitude, longitude]
        );
        res.status(201).json({ message: 'Message sent successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.get('/',  async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM contacts');
        res.status(200).json(result.rows);
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
        if (result.rowCount > 0) {
            res.status(200).json({ message: 'Message deleted successfully' });
        } else {
            res.status(404).json({ message: 'Message not found' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

module.exports = router;