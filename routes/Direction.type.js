const express = require('express');
const pool = require('../db');
const jwt = require('jsonwebtoken'); // For token verification
const router = express.Router();
const { v4: uuidv4 } = require('uuid'); // Import UUID library

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).json({ message: 'Token is required' });
    }

    try {
        const verified = jwt.verify(token, process.env.SECRET_KEY); // Replace with your secret key
        req.user = verified;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token', error: err.message });
    }
};

router.get('/direction/types', async (req, res) => {
    try {
        const directionTypesResult = await pool.query('SELECT * FROM directionstype');
        res.status(200).json(directionTypesResult.rows);
    } catch (err) {
        console.error('Error fetching direction types:', err.message);
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});


router.post('/direction/types', verifyToken, async (req, res) => {
    const { nameUz, nameRu, nameEng, nameQq } = req.body;

    if (!nameUz || !nameRu || !nameEng || !nameQq) {
        return res.status(400).json({ message: 'All language names (nameUz, nameRu, nameEng, nameQq) are required' });
    }

    const id = uuidv4(); // Generate a unique ID

    try {
        const insertResult = await pool.query(
            'INSERT INTO directionstype (id, title_uz, title_ru, title_eng, title_qq) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [id, nameUz, nameRu, nameEng, nameQq]
        );
        res.status(201).json({ message: 'Direction type added successfully', directionType: insertResult.rows[0] });
    } catch (err) {
        console.error('Error adding direction type:', err.message);
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});

router.delete('/direction/types/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const deleteResult = await pool.query('DELETE FROM directionstype WHERE id = $1 RETURNING *', [id]);

        if (deleteResult.rows.length > 0) {
            res.status(200).json({ message: 'Direction type deleted successfully', directionType: deleteResult.rows[0] });
        } else {
            res.status(404).json({ message: 'Direction type not found' });
        }
    } catch (err) {
        console.error('Error deleting direction type:', err.message);
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});

module.exports = router;
