document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('registerForm');
  const roleOptions = document.querySelectorAll('.role-option');
  const userRoleInput = document.getElementById('userRole');
  const coachFields = document.querySelector('.coach-fields');
  const adminFields = document.querySelector('.admin-fields');
  const securityCode = document.querySelector('.security-code');
  
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
  
  // Обробка відправки форми
  registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const name = document.getElementById('registerName').value;
      const email = document.getElementById('registerEmail').value;
      const phone = document.getElementById('registerPhone').value;
      const password = document.getElementById('registerPassword').value;
      const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
      const role = userRoleInput.value;
      
      if (password !== passwordConfirm) {
          alert('Паролі не співпадають!');
          return;
      }
      
      let userData = { name, email, phone, password, role };
      
      if (role === 'coach') {
          userData.specialization = document.getElementById('coachSpecialization').value;
          userData.experience = document.getElementById('coachExperience').value;
          userData.certificates = document.getElementById('coachCertificates').value;
          
          if (!userData.specialization) {
              alert('Будь ласка, оберіть спеціалізацію');
              return;
          }
      } else if (role === 'admin') {
          userData.position = document.getElementById('adminPosition').value;
          userData.securityCode = document.getElementById('securityCode').value;
          
          if (userData.securityCode !== '123456') {
              alert('Невірний код безпеки для адміністратора');
              return;
          }
      }
      
      console.log('Дані реєстрації:', userData);
      
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      if (role === 'client') {
          window.location.href = 'client-dashboard.html';
      } else if (role === 'coach') {
          window.location.href = 'coach-dashboard.html';
      } else if (role === 'admin') {
          window.location.href = 'admin-dashboard.html';
      }
  });
});