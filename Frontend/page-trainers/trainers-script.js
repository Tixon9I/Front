import { initializeAuth } from '../utils/header-script.js';

// Дані тренерів
const trainers = [
    {
        id: 1,
        name: 'Олександр Петренко',
        specialization: 'strength',
        experience: '7',
        rating: 4.8,
        description: 'Сертифікований тренер з силових тренувань з 7-річним досвідом. Спеціалізується на програмах набору мязової маси та силового тренінгу.',
        image: "images/1.jpg"
    },
    {
        id: 2,
        name: 'Марія Ковальчук',
        specialization: 'yoga',
        experience: '5',
        rating: 5.0,
        description: 'Інструктор з йоги, має сертифікати міжнародного зразка. Проводить заняття для початківців та просунутих рівнів.',
        image: "images/2.jpg"
    },
    {
        id: 3,
        name: 'Андрій Савченко',
        specialization: 'crossfit',
        experience: '4',
        rating: 4.6,
        description: 'Професійний тренер з кросфіту, учасник національних змагань. Допоможе досягти нових вершин у фізичній підготовці.',
        image: "images/3.jpg"
    },
    {
        id: 4,
        name: 'Юлія Іваненко',
        specialization: 'pilates',
        experience: '6',
        rating: 4.9,
        description: 'Тренер з пілатесу, фахівець з реабілітації. Допомагає клієнтам відновитися після травм та покращити гнучкість.',
        image: "images/4.jpg"
    },
    {
        id: 5,
        name: 'Валентин Мороз',
        specialization: 'cardio',
        experience: '3',
        rating: 4.7,
        description: 'Інструктор з кардіотренувань. Розробляє індивідуальні програми для схуднення та підвищення витривалості.',
        image: "images/5.jpg"
    },
    {
        id: 6,
        name: 'Наталія Шевченко',
        specialization: 'yoga',
        experience: '8',
        rating: 4.9,
        description: 'Майстер йоги з 8-річним досвідом. Спеціалізується на хатха та кундаліні йозі. Допомагає клієнтам знайти внутрішню гармонію.',
        image: "images/6.jpg"
    },
    {
        id: 7,
        name: 'Віктор Коваленко',
        specialization: 'strength',
        experience: '10',
        rating: 4.8,
        description: 'Досвідчений тренер з силових тренувань. Колишній професійний спортсмен, допомагає клієнтам безпечно досягати своїх фітнес-цілей.',
        image: "images/7.jpg"
    },
    {
        id: 8,
        name: 'Софія Мельник',
        specialization: 'pilates',
        experience: '4',
        rating: 4.5,
        description: 'Сертифікований інструктор з пілатесу. Фокусується на поставі та зміцненні кору, підходить для клієнтів різного рівня підготовки.',
        image: "images/8.jpg"
    },
    {
        id: 9,
        name: 'Денис Козак',
        specialization: 'cardio',
        experience: '6',
        rating: 4.7,
        description: 'Фахівець з кардіотренувань та інтервального тренінгу. Допомагає клієнтам покращити серцево-судинну систему та скинути вагу.',
        image: "images/9.jpg"
    }
];

// Відображення тренерів на сторінці
function displayTrainers(trainersData) {
    const container = document.getElementById('trainers-container');
    const noResults = document.getElementById('no-results');
    
    if (container) container.innerHTML = '';
    
    if (trainersData.length === 0) {
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (noResults) noResults.style.display = 'none';
    
    trainersData.forEach(trainer => {
        let specializationText = '';
        switch(trainer.specialization) {
            case 'strength':
                specializationText = 'Силові тренування';
                break;
            case 'cardio':
                specializationText = 'Кардіо';
                break;
            case 'yoga':
                specializationText = 'Йога';
                break;
            case 'crossfit':
                specializationText = 'Кросфіт';
                break;
            case 'pilates':
                specializationText = 'Пілатес';
                break;
            default:
                specializationText = 'Універсальний тренер';
        }
        
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= Math.floor(trainer.rating)) {
                starsHTML += '<i class="fas fa-star star"></i>';
            } else if (i - 0.5 <= trainer.rating) {
                starsHTML += '<i class="fas fa-star-half-alt star"></i>';
            } else {
                starsHTML += '<i class="far fa-star star"></i>';
            }
        }
        
        const trainerCard = document.createElement('div');
        trainerCard.className = 'trainer-card fade-in';
        
        trainerCard.innerHTML = `
            <div class="trainer-image" style="background-image: url('${trainer.image}')"></div>
            <div class="trainer-info">
                <h3>${trainer.name}</h3>
                <div class="trainer-specialization">${specializationText}</div>
                <div class="trainer-rating">
                    ${starsHTML}
                    <span>(${trainer.rating})</span>
                </div>
                <p class="trainer-description">${trainer.description}</p>
                <div class="trainer-action">
                    <a href="trainer-detail.html?id=${trainer.id}" class="btn btn-filled">Детальніше</a>
                </div>
            </div>
        `;
        
        if (container) container.appendChild(trainerCard);

        setTimeout(() => {
            trainerCard.classList.add('visible');
        }, 100 * container.children.length);
    });
}

// Функція фільтрації тренерів
function filterTrainers() {
    const specializationFilter = document.getElementById('specialization').value;
    const experienceFilter = document.getElementById('experience').value;
    const ratingFilter = document.getElementById('rating').value;
    const sortBy = document.getElementById('sort').value;
    
    let filteredTrainers = [...trainers];
    
    if (specializationFilter) {
        filteredTrainers = filteredTrainers.filter(trainer => 
            trainer.specialization === specializationFilter
        );
    }
    
    if (experienceFilter) {
        const [min, max] = experienceFilter.split('-');
        if (max) {
            filteredTrainers = filteredTrainers.filter(trainer => 
                parseInt(trainer.experience) >= parseInt(min) && 
                parseInt(trainer.experience) < parseInt(max)
            );
        } else {
            const minExperience = parseInt(min);
            filteredTrainers = filteredTrainers.filter(trainer => 
                parseInt(trainer.experience) >= minExperience
            );
        }
    }
    
    if (ratingFilter) {
        const minRating = parseFloat(ratingFilter);
        filteredTrainers = filteredTrainers.filter(trainer => 
            trainer.rating >= minRating
        );
    }

    switch (sortBy) {
        case 'rating':
            filteredTrainers.sort((a, b) => b.rating - a.rating);
            break;
        case 'experience':
            filteredTrainers.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
            break;
        case 'name':
            filteredTrainers.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    
    displayTrainers(filteredTrainers);
}

// Авторизація та реєстрація
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');

// Перенаправлення на сторінку входу
if (loginBtn) {
    loginBtn.addEventListener('click', function() {
        window.location.href = '../page-login/login.html';
    });
}

// Перенаправлення на сторінку реєстрації
if (registerBtn) {
    registerBtn.addEventListener('click', function() {
        window.location.href = '../page-register/register.html';
    });
}

// Об'єднаний обробник DOMContentLoaded
document.addEventListener('DOMContentLoaded', async function() {
    // Ініціалізація авторизації
    await initializeAuth();

    // Відображення всіх тренерів при завантаженні сторінки
    trainers.sort((a, b) => b.rating - a.rating);
    displayTrainers(trainers);

    // Фільтрація тренерів
    const specializationFilter = document.getElementById('specialization');
    const experienceFilter = document.getElementById('experience');
    const ratingFilter = document.getElementById('rating');
    const sortFilter = document.getElementById('sort');

    if (specializationFilter) specializationFilter.addEventListener('change', filterTrainers);
    if (experienceFilter) experienceFilter.addEventListener('change', filterTrainers);
    if (ratingFilter) ratingFilter.addEventListener('change', filterTrainers);
    if (sortFilter) sortFilter.addEventListener('change', filterTrainers);

    // Анімація для елементів із класом fade-in
    const fadeElements = document.querySelectorAll('.fade-in');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              entry.target.classList.add('visible');
          }
      });
  }, { threshold: 0.1 });
  
  fadeElements.forEach(element => observer.observe(element));

    // Кнопки запису на тренування
    const trainingButtons = document.querySelectorAll('.btn-filled');
    trainingButtons.forEach(button => {
        if (button.textContent.includes('Записатись')) {
            button.addEventListener('click', function() {
                window.location.href = '../page-booking/booking.html';
            });
        }
    });

    // Повідомлення на розсилку
    const subscribeForm = document.querySelector('.footer-form');
    const emailInput = document.querySelector('#subscribeEmail');

    if (subscribeForm) {
        subscribeForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const email = emailInput.value;

            try {
                const response = await fetch('http://localhost:3000/api/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Помилка підписки');
                }

                Swal.fire({
                    title: 'Ви успішно підписалися!',
                    text: 'Дякуємо за підписку на нашу розсилку.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#28a745'
                }).then(() => {
                    subscribeForm.reset();
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
    }
});