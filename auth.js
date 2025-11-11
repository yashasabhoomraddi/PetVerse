// auth.js — Supabase-based auth helpers (replace existing file)
// Assumes supabase client already loaded (window.supabase)

async function signupWithEmail(email, password, options = {}) {
  // options can include user_metadata, redirectTo, etc.
  const { data, error } = await supabase.auth.signUp(
    { email, password },
    options
  );
  if (error) throw error;
  return data;
}

async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signInWithProvider(provider) {
  // provider: 'google' | 'github' | 'facebook' (if enabled in Supabase)
  // This will redirect to provider's consent screen (config in Supabase dashboard)
  const { data, error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) throw error;
  return data;
}

async function logout() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    showToast(`Goodbye! You have been logged out.`, 'success');
    updateAuthLinks(); // update UI immediately
    // fallback redirect
    setTimeout(() => { window.location.href = 'index.html'; }, 1200);
  } catch (err) {
    console.error('Logout error', err);
    showToast('Logout failed', 'error');
  }
}

function getCurrentUser() {
  return supabase.auth.getUser().then(res => res.data.user).catch(()=>null);
}

function isLoggedIn() {
  // synchronous convenience: checks local session stored by supabase-js
  return !!supabase.auth.getSession().then(r => r.data.session).catch(()=>null);
}

// Update header/login links (keeps previous UI logic)
async function updateAuthLinks() {
  // Attempt to get user (async)
  let user = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data.user;
  } catch (e) {
    user = null;
  }

  const loginLink = document.getElementById("loginLink");
  const logoutItem = document.getElementById("logoutItem");
  const logoutLink = document.getElementById("logoutLink");

  if (user && loginLink) {
    const display = user.email || user.user_metadata?.name || user.id;
    loginLink.innerHTML = `Welcome, ${display} 👋`;
    loginLink.style.color = "var(--accent)";
    loginLink.href = "javascript:void(0)";
    loginLink.onclick = () => showToast(`Already logged in as ${display}`);
    if (logoutItem && logoutLink) {
      logoutItem.style.display = "block";
      logoutLink.onclick = logout;
    }
  } else if (loginLink) {
    loginLink.innerHTML = "Login / Signup";
    loginLink.style.color = "";
    loginLink.href = "login.html";
    loginLink.onclick = null;
    if (logoutItem) logoutItem.style.display = "none";
  }
}

// Require login helper for actions
async function requireLogin(actionName = "this action") {
  const userRes = await supabase.auth.getUser();
  const user = userRes?.data?.user ?? null;
  if (!user) {
    showToast(`Please login to ${actionName}`, 'error');
    // optional: redirect to login after short delay
    setTimeout(() => { window.location.href = 'login.html'; }, 800);
    return false;
  }
  return true;
}

// Show toast utility (keeps existing style)
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

// Listen to auth state changes so UI updates automatically
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event', event);
  updateAuthLinks();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateAuthLinks();
});
