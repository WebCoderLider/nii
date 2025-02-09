const express = require('express');
const verifyToken = require('../middleware/verify');
const pool = require('../db');
const axios = require('axios');

const router = express.Router();

const IPSTACK_API_KEY = '0652415e2255d2559919598d6802e366'; // Replace with your ipstack API key

// Get aggregated logs by month
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                DATE_TRUNC('month', timestamp) AS month,
                COUNT(DISTINCT ip_address) AS unique_visitors
            FROM request_logs
            GROUP BY month
            ORDER BY month
        `);

        const logs = result.rows.map(row => ({
            month: row.month,
            unique_visitors: row.unique_visitors
        }));

        res.status(200).json(logs);
    } catch (err) {
        console.error('Error fetching logs:', err);
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

router.get('/full', verifyToken, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const totalResult = await pool.query('SELECT COUNT(*) FROM request_logs');
        const totalLogs = parseInt(totalResult.rows[0].count, 10);

        const result = await pool.query('SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT $1 OFFSET $2', [limit, offset]);
        const logs = result.rows;

        const logsWithGeoData = await Promise.all(logs.map(async log => {
            const geoData = await axios.get(`http://api.ipstack.com/${log.ip_address}?access_key=${IPSTACK_API_KEY}`);
            return {
                ...log,
                country: geoData.data.country_name,
                region: geoData.data.region_name,
                city: geoData.data.city,
                device: log.device,
                timestamp: log.timestamp
            };
        }));

        res.status(200).json({
            totalLogs,
            totalPages: Math.ceil(totalLogs / limit),
            currentPage: page,
            logs: logsWithGeoData
        });
    } catch (err) {
        console.error('Error fetching full logs:', err);
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

router.delete('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const deleteResult = await pool.query('DELETE FROM request_logs WHERE id = $1 RETURNING *', [id]);

        if (deleteResult.rows.length > 0) {
            res.status(200).json({ message: 'Log entry deleted successfully', log: deleteResult.rows[0] });
        } else {
            res.status(404).json({ message: 'Log entry not found' });
        }
    } catch (err) {
        console.error('Error deleting log entry:', err);
        res.status(500).json({ message: 'Database error', error: err.message });
    }
});

module.exports = router;