const express = require('express');
const verifyToken = require('../middleware/verify');
const pool = require('../db');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
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
const upload = multer({ storage: storage, limits: { files: 5 } });

router.post('/create', verifyToken, upload.array('images', 5), async (req, res) => {
    const { titleUz, titleRu, titleEng, titleQq, bodyUz, bodyRu, bodyEng, bodyQq, date } = req.body;
    const newsId = uuidv4();
    const images = req.files;

    try {
        if (!titleUz) {
            return res.status(400).json({ message: "titleUz is required" });
        }

        const insertDate = date || new Date().toISOString();

        await pool.query(
            `INSERT INTO news (
                id, title_uz, title_ru, title_eng, title_qq,
                body_uz, body_ru, body_eng, body_qq, date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [newsId, titleUz, titleRu, titleEng, titleQq, bodyUz, bodyRu, bodyEng, bodyQq, insertDate]
        );

        for (const image of images) {
            const formattedPath = path.join('uploads', image.filename).replace(/\\/g, '/');
            await pool.query('INSERT INTO images (id, news_id, path) VALUES ($1, $2, $3)', [uuidv4(), newsId, formattedPath]);
        }

        res.status(201).json({ message: 'News created successfully', newsId });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.get('/', async (req, res) => {
    try {
        const newsResult = await pool.query('SELECT * FROM news');
        const newsList = newsResult.rows;

        for (const news of newsList) {
            const imagesResult = await pool.query('SELECT * FROM images WHERE news_id = $1', [news.id]);
            news.images = imagesResult.rows;
        }

        res.status(200).json(newsList);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const newsResult = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
        const imagesResult = await pool.query('SELECT * FROM images WHERE news_id = $1', [id]);

        if (newsResult.rows.length > 0) {
            res.status(200).json({ news: newsResult.rows[0], images: imagesResult.rows });
        } else {
            res.status(404).json({ message: 'News not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.delete('/delete/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const oldImages = await pool.query('SELECT * FROM images WHERE news_id = $1', [id]);
        for (const oldImage of oldImages.rows) {
            fs.unlinkSync(path.join(__dirname, '..', oldImage.path));
        }
        await pool.query('DELETE FROM images WHERE news_id = $1', [id]);
        await pool.query('DELETE FROM news WHERE id = $1', [id]);

        res.status(200).json({ message: 'News deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

module.exports = router;