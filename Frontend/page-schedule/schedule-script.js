import { initializeAuth } from '../utils/header-script.js';
import { makeAuthenticatedRequest } from '../utils/auth.js';

// Авторизація та реєстрація
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

// Перенаправлення на сторінку входу
if (loginBtn) {
    loginBtn.addEventListener('click', function() {
        window.location.href = '../page-login/login.html';
    });
}

// Перенаправлення на сторінку реєстрації
if (registerBtn) {
    registerBtn.addEventListener('click', function() {
        window.location.href = '../page-register/register.html';
    });
}

// Функція для отримання дати для дня тижня
function getNextDateForDay(day) {
  const daysOfWeek = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 0,
  };

  const today = new Date();
  const currentDay = today.getDay();
  const targetDay = daysOfWeek[day.toLowerCase()];
  let daysUntilTarget = targetDay - currentDay;

  // Якщо це поточний день, використовуємо сьогоднішню дату
  if (daysUntilTarget === 0) {
      return today.toISOString().split('T')[0];
  }

  if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
  }

  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysUntilTarget);

  return targetDate.toISOString().split('T')[0];
}

// Об'єднаний обробник DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    // Ініціалізація авторизації
    await initializeAuth();

    // Анітація для елементів із класом fade-in
    const fadeElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    fadeElements.forEach(element => observer.observe(element));

    // Елементи розкладу
    const tabs = document.querySelectorAll('.schedule-tab');
    const scheduleTableBody = document.querySelector('.schedule-table tbody');
    const trainingButtons = document.querySelectorAll('.book-training');
    const applyFiltersButton = document.getElementById('apply-filters');
    const resetFiltersButton = document.getElementById('reset-filters');
    const trainingTypeFilter = document.getElementById('training-type');
    const trainerFilter = document.getElementById('trainer');
    const dateFilter = document.getElementById('date');

    // Зберігаємо поточну дату для синхронізації
    let currentDate = getNextDateForDay('monday');

    // Функція для завантаження розкладу
    async function loadSchedule(date, useWeekly = false) {
        currentDate = date; // Оновлюємо поточну дату
        try {
            const url = useWeekly 
                ? `http://localhost:3000/api/schedule?date=${date}&weekly=true` 
                : `http://localhost:3000/api/schedule?date=${date}`;
            const response = await fetch(url);
            const schedule = await response.json();

            // Очищаємо таблицю перед завантаженням
            if (scheduleTableBody) scheduleTableBody.innerHTML = '';

            if (Array.isArray(schedule) && schedule.length === 0) {
                scheduleTableBody.innerHTML = '<tr><td colspan="6">Немає тренувань для цієї дати.</td></tr>';
                return;
            }

            // Заповнюємо таблицю
            schedule.forEach((item) => {
                const isFull = item.participants_count >= item.max_participants;
                const row = document.createElement('tr');
                row.setAttribute('data-training-type', item.training_type);
                row.setAttribute('data-trainer', item.coach_name);
                row.setAttribute('data-date', item.date);
                row.setAttribute('data-max-participants', item.max_participants);
                row.innerHTML = `
                    <td>${item.time.slice(0, 5)}</td>
                    <td>${item.training_type}</td>
                    <td>${item.coach_name}</td>
                    <td>${item.duration} хв</td>
                    <td>${item.location}</td>
                    <td>
                        <button class="btn btn-filled btn-small book-training"
                            data-training-type="${item.training_type}"
                            data-time="${item.time.slice(0, 5)}"
                            data-trainer="${item.coach_name}"
                            data-date="${date}"  // Використовуємо currentDate
                            data-participants-count="${item.participants_count}"
                            data-max-participants="${item.max_participants}"
                            ${isFull ? 'disabled' : ''}>
                            ${isFull ? 'Місць немає' : 'Записатись'} (${item.participants_count}/${item.max_participants})
                        </button>
                    </td>
                `;
                if (scheduleTableBody) scheduleTableBody.appendChild(row);
            });

            // Оновлюємо кнопки запису
            updateBookButtons();
            applyFilters(); // Застосовуємо фільтри після завантаження
        } catch (err) {
            console.error('Помилка завантаження розкладу:', err);
            if (scheduleTableBody) {
                scheduleTableBody.innerHTML = '<tr><td colspan="6">Помилка завантаження розкладу. Перевірте дату або зверніться до адміністратора.</td></tr>';
            }
        }
    }

    // Функція для оновлення кількості учасників для конкретного тренування
    async function updateParticipantsCount(button, trainingType, date, time) {
        try {
            const response = await fetch(`http://localhost:3000/api/participants-count?training_type=${trainingType}&date=${date}&time=${time}`);
            const data = await response.json();
            const participantsCount = data.participants_count;
            const maxParticipants = parseInt(button.getAttribute('data-max-participants'));

            button.setAttribute('data-participants-count', participantsCount);
            button.textContent = `${participantsCount >= maxParticipants ? 'Місць немає' : 'Записатись'} (${participantsCount}/${maxParticipants})`;
            if (participantsCount >= maxParticipants) {
                button.disabled = true;
            }
        } catch (err) {
            console.error('Помилка оновлення кількості учасників:', err);
            Swal.fire({
                title: 'Помилка!',
                text: 'Не вдалося оновити кількість учасників. Спробуйте ще раз.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#dc3545',
            });
        }
    }

    // Оновлення кнопок запису
    function updateBookButtons() {
        const newButtons = document.querySelectorAll('.book-training');
        newButtons.forEach((button) => {
            button.addEventListener('click', async function() {
                // Перевіряємо, чи користувач авторизований
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    Swal.fire({
                        title: 'Авторизація потрібна',
                        text: 'Будь ласка, увійдіть, щоб записатися на тренування.',
                        icon: 'warning',
                        confirmButtonText: 'Увійти',
                        confirmButtonColor: '#28a745',
                    }).then(() => {
                        window.location.href = '../page-login/login.html';
                    });
                    return;
                }

                const trainingType = button.getAttribute('data-training-type');
                const time = button.getAttribute('data-time');
                const trainer = button.getAttribute('data-trainer');
                const date = currentDate; // Використовуємо currentDate замість data-date

                const { value: email } = await Swal.fire({
                    title: 'Введіть ваш email',
                    input: 'email',
                    inputPlaceholder: 'Ваш email',
                    inputAttributes: {
                        required: true,
                    },
                    showCancelButton: true,
                    confirmButtonText: 'Записатись',
                    cancelButtonText: 'Скасувати',
                    confirmButtonColor: '#28a745',
                    cancelButtonColor: '#dc3545',
                });

                if (!email) {
                    return;
                }

                try {
                    const trainerData = await fetch(`http://localhost:3000/api/coaches?training_type=${trainingType}`);
                    const trainers = await trainerData.json();
                    const trainerObj = trainers.find(t => t.display_name.includes(trainer));
                    const trainerId = trainerObj ? trainerObj.user_id : null;

                    if (!trainerId) {
                        throw new Error('Тренера не знайдено');
                    }

                    const data = await makeAuthenticatedRequest('http://localhost:3000/api/book-training', {
                        method: 'POST',
                        body: JSON.stringify({
                            training_type: trainingType,
                            trainer_id: trainerId,
                            date,
                            time,
                            email,
                        }),
                    });

                    Swal.fire({
                        title: 'Успішно заброньовано!',
                        text: 'Ваше тренування заброньовано! Очікуйте підтвердження на email.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#28a745',
                    }).then(() => {
                        // Оновлюємо кількість учасників, використовуючи currentDate
                        updateParticipantsCount(button, trainingType, date, time);
                    });
                } catch (err) {
                    let errorMessage = err.message;
                    let redirectToRegister = false;

                    if (err.message.includes('Користувача з таким email не знайдено')) {
                        errorMessage = 'Користувача з таким email не знайдено. Будь ласка, зареєструйтеся.';
                        redirectToRegister = true;
                    } else if (err.message.includes('Ви вже записані на це тренування')) {
                        errorMessage = 'Ви вже записані на це тренування.';
                    } else if (err.message.includes('Ви вже записані на інше тренування в цей час')) {
                        errorMessage = 'Ви вже записані на інше тренування в цей час.';
                    } else if (err.message.includes('Токен прострочений') || err.message.includes('Redirect to login')) {
                        return; // makeAuthenticatedRequest уже обробляє перенаправлення
                    }

                    Swal.fire({
                        title: 'Помилка!',
                        text: errorMessage,
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#dc3545',
                    }).then(() => {
                        if (redirectToRegister) {
                            window.location.href = '../page-register/register.html';
                        }
                    });
                }
            });
        });
    }

    // Обробка вкладок
    if (tabs.length > 0) {
        tabs.forEach((tab) => {
            tab.addEventListener('click', function() {
                tabs.forEach((t) => t.classList.remove('active'));
                this.classList.add('active');
                const day = this.getAttribute('data-day');
                const date = getNextDateForDay(day);
                // Скидаємо dateFilter при переключенні вкладок
                if (dateFilter) dateFilter.value = '';
                loadSchedule(date);
            });
        });
    }

    // Фільтрація тренувань
    function applyFilters() {
        const trainingType = trainingTypeFilter ? trainingTypeFilter.value : 'all';
        const trainer = trainerFilter ? trainerFilter.value : 'all';
        const selectedDate = dateFilter ? dateFilter.value : '';

        let visibleRows = 0;
        const rows = document.querySelectorAll('.schedule-table tbody tr');

        rows.forEach((row) => {
            const rowTrainingType = row.getAttribute('data-training-type');
            const rowTrainer = row.getAttribute('data-trainer');
            const rowDate = row.getAttribute('data-date');

            const matchesTrainingType = trainingType === 'all' || rowTrainingType === trainingType;
            const matchesTrainer = trainer === 'all' || rowTrainer === trainer;
            const matchesDate = !selectedDate || rowDate === selectedDate;

            if (matchesTrainingType && matchesTrainer && matchesDate) {
                row.style.display = '';
                visibleRows++;
            } else {
                row.style.display = 'none';
            }
        });

        const noResultsMessage = document.querySelector('.no-results-message');
        if (noResultsMessage) {
            noResultsMessage.remove();
        }
        if (visibleRows === 0 && scheduleTableBody) {
            const table = document.querySelector('.schedule-table');
            const message = document.createElement('p');
            message.className = 'no-results-message';
            message.textContent = 'Немає тренувань, які відповідають вибраним фільтрам.';
            message.style.textAlign = 'center';
            message.style.marginTop = '20px';
            table.parentNode.insertBefore(message, table.nextSibling);
        }
    }

    if (applyFiltersButton) applyFiltersButton.addEventListener('click', applyFilters);
    if (resetFiltersButton) resetFiltersButton.addEventListener('click', function() {
        if (trainingTypeFilter) trainingTypeFilter.value = 'all';
        if (trainerFilter) trainerFilter.value = 'all';
        if (dateFilter) dateFilter.value = '';
        applyFilters();
    });
    if (trainingTypeFilter) trainingTypeFilter.addEventListener('change', applyFilters);
    if (trainerFilter) trainerFilter.addEventListener('change', applyFilters);
    if (dateFilter) dateFilter.addEventListener('change', applyFilters);

    // Завантажуємо розклад при завантаженні сторінки
    loadSchedule(getNextDateForDay('monday'), true);

    // Повідомлення на розсилку
    const subscribeForm = document.querySelector('.footer-form');
    const emailInput = document.querySelector('#subscribeEmail');

    if (subscribeForm) {
        subscribeForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = emailInput.value;

            try {
                const response = await fetch('http://localhost:3000/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Помилка підписки');
                }

                Swal.fire({
                    title: 'Ви успішно підписалися!',
                    text: 'Дякуємо за підписку на нашу розсилку.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#28a745',
                }).then(() => {
                    subscribeForm.reset();
                });
            } catch (err) {
                Swal.fire({
                    title: 'Помилка!',
                    text: err.message,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#dc3545',
                });
            }
        });
    }
});