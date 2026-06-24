// nav.js — injects the shared topbar into any page that includes a
// <div id="topbar"></div>. Keeps logout + active-link logic in one place.

function renderTopbar(activePage) {
  const el = document.getElementById("topbar");
  if (!el) return;
  const user = Auth.getUser();

  el.innerHTML = `
    <div class="brand">Ledger</div>
    <nav>
      <a href="clients.html" class="${activePage === 'clients' ? 'active' : ''}">Clients</a>
      <a href="invoices.html" class="${activePage === 'invoices' ? 'active' : ''}">Invoices</a>
      <a href="#" id="logout-link">${user ? `${user.email} · Sign out` : 'Sign out'}</a>
    </nav>
  `;

  document.getElementById("logout-link").addEventListener("click", (e) => {
    e.preventDefault();
    Auth.clear();
    window.location.href = "login.html";
  });
}
