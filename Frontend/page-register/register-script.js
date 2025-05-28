document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const phoneInput = document.getElementById('registerPhone');
  const phoneError = document.getElementById('phoneError');
  const passwordError = document.getElementById('passwordError');
  const coachSpecializationError = document.getElementById('coachSpecializationError');
  const securityCodeError = document.getElementById('securityCodeError');
  const coachExperienceError = document.getElementById('coachExperienceError');
  const adminPositionError = document.getElementById('adminPositionError');
  const roleOptions = document.querySelectorAll('.role-option');
  const userRoleInput = document.getElementById('userRole');
  const coachFields = document.querySelector('.coach-fields');
  const adminFields = document.querySelector('.admin-fields');
  const securityCode = document.querySelector('.security-code');

  // Додаємо маску на телефон
  const phoneMask = new Inputmask("+380 (99) 999-99-99");
  phoneMask.mask(phoneInput);

  // Функція перевірки номера
  function validatePhone() {
      const phoneDigits = phoneInput.value.replace(/\D/g, '');
      const phonePattern = /^380\d{9}$/;

      if (!phonePattern.test(phoneDigits)) {
          phoneError.textContent = 'Введіть коректний номер телефону';
          phoneError.style.display = 'block';
          return false;
      } else {
          phoneError.style.display = 'none';
          return true;
      }
  }

  phoneInput.addEventListener('blur', validatePhone);

  roleOptions.forEach(option => {
      option.addEventListener('click', function() {
          roleOptions.forEach(opt => opt.classList.remove('active'));
          this.classList.add('active');
          const role = this.getAttribute('data-role');
          userRoleInput.value = role;

          if (role === 'coach') {
              coachFields.style.display = 'block';
              adminFields.style.display = 'none';
          } else if (role === 'admin') {
              coachFields.style.display = 'none';
              adminFields.style.display = 'block';
              securityCode.style.display = 'block';
          } else {
              coachFields.style.display = 'none';
              adminFields.style.display = 'none';
          }
      });
  });

  registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      if (!validatePhone()) {
          return;
      }

      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const phoneDigits = phoneInput.value.replace(/\D/g, '');
      const fullPhone = `+${phoneDigits}`;
      const password = document.getElementById('registerPassword').value;
      const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
      const role = userRoleInput.value;

      let userData = { name, email, phone: fullPhone, password, role };

      if (role === 'coach') {
          userData.specialization = document.getElementById('coachSpecialization').value;
          userData.experience = document.getElementById('coachExperience').value;
          userData.certificates = document.getElementById('coachCertificates').value;

          if (!userData.specialization) {
              coachSpecializationError.textContent = 'Оберіть спеціалізацію';
              coachSpecializationError.style.display = 'block';
              return;
          } else {
              coachSpecializationError.style.display = 'none';
          }

          if (!userData.experience || userData.experience < 1) {
              coachExperienceError.textContent = 'Введіть досвід роботи';
              coachExperienceError.style.display = 'block';
              return;
          } else {
              coachExperienceError.style.display = 'none';
          }
      } else if (role === 'admin') {
          userData.position = document.getElementById('adminPosition').value;
          userData.securityCode = document.getElementById('securityCode').value;

          if (!userData.position) {
              adminPositionError.textContent = 'Оберіть посаду';
              adminPositionError.style.display = 'block';
              return;
          } else {
              adminPositionError.style.display = 'none';
          }

          if (userData.securityCode !== '123456') {
              securityCodeError.textContent = 'Неправильний код безпеки';
              securityCodeError.style.display = 'block';
              return;
          } else {
              securityCodeError.style.display = 'none';
          }
      }

      if (password !== passwordConfirm) {
          passwordError.textContent = 'Паролі не співпадають';
          passwordError.style.display = 'block';
          return;
      } else {
          passwordError.style.display = 'none';
      }

      try {
          const response = await fetch('http://localhost:3000/api/auth/register', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.message || 'Помилка реєстрації');
          }

          Swal.fire({
              title: 'Успішна реєстрація!',
              text: 'Тепер ви можете увійти в систему.',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745'
          }).then(() => {
              window.location.href = '../page-login/login.html';
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
});