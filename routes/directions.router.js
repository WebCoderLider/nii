const express = require('express');
const verifyToken = require('../middleware/verify');
const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/create', verifyToken, async (req, res) => {
    const { directionNameUz, directionNameRu, directionNameEng, directionNameQq, directiontypeId, term } = req.body;
    const directionId = uuidv4();

    try {
        if (!directiontypeId) {
            return res.status(400).json({ message: "directiontypeId is required" });
        }

        if (!term) {
            return res.status(400).json({ message: "term is required" });
        }

        await pool.query(
            `INSERT INTO directions (
                id, direction_name_uz, direction_name_ru, direction_name_eng, direction_name_qq, directiontype_id, term
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [directionId, directionNameUz, directionNameRu, directionNameEng, directionNameQq, directiontypeId, term]
        );

        res.status(201).json({ message: 'Direction created successfully', directionId });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});

router.get('/', async (req, res) => {
    try {
        const directionsResult = await pool.query('SELECT * FROM directions');
        const directionsList = directionsResult.rows;

        res.status(200).json(directionsList);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const directionResult = await pool.query('SELECT * FROM directions WHERE id = $1', [id]);

        if (directionResult.rows.length > 0) {
            res.status(200).json(directionResult.rows[0]);
        } else {
            res.status(404).json({ message: 'Direction not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});

router.delete('/delete/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const deleteResult = await pool.query('DELETE FROM directions WHERE id = $1', [id]);

        if (deleteResult.rowCount > 0) {
            res.status(200).json({ message: 'Direction deleted successfully' });
        } else {
            res.status(404).json({ message: 'Direction not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});

router.get('/types', async (req, res) => {
    console.log('object')
    try {
        const directionTypesResult = await pool.query('SELECT * FROM directionstype');
        const directionTypesList = directionTypesResult.rows;
        res.status(200).json(directionTypesList);
    } catch (err) {
        console.error('Error fetching direction types:', err);
        res.status(500).json({ message: 'Database error', error: err.message, code: err.code });
    }
});


module.exports = router;