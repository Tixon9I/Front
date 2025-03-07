document.addEventListener('click', function(event) {
  // Відкриття модальних вікон
  if (event.target.classList.contains('add-workout-button')) {
      if (event.target.innerText.includes('Новий користувач')) {
          // Відкрити модальне вікно користувача
          document.querySelector('#userModal .modal-title').textContent = 'Додати користувача';
          document.getElementById('userForm').reset();
          document.getElementById('userModal').style.display = 'block';
      } else {
          // Відкрити модальне вікно тренування
          document.querySelector('#workoutModal .modal-title').textContent = 'Додати запис на тренування';
          document.getElementById('workoutForm').reset();
          document.getElementById('workoutModal').style.display = 'block';
      }
  }
  
  // Кнопки редагування тренування
  if (event.target.classList.contains('edit-button') || 
      event.target.closest('.edit-button')) {
      const button = event.target.classList.contains('edit-button') ? 
                      event.target : event.target.closest('.edit-button');
      
      // Перевірити, в якій таблиці знаходиться кнопка
      if (button.closest('.workouts-management')) {
          document.querySelector('#workoutModal .modal-title').textContent = 'Редагувати запис на тренування';
          document.getElementById('workoutModal').style.display = 'block';
      } else if (button.closest('.users-management')) {
          const userId = button.getAttribute('data-id');
          document.querySelector('#userModal .modal-title').textContent = 'Редагувати користувача';
          document.getElementById('userModal').style.display = 'block';
      }
  }
  
  // Кнопки видалення користувача
  if (event.target.classList.contains('delete-button') || 
      event.target.closest('.delete-button')) {
      const button = event.target.classList.contains('delete-button') ? 
                      event.target : event.target.closest('.delete-button');
      
      if (button.closest('.users-management')) {
          const userId = button.getAttribute('data-id');
          document.getElementById('deleteUserId').value = userId;
          document.getElementById('confirmDeleteModal').style.display = 'block';
      }
  }
  
  // Закриття модальних вікон
  if (event.target.classList.contains('close-button') || 
      event.target.closest('.close-button')) {
      const modal = event.target.closest('.modal');
      if (modal) {
          modal.style.display = 'none';
      }
  }
  
  // Кнопки "Скасувати" закривають відповідні модальні вікна
  if (event.target.classList.contains('cancel-button') || 
      event.target.classList.contains('user-cancel-button') ||
      event.target.classList.contains('confirm-cancel-button')) {
      const modal = event.target.closest('.modal');
      if (modal) {
          modal.style.display = 'none';
      }
  }
  
  // Підтвердження видалення
  if (event.target.classList.contains('confirm-delete-button')) {
      const userId = document.getElementById('deleteUserId').value;
      console.log('Видалення користувача з ID:', userId);
      document.getElementById('confirmDeleteModal').style.display = 'none';
  }
  
  // Збереження даних користувача
  if (event.target.classList.contains('user-save-button')) {
      console.log('Збереження даних користувача');
      document.getElementById('userModal').style.display = 'none';
  }
  
  // Збереження даних тренування
  if (event.target.classList.contains('save-button') && 
      !event.target.classList.contains('user-save-button')) {
      console.log('Збереження даних тренування');
      document.getElementById('workoutModal').style.display = 'none';
  }
});

// Закриття модальних вікон при кліку поза ними
window.addEventListener('click', function(event) {
  if (event.target.classList.contains('modal')) {
      event.target.style.display = 'none';
  }
});