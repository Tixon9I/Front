const cron = require('node-cron');
const pool = require('../config/db');

const task = cron.schedule('0 0 * * *', async () => {
    try {
        console.log('Перевірка статусів користувачів...');
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const result = await pool.query(
            `UPDATE users 
             SET status = 'inactive' 
             WHERE last_login_at < $1 
             AND status = 'active'`,
            [oneWeekAgo]
        );

        console.log(`Оновлено статус для ${result.rowCount} користувачів`);
    } catch (err) {
        console.error('Помилка в CRON завданні:', err.stack);
    }
});

console.log('CRON завдання для перевірки статусів ініціалізовано');

// Експортуємо об'єкт із методом start для запуску
module.exports = { start: () => task.start(), stop: () => task.stop() };