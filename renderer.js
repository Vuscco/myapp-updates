// ============================================
// STATE MANAGEMENT
// ============================================

let currentUser = null;
let userLibrary = [];

// Load user data from localStorage
function loadUserData() {
    const userData = localStorage.getItem('outflowUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        showProfile();
    }
}

// ============================================
// NAVIGATION - BOTTOM TABS
// ============================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const sectionId = e.currentTarget.dataset.section;
        switchSection(sectionId);
    });
});

function switchSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionId).classList.add('active');
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    // Load section data
    if (sectionId === 'library') {
        loadLibrary();
    } else if (sectionId === 'shop') {
        loadShop();
    }
}

// ============================================
// LIBRARY SECTION
// ============================================

function loadLibrary() {
    const container = document.getElementById('libraryContainer');
    
    if (userLibrary.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"></div>
                <p>Your library is empty</p>
            </div>
        `;
        return;
    }

    let html = '';
    userLibrary.forEach(game => {
        html += `
            <div class="game-card-library">
                <div class="game-card-cover"></div>
                <div class="game-card-info">
                    <div class="game-card-title">${game.name}</div>
                    <div class="game-card-status">Installed</div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================
// SHOP SECTION
// ============================================

function loadShop() {
    const container = document.getElementById('shopContainer');

    // Check if there are games in updates folder
    window.electronAPI.getAvailableGames((games) => {
        if (!games || games.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon sad"></div>
                    <p>Games Not Found</p>
                </div>
            `;
            return;
        }

        let html = '';
        games.forEach(game => {
            html += `
                <div class="game-card-shop">
                    <div class="game-card-cover"></div>
                    <div class="game-card-details">
                        <div class="game-card-title">${game.name}</div>
                        <div class="game-card-price">Free</div>
                        <div class="game-card-description">${game.description || 'Amazing game'}</div>
                        <button class="btn-buy" onclick="buyGame('${game.id}', '${game.name}')">Get Game</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    });
}

function buyGame(gameId, gameName) {
    // Add game to user library
    if (!userLibrary.find(g => g.id === gameId)) {
        userLibrary.push({ id: gameId, name: gameName });
        alert(`${gameName} added to your library!`);
        loadLibrary();
    }
}

// ============================================
// PROFILE - AUTHENTICATION
// ============================================

// LOGIN FORM
document.getElementById('loginBtn').addEventListener('click', (e) => {
    e.preventDefault();
    loginEmail();
});
document.getElementById('registerBtn').addEventListener('click', (e) => {
    e.preventDefault();
    registerEmail();
});

function loginEmail() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert('Please fill in all fields');
        return;
    }

    // Validate email format
    if (!validateEmail(email)) {
        alert('Invalid email format');
        return;
    }

    // Check if user exists
    const users = JSON.parse(localStorage.getItem('outflowUsers') || '[]');
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('outflowUser', JSON.stringify(user));
        showProfile();
    } else {
        alert('Invalid email or password');
    }
}

function registerEmail() {
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const username = document.getElementById('registerUsername').value;

    if (!email || !password || !username) {
        alert('Please fill in all fields');
        return;
    }

    if (!validateEmail(email)) {
        alert('Invalid email format');
        return;
    }

    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('outflowUsers') || '[]');
    if (users.find(u => u.email === email)) {
        alert('Email already registered');
        return;
    }

    // Create user
    const newUser = {
        id: Date.now(),
        email,
        password,
        username,
        loginMethod: 'email',
        profileImage: getDefaultAvatar()
    };

    users.push(newUser);
    localStorage.setItem('outflowUsers', JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem('outflowUser', JSON.stringify(newUser));
    showProfile();
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function toggleAuthMode(e) {
    e.preventDefault();
    document.getElementById('loginForm').style.display = 
        document.getElementById('loginForm').style.display === 'none' ? 'flex' : 'none';
    document.getElementById('registerForm').style.display = 
        document.getElementById('registerForm').style.display === 'none' ? 'flex' : 'none';
    
    const text = document.getElementById('authToggleText');
    text.textContent = document.getElementById('loginForm').style.display === 'none' 
        ? 'Already have an account? ' 
        : 'Don\'t have an account? ';
    
    const link = text.querySelector('a');
    link.textContent = document.getElementById('loginForm').style.display === 'none' 
        ? 'Login here' 
        : 'Create one';
}

// ============================================
// PROFILE - DISPLAY & MANAGEMENT
// ============================================

function showProfile() {
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');

    authSection.style.display = 'none';
    profileSection.style.display = 'block';

    // Enable all inputs first
    const allInputs = document.querySelectorAll('.form-input, #usernameInput');
    allInputs.forEach(input => {
        input.disabled = false;
    });

    // Update profile info
    document.getElementById('profileUsername').textContent = currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
    document.getElementById('emailDisplay').textContent = currentUser.email;
    
    const usernameInput = document.getElementById('usernameInput');
    usernameInput.value = currentUser.username;
    usernameInput.disabled = false;
    
    document.getElementById('profileImage').src = currentUser.profileImage;

    // Photo upload
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const photoInput = document.getElementById('photoInput');

    // Clear previous listeners by cloning
    const newChangePhotoBtn = changePhotoBtn.cloneNode(true);
    changePhotoBtn.parentNode.replaceChild(newChangePhotoBtn, changePhotoBtn);

    newChangePhotoBtn.addEventListener('click', () => {
        document.getElementById('photoInput').click();
    });

    const newPhotoInput = photoInput.cloneNode(true);
    photoInput.parentNode.replaceChild(newPhotoInput, photoInput);

    newPhotoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                currentUser.profileImage = event.target.result;
                document.getElementById('profileImage').src = event.target.result;
                localStorage.setItem('outflowUser', JSON.stringify(currentUser));
            };
            reader.readAsDataURL(file);
        }
    });
}

function updateUsername() {
    const newUsername = document.getElementById('usernameInput').value;
    if (!newUsername) {
        alert('Username cannot be empty');
        return;
    }

    currentUser.username = newUsername;
    localStorage.setItem('outflowUser', JSON.stringify(currentUser));
    document.getElementById('profileUsername').textContent = newUsername;
    alert('Username updated successfully');
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    currentUser = null;
    userLibrary = [];
    localStorage.removeItem('outflowUser');
    
    // Reset forms
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerUsername').value = '';

    // Show auth section
    const authSection = document.getElementById('authSection');
    const profileSection = document.getElementById('profileSection');
    authSection.style.display = 'flex';
    profileSection.style.display = 'none';
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';

    switchSection('library');
});

// ============================================
// UTILITIES
// ============================================

function getDefaultAvatar() {
    // Default anonymous avatar (SVG)
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%234cafff' opacity='0.2'/%3E%3Ccircle cx='50' cy='35' r='15' fill='%234cafff'/%3E%3Cpath d='M 20 65 Q 50 75 80 65' fill='%234cafff'/%3E%3C/svg%3E`;
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    loadLibrary();
});