const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Отримання даних профілю
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, name, email, phone, role FROM users WHERE id = $1 AND role = $2',
      [req.user.userId, 'client']
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Користувача не знайдено або він не є клієнтом' });
    }

    res.status(200).json(userResult.rows[0]);
  } catch (err) {
    console.error('Помилка в /profile:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання тренувань (останні та майбутні)
router.get('/workouts', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentDate = new Date().toISOString().split('T')[0];
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

    const recentWorkouts = await pool.query(
      `SELECT training_type, date, time
       FROM bookings
       WHERE user_id = $1 AND date < $2
       ORDER BY date DESC, time DESC
       LIMIT 3`,
      [userId, currentDate]
    );

    const upcomingWorkouts = await pool.query(
      `SELECT training_type, date, time
       FROM bookings
       WHERE user_id = $1 AND date >= $2 AND date <= $3
       ORDER BY date ASC, time ASC`,
      [userId, currentDate, endOfWeek.toISOString().split('T')[0]]
    );

    res.status(200).json({
      recent: recentWorkouts.rows,
      upcoming: upcomingWorkouts.rows,
    });
  } catch (err) {
    console.error('Помилка в /workouts:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання всіх тренувань
router.get('/workouts/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const allWorkouts = await pool.query(
      `SELECT training_type, date, time
       FROM bookings
       WHERE user_id = $1
       ORDER BY date DESC, time DESC`,
      [userId]
    );

    res.status(200).json(allWorkouts.rows);
  } catch (err) {
    console.error('Помилка в /workouts/all:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання минулих тренувань для відгуків
router.get('/workouts/past', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const currentDate = new Date().toISOString().split('T')[0];

    const pastWorkouts = await pool.query(
      `SELECT b.training_type, b.date, b.time, u.name AS coach_name, b.trainer_id AS coach_id
       FROM bookings b
       LEFT JOIN users u ON b.trainer_id = u.id
       WHERE b.user_id = $1 AND b.date < $2
       ORDER BY b.date DESC, b.time DESC`,
      [userId, currentDate]
    );

    res.status(200).json(pastWorkouts.rows);
  } catch (err) {
    console.error('Помилка в /workouts/past:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання відгуків користувача
router.get('/feedback', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const feedbackResult = await pool.query(
      `SELECT f.workout_type, f.rating, f.comment, f.created_at, u.name AS coach_name
       FROM feedbacks f
       LEFT JOIN users u ON f.coach_id = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.status(200).json(feedbackResult.rows);
  } catch (err) {
    console.error('Помилка в /feedback:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Додавання відгуку
router.post('/feedback', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { coach_id, workout_type, rating, comment } = req.body;

    if (!coach_id || !workout_type || !rating) {
      return res.status(400).json({ message: 'Необхідно вказати coach_id, workout_type та rating' });
    }

    const newFeedback = await pool.query(
      `INSERT INTO feedbacks (user_id, coach_id, workout_type, rating, comment, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [userId, coach_id, workout_type, rating, comment || '']
    );

    res.status(201).json(newFeedback.rows[0]);
  } catch (err) {
    console.error('Помилка в POST /feedback:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання всіх відгуків
router.get('/feedback/all', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const feedbackResult = await pool.query(
      `SELECT f.workout_type, f.rating, f.comment, f.created_at, u.name AS coach_name
       FROM feedbacks f
       LEFT JOIN users u ON f.coach_id = u.id
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );
    res.status(200).json(feedbackResult.rows);
  } catch (err) {
    console.error('Помилка в /feedback/all:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання прогресу користувача (тимчасово повертаємо фіктивні дані)
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const mockProgressData = {
      weight: 70.5,
      fat: 20.0,
      muscle: 40.0,
      weight_change: -1.5,
      fat_change: -2.0,
      muscle_change: 1.0
    };

    res.status(200).json(mockProgressData);
  } catch (err) {
    console.error('Помилка в /progress:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання активного абонемента
router.get('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscriptionResult = await pool.query(
      `SELECT name, status, valid_until, remaining_sessions, total_sessions
       FROM subscriptions
       WHERE user_id = $1 AND status = 'active'
       LIMIT 1`,
      [userId]
    );

    if (subscriptionResult.rows.length === 0) {
      return res.status(200).json(null);
    }

    res.status(200).json(subscriptionResult.rows[0]);
  } catch (err) {
    console.error('Помилка в /subscription:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Додавання абонемента
router.post('/subscription', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, status, valid_until, remaining_sessions, total_sessions } = req.body;

    if (!name || !status || !valid_until || !remaining_sessions || !total_sessions) {
      return res.status(400).json({ message: 'Усі поля є обов’язковими' });
    }

    const newSubscription = await pool.query(
      `INSERT INTO subscriptions (user_id, name, status, valid_until, remaining_sessions, total_sessions)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, name, status, valid_until, remaining_sessions, total_sessions]
    );

    res.status(201).json(newSubscription.rows[0]);
  } catch (err) {
    console.error('Помилка в POST /subscription:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

// Отримання всіх абонементів
router.get('/subscriptions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscriptionsResult = await pool.query(
      `SELECT name, status, valid_until, remaining_sessions, total_sessions
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY valid_until DESC`,
      [userId]
    );

    res.status(200).json(subscriptionsResult.rows);
  } catch (err) {
    console.error('Помилка в /subscriptions:', err.stack);
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
});

module.exports = router;