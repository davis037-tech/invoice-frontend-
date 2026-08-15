// guest-store.js — localStorage-backed data for people browsing Ledger
// without an account. Mirrors the shape of real API responses so pages
// can use the same rendering code for guest and logged-in data.
//
// Guest data never touches the server. It's local to this browser only,
// and is lost if they clear their browser data. Anything that genuinely
// needs the server — sending an invoice, downloading a PDF, tracking
// real payments, emailing reminders — is blocked with a "sign up" prompt,
// since those can't work without a real account.

const GuestStore = {
  _read(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  },
  _write(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // ===== Clients =====
  getClients() {
    return this._read("guest_clients");
  },
  saveClient(client) {
    const clients = this.getClients();
    if (client.id) {
      const idx = clients.findIndex(c => c.id === client.id);
      if (idx >= 0) clients[idx] = { ...clients[idx], ...client };
    } else {
      client.id = "guest-client-" + Date.now();
      client.created_at = new Date().toISOString();
      clients.push(client);
    }
    this._write("guest_clients", clients);
    return client;
  },
  deleteClient(id) {
    this._write("guest_clients", this.getClients().filter(c => c.id !== id));
  },

  // ===== Invoices =====
  getInvoices() {
    return this._read("guest_invoices");
  },
  getInvoice(id) {
    return this.getInvoices().find(i => i.id === id) || null;
  },
  saveInvoice(inv) {
    const invoices = this.getInvoices();
    if (inv.id) {
      const idx = invoices.findIndex(i => i.id === inv.id);
      if (idx >= 0) {
        const subtotal = (inv.items || invoices[idx].items || []).reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
        const taxRate = inv.tax_rate !== undefined ? Number(inv.tax_rate) : Number(invoices[idx].tax_rate || 0);
        const taxAmount = subtotal * taxRate;
        invoices[idx] = { ...invoices[idx], ...inv, subtotal, tax_amount: taxAmount, total: subtotal + taxAmount };
        this._write("guest_invoices", invoices);
        return invoices[idx];
      }
    }
    const subtotal = (inv.items || []).reduce((sum, i) => sum + Number(i.quantity) * Number(i.unit_price), 0);
    const taxAmount = subtotal * Number(inv.tax_rate || 0);
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + (Number(inv.payment_terms) || 30) * 24 * 60 * 60 * 1000);
    const newInvoice = {
      ...inv,
      id: "guest-inv-" + Date.now(),
      number: "DRAFT-" + String(invoices.length + 1).padStart(3, "0"),
      status: "DRAFT",
      subtotal,
      tax_amount: taxAmount,
      total: subtotal + taxAmount,
      created_at: issueDate.toISOString(),
      issue_date: issueDate.toISOString(),
      due_date: dueDate.toISOString(),
    };
    invoices.push(newInvoice);
    this._write("guest_invoices", invoices);
    return newInvoice;
  },
  deleteInvoice(id) {
    this._write("guest_invoices", this.getInvoices().filter(i => i.id !== id));
  },

  hasAnyData() {
    return this.getClients().length > 0 || this.getInvoices().length > 0;
  },
};

/**
 * Renders the persistent "you're browsing as a guest" banner. Call this
 * on any guest-accessible page after the topbar, when Auth.allowGuest()
 * is true.
 */
function renderGuestBanner(containerId = "guest-banner") {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="card" style="background:#FBF3E3; border-color:#E3C98A; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
      <span style="font-size:13px;">You're browsing as a guest — this data stays in your browser only. Sign up to save it, send invoices, and get paid.</span>
      <a href="register.html" class="btn btn-stamp" style="flex-shrink:0;">Create free account</a>
    </div>
  `;
}
