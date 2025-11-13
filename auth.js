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
 * Injects the CSS needed for the new profile avatar.
 * This keeps all profile logic self-contained in this file.
 */
function injectProfileStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* Style for the round profile avatar in the navbar */
    .navbar-avatar, .navbar-avatar-default {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      margin-right: 8px;
      object-fit: cover;
      border: 2px solid var(--primary-light);
      flex-shrink: 0;
    }
    
    /* Fallback style for if user has no avatar_url */
    .navbar-avatar-default {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background-color: var(--primary-light);
      color: var(--white);
      font-weight: 600;
      font-size: 14px;
    }
    
    /* Make the login/profile link a flex container to hold the avatar */
    #loginLink {
      display: flex;
      align-items: center;
      gap: 5px; /* Adds a small space between avatar and text */
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
    // 1. Clear the saved profile from local storage
    localStorage.removeItem('petverse_profile');
    
    // 2. Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    showToast(`Goodbye! You have been logged out.`, 'success');
    
    // 3. Update navbar links and redirect
    updateAuthLinks(); // Update UI immediately
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err) {
    console.error('Logout error', err);
    showToast('Logout failed', 'error');
  }
}

/**
 * Updates the navbar links based on the user's login state.
 * Reads profile from localStorage to display username and avatar.
 */
async function updateAuthLinks() {
  // Get auth state from Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // Get UI elements
  const loginLink = document.getElementById("loginLink");
  const logoutItem = document.getElementById("logoutItem");
  const logoutLink = document.getElementById("logoutLink");
  
  // This is the logo in the top-left corner
  const mainLogo = document.querySelector('.navbar .logo');

  if (user) {
    // --- USER IS LOGGED IN ---
    
    // 1. Get profile from localStorage (saved during login)
    const profile = JSON.parse(localStorage.getItem('petverse_profile'));

    // 2. Determine display name and avatar
    const displayName = profile?.username || user.email.split('@')[0];
    const avatarUrl = profile?.avatar_url;

    // 3. Create the avatar HTML
    let avatarHtml = '';
    if (avatarUrl) {
      avatarHtml = `<img src="${avatarUrl}" alt="${displayName}" class="navbar-avatar">`;
    } else {
      // Use first letter as default
      const firstLetter = displayName.charAt(0).toUpperCase();
      avatarHtml = `<div class="navbar-avatar-default">${firstLetter}</div>`;
    }

    // 4. Update the "Login" link to be a "Profile" link
    if (loginLink) {
      // This is the "Login / Signup" link on the right
      loginLink.innerHTML = `${avatarHtml} Welcome, ${displayName} 👋`;
      loginLink.style.color = "var(--accent)";
      loginLink.href = "javascript:void(0)"; // Or link to a profile page
      loginLink.onclick = () => showToast(`Logged in as ${displayName}`);
    }

    // 5. Update the main logo in the top-left, as you requested
    if (mainLogo) {
      mainLogo.innerHTML = `
        <a href="index.html" style="display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit;">
          ${avatarHtml}
          <span style="font-weight: 500;">${displayName}'s PetVerse</span>
        </a>
      `;
    }
    
    // 6. Show the "Logout" button
    if (logoutItem && logoutLink) {
      logoutItem.style.display = "block";
      logoutLink.onclick = logout;
    }
  } else {
    // --- USER IS LOGGED OUT ---

    // 1. Restore the original logo
    if (mainLogo) {
      mainLogo.innerHTML = 'PetVerse 🐾';
    }
    
    // 2. Show the "Login / Signup" link
    if (loginLink) {
      loginLink.innerHTML = "Login / Signup";
      loginLink.style.color = "";
      loginLink.href = "login.html";
      loginLink.onclick = null;
    }
    
    // 3. Hide the "Logout" button
    if (logoutItem) {
      logoutItem.style.display = "none";
    }
  }
}

// --- 3. INITIALIZATION ---

// Listen to auth state changes (e.g., login, logout)
// This runs when the page loads AND when auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  
  // If user logs out, our logout() function clears the profile.
  // If user logs in, the login.html page saves the profile.
  // Either way, we update the navbar to reflect the change.
  updateAuthLinks();
});

// Run once when the page loads
document.addEventListener('DOMContentLoaded', () => {
  injectProfileStyles();
  updateAuthLinks();
});
