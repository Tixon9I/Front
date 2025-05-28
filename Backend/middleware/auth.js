const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Токен відсутній' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Токен прострочений, виконайте оновлення', 
                tokenExpired: true 
            });
        }
        res.status(401).json({ message: 'Недійсний токен' });
    }
};

module.exports = authMiddleware;