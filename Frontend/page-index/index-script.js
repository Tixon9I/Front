import { initializeAuth } from '../utils/header-script.js';

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

// Ініціалізація авторизації
document.addEventListener('DOMContentLoaded', async function() {
    await initializeAuth();

    // Анімація для елементів із класом fade-in
    const fadeElements = document.querySelectorAll('.fade-in');
    
    function checkFade() {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    }
    
    window.addEventListener('scroll', checkFade);
    checkFade();

    // Кнопки запису на тренування
    const trainingButtons = document.querySelectorAll('.btn-filled');
    trainingButtons.forEach(button => {
        if (button.textContent.includes('Записатись')) {
            button.addEventListener('click', function() {
                window.location.href = '../page-booking/booking.html';
            });
        }
    });

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