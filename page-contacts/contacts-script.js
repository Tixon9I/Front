// JavaScript для FAQ секції (розгортання/згортання відповідей)
document.addEventListener('DOMContentLoaded', function() {
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
          alert('Дякуємо за ваше повідомлення! Ми зв\'яжемося з вами найближчим часом.');
          contactForm.reset();
      });
  }
});

// Авторизація та реєстрація
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