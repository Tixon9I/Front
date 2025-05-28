import { makeAuthenticatedRequest } from './auth.js';

export async function initializeAuth() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const avatar = document.getElementById('avatar');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const profileLink = document.getElementById('profileLink');
    const logoutLink = document.getElementById('logoutLink');
    const navbar = document.getElementById('navbar');
    const adminLinks = document.querySelectorAll('.admin-only');

    // Обробка кліку на аватарку
    if (avatar) {
        avatar.addEventListener('click', function() {
            dropdownMenu.classList.toggle('show');
        });
    }

    // Закриття меню при кліку поза ним
    document.addEventListener('click', function(event) {
        if (!userMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Швидка перевірка локальних даних
    const cachedRole = localStorage.getItem('userRole');
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && cachedRole) {
        userMenu.style.display = 'block';
        authButtons.classList.remove('visible');
        if (avatar) avatar.textContent = localStorage.getItem('userInitial') || 'U';

        // Попереднє налаштування на основі cachedRole (до запиту)
        if (cachedRole === 'admin') {
            if (profileLink) profileLink.href = '../accounts/account-admin/account_admin.html';
            adminLinks.forEach(link => link.style.display = 'block');
        } else if (cachedRole === 'coach') {
            if (profileLink) profileLink.href = '../accounts/account-trainer/account_trainer.html';
        } else {
            if (profileLink) profileLink.href = '../accounts/account-client/account_client.html';
        }
    } else if (!accessToken) {
        authButtons.classList.add('visible');
        userMenu.style.display = 'none';
    }

    // Асинхронна перевірка авторизації
    if (accessToken) {
        try {
            const userData = await makeAuthenticatedRequest('http://localhost:3000/api/auth/me');
            
            userMenu.style.display = 'block';
            authButtons.classList.remove('visible');

            const firstLetter = userData.name.charAt(0).toUpperCase();
            if (avatar) avatar.textContent = firstLetter;

            localStorage.setItem('userInitial', firstLetter);
            localStorage.setItem('userRole', userData.role);

            // Використовуємо userData.role для визначення правильного профілю
            if (userData.role === 'admin') {
                if (profileLink) profileLink.href = '../accounts/account-admin/account_admin.html';
                adminLinks.forEach(link => link.style.display = 'block');
            } else if (userData.role === 'coach') {
                if (profileLink) profileLink.href = '../accounts/account-trainer/account_trainer.html';
            } else {
                if (profileLink) profileLink.href = '../accounts/account-client/account_client.html';
            }
        } catch (err) {
            console.error('Помилка отримання даних користувача:', err);
            authButtons.classList.add('visible');
            userMenu.style.display = 'none';
            localStorage.removeItem('accessToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userInitial');
        }
    } else {
        authButtons.classList.add('visible');
        userMenu.style.display = 'none';
    }

    // Показуємо навігаційну панель після перевірки
    if (navbar) {
        navbar.classList.add('visible');
    }

    // Обробка виходу
    if (logoutLink) {
        logoutLink.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                const refreshToken = localStorage.getItem('refreshToken');
                await fetch('http://localhost:3000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                });

                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userInitial');

                authButtons.classList.add('visible');
                userMenu.style.display = 'none';
                dropdownMenu.classList.remove('show');
                adminLinks.forEach(link => link.style.display = 'none');

                // Диспатчимо подію для сповіщення про вихід
                const logoutEvent = new Event('userLoggedOut');
                document.dispatchEvent(logoutEvent);

                Swal.fire({
                    title: 'Успішний вихід!',
                    text: 'Ви вийшли з профілю.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#28a745'
                });
            } catch (err) {
                console.error('Помилка виходу:', err);
                Swal.fire({
                    title: 'Помилка!',
                    text: 'Не вдалося вийти з профілю.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#dc3545'
                });
            }
        });
    }
}