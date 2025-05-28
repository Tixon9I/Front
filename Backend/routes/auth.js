const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// Реєстрація
router.post('/register', async (req, res) => {
    const { name, email, phone, password, role, specialization, experience, certificates, position, securityCode } = req.body;

    try {
        // Перевірка, чи існує користувач із таким email
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ message: 'Користувач із таким email вже існує' });
        }

        // Перевірка коду безпеки для адміністратора
        if (role === 'admin' && securityCode !== '123456') {
            return res.status(400).json({ message: 'Неправильний код безпеки' });
        }

        // Хешування пароля
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Додавання користувача в таблицю users
        const newUser = await pool.query(
            'INSERT INTO users (name, email, phone, password, role, created_at) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *',
            [name, email, phone, hashedPassword, role]
        );

        const userId = newUser.rows[0].id;

        // Додавання додаткових даних для тренера
        if (role === 'coach') {
            if (!specialization || !experience) {
                return res.status(400).json({ message: 'Заповніть обов’язкові поля для тренера' });
            }
            await pool.query(
                'INSERT INTO coaches (user_id, specialization, experience, certificates) VALUES ($1, $2, $3, $4)',
                [userId, specialization, experience, certificates || '']
            );
        }

        // Додавання додаткових даних для адміністратора
        if (role === 'admin') {
            if (!position) {
                return res.status(400).json({ message: 'Оберіть посаду' });
            }
            await pool.query(
                'INSERT INTO admins (user_id, position) VALUES ($1, $2)',
                [userId, position]
            );
        }

        res.status(201).json({ message: 'Користувач успішно зареєстрований' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// Авторизація
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Перевірка, чи існує користувач
        const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Неправильний email або пароль' });
        }

        // Перевірка пароля
        const validPassword = await bcrypt.compare(password, user.rows[0].password);
        if (!validPassword) {
            return res.status(400).json({ message: 'Неправильний email або пароль' });
        }

        // Оновлення last_login_at
        await pool.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = $1',
            [user.rows[0].id]
        );

        // Генерація доступового токена (короткий термін дії)
        const accessToken = jwt.sign(
            { userId: user.rows[0].id, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        // Генерація оновлювального токена
        const refreshToken = jwt.sign(
            { userId: user.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Зберігаємо refresh token у базі
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        await pool.query(
            'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.rows[0].id, refreshToken, expiresAt]
        );

        // Повертаємо обидва токени
        res.json({ accessToken, refreshToken, role: user.rows[0].role });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token відсутній' });
    }

    try {
        // Перевірка refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const tokenCheck = await pool.query(
            'SELECT * FROM refresh_tokens WHERE token = $1',
            [refreshToken]
        );

        if (tokenCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Refresh token не знайдено' });
        }

        // Перевірка, чи токен прострочений
        const tokenExpired = tokenCheck.rows[0].expires_at < new Date();
        if (tokenExpired) {
            // Видаляємо прострочений токен із бази
            await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
            return res.status(403).json({ 
                message: 'Refresh token прострочений. Будь ласка, увійдіть знову.', 
                redirectToLogin: true 
            });
        }

        // Генерація нового доступового токена
        const user = await pool.query('SELECT role FROM users WHERE id = $1', [decoded.userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }

        const accessToken = jwt.sign(
            { userId: decoded.userId, role: user.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        res.json({ accessToken });
    } catch (err) {
        console.error(err.message);
        if (err.name === 'JsonWebTokenError') {
            await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
            return res.status(403).json({ 
                message: 'Недійсний refresh token. Будь ласка, увійдіть знову.', 
                redirectToLogin: true 
            });
        }
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token відсутній' });
    }

    try {
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
        res.json({ message: 'Успішний вихід' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

// Роут для отримання інформації про користувача
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = $1', [req.user.userId]);
        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Користувача не знайдено' });
        }
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Помилка сервера' });
    }
});

module.exports = router;