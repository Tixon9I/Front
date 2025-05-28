async function makeAuthenticatedRequest(url, options = {}) {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');

  // Додаємо заголовок Authorization
  options.headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
  };

  try {
      const response = await fetch(url, options);
      const data = await response.json();

      if (!response.ok) {
          // Якщо токен прострочений, пробуємо оновити
          if (data.tokenExpired) {
              const refreshResponse = await fetch('http://localhost:3000/api/auth/refresh', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ refreshToken }),
              });

              const refreshData = await refreshResponse.json();

              if (!refreshResponse.ok) {
                  // Якщо refresh token недійсний або прострочений
                  if (refreshData.redirectToLogin) {
                      localStorage.removeItem('accessToken');
                      localStorage.removeItem('refreshToken');
                      Swal.fire({
                          title: 'Сесія закінчилася!',
                          text: 'Будь ласка, увійдіть знову.',
                          icon: 'warning',
                          confirmButtonText: 'Увійти',
                          confirmButtonColor: '#28a745',
                      }).then(() => {
                          window.location.href = '../page-login/login.html';
                      });
                      throw new Error('Redirect to login');
                  }
                  throw new Error(refreshData.message || 'Помилка оновлення токена');
              }

              // Зберігаємо новий access token і повторюємо запит
              localStorage.setItem('accessToken', refreshData.accessToken);
              options.headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
              return fetch(url, options).then(res => res.json());
          }

          throw new Error(data.message || 'Помилка запиту');
      }

      return data;
  } catch (err) {
      throw err;
  }
}

export { makeAuthenticatedRequest };