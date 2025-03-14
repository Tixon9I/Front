const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');

        // Перенаправлення на сторінку входу
        loginBtn.addEventListener('click', function() {
            window.location.href = '../page-login/login.html';
        });

        // Перенаправлення на сторінку реєстрації
        registerBtn.addEventListener('click', function() {
            window.location.href = '../page-register/register.html';
        });

        document.addEventListener('DOMContentLoaded', function() {
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
        });

        // Кнопки запису на тренування
        const trainingButtons = document.querySelectorAll('.btn-filled');
        trainingButtons.forEach(button => {
            if (button.textContent.includes('Записатись')) {
                button.addEventListener('click', function() {
                    window.location.href = '../page-booking/booking.html';
                });
            }
        });