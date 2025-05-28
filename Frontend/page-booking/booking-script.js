import { initializeAuth } from '../utils/header-script.js';

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

// Об'єднаний обробник DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    // Ініціалізація авторизації
    await initializeAuth();

    // Маска для вводу телефону
    const phoneInput = document.getElementById('phone');
    const phoneError = document.getElementById('phoneError');
    const emailInput = document.getElementById('email');
    const nameInput = document.getElementById('full-name');
    const bookingForm = document.getElementById('training-booking-form');
    const trainingTypeSelect = document.getElementById('training-type');
    const trainerSelect = document.getElementById('trainer');

    // Функція для очищення форми
    function clearForm() {
        if (bookingForm) {
            bookingForm.reset();
        }
        if (emailInput) {
            emailInput.readOnly = false;
        }
        if (nameInput) {
            nameInput.readOnly = false;
        }
        // Очищаємо список тренерів
        if (trainerSelect) {
            trainerSelect.innerHTML = '<option value="">Оберіть тренера</option>';
        }
    }

    // Автозаповнення полів для авторизованих користувачів
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        try {
            const response = await fetch(`http://localhost:3000/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            const userData = await response.json();

            if (response.ok && userData) {
                if (userData.email && emailInput) {
                    emailInput.value = userData.email;
                    emailInput.readOnly = true;
                }
                if (userData.phone && phoneInput) {
                    phoneInput.value = userData.phone;
                } else if (phoneInput) {
                    phoneInput.value = '';
                }
                if (userData.name && nameInput) {
                    nameInput.value = userData.name;
                    nameInput.readOnly = true;
                }
            } else {
                console.error('Помилка при отриманні даних користувача:', userData.message);
                clearForm();
            }
        } catch (err) {
            console.error('Помилка обробки запиту:', err);
            clearForm();
        }
    } else {
        clearForm();
    }

    // Слухаємо подію виходу користувача
    document.addEventListener('userLoggedOut', function() {
        clearForm();
    });

    // Завантаження тренерів залежно від типу тренування
    if (trainingTypeSelect && trainerSelect) {
        trainingTypeSelect.addEventListener('change', async function() {
            const trainingType = trainingTypeSelect.value;
            if (!trainingType) {
                trainerSelect.innerHTML = '<option value="">Оберіть тренера</option>';
                return;
            }

            try {
                const response = await fetch(`http://localhost:3000/api/coaches?training_type=${trainingType}`);
                const coaches = await response.json();

                if (response.ok && coaches.length > 0) {
                    trainerSelect.innerHTML = '<option value="">Оберіть тренера</option>';
                    coaches.forEach(coach => {
                        const option = document.createElement('option');
                        option.value = coach.user_id;
                        option.textContent = coach.display_name; // Наприклад, "Наталія Шевченко - Йога"
                        trainerSelect.appendChild(option);
                    });
                } else {
                    trainerSelect.innerHTML = '<option value="">Тренери відсутні</option>';
                }
            } catch (err) {
                console.error('Помилка завантаження тренерів:', err);
                trainerSelect.innerHTML = '<option value="">Помилка завантаження тренерів</option>';
            }
        });
    }

    if (phoneInput) {
        const phoneMask = new Inputmask("+380 (99) 999-99-99");
        phoneMask.mask(phoneInput);

        // Функція для перевірки телефону
        function validatePhone() {
            const phoneValue = phoneInput.value.replace(/\D/g, '');
            const phonePattern = /^380\d{9}$/;

            if (!phonePattern.test(phoneValue)) {
                if (phoneError) {
                    phoneError.textContent = 'Введіть коректний номер телефону';
                    phoneError.style.display = 'block';
                }
                return false;
            } else {
                if (phoneError) phoneError.style.display = 'none';
                return true;
            }
        }

        phoneInput.addEventListener('blur', validatePhone);

        // Перевірка при відправці форми
        if (bookingForm) {
            bookingForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                // Перевірка телефону
                if (!validatePhone()) {
                    return;
                }

                // Перевірка авторизації
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    Swal.fire({
                        title: 'Авторизація потрібна',
                        text: 'Будь ласка, увійдіть у систему або зареєструйтеся, щоб записатися на тренування.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Увійти',
                        cancelButtonText: 'Зареєструватися',
                        confirmButtonColor: '#28a745',
                        cancelButtonColor: '#dc3545',
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '../page-login/login.html';
                        } else if (result.dismiss === Swal.DismissReason.cancel) {
                            window.location.href = '../page-register/register.html';
                        }
                    });
                    return;
                }

                // Отримуємо дані з форми
                const trainingType = document.getElementById('training-type').value;
                const trainerId = document.getElementById('trainer').value;
                const date = document.getElementById('booking-date').value;
                const time = document.getElementById('booking-time').value;
                const email = emailInput.value;

                if (!trainerId) {
                    Swal.fire({
                        title: 'Помилка!',
                        text: 'Будь ласка, оберіть тренера.',
                        icon: 'error',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#dc3545',
                    });
                    return;
                }

                try {
                    const response = await fetch('http://localhost:3000/api/book-training', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            training_type: trainingType,
                            trainer_id: trainerId,
                            date,
                            time,
                            email,
                        }),
                    });

                    const data = await response.json();

                    if (!response.ok) {
                        throw new Error(data.message || 'Помилка бронювання');
                    }

                    Swal.fire({
                        title: 'Успішно заброньовано!',
                        text: 'Ваше бронювання прийнято! Очікуйте підтвердження на email.',
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#28a745',
                    }).then(() => {
                        e.target.reset();
                        trainerSelect.innerHTML = '<option value="">Оберіть тренера</option>';
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
    }

    // Анімація для елементів із класом fade-in
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    fadeElements.forEach(element => observer.observe(element));

    // Повідомлення на розсилку
    const subscribeForm = document.querySelector('.footer-form');
    const emailInputSubscribe = document.querySelector('#subscribeEmail');

    if (subscribeForm) {
        subscribeForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = emailInputSubscribe.value;

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
                    confirmButtonColor: '#28a745'
                }).then(() => {
                    subscribeForm.reset();
                });
            } catch (err) {
                Swal.fire({
                    title: 'Помилка!',
                    text: err.message,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#dc3545'
                });
            }
        });
    }
});