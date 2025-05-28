const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Перевірка ролі адміністратора
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ дозволено лише адміністраторам' });
  }
  next();
};

// Отримання статистики
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const activeUsersResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE status = 'active'"
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const activeUsersLastWeekResult = await pool.query(
      "SELECT COUNT(*) FROM users WHERE status = 'active' AND created_at < $1",
      [lastWeek.toISOString()]
    );
    const activeUsersLastWeek = parseInt(activeUsersLastWeekResult.rows[0].count);
    const activeUsersChange = activeUsers - activeUsersLastWeek;

    const nextWeekStart = new Date();
    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 7);
    const bookingsNextWeekResult = await pool.query(
      "SELECT COUNT(*) FROM bookings WHERE date >= $1 AND date <= $2 AND status != 'canceled'",
      [nextWeekStart.toISOString().split('T')[0], nextWeekEnd.toISOString().split('T')[0]]
    );
    const bookingsNextWeek = parseInt(bookingsNextWeekResult.rows[0].count);

    const activeSubscriptionsResult = await pool.query(
      "SELECT COUNT(*) FROM subscriptions WHERE status = 'active'"
    );
    const activeSubscriptions = parseInt(activeSubscriptionsResult.rows[0].count);

    const totalUsersResult = await pool.query("SELECT COUNT(*) FROM users");
    const totalUsers = parseInt(totalUsersResult.rows[0].count);
    const subscriptionsPercentage = totalUsers > 0 ? Math.round((activeSubscriptions / totalUsers) * 100) : 0;

    const today = new Date().toISOString().split('T')[0];
    const workoutsTodayResult = await pool.query(
      "SELECT COUNT(*) FROM bookings WHERE date = $1 AND status = 'confirmed'",
      [today]
    );
    const workoutsToday = parseInt(workoutsTodayResult.rows[0].count);

    const lastWeekSameDay = new Date();
    lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7);
    const workoutsLastWeekResult = await pool.query(
      "SELECT COUNT(*) FROM bookings WHERE date = $1 AND status = 'confirmed'",
      [lastWeekSameDay.toISOString().split('T')[0]]
    );
    const workoutsLastWeek = parseInt(workoutsLastWeekResult.rows[0].count);
    const workoutsTodayChange = workoutsToday - workoutsLastWeek;

    res.status(200).json({
      activeUsers,
      activeUsersChange,
      bookingsNextWeek,
      activeSubscriptions,
      subscriptionsPercentage,
      workoutsToday,
      workoutsTodayChange,
    });
  } catch (err) {
    console.error('Помилка в /stats:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання записів на тренування
router.get('/bookings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
      const bookingsResult = await pool.query(
          `SELECT b.id, b.user_id, u.name AS client_name, b.training_type, b.date, b.time, b.trainer_id, t.name AS coach_name, b.status
           FROM bookings b
           LEFT JOIN users u ON b.user_id = u.id
           LEFT JOIN users t ON b.trainer_id = t.id
           WHERE NOT EXISTS (
               SELECT 1 
               FROM schedule s 
               WHERE s.date = b.date 
               AND s.time = b.time 
               AND s.training_type = b.training_type 
               AND s.coach_id = b.trainer_id
           )
           ORDER BY b.date DESC, b.time DESC`
      );

      res.status(200).json(bookingsResult.rows);
  } catch (err) {
      console.error('Помилка в /bookings:', err.stack);
      res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Створення нового запису на тренування
router.post('/bookings', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { user_id, training_type, date, time, trainer_id, status } = req.body;

    if (!user_id || !training_type || !date || !time || !trainer_id || !status) {
      return res.status(400).json({ message: 'Усі обов’язкові поля мають бути заповнені' });
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const coachCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [trainer_id, 'coach']);
    if (coachCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Тренера не знайдено' });
    }

    const newBooking = await pool.query(
      `INSERT INTO bookings (user_id, training_type, date, time, trainer_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [user_id, training_type, date, time, trainer_id, status]
    );

    const bookingWithNames = await pool.query(
      `SELECT b.id, b.user_id, u.name AS client_name, b.training_type, b.date, b.time, b.trainer_id, t.name AS coach_name, b.status
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users t ON b.trainer_id = t.id
       WHERE b.id = $1`,
      [newBooking.rows[0].id]
    );

    res.status(201).json(bookingWithNames.rows[0]);
  } catch (err) {
    console.error('Помилка в POST /bookings:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Оновлення запису на тренування
router.put('/bookings/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { user_id, training_type, date, time, trainer_id, status } = req.body;

    if (!user_id || !training_type || !date || !time || !trainer_id || !status) {
      return res.status(400).json({ message: 'Усі обов’язкові поля мають бути заповнені' });
    }

    const bookingCheck = await pool.query('SELECT id FROM bookings WHERE id = $1', [bookingId]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Запис не знайдено' });
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const coachCheck = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [trainer_id, 'coach']);
    if (coachCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Тренера не знайдено' });
    }

    const updatedBooking = await pool.query(
      `UPDATE bookings
       SET user_id = $1, training_type = $2, date = $3, time = $4, trainer_id = $5, status = $6
       WHERE id = $7
       RETURNING *`,
      [user_id, training_type, date, time, trainer_id, status, bookingId]
    );

    const bookingWithNames = await pool.query(
      `SELECT b.id, b.user_id, u.name AS client_name, b.training_type, b.date, b.time, b.trainer_id, t.name AS coach_name, b.status
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users t ON b.trainer_id = t.id
       WHERE b.id = $1`,
      [updatedBooking.rows[0].id]
    );

    res.status(200).json(bookingWithNames.rows[0]);
  } catch (err) {
    console.error('Помилка в PUT /bookings/:id:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Видалення запису на тренування
router.delete('/bookings/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const bookingId = req.params.id;

    const bookingCheck = await pool.query('SELECT id FROM bookings WHERE id = $1', [bookingId]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Запис не знайдено' });
    }

    await pool.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    res.status(200).json({ message: 'Запис видалено' });
  } catch (err) {
    console.error('Помилка в DELETE /bookings/:id:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання всіх записів (для історії)
router.get('/bookings/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const allBookings = await pool.query(
      `SELECT b.id, b.user_id, u.name AS client_name, b.training_type, b.date, b.time, b.trainer_id, t.name AS coach_name, b.status
       FROM bookings b
       LEFT JOIN users u ON b.user_id = u.id
       LEFT JOIN users t ON b.trainer_id = t.id
       ORDER BY b.date DESC, b.time DESC`
    );

    res.status(200).json(allBookings.rows);
  } catch (err) {
    console.error('Помилка в /bookings/all:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання всіх користувачів
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const roleFilter = req.query.role;

    let queryText = `
      SELECT id, name, role, email, phone, status, created_at
      FROM users
      WHERE role IN ('client', 'coach', 'admin')
    `;
    let queryParams = [];

    if (roleFilter) {
      queryText += ' AND role = $1';
      queryParams.push(roleFilter);
    }

    queryText += ' ORDER BY created_at DESC';

    const usersResult = await pool.query(queryText, queryParams);
    res.status(200).json(usersResult.rows);
  } catch (err) {
    console.error('Помилка в /users:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Створення нового користувача
router.post('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, phone, role, status } = req.body;

    if (!name || !email || !phone || !role || !status) {
      return res.status(400).json({ message: 'Усі обов’язкові поля мають бути заповнені' });
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Користувач з таким email вже існує' });
    }

    const bcrypt = require('bcrypt');
    const defaultPassword = 'tempPassword123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const newUser = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id, name, email, phone, role, status, created_at`,
      [name, email, phone, hashedPassword, role, status]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('Помилка в POST /users:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Оновлення користувача
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, phone, role, status } = req.body;

    if (!name || !email || !phone || !role || !status) {
      return res.status(400).json({ message: 'Усі обов’язкові поля мають бути заповнені' });
    }

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    const emailCheck = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, userId]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Цей email вже використовується іншим користувачем' });
    }

    const updatedUser = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, phone = $3, role = $4, status = $5
       WHERE id = $6
       RETURNING id, name, email, phone, role, status, created_at`,
      [name, email, phone, role, status, userId]
    );

    res.status(200).json(updatedUser.rows[0]);
  } catch (err) {
    console.error('Помилка в PUT /users/:id:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Видалення користувача
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;

    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    res.status(200).json({ message: 'Користувача видалено' });
  } catch (err) {
    console.error('Помилка в DELETE /users/:id:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання всіх користувачів (для експорту)
router.get('/users/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const allUsers = await pool.query(
      `SELECT id, name, role, email, phone, status, created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.status(200).json(allUsers.rows);
  } catch (err) {
    console.error('Помилка в /users/all:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

module.exports = router;