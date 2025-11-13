/*
  auth.js - Global Supabase Authentication Helper
  Handles:
  - Global `showToast` utility
  - Automatic UI updates for login/logout (navbar)
  - Displaying user profile (username & avatar)
  - Secure logout
*/

// --- 1. GLOBAL UTILITY FUNCTIONS ---

/**
 * Displays a toast notification.
 * @param {string} message The message to display.
 * @param {'info' | 'success' | 'error'} type The type of toast.
 */
function showToast(message, type = 'info') {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.innerText = message;
  toast.style.background = type === 'error' ? '#ff6b6b' : 
                          type === 'success' ? 'var(--accent)' : 'var(--primary)';
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

/**
 * Injects the CSS needed for the new profile dropdown.
 * This keeps all profile logic self-contained in this file.
 */
function injectProfileStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Style for the round profile avatar BUTTON */
    .profile-avatar-button {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--primary-light);
      background-color: var(--primary-light);
      color: var(--white);
      font-weight: 600;
      font-size: 16px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0; /* Reset button padding */
    }
    
    /* Container for the profile menu */
    .profile-menu-container {
      position: relative;
    }
    
    /* The dropdown menu itself */
    .profile-dropdown {
      display: none; /* Hidden by default */
      position: absolute;
      top: 50px; /* Position below the navbar */
      right: 0;
      background: var(--white);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      min-width: 220px;
      z-index: 100;
      border: 1px solid var(--background);
      overflow: hidden;
    }
    
    /* Show the dropdown when active */
    .profile-dropdown.active {
      display: block;
    }
    
    /* Header section of the dropdown */
    .profile-dropdown-header {
      padding: 1rem;
      border-bottom: 1px solid var(--background);
    }
    
    .profile-dropdown-header .username {
      font-weight: 600;
      color: var(--text);
      display: block;
    }
    
    .profile-dropdown-header .email {
      font-size: 0.8rem;
      color: var(--text-light);
      display: block;
      word-wrap: break-word;
    }
    
    /* Clickable items in the dropdown */
    .profile-dropdown-item {
      display: block;
      padding: 0.8rem 1rem;
      color: var(--text);
      text-decoration: none;
      font-size: 0.9rem;
      cursor: pointer;
    }
    
    .profile-dropdown-item:hover {
      background: var(--background);
    }
    
    .profile-dropdown-item.logout {
      color: #ff6b6b; /* Red color for logout */
    }
  `;
  document.head.appendChild(style);
}

// --- 2. CORE AUTHENTICATION LOGIC ---

/**
 * Logs the user out, clears local storage, and updates UI.
 */
async function logout() {
  try {
    localStorage.removeItem('petverse_profile');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    showToast(`Goodbye! You have been logged out.`, 'success');
    updateAuthLinks(); // Update UI immediately
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err) {
    console.error('Logout error', err);
    showToast('Logout failed', 'error');
  }
}

/**
 * Toggles the visibility of the profile dropdown menu.
 */
function toggleProfileDropdown() {
  const dropdown = document.getElementById('profile-dropdown-menu');
  if (dropdown) {
    dropdown.classList.toggle('active');
  }
}

/**
 * Updates the navbar links based on the user's login state.
 * Creates or removes the profile dropdown menu.
 */
async function updateAuthLinks() {
  const { data: { user } } = await supabase.auth.getUser();

  // Get the navbar list <ul>
  const navbarList = document.querySelector('.navbar ul');
  if (!navbarList) return; // Exit if navbar isn't found

  // Get the original login/logout links
  const loginLinkItem = document.getElementById("loginLink")?.parentElement; // Get the <li>
  const logoutItem = document.getElementById("logoutItem"); // Get the <li>

  // Find the new profile menu if it already exists
  let profileMenu = document.getElementById('profile-menu-container');

  if (user) {
    // --- USER IS LOGGED IN ---
    
    // 1. Hide the original "Login / Signup" and "Logout" links
    if (loginLinkItem) loginLinkItem.style.display = 'none';
    if (logoutItem) logoutItem.style.display = 'none';
    
    // 2. If the profile menu doesn't exist, create it
    if (!profileMenu) {
      profileMenu = document.createElement('li');
      profileMenu.id = 'profile-menu-container';
      profileMenu.className = 'profile-menu-container';
      navbarList.appendChild(profileMenu);
    }
    
    // 3. Get profile data
    const profile = JSON.parse(localStorage.getItem('petverse_profile'));
    const displayName = profile?.username || user.email.split('@')[0];
    const email = user.email;
    const avatarUrl = profile?.avatar_url;

    // 4. Create avatar button
    let avatarButtonHtml = '';
    if (avatarUrl) {
      avatarButtonHtml = `<img src="${avatarUrl}" alt="${displayName}" class="profile-avatar-button">`;
    } else {
      const firstLetter = displayName.charAt(0).toUpperCase();
      avatarButtonHtml = `<button class="profile-avatar-button">${firstLetter}</button>`;
    }

    // 5. Populate the profile menu
    profileMenu.innerHTML = `
      <!-- This is the clickable avatar button -->
      <div id="profile-avatar-button">
        ${avatarButtonHtml}
      </div>
      
      <!-- This is the hidden dropdown menu -->
      <div id="profile-dropdown-menu" class="profile-dropdown">
        <div class="profile-dropdown-header">
          <span class="username">${displayName}</span>
          <span class="email">${email}</span>
        </div>
        <a id="profile-logout-button" class="profile-dropdown-item logout">
          Logout
        </a>
      </div>
    `;

    // 6. Add click listeners
    document.getElementById('profile-avatar-button').onclick = toggleProfileDropdown;
    document.getElementById('profile-logout-button').onclick = logout;
    
    // Optional: Close dropdown if user clicks outside
    window.addEventListener('click', function(e) {
      if (!profileMenu.contains(e.target)) {
        document.getElementById('profile-dropdown-menu')?.classList.remove('active');
      }
    });

  } else {
    // --- USER IS LOGGED OUT ---

    // 1. Show the "Login / Signup" link
    if (loginLinkItem) loginLinkItem.style.display = 'block';
    
    // 2. Hide the (unused) "Logout" item
    if (logoutItem) logoutItem.style.display = 'none';

    // 3. If the profile menu exists, remove it
    if (profileMenu) {
      profileMenu.remove();
    }
  }
}

// --- 3. INITIALIZATION ---

// Listen to auth state changes
try {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth event:', event);
    updateAuthLinks();
  });
} catch (error) {
  console.error("Error setting up onAuthStateChange:", error);
}

// Run once when the page loads
document.addEventListener('DOMContentLoaded', () => {
  try {
    injectProfileStyles();
    updateAuthLinks();
  } catch (error) {
    console.error("Error during initial auth setup:", error);
  }
});