import { makeAuthenticatedRequest } from '../../utils/auth.js';

document.addEventListener('DOMContentLoaded', async function () {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        window.location.href = '../../page-index/index.html';
        return;
    }

    try {
        const profileData = await makeAuthenticatedRequest('http://localhost:3000/api/auth/me');
        if (profileData.role !== 'admin') {
            window.location.href = '../../page-index/index.html';
            return;
        }

        const userInfo = document.querySelector('.user-info');
        const userName = document.querySelector('.user-name');
        const avatar = document.getElementById('avatar');
        userName.textContent = profileData.name || 'Адміністратор';
        avatar.textContent = profileData.name.charAt(0).toUpperCase();

        const sidebarLinks = document.querySelectorAll('.sidebar-menu-link[data-section]');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                const section = document.getElementById(sectionId);
                if (section) {
                    const rect = section.getBoundingClientRect();
                    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                    const headerHeight = document.querySelector('header').offsetHeight;
                    const targetPosition = rect.top + scrollTop - headerHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth',
                    });

                    sidebarLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            });
        });

        const logoutLinks = document.querySelectorAll('#logoutLink, #logoutLinkSidebar');
        logoutLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                try {
                    const refreshToken = localStorage.getItem('refreshToken');
                    await fetch('http://localhost:3000/api/auth/logout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken }),
                    });
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '../../page-index/index.html';
                } catch (err) {
                    console.error('Помилка виходу:', err);
                }
            });
        });

        const statsData = await makeAuthenticatedRequest('http://localhost:3000/api/admin/stats');
        document.getElementById('activeUsers').textContent = statsData.activeUsers;
        document.getElementById('activeUsersChange').textContent = statsData.activeUsersChange >= 0 
            ? `+${statsData.activeUsersChange} за останній тиждень` 
            : `${statsData.activeUsersChange} за останній тиждень`;
        document.getElementById('bookingsNextWeek').textContent = statsData.bookingsNextWeek;
        document.getElementById('activeSubscriptions').textContent = statsData.activeSubscriptions;
        document.getElementById('subscriptionsPercentage').textContent = `${statsData.subscriptionsPercentage}% від усіх користувачів`;
        document.getElementById('workoutsToday').textContent = statsData.workoutsToday;
        document.getElementById('workoutsTodayChange').textContent = statsData.workoutsTodayChange >= 0 
            ? `+${statsData.workoutsTodayChange} у порівнянні з минулим тижнем` 
            : `${statsData.workoutsTodayChange} у порівнянні з минулим тижнем`;

        let workouts = [];
        let currentWorkoutPage = 1;
        const workoutsPerPage = 5;

        const loadWorkouts = async () => {
            workouts = await makeAuthenticatedRequest('http://localhost:3000/api/admin/bookings');
            renderWorkouts();
        };

        const renderWorkouts = () => {
            const tableBody = document.getElementById('workoutsTableBody');
            const start = (currentWorkoutPage - 1) * workoutsPerPage;
            const end = start + workoutsPerPage;
            const paginatedWorkouts = workouts.slice(start, end);

            tableBody.innerHTML = paginatedWorkouts.map(workout => `
                <tr data-id="${workout.id}">
                    <td>
                        <div class="client-info">
                            <div class="client-avatar">${workout.client_name.split(' ').map(n => n[0]).join('')}</div>
                            <span class="client-name">${workout.client_name}</span>
                        </div>
                    </td>
                    <td>${workout.training_type}</td>
                    <td>${new Date(workout.date).toLocaleDateString('uk-UA')}, ${workout.time.slice(0, 5)}</td>
                    <td>${workout.coach_name}</td>
                    <td><span class="workout-status ${workout.status}">${workout.status === 'confirmed' ? 'Підтверджено' : workout.status === 'pending' ? 'Очікує' : 'Скасовано'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-button edit-button" data-id="${workout.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-button delete-button" data-id="${workout.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="6">Немає записів</td></tr>';

            renderWorkoutsPagination();
        };

        const renderWorkoutsPagination = () => {
            const totalPages = Math.ceil(workouts.length / workoutsPerPage);
            const pagination = document.getElementById('workoutsPagination');
            pagination.innerHTML = `
                <div class="pagination-item ${currentWorkoutPage === 1 ? 'disabled' : ''}"><i class="fas fa-chevron-left"></i></div>
                ${Array.from({ length: totalPages }, (_, i) => `
                    <div class="pagination-item ${currentWorkoutPage === i + 1 ? 'active' : ''}">${i + 1}</div>
                `).join('')}
                <div class="pagination-item ${currentWorkoutPage === totalPages ? 'disabled' : ''}"><i class="fas fa-chevron-right"></i></div>
            `;

            pagination.querySelectorAll('.pagination-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    if (item.classList.contains('disabled')) return;
                    if (item.querySelector('i.fa-chevron-left')) {
                        currentWorkoutPage--;
                    } else if (item.querySelector('i.fa-chevron-right')) {
                        currentWorkoutPage++;
                    } else {
                        currentWorkoutPage = index;
                    }
                    renderWorkouts();
                });
            });
        };

        document.getElementById('applyWorkoutFilters').addEventListener('click', async () => {
            const typeFilter = document.getElementById('workoutTypeFilter').value;
            const dateFilter = document.getElementById('dateFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;
            const searchQuery = document.getElementById('searchWorkoutInput').value.toLowerCase();

            let filteredWorkouts = await makeAuthenticatedRequest('http://localhost:3000/api/admin/bookings');

            if (typeFilter !== 'all') {
                filteredWorkouts = filteredWorkouts.filter(w => w.training_type.toLowerCase() === typeFilter);
            }

            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() + 7);
            const monthEnd = new Date();
            monthEnd.setMonth(monthEnd.getMonth() + 1);

            if (dateFilter !== 'all') {
                filteredWorkouts = filteredWorkouts.filter(w => {
                    if (dateFilter === 'today') return w.date === today;
                    if (dateFilter === 'tomorrow') return w.date === tomorrow.toISOString().split('T')[0];
                    if (dateFilter === 'week') return w.date >= today && w.date <= weekEnd.toISOString().split('T')[0];
                    if (dateFilter === 'month') return w.date >= today && w.date <= monthEnd.toISOString().split('T')[0];
                    return true;
                });
            }

            if (statusFilter !== 'all') {
                filteredWorkouts = filteredWorkouts.filter(w => w.status === statusFilter);
            }

            if (searchQuery) {
                filteredWorkouts = filteredWorkouts.filter(w => w.client_name.toLowerCase().includes(searchQuery));
            }

            workouts = filteredWorkouts;
            currentWorkoutPage = 1;
            renderWorkouts();
        });

        let users = [];
        let currentUserPage = 1;
        const usersPerPage = 5;

        const loadUsers = async () => {
            users = await makeAuthenticatedRequest('http://localhost:3000/api/admin/users');
            renderUsers();
        };

        const renderUsers = () => {
            const tableBody = document.getElementById('usersTableBody');
            const start = (currentUserPage - 1) * usersPerPage;
            const end = start + usersPerPage;
            const paginatedUsers = users.slice(start, end);

            tableBody.innerHTML = paginatedUsers.map(user => `
                <tr data-id="${user.id}">
                    <td>
                        <div class="client-info">
                            <div class="client-avatar">${user.name.split(' ').map(n => n[0]).join('')}</div>
                            <span class="client-name">${user.name}</span>
                        </div>
                    </td>
                    <td>${user.role === 'client' ? 'Клієнт' : user.role === 'coach' ? 'Тренер' : 'Адміністратор'}</td>
                    <td>${user.email}</td>
                    <td>${new Date(user.created_at).toLocaleDateString('uk-UA')}</td>
                    <td><span class="user-status ${user.status}">${user.status === 'active' ? 'Активний' : 'Неактивний'}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-button edit-button" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                            <button class="action-button delete-button" data-id="${user.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="6">Немає користувачів</td></tr>';

            renderUsersPagination();
        };

        const renderUsersPagination = () => {
            const totalPages = Math.ceil(users.length / usersPerPage);
            const pagination = document.getElementById('usersPagination');
            pagination.innerHTML = `
                <div class="pagination-item ${currentUserPage === 1 ? 'disabled' : ''}"><i class="fas fa-chevron-left"></i></div>
                ${Array.from({ length: totalPages }, (_, i) => `
                    <div class="pagination-item ${currentUserPage === i + 1 ? 'active' : ''}">${i + 1}</div>
                `).join('')}
                <div class="pagination-item ${currentUserPage === totalPages ? 'disabled' : ''}"><i class="fas fa-chevron-right"></i></div>
            `;

            pagination.querySelectorAll('.pagination-item').forEach((item, index) => {
                item.addEventListener('click', () => {
                    if (item.classList.contains('disabled')) return;
                    if (item.querySelector('i.fa-chevron-left')) {
                        currentUserPage--;
                    } else if (item.querySelector('i.fa-chevron-right')) {
                        currentUserPage++;
                    } else {
                        currentUserPage = index;
                    }
                    renderUsers();
                });
            });
        };

        document.getElementById('applyUserFilters').addEventListener('click', async () => {
            const roleFilter = document.getElementById('roleFilter').value;
            const statusFilter = document.getElementById('userStatusFilter').value;
            const sortFilter = document.getElementById('sortFilter').value;
            const searchQuery = document.getElementById('searchUserInput').value.toLowerCase();

            let filteredUsers = await makeAuthenticatedRequest('http://localhost:3000/api/admin/users');

            if (roleFilter !== 'all') {
                filteredUsers = filteredUsers.filter(u => u.role === roleFilter);
            }

            if (statusFilter !== 'all') {
                filteredUsers = filteredUsers.filter(u => u.status === statusFilter);
            }

            if (searchQuery) {
                filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes(searchQuery));
            }

            if (sortFilter === 'name') {
                filteredUsers.sort((a, b) => a.name.localeCompare(b.name));
            } else if (sortFilter === 'date') {
                filteredUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else if (sortFilter === 'activity') {
                filteredUsers.sort((a, b) => b.status === 'active' ? 1 : -1);
            }

            users = filteredUsers;
            currentUserPage = 1;
            renderUsers();
        });

        await loadWorkouts();
        await loadUsers();

        const populateWorkoutForm = async () => {
            const clients = await makeAuthenticatedRequest('http://localhost:3000/api/admin/users?role=client');
            const coaches = await makeAuthenticatedRequest('http://localhost:3000/api/admin/users?role=coach');

            const clientSelect = document.getElementById('workoutClient');
            clientSelect.innerHTML = `<option value="">Оберіть клієнта</option>` + 
                clients.map(client => `<option value="${client.id}">${client.name}</option>`).join('');

            const coachSelect = document.getElementById('workoutTrainer');
            coachSelect.innerHTML = `<option value="">Оберіть тренера</option>` + 
                coaches.map(coach => `<option value="${coach.id}">${coach.name}</option>`).join('');
        };

        document.addEventListener('click', async (event) => {
            if (event.target.classList.contains('add-workout-button')) {
                if (event.target.innerText.includes('Новий користувач')) {
                    document.querySelector('#userModal .modal-title').textContent = 'Додати користувача';
                    document.getElementById('userForm').reset();
                    document.getElementById('userId').value = '';
                    document.getElementById('userModal').style.display = 'block';
                } else {
                    await populateWorkoutForm();
                    document.querySelector('#workoutModal .modal-title').textContent = 'Додати запис на тренування';
                    document.getElementById('workoutForm').reset();
                    document.getElementById('workoutId').value = '';
                    document.getElementById('workoutModal').style.display = 'block';
                }
            }

            if (event.target.classList.contains('edit-button') || event.target.closest('.edit-button')) {
                const button = event.target.classList.contains('edit-button') ? event.target : event.target.closest('.edit-button');
                const id = button.getAttribute('data-id');

                if (button.closest('.workouts-management')) {
                    const workout = workouts.find(w => w.id == id);
                    if (workout) {
                        await populateWorkoutForm();
                        document.querySelector('#workoutModal .modal-title').textContent = 'Редагувати запис на тренування';
                        document.getElementById('workoutId').value = workout.id;
                        document.getElementById('workoutClient').value = workout.user_id;
                        document.getElementById('workoutType').value = workout.training_type.toLowerCase();
                        document.getElementById('workoutDate').value = workout.date;
                        document.getElementById('workoutTime').value = workout.time;
                        document.getElementById('workoutTrainer').value = workout.trainer_id;
                        document.getElementById('workoutStatus').value = workout.status;
                        document.getElementById('workoutModal').style.display = 'block';
                    }
                } else if (button.closest('.users-management')) {
                    const user = users.find(u => u.id == id);
                    if (user) {
                        document.querySelector('#userModal .modal-title').textContent = 'Редагувати користувача';
                        document.getElementById('userId').value = user.id;
                        document.getElementById('userName').value = user.name;
                        document.getElementById('userEmail').value = user.email;
                        document.getElementById('userPhone').value = user.phone;
                        document.getElementById('userRole').value = user.role;
                        document.getElementById('userStatus').value = user.status;
                        document.getElementById('userModal').style.display = 'block';
                    }
                }
            }

            if (event.target.classList.contains('delete-button') || event.target.closest('.delete-button')) {
                const button = event.target.classList.contains('delete-button') ? event.target : event.target.closest('.delete-button');
                const id = button.getAttribute('data-id');

                if (button.closest('.users-management')) {
                    document.getElementById('deleteUserId').value = id;
                    document.getElementById('confirmDeleteModal').style.display = 'block';
                } else if (button.closest('.workouts-management')) {
                    Swal.fire({
                        title: 'Підтвердження видалення',
                        text: 'Ви дійсно хочете видалити цей запис на тренування? Цю дію неможливо скасувати.',
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonText: 'Видалити',
                        cancelButtonText: 'Скасувати',
                        confirmButtonColor: '#dc3545',
                        cancelButtonColor: '#28a745',
                    }).then(async (result) => {
                        if (result.isConfirmed) {
                            try {
                                await makeAuthenticatedRequest(`http://localhost:3000/api/admin/bookings/${id}`, {
                                    method: 'DELETE',
                                });
                                await loadWorkouts();
                                Swal.fire('Успіх!', 'Запис на тренування видалено.', 'success');
                            } catch (err) {
                                Swal.fire('Помилка!', err.message, 'error');
                            }
                        }
                    });
                }
            }

            if (event.target.classList.contains('close-button') || 
                event.target.closest('.close-button') ||
                event.target.classList.contains('cancel-button') ||
                event.target.classList.contains('user-cancel-button') ||
                event.target.classList.contains('workout-cancel-button') ||
                event.target.classList.contains('confirm-cancel-button')) {
                const modal = event.target.closest('.modal');
                if (modal) {
                    modal.style.display = 'none';
                }
            }

            if (event.target.classList.contains('confirm-delete-button')) {
                const userId = document.getElementById('deleteUserId').value;
                try {
                    await makeAuthenticatedRequest(`http://localhost:3000/api/admin/users/${userId}`, {
                        method: 'DELETE',
                    });
                    document.getElementById('confirmDeleteModal').style.display = 'none';
                    await loadUsers();
                    Swal.fire('Успіх!', 'Користувача видалено.', 'success');
                } catch (err) {
                    Swal.fire('Помилка!', err.message, 'error');
                }
            }

            if (event.target.classList.contains('user-save-button')) {
                const userId = document.getElementById('userId').value;
                const name = document.getElementById('userName').value;
                const email = document.getElementById('userEmail').value;
                const phone = document.getElementById('userPhone').value;
                const role = document.getElementById('userRole').value;
                const status = document.getElementById('userStatus').value;

                try {
                    const data = { name, email, phone, role, status };

                    if (userId) {
                        await makeAuthenticatedRequest(`http://localhost:3000/api/admin/users/${userId}`, {
                            method: 'PUT',
                            body: JSON.stringify(data),
                        });
                    } else {
                        await makeAuthenticatedRequest('http://localhost:3000/api/admin/users', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        });
                    }

                    document.getElementById('userModal').style.display = 'none';
                    await loadUsers();
                    Swal.fire('Успіх!', userId ? 'Користувача оновлено.' : 'Користувача додано.', 'success');
                } catch (err) {
                    Swal.fire('Помилка!', err.message, 'error');
                }
            }

            if (event.target.classList.contains('workout-save-button')) {
                const workoutId = document.getElementById('workoutId').value;
                const user_id = document.getElementById('workoutClient').value;
                const training_type = document.getElementById('workoutType').value;
                const date = document.getElementById('workoutDate').value;
                const time = document.getElementById('workoutTime').value;
                const trainer_id = document.getElementById('workoutTrainer').value;
                const status = document.getElementById('workoutStatus').value;

                try {
                    const data = { user_id, training_type, date, time, trainer_id, status };

                    if (workoutId) {
                        await makeAuthenticatedRequest(`http://localhost:3000/api/admin/bookings/${workoutId}`, {
                            method: 'PUT',
                            body: JSON.stringify(data),
                        });
                    } else {
                        await makeAuthenticatedRequest('http://localhost:3000/api/admin/bookings', {
                            method: 'POST',
                            body: JSON.stringify(data),
                        });
                    }

                    document.getElementById('workoutModal').style.display = 'none';
                    await loadWorkouts();
                    Swal.fire('Успіх!', workoutId ? 'Запис на тренування оновлено.' : 'Запис на тренування додано.', 'success');
                } catch (err) {
                    Swal.fire('Помилка!', err.message, 'error');
                }
            }
        });

        window.addEventListener('click', function(event) {
            if (event.target.classList.contains('modal')) {
                event.target.style.display = 'none';
            }
        });

        document.querySelector('.view-all-bookings').addEventListener('click', async (e) => {
            e.preventDefault();
            const allBookings = await makeAuthenticatedRequest('http://localhost:3000/api/admin/bookings/all');
            Swal.fire({
                title: 'Історія записів',
                html: `
                    <div style="max-height: 400px; overflow-y: auto;">
                        ${allBookings.map(booking => `
                            <div style="border-bottom: 1px solid #ddd; padding: 10px;">
                                <strong>${booking.client_name}</strong> (${booking.training_type})<br>
                                <span>${new Date(booking.date).toLocaleDateString('uk-UA')}, ${booking.time.slice(0, 5)}</span><br>
                                <span>Тренер: ${booking.coach_name}</span><br>
                                <span>Статус: ${booking.status === 'confirmed' ? 'Підтверджено' : booking.status === 'pending' ? 'Очікує' : 'Скасовано'}</span>
                            </div>
                        `).join('') || '<p>Немає записів</p>'}
                    </div>
                `,
                showConfirmButton: true,
                confirmButtonText: 'Закрити',
                confirmButtonColor: '#28a745',
                width: '600px',
            });
        });

        document.querySelector('.export-users').addEventListener('click', async (e) => {
            e.preventDefault();
            const allUsers = await makeAuthenticatedRequest('http://localhost:3000/api/admin/users/all');
            const csv = [
                ['ID', 'Ім\'я', 'Роль', 'Email', 'Дата реєстрації', 'Статус'],
                ...allUsers.map(user => [
                    user.id,
                    user.name,
                    user.role,
                    user.email,
                    new Date(user.created_at).toLocaleDateString('uk-UA'),
                    user.status
                ])
            ].map(row => row.join(',')).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.setAttribute('href', url);
            a.setAttribute('download', 'users_export.csv');
            a.click();
        });

    } catch (err) {
        Swal.fire({
            title: 'Помилка!',
            text: err.message,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
        }).then(() => {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '../../page-index/index.html';
        });
    }
});