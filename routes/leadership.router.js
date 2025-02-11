const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const verifyToken = require('../middleware/verify');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/leadership');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueSuffix);
    },
});
const upload = multer({ storage });

router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM leaders');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.post('/create', verifyToken, upload.single('image'), async (req, res) => {
    const {
        fullname,
        roleUz,
        roleEng,
        roleRu,
        roleQq,
        receptionUz,
        receptionEng,
        receptionRu,
        receptionQq,
        phone,
        faks,
        email,
        telegram,
        location,
    } = req.body;

    const imagePath = req.file ? `/uploads/leadership/${req.file.filename}` : null;
    const leaderId = uuidv4();

    try {
        await pool.query(
            `INSERT INTO leaders (
                id, fullname, role_uz, role_eng, role_ru, role_qq,
                reception_uz, reception_eng, reception_ru, reception_qq,
                phone, faks, email, telegram, location, image
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
                leaderId,
                fullname,
                roleUz,
                roleEng,
                roleRu,
                roleQq,
                receptionUz,
                receptionEng,
                receptionRu,
                receptionQq,
                phone,
                faks,
                email,
                telegram,
                location,
                imagePath,
            ]
        );
        res.status(201).json({ message: 'Leader created successfully', leaderId });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT image FROM leaders WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Leader not found' });
        }
        const imagePath = result.rows[0].image;
        await pool.query('DELETE FROM leaders WHERE id = $1', [id]);

        if (imagePath) {
            const fullImagePath = path.join(__dirname, '..', imagePath);

            // Check if file exists and delete it
            if (fs.existsSync(fullImagePath) && fs.lstatSync(fullImagePath).isFile()) {
                fs.unlinkSync(fullImagePath);
            }
        }

        res.status(200).json({ message: 'Leader deleted successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

module.exports = router;
