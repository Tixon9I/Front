const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Middleware для перевірки токена
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Токен авторизації відсутній' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Недійсний токен' });
    }
};

// Мапінг для зворотної сумісності (англійські значення → українські)
const specializationMap = {
    'strength': 'Силові тренування',
    'cardio': 'Кардіо',
    'flexibility': 'Розтяжка і гнучкість',
    'hiit': 'HIIT',
    'crossfit': 'Кросфіт',
    'yoga': 'Йога',
    'pilates': 'Пілатес'
};

// Ендпоінт для отримання тренерів залежно від типу тренування
router.get('/coaches', async (req, res) => {
    const { training_type } = req.query;

    if (!training_type) {
        return res.status(400).json({ message: 'Тип тренування не вказано' });
    }

    try {
        let query;
        let queryParams;

        // Нормалізуємо training_type до української назви, якщо це англійське значення
        const normalizedTrainingType = specializationMap[training_type.toLowerCase()] || training_type;

        if (training_type === 'individual') {
            // Для індивідуального тренування повертаємо всіх тренерів із їхньою спеціалізацією
            query = `
                SELECT u.id AS user_id, u.name, c.specialization
                FROM users u
                JOIN coaches c ON u.id = c.user_id
                WHERE u.role = 'coach'
            `;
            queryParams = [];
        } else if (training_type === 'group') {
            // Для групового тренування повертаємо тренерів, які спеціалізуються на Йога або Пілатес
            query = `
                SELECT u.id AS user_id, u.name, c.specialization
                FROM users u
                JOIN coaches c ON u.id = c.user_id
                WHERE u.role = 'coach'
                AND (c.specialization ILIKE $1 OR c.specialization ILIKE $2)
            `;
            queryParams = ['%Йога%', '%Пілатес%'];
        } else {
            // Для інших типів тренувань повертаємо тренерів, які спеціалізуються на цьому типі
            query = `
                SELECT u.id AS user_id, u.name, c.specialization
                FROM users u
                JOIN coaches c ON u.id = c.user_id
                WHERE u.role = 'coach'
                AND c.specialization ILIKE $1
            `;
            queryParams = [`%${normalizedTrainingType}%`];
        }

        const result = await pool.query(query, queryParams);

        // Формуємо список тренерів із відображенням спеціалізації
        const coaches = result.rows.map(coach => {
            let displayName;
            if (training_type === 'individual') {
                // Для індивідуального тренування показуємо спеціалізацію
                displayName = `${coach.name} - ${coach.specialization}`;
            } else {
                // Для інших тренувань просто ім'я тренера
                displayName = coach.name;
            }
            return {
                user_id: coach.user_id,
                display_name: displayName,
            };
        });

        res.json(coaches);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

router.post('/book-training', authenticateToken, async (req, res) => {
    const { training_type, trainer_id, date, time, email } = req.body;
    const user_id = req.user.userId;

    // Перевірка, чи email із запиту збігається з email користувача
    const userEmailCheck = await pool.query('SELECT email FROM users WHERE id = $1', [user_id]);
    if (userEmailCheck.rows.length === 0 || userEmailCheck.rows[0].email !== email) {
        return res.status(400).json({ message: 'Email не збігається з обліковим записом користувача' });
    }

    // Перевірка, чи trainer_id належить тренеру
    const trainerCheck = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [trainer_id, 'coach']);
    if (trainerCheck.rows.length === 0) {
        return res.status(400).json({ message: 'Обраний тренер не знайдений' });
    }

    try {
        const formattedTime = `${time}:00`;

        // Перевірка на дублювання
        const sameTrainingCheck = await pool.query(
            'SELECT * FROM bookings WHERE user_id = $1 AND training_type = $2 AND date = $3 AND time = $4',
            [user_id, training_type, date, formattedTime]
        );
        if (sameTrainingCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Ви вже записані на це тренування.' });
        }

        // Перевірка на конфлікт часу
        const timeConflictCheck = await pool.query(
            'SELECT * FROM bookings WHERE user_id = $1 AND date = $2 AND time = $3',
            [user_id, date, formattedTime]
        );
        if (timeConflictCheck.rows.length > 0) {
            return res.status(400).json({ message: 'Ви вже записані на інше тренування в цей час.' });
        }

        // Створюємо бронювання
        const newBooking = await pool.query(
            'INSERT INTO bookings (user_id, trainer_id, training_type, date, time) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, trainer_id, training_type, date, formattedTime]
        );

        res.status(201).json({ message: 'Тренування успішно заброньовано', booking: newBooking.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;