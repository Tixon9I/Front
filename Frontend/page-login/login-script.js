document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.querySelector('.auth-form');

  loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;

      try {
          const response = await fetch('http://localhost:3000/api/auth/login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
              throw new Error(data.message || 'Помилка авторизації');
          }

          // Зберігаємо токени у localStorage
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);

          Swal.fire({
              title: 'Успішний вхід!',
              text: 'Ви увійшли в систему.',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#28a745'
          }).then(() => {
                  window.location.href = '../page-index/index.html';
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