# Ledger — frontend

Plain HTML/CSS/JS, no build step, no npm install.

## Running it locally

1. Make sure the Ledger backend API is running separately (its own project/zip),
   by default on `http://localhost:5000`.

2. Serve this folder as static files. From inside `frontend/`:
   ```bash
   python3 -m http.server 8080
   ```
   Then open `http://localhost:8080` in your browser.

3. If your backend runs on a different host/port, open `api.js` and change:
   ```js
   const API_BASE = window.API_BASE || "http://localhost:5000/v1";
   ```
   to match.

4. Make sure `FRONTEND_URL` in the backend's `.env` matches whatever origin you're
   serving this frontend from (e.g. `http://localhost:8080`) — this is what allows
   CORS to let the two talk to each other. If you serve the frontend from a
   different port, CORS will block all requests until this matches.

## Pages

| File | Purpose |
|---|---|
| `login.html` / `register.html` | Auth |
| `clients.html` | List, add, edit, delete clients |
| `invoices.html` | List invoices, filter by status |
| `invoice-new.html` | Create an invoice with dynamic line items |
| `invoice-detail.html` | View one invoice, send it, mark it paid once you confirm the bank transfer |
| `public-invoice.html` | The link your client sees — no login needed, shows your bank transfer details |
| `settings.html` | Business info + bank transfer details shown on sent invoices |

## Notes

- Auth tokens are stored in `localStorage`. There's no environment to persist
  them server-side, so logging out clears them and logging back in re-issues new ones.
- All API error messages are pulled from the backend's JSON error responses
  and shown inline above the relevant form.
