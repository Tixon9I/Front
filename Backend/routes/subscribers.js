const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Маршрут для підписки на розсилку
router.post('/subscribe', async (req, res) => {
    const { email } = req.body;

    try {
        // Перевірка, чи email уже є в базі
        const emailExists = await pool.query('SELECT * FROM subscribers WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ message: 'Цей email уже підписаний на розсилку' });
        }

        // Додавання email до таблиці subscribers
        await pool.query('INSERT INTO subscribers (email) VALUES ($1)', [email]);

        res.status(201).json({ message: 'Ви успішно підписалися на розсилку' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;