const { v4: uuidv4 } = require('uuid');
const pool = require('./../db');
const useragent = require('express-useragent');

const logRequest = async (req, res, next) => {
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const route = req.originalUrl;
    const device = req.useragent.platform + ' ' + req.useragent.browser;
    const timestamp = new Date();

    try {
        await pool.query(
            `INSERT INTO request_logs (id, ip_address, route, device, timestamp) VALUES ($1, $2, $3, $4, $5)`,
            [uuidv4(), ipAddress, route, device, timestamp]
        );
    } catch (err) {
        console.error('Error logging request:', err);
    }

    next();
};

module.exports = logRequest;