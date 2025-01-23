const express = require('express');
const verifyToken = require('../middleware/verify');
const pool = require('../db');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

router.post('/create', verifyToken, upload.single('image'), async (req, res) => {
    const { fullname, reseption, lunch, email, aboutUz, aboutEng, aboutRu, aboutQq, goalUz, goalRu, goalEng, goalQq } = req.body;
    const departmentId = uuidv4();
    const image = req.file;

    try {
        if (!image) {
            return res.status(400).json({ message: "Image is required" });
        }

        const formattedPath = path.join('uploads', image.filename).replace(/\\/g, '/');

        await pool.query(
            `INSERT INTO departments (
                id, fullname, reseption, lunch, email, about_uz, about_eng, about_ru, about_qq, goal_uz, goal_ru, goal_eng, goal_qq, image_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
            [departmentId, fullname, reseption, lunch, email, aboutUz, aboutEng, aboutRu, aboutQq, goalUz, goalRu, goalEng, goalQq, formattedPath]
        );

        res.status(201).json({ message: 'Department created successfully', departmentId });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.get('/', async (req, res) => {
    try {
        const departmentsResult = await pool.query('SELECT * FROM departments');
        const departmentsList = departmentsResult.rows;

        res.status(200).json(departmentsList);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const departmentResult = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);

        if (departmentResult.rows.length > 0) {
            res.status(200).json(departmentResult.rows[0]);
        } else {
            res.status(404).json({ message: 'Department not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.delete('/delete/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const departmentResult = await pool.query('SELECT * FROM departments WHERE id = $1', [id]);

        if (departmentResult.rows.length > 0) {
            const imagePath = departmentResult.rows[0].image_path;
            fs.unlinkSync(path.join(__dirname, '..', imagePath));

            await pool.query('DELETE FROM departments WHERE id = $1', [id]);
            res.status(200).json({ message: 'Department deleted successfully' });
        } else {
            res.status(404).json({ message: 'Department not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

module.exports = router;