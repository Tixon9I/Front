document.addEventListener('DOMContentLoaded', function() {
  // Відображення імені користувача
  const userNameElement = document.getElementById('userName');
  const userAvatarElement = document.getElementById('userAvatar');
  
  const userData = {
      firstName: 'Михайло',
      lastName: 'Тренер',
      email: 'trainer@example.com'
  };
  
  // Відображення ініціалів у аватарі
  if (userData.firstName && userData.lastName) {
      const initials = userData.firstName.charAt(0) + userData.lastName.charAt(0);
      userAvatarElement.textContent = initials;
  }
  
  // Налаштування меню
  const menuItems = document.querySelectorAll('.sidebar-menu-link');
  menuItems.forEach(item => {
      item.addEventListener('click', function(e) {
          menuItems.forEach(i => i.classList.remove('active'));
          this.classList.add('active');
      });
  });
});

// Функціонал для управління записами на тренування
document.addEventListener('DOMContentLoaded', function() {
const confirmButtons = document.querySelectorAll('.registration-action.confirm');
const editButtons = document.querySelectorAll('.registration-action.edit');
const removeButtons = document.querySelectorAll('.registration-action.remove');
const addClientButtons = document.querySelectorAll('.add-client-btn');

// Обробник для підтвердження запису
confirmButtons.forEach(button => {
button.addEventListener('click', function() {
    this.classList.toggle('active');
});
});

// Обробник для редагування запису
editButtons.forEach(button => {
button.addEventListener('click', function() {
    const clientElement = this.closest('.client-registration');
    const clientName = clientElement.querySelector('.registration-client-name').textContent;
    alert(`Редагування запису для клієнта: ${clientName}`);
});
});

// Обробник для видалення запису
removeButtons.forEach(button => {
button.addEventListener('click', function() {
    const clientElement = this.closest('.client-registration');
    const clientName = clientElement.querySelector('.registration-client-name').textContent;
    if (confirm(`Ви впевнені, що хочете видалити запис для клієнта: ${clientName}?`)) {
        clientElement.remove();
        const regItem = this.closest('.registration-item');
        const countElement = regItem.querySelector('.clients-count');
        const currentCount = countElement.textContent.split('/')[0];
        const maxCount = countElement.textContent.split('/')[1].split(' ')[0];
        countElement.textContent = `${parseInt(currentCount) - 1}/${maxCount} учасників`;
    }
});
});

// Обробник для додавання клієнта
addClientButtons.forEach(button => {
button.addEventListener('click', function() {
    const regItem = this.closest('.registration-item');
    const title = regItem.querySelector('.registration-title').textContent;
    alert(`Додавання клієнта до тренування: ${title}`);
});
});
});