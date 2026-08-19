// nav.js — injects the shared topbar into any page that includes a
// <div id="topbar"></div>. Keeps logout + active-link logic in one place.

function renderTopbar(activePage) {
  const el = document.getElementById("topbar");
  if (!el) return;
  const user = Auth.getUser();
  const isGuestNav = typeof Auth.allowGuest === "function" && Auth.allowGuest();

  el.innerHTML = `
    <div class="brand">Ledger</div>
    <button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false">Menu</button>
    <nav id="topbar-nav">
      <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
      <a href="clients.html" class="${activePage === 'clients' ? 'active' : ''}">Clients</a>
      <a href="invoices.html" class="${activePage === 'invoices' ? 'active' : ''}">Invoices</a>
      ${!isGuestNav ? `<a href="payments.html" class="${activePage === 'payments' ? 'active' : ''}">Payments</a>` : ""}
      ${!isGuestNav ? `<a href="settings.html" class="${activePage === 'settings' ? 'active' : ''}">Settings</a>` : ""}
      ${!isGuestNav ? `<a href="upgrade.html" class="${activePage === 'upgrade' ? 'active' : ''}">Upgrade</a>` : ""}
      ${user && user.is_superadmin ? `<a href="admin.html" class="${activePage === 'admin' ? 'active' : ''}">Admin</a>` : ""}
      ${isGuestNav
        ? `<a href="register.html" id="logout-link">Sign up to save →</a>`
        : `<a href="#" id="logout-link">${user ? `${user.email} · Sign out` : 'Sign out'}</a>`}
    </nav>
  `;

  const logoutLink = document.getElementById("logout-link");
  if (!isGuestNav) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      Auth.clear();
      window.location.href = "login.html";
    });
  }

  const toggle = document.getElementById("nav-toggle");
  const navEl = document.getElementById("topbar-nav");
  toggle.addEventListener("click", () => {
    const isOpen = navEl.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  document.addEventListener("click", (e) => {
    if (!el.contains(e.target)) {
      navEl.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}
