// nav.js — injects the shared topbar into any page that includes a
// <div id="topbar"></div>. Keeps logout + active-link logic in one place.

function renderTopbar(activePage) {
  const el = document.getElementById("topbar");
  if (!el) return;
  const user = Auth.getUser();

  el.innerHTML = `
    <div class="brand">Ledger</div>
    <button class="nav-toggle" id="nav-toggle" aria-label="Menu" aria-expanded="false">Menu</button>
    <nav id="topbar-nav">
      <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
      <a href="clients.html" class="${activePage === 'clients' ? 'active' : ''}">Clients</a>
      <a href="invoices.html" class="${activePage === 'invoices' ? 'active' : ''}">Invoices</a>
      <a href="payments.html" class="${activePage === 'payments' ? 'active' : ''}">Payments</a>
      <a href="settings.html" class="${activePage === 'settings' ? 'active' : ''}">Settings</a>
      ${user && user.is_superadmin ? `<a href="admin.html" class="${activePage === 'admin' ? 'active' : ''}">Admin</a>` : ""}
      <a href="#" id="logout-link">${user ? `${user.email} · Sign out` : 'Sign out'}</a>
    </nav>
  `;

  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    Auth.clear();
    window.location.href = "login.html";
  });

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
