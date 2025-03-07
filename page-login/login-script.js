document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.querySelector('.auth-form');
  
  loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      console.log('Спроба входу:', { email, password });
      alert('Авторизація успішна!');
  });
});