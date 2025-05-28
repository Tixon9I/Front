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

    // JavaScript для FAQ секції (розгортання/згортання відповідей)
    const questions = document.querySelectorAll('.faq-question');
    
    questions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const isActive = this.classList.contains('active');
            
            // Закрити всі активні відповіді
            document.querySelectorAll('.faq-question.active').forEach(activeQuestion => {
                if (activeQuestion !== this) {
                    activeQuestion.classList.remove('active');
                    activeQuestion.nextElementSibling.classList.remove('active');
                }
            });
            
            // Переключити поточну відповідь
            if (isActive) {
                this.classList.remove('active');
                answer.classList.remove('active');
            } else {
                this.classList.add('active');
                answer.classList.add('active');
            }
        });
    });

    // Форма контактів
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();

            Swal.fire({
                title: 'Успішно!',
                text: 'Ваш запит було надіслано',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#28a745'
            }).then(() => {
                contactForm.reset();
            });
        });
    }

    // Анімація для елементів із класом fade-in
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('visible');
          }
      });
  }, {
      threshold: 0.1
  });
  
  fadeElements.forEach(element => {
      observer.observe(element);
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