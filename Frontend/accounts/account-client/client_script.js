import { makeAuthenticatedRequest } from '../../utils/auth.js';

document.addEventListener('DOMContentLoaded', async function () {
  // Перевіряємо наявність токена
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) {
    window.location.href = '../../page-index/index.html';
    return;
  }

  try {
    // Отримання даних профілю через /api/auth/me
    const profileData = await makeAuthenticatedRequest('http://localhost:3000/api/auth/me');
    
    const email = profileData.email; // Зберігаємо email для відображення профілю

    // Оновлення інформації про користувача
    const userInfoDisplay = document.getElementById('userInfoDisplay');
    const userName = profileData.name || 'Користувач';
    const firstLetter = userName.charAt(0).toUpperCase();
    userInfoDisplay.querySelector('.user-avatar').textContent = firstLetter;
    userInfoDisplay.querySelector('.user-name').textContent = userName;

    // Навігація по вкладках
    const sidebarLinks = document.querySelectorAll('.sidebar-menu-link[data-section]');
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        const section = document.getElementById(sectionId);
        if (section) {
          const rect = section.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const headerHeight = document.querySelector('header').offsetHeight;
          const targetPosition = rect.top + scrollTop - headerHeight - 20;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });

          sidebarLinks.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    });

    // Вихід
    document.querySelector('.sidebar-menu-link[href="index.html"]').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        await fetch('http://localhost:3000/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '../../page-index/index.html';
      } catch (err) {
        console.error('Помилка виходу:', err);
      }
    });

    // Отримання тренувань
    const workoutsData = await makeAuthenticatedRequest('http://localhost:3000/api/workouts');

    // Оновлення статистики
    const trainingsThisMonth = document.getElementById('trainingsThisMonth');
    const trainingsPlanned = document.getElementById('trainingsPlanned');
    trainingsThisMonth.textContent = workoutsData.recent.length;
    trainingsPlanned.textContent = `${workoutsData.upcoming.length} заплановано`;

    // Оновлення останніх тренувань (обмежуємо до 3, це минулі тренування)
    const recentWorkoutsContainer = document.getElementById('recentWorkouts');
    recentWorkoutsContainer.innerHTML = workoutsData.recent.slice(0, 3).map(workout => `
      <div class="workout-item">
        <div class="workout-icon">
          <i class="fas fa-dumbbell"></i>
        </div>
        <div class="workout-info">
          <div class="workout-title">${workout.training_type}</div>
          <div class="workout-meta">
            <span>${new Date(workout.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}</span>
            <span>${workout.time.slice(0, 5)}</span>
          </div>
        </div>
        <a href="#" class="workout-action">
          Деталі <i class="fas fa-chevron-right"></i>
        </a>
      </div>
    `).join('') || '<p>Немає останніх тренувань</p>';

    // Форма для всіх минулих тренувань
    document.querySelector('.view-all-workouts').addEventListener('click', async (e) => {
      e.preventDefault();
      const allWorkoutsData = await makeAuthenticatedRequest('http://localhost:3000/api/workouts/all');
      const currentDate = new Date().toISOString().split('T')[0];

      // Фільтруємо лише минулі тренування
      const pastWorkouts = allWorkoutsData
        .filter(workout => workout.date < currentDate)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Сортування за спаданням дати

      Swal.fire({
        title: 'Всі минулі тренування',
        html: `
          <div style="max-height: 400px; overflow-y: auto;">
            ${pastWorkouts.map(workout => `
              <div style="border-bottom: 1px solid #ddd; padding: 10px;">
                <strong>${workout.training_type}</strong><br>
                <span>${new Date(workout.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                <span>${workout.time.slice(0, 5)}</span>
              </div>
            `).join('') || '<p>Немає минулих тренувань</p>'}
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Закрити',
        confirmButtonColor: '#28a745',
        width: '600px',
      });
    });

    // Оновлення найближчих тренувань (обмежуємо до 3, це майбутні тренування)
    const upcomingWorkoutsContainer = document.getElementById('upcomingWorkouts');
    upcomingWorkoutsContainer.innerHTML = workoutsData.upcoming.slice(0, 3).map(workout => `
      <div class="upcoming-workout">
        <div class="workout-date">
          <div class="date-day">${new Date(workout.date).getDate()}</div>
          <div class="date-month">${new Date(workout.date).toLocaleDateString('uk-UA', { month: 'short' })}</div>
        </div>
        <div class="upcoming-workout-info">
          <div class="upcoming-workout-title">${workout.training_type}</div>
          <div class="upcoming-workout-time">
            <i class="far fa-clock"></i> ${workout.time.slice(0, 5)}
          </div>
        </div>
      </div>
    `).join('') || '<p>Немає найближчих тренувань</p>';

    // Форма для календаря найближчих тренувань (лише майбутні)
    document.querySelector('.view-calendar').addEventListener('click', async (e) => {
      e.preventDefault();
      const allWorkoutsData = await makeAuthenticatedRequest('http://localhost:3000/api/workouts/all');
      const currentDate = new Date().toISOString().split('T')[0];

      // Фільтруємо лише майбутні тренування
      const upcomingWorkouts = allWorkoutsData
        .filter(workout => workout.date >= currentDate)
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Сортування за зростанням дати

      // Групуємо тренування за датами
      const workoutsByDate = upcomingWorkouts.reduce((acc, workout) => {
        const date = new Date(workout.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(workout);
        return acc;
      }, {});

      // Формуємо HTML для календаря
      const calendarHtml = Object.keys(workoutsByDate).map(date => `
        <div style="border-bottom: 1px solid #ddd; padding: 10px;">
          <strong>${date}</strong>
          ${workoutsByDate[date].map(workout => `
            <div style="padding: 5px 0;">
              <span>${workout.training_type}</span>
              <span>(${workout.time.slice(0, 5)})</span>
            </div>
          `).join('')}
        </div>
      `).join('') || '<p>Немає найближчих тренувань</p>';

      Swal.fire({
        title: 'Календар найближчих тренувань',
        html: `
          <div style="max-height: 400px; overflow-y: auto;">
            ${calendarHtml}
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Закрити',
        confirmButtonColor: '#28a745',
        width: '600px',
      });
    });

    // Отримання прогресу
    const progressData = await makeAuthenticatedRequest('http://localhost:3000/api/progress');

    // Оновлення статистики на головній
    document.getElementById('weightLoss').textContent = `${Math.abs(progressData.weight_change)} кг`;
    document.getElementById('caloriesBurned').textContent = Math.round(workoutsData.recent.length * 400);
    document.getElementById('regularity').textContent = `${Math.min(workoutsData.recent.length * 10, 100)}%`;

    const progressCards = document.getElementById('progressCards');
    progressCards.innerHTML = `
      <div class="progress-card">
        <div class="progress-card-title">Вага</div>
        <div class="progress-card-value">${progressData.weight} кг</div>
        <div class="progress-card-change ${progressData.weight_change > 0 ? 'negative' : 'positive'}">
          <i class="fas fa-arrow-${progressData.weight_change > 0 ? 'up' : 'down'}"></i> ${Math.abs(progressData.weight_change)} кг
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-card-title">Жир</div>
        <div class="progress-card-value">${progressData.fat}%</div>
        <div class="progress-card-change ${progressData.fat_change > 0 ? 'negative' : 'positive'}">
          <i class="fas fa-arrow-${progressData.fat_change > 0 ? 'up' : 'down'}"></i> ${Math.abs(progressData.fat_change)}%
        </div>
      </div>
      <div class="progress-card">
        <div class="progress-card-title">М'язи</div>
        <div class="progress-card-value">${progressData.muscle}%</div>
        <div class="progress-card-change ${progressData.muscle_change > 0 ? 'positive' : 'negative'}">
          <i class="fas fa-arrow-${progressData.muscle_change > 0 ? 'up' : 'down'}"></i> ${Math.abs(progressData.muscle_change)}%
        </div>
      </div>
    `;

    // Отримання минулих тренувань для відгуків
    const pastWorkoutsData = await makeAuthenticatedRequest('http://localhost:3000/api/workouts/past');

    // Отримання існуючих відгуків
    const feedbackData = await makeAuthenticatedRequest('http://localhost:3000/api/feedback');

    // Оновлення відгуків (обмежуємо до 3)
    const feedbackListContainer = document.getElementById('feedbackList');
    function updateFeedbackList() {
      feedbackListContainer.innerHTML = pastWorkoutsData.slice(0, 3).map(workout => {
        const existingFeedback = feedbackData.find(f => f.workout_type === workout.training_type && new Date(f.created_at).toISOString().split('T')[0] === workout.date);
        return `
          <div class="feedback-item">
            <div class="feedback-header">
              <div class="feedback-trainer">
                <div class="trainer-avatar">${workout.coach_name.split(' ').map(n => n[0]).join('')}</div>
                <div class="feedback-trainer-name">${workout.coach_name}</div>
                <div class="feedback-workout-type">${workout.training_type}</div>
              </div>
              <div class="feedback-date">${new Date(workout.date).toLocaleDateString('uk-UA')}</div>
            </div>
            ${existingFeedback ? `
              <div class="feedback-rating">
                ${Array.from({ length: 5 }, (_, i) => `<i class="fas fa-star star ${i < existingFeedback.rating ? '' : 'empty'}"></i>`).join('')}
              </div>
              <div class="feedback-text">${existingFeedback.comment || 'Без коментаря'}</div>
            ` : `
              <button class="add-feedback-for-workout" data-workout-type="${workout.training_type}" data-date="${workout.date}" data-coach-id="${workout.coach_id}">
                Додати відгук
              </button>
            `}
          </div>
        `;
      }).join('') || '<p>Немає минулих тренувань</p>';
    }
    updateFeedbackList();

    // Делегування подій для кнопок "Додати відгук"
    feedbackListContainer.addEventListener('click', async (e) => {
      if (e.target.classList.contains('add-feedback-for-workout')) {
        const workoutType = e.target.getAttribute('data-workout-type');
        const date = e.target.getAttribute('data-date');
        const coachId = e.target.getAttribute('data-coach-id');

        // Форма для додавання відгуку
        const { value: formValues } = await Swal.fire({
          title: 'Додати відгук',
          html: `
            <div class="feedback-form-container">
              <div class="form-group">
                <label for="swal-workout-type">Тип тренування:</label>
                <div class="input-with-icon">
                  <input id="swal-workout-type" class="swal2-input" value="${workoutType}" readonly>
                </div>
              </div>
              <div class="form-group">
                <label for="swal-rating">Ваша оцінка:<span class="required-star">*</span></label>
                <div class="rating-stars" id="swal-rating">
                  ${Array.from({ length: 5 }, (_, i) => `
                    <i class="fas fa-star rating-star" data-value="${i + 1}"></i>
                  `).join('')}
                </div>
                <input type="hidden" id="swal-rating-value" value="0">
              </div>
              <div class="form-group">
                <label for="swal-comment">Коментар:</label>
                <div class="input-with-icon">
                  <textarea id="swal-comment" class="swal2-textarea" placeholder="Ваш коментар (необов’язково)" maxlength="500"></textarea>
                </div>
              </div>
            </div>
          `,
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Додати',
          cancelButtonText: 'Скасувати',
          confirmButtonColor: '#28a745',
          cancelButtonColor: '#dc3545',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            htmlContainer: 'custom-swal-html',
          },
          didOpen: () => {
            // Динамічна оцінка зірок
            const stars = document.querySelectorAll('.rating-star');
            const ratingInput = document.getElementById('swal-rating-value');
            let selectedRating = 0;

            stars.forEach(star => {
              star.addEventListener('mouseover', () => {
                const value = parseInt(star.getAttribute('data-value'));
                stars.forEach((s, i) => {
                  s.classList.toggle('hover', i < value);
                  s.classList.remove('selected');
                });
              });

              star.addEventListener('mouseout', () => {
                stars.forEach(s => {
                  s.classList.remove('hover');
                  s.classList.toggle('selected', parseInt(s.getAttribute('data-value')) <= selectedRating);
                });
              });

              star.addEventListener('click', () => {
                selectedRating = parseInt(star.getAttribute('data-value'));
                ratingInput.value = selectedRating;
                stars.forEach(s => {
                  s.classList.toggle('selected', parseInt(s.getAttribute('data-value')) <= selectedRating);
                });
              });
            });
          },
          preConfirm: () => {
            const rating = parseInt(document.getElementById('swal-rating-value').value);
            const comment = document.getElementById('swal-comment').value;
            if (rating === 0) {
              Swal.showValidationMessage('Будь ласка, оберіть оцінку');
              return false;
            }
            return { rating, comment };
          },
        });

        if (formValues) {
          try {
            const data = await makeAuthenticatedRequest('http://localhost:3000/api/feedback', {
              method: 'POST',
              body: JSON.stringify({
                coach_id: coachId,
                workout_type: workoutType,
                rating: formValues.rating,
                comment: formValues.comment,
              }),
            });

            Swal.fire({
              title: 'Відгук додано!',
              text: 'Ваш відгук успішно збережено.',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745',
            }).then(async () => {
              // Оновлення даних відгуків після додавання
              const updatedFeedbackData = await makeAuthenticatedRequest('http://localhost:3000/api/feedback');
              feedbackData.length = 0; // Очищаємо старий масив
              feedbackData.push(...updatedFeedbackData); // Оновлюємо масив новими даними
              updateFeedbackList(); // Оновлюємо відображення
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
        }
      }
    });

    // Форма для всіх відгуків
    document.querySelector('.view-all-feedback').addEventListener('click', async (e) => {
      e.preventDefault();
      const allFeedbackData = await makeAuthenticatedRequest('http://localhost:3000/api/feedback/all');

      Swal.fire({
        title: 'Всі ваші відгуки',
        html: `
          <div style="max-height: 400px; overflow-y: auto;">
            ${allFeedbackData.map(feedback => `
              <div style="border-bottom: 1px solid #ddd; padding: 10px;">
                <strong>${feedback.coach_name}</strong> (${feedback.workout_type})<br>
                <span>Оцінка: ${feedback.rating}/5</span><br>
                <span>${feedback.comment || 'Без коментаря'}</span><br>
                <span>${new Date(feedback.created_at).toLocaleDateString('uk-UA')}</span>
              </div>
            `).join('') || '<p>Немає відгуків</p>'}
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Закрити',
        confirmButtonColor: '#28a745',
        width: '600px',
      });
    });

    // Отримання абонемента
    const subscriptionData = await makeAuthenticatedRequest('http://localhost:3000/api/subscription');
    if (!subscriptionData) {
      document.getElementById('subscriptionInfo').innerHTML = '<p>Абонемент не активний</p>';
    } else {
      document.getElementById('subscriptionInfo').innerHTML = `
        <p><strong>${subscriptionData.name}</strong></p>
        <p>Статус: ${subscriptionData.status}</p>
        <p>Дійсний до: ${new Date(subscriptionData.valid_until).toLocaleDateString('uk-UA')}</p>
        <p>Залишилось занять: ${subscriptionData.remaining_sessions}/${subscriptionData.total_sessions}</p>
      `;
    }

    // Додавання абонемента
    document.getElementById('addSubscriptionButton').addEventListener('click', async () => {
      const availableSubscriptions = [
        { id: 1, name: 'Базовий', price: 500, sessions: 10, duration: 30 },
        { id: 2, name: 'Преміум', price: 1000, sessions: 20, duration: 60 },
        { id: 3, name: 'VIP', price: 2000, sessions: 40, duration: 90 },
      ];

      const { value: subscriptionId } = await Swal.fire({
        title: 'Оберіть абонемент',
        html: `
          <select id="swal-subscription" class="swal2-input" required>
            <option value="" disabled selected>Оберіть абонемент</option>
            ${availableSubscriptions.map(sub => `
              <option value="${sub.id}">
                ${sub.name} (${sub.price} грн, ${sub.sessions} занять, ${sub.duration} днів)
              </option>
            `).join('')}
          </select>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Додати',
        cancelButtonText: 'Скасувати',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        preConfirm: () => {
          const subscriptionId = document.getElementById('swal-subscription').value;
          if (!subscriptionId) {
            Swal.showValidationMessage('Оберіть абонемент');
          }
          return subscriptionId;
        },
      });

      if (subscriptionId) {
        const selectedSub = availableSubscriptions.find(sub => sub.id === parseInt(subscriptionId));
        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + selectedSub.duration);

        try {
          const data = await makeAuthenticatedRequest('http://localhost:3000/api/subscription', {
            method: 'POST',
            body: JSON.stringify({
              name: selectedSub.name,
              status: 'active',
              valid_until: validUntil.toISOString().split('T')[0],
              remaining_sessions: selectedSub.sessions,
              total_sessions: selectedSub.sessions,
            }),
          });

          Swal.fire({
            title: 'Абонемент додано!',
            text: 'Ваш абонемент успішно активовано.',
            icon: 'success',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28a745',
          }).then(() => {
            document.getElementById('subscriptionInfo').innerHTML = `
              <p><strong>${selectedSub.name}</strong></p>
              <p>Статус: active</p>
              <p>Дійсний до: ${validUntil.toLocaleDateString('uk-UA')}</p>
              <p>Залишилось занять: ${selectedSub.sessions}/${selectedSub.sessions}</p>
            `;
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
      }
    });

    // Перегляд всіх абонементів
    document.querySelector('.view-all-subscriptions').addEventListener('click', async (e) => {
      e.preventDefault();
      const allSubscriptionsData = await makeAuthenticatedRequest('http://localhost:3000/api/subscriptions');

      Swal.fire({
        title: 'Всі ваші абонементи',
        html: `
          <div style="max-height: 400px; overflow-y: auto;">
            ${allSubscriptionsData.map(sub => `
              <div style="border-bottom: 1px solid #ddd; padding: 10px;">
                <strong>${sub.name}</strong><br>
                <span>Статус: ${sub.status}</span><br>
                <span>Дійсний до: ${new Date(sub.valid_until).toLocaleDateString('uk-UA')}</span><br>
                <span>Залишилось занять: ${sub.remaining_sessions}/${sub.total_sessions}</span>
              </div>
            `).join('') || '<p>Немає абонементів</p>'}
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: 'Закрити',
        confirmButtonColor: '#28a745',
        width: '600px',
      });
    });

  } catch (err) {
    Swal.fire({
      title: 'Помилка!',
      text: err.message,
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545',
    }).then(() => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '../../page-index/index.html';
    });
  }
});