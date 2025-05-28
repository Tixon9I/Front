const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/schedule', async (req, res) => {
  try {
      const { training_type, trainer, date, weekly } = req.query;

      let query = `
          SELECT 
              s.*, 
              u.name AS coach_name,
              (SELECT COUNT(*) 
               FROM bookings b 
               WHERE b.training_type = s.training_type 
               AND b.date = s.date 
               AND b.time = s.time) AS participants_count
          FROM schedule s
          JOIN coaches c ON s.coach_id = c.user_id
          JOIN users u ON c.user_id = u.id
      `;
      const params = [];

      const conditions = [];
      if (training_type && training_type !== 'all') {
          conditions.push('s.training_type = $' + (params.length + 1));
          params.push(training_type);
      }
      if (trainer && trainer !== 'all') {
          conditions.push('u.name = $' + (params.length + 1));
          params.push(trainer);
      }
      if (date) {
          conditions.push('s.date = $' + (params.length + 1));
          params.push(date);
          // Додаємо фільтр за часом для поточної дати
          const today = new Date().toISOString().split('T')[0];
          if (date === today) {
              const currentTime = new Date().toTimeString().slice(0, 8); // Поточний час у форматі HH:MM:SS
              conditions.push('s.time > $' + (params.length + 1));
              params.push(currentTime);
          }
      } else if (weekly) {
          const today = new Date();
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          conditions.push('s.date BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2));
          params.push(today.toISOString().split('T')[0], nextWeek.toISOString().split('T')[0]);
          // Фільтр за часом для поточної дати в тижневому запиті
          const currentTime = new Date().toTimeString().slice(0, 8);
          conditions.push(`(s.date > $1 OR (s.date = $1 AND s.time > $${params.length + 1}))`);
          params.push(currentTime);
      }

      if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ' ORDER BY s.date, s.time';

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
          return res.status(200).json([]);
      }

      res.status(200).json(result.rows);
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Помилка сервера' });
  }
});

// Новий роут для отримання кількості учасників
router.get('/participants-count', async (req, res) => {
  try {
      const { training_type, date, time } = req.query;

      if (!training_type || !date || !time) {
          return res.status(400).json({ message: 'Необхідно вказати training_type, date та time' });
      }

      const result = await pool.query(
          `SELECT COUNT(*) AS participants_count
           FROM bookings
           WHERE training_type = $1 AND date = $2 AND time = $3`,
          [training_type, date, time]
      );

      const participantsCount = parseInt(result.rows[0].participants_count, 10);
      res.status(200).json({ participants_count: participantsCount });
  } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Помилка сервера' });
  }
});

module.exports = router;