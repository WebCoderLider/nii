const express = require('express');
const rateLimit = require('express-rate-limit');
const verifyToken = require('../middleware/verify');
const pool = require('../db');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        if (file.fieldname === 'pasportFront') {
            uploadPath += 'pasport/front/';
        } else if (file.fieldname === 'pasportBack') {
            uploadPath += 'pasport/back/';
        } else if (file.fieldname === 'diplom') {
            uploadPath += 'diplom/';
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

const applyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 1,
    keyGenerator: (req) => req.headers['x-forwarded-for'] || req.connection.remoteAddress,
    message: 'Siz bir marta'
});
router.get('/status', async (req, res) => {
    try {
        const result = await pool.query('SELECT status FROM applyisopen LIMIT 1');
        if (result.rows.length > 0) {
            res.status(200).json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'Status not found' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});
router.post('/create', applyLimiter, async (req, res, next) => {
    try {
        const statusResult = await pool.query('SELECT status FROM applyisopen LIMIT 1');
        if (statusResult.rows.length > 0 && !statusResult.rows[0].status) {
            return res.status(403).json({ message: 'Qabul yopilgan!' });
        }
        next();
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
}, upload.fields([
    { name: 'pasportFront', maxCount: 1 },
    { name: 'pasportBack', maxCount: 1 },
    { name: 'diplom', maxCount: 1 }
]), async (req, res) => {
    const { autolocation, lastname, firstname, middlename, phoneNumber, previousEducationalInstitution, viloyat, tuman, mahalla, location, directionstypeId, directionsId } = req.body;
    if (!autolocation || !lastname || !firstname || !middlename || !phoneNumber || !previousEducationalInstitution || !viloyat || !tuman || !mahalla || !location || !directionstypeId || !directionsId) {
        return res.status(400).json("Ma'lumotlar to'liq emas!");
    }

    try {
        const applicationId = uuidv4();
        const pasportFront = req.files['pasportFront'][0];
        const pasportBack = req.files['pasportBack'][0];
        const diplom = req.files['diplom'][0];

        const pasportFrontPath = path.join('uploads/pasport/front', pasportFront.filename).replace(/\\/g, '/');
        const pasportBackPath = path.join('uploads/pasport/back', pasportBack.filename).replace(/\\/g, '/');
        const diplomPath = path.join('uploads/diplom', diplom.filename).replace(/\\/g, '/');

        await pool.query(
            `INSERT INTO applications (
                id, autolocation, lastname, firstname, middlename, phone_number, previous_educational_institution, pasport_front_path, pasport_back_path, diplom_path, viloyat, tuman, mahalla, location, directionstype_id, directions_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [applicationId, autolocation, lastname, firstname, middlename, phoneNumber, previousEducationalInstitution, pasportFrontPath, pasportBackPath, diplomPath, viloyat, tuman, mahalla, location, directionstypeId, directionsId]
        );

        res.status(201).json({ message: 'Application submitted successfully', applicationId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.get('/', verifyToken, async (req, res) => {
    try {
        const applicationsResult = await pool.query('SELECT * FROM applications');
        const applicationsList = applicationsResult.rows;
        res.status(200).json(applicationsList);
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const applicationResult = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);

        if (applicationResult.rows.length > 0) {
            res.status(200).json(applicationResult.rows[0]);
        } else {
            res.status(404).json({ message: 'Application not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.delete('/delete/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const applicationResult = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);

        if (applicationResult.rows.length > 0) {
            const pasportFrontPath = applicationResult.rows[0].pasport_front_path;
            const pasportBackPath = applicationResult.rows[0].pasport_back_path;
            const diplomPath = applicationResult.rows[0].diplom_path;

            console.log('Deleting files:', pasportFrontPath, pasportBackPath, diplomPath);
            if (pasportFrontPath && fs.existsSync(path.join(__dirname, '..', pasportFrontPath)) && fs.lstatSync(path.join(__dirname, '..', pasportFrontPath)).isFile()) {
                fs.unlinkSync(path.join(__dirname, '..', pasportFrontPath));
            }
            if (pasportBackPath && fs.existsSync(path.join(__dirname, '..', pasportBackPath)) && fs.lstatSync(path.join(__dirname, '..', pasportBackPath)).isFile()) {
                fs.unlinkSync(path.join(__dirname, '..', pasportBackPath));
            }
            if (diplomPath && fs.existsSync(path.join(__dirname, '..', diplomPath)) && fs.lstatSync(path.join(__dirname, '..', diplomPath)).isFile()) {
                fs.unlinkSync(path.join(__dirname, '..', diplomPath));
            }

            await pool.query('DELETE FROM applications WHERE id = $1', [id]);
            res.status(200).json({ message: 'Application deleted successfully' });
        } else {
            res.status(404).json({ message: 'Application not found' });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});

router.put('/status', verifyToken, async (req, res) => {
    const { status } = req.body;

    if (typeof status !== 'boolean') {
        return res.status(400).json({ message: 'Invalid status type. It should be boolean.' });
    }

    try {
        await pool.query('UPDATE applyisopen SET status = $1 WHERE id = (SELECT id FROM applyisopen LIMIT 1)', [status]);
        res.status(200).json({ message: 'Status updated successfully' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: 'Database error', error: err });
    }
});



module.exports = router;