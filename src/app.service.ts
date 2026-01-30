import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getIndexHtml(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bookdarr Media Server</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f1115;
        --bg-soft: #161a23;
        --panel: #1b2130;
        --panel-strong: #242c3f;
        --text: #f6f4ef;
        --muted: #9aa4b2;
        --accent: #f5b942;
        --accent-soft: rgba(245, 185, 66, 0.18);
        --success: #4ade80;
        --warning: #fbbf24;
        --danger: #f87171;
        --shadow: 0 18px 40px rgba(5, 8, 20, 0.4);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        font-family: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
        background: radial-gradient(circle at top left, #222838 0%, #0f1115 55%) fixed;
        color: var(--text);
      }

      body::before {
        content: "";
        position: fixed;
        inset: 0;
        background:
          radial-gradient(circle at 80% 10%, rgba(245, 185, 66, 0.18), transparent 45%),
          radial-gradient(circle at 10% 80%, rgba(90, 138, 255, 0.15), transparent 50%);
        pointer-events: none;
        z-index: 0;
      }

      .app-shell {
        display: grid;
        grid-template-columns: 240px 1fr;
        min-height: 100vh;
        position: relative;
        z-index: 1;
      }

      .sidebar {
        background: rgba(12, 14, 20, 0.92);
        border-right: 1px solid rgba(255, 255, 255, 0.05);
        padding: 32px 24px;
      }

      .brand {
        font-weight: 600;
        font-size: 1.3rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 32px;
      }

      .nav-section {
        margin-bottom: 24px;
      }

      .nav-title {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.22em;
        color: var(--muted);
        margin-bottom: 12px;
      }

      .nav-link {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 12px;
        border-radius: 12px;
        color: var(--text);
        text-decoration: none;
        background: transparent;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .nav-link.active {
        background: var(--accent-soft);
        color: var(--accent);
      }

      .main {
        padding: 28px 36px 48px;
      }

      .topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
      }

      .search {
        display: flex;
        align-items: center;
        gap: 12px;
        background: var(--panel);
        padding: 10px 16px;
        border-radius: 999px;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        flex: 1;
        max-width: 420px;
      }

      .search input {
        background: transparent;
        border: none;
        color: var(--text);
        font-size: 0.95rem;
        outline: none;
        width: 100%;
      }

      .pill {
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.78rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: rgba(255, 255, 255, 0.08);
        color: var(--muted);
      }

      .hero {
        background: var(--panel-strong);
        border-radius: 22px;
        padding: 24px 28px;
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 24px;
        box-shadow: var(--shadow);
        margin-bottom: 24px;
      }

      .hero h1 {
        margin: 0 0 8px;
        font-size: 2rem;
      }

      .hero p {
        margin: 0 0 16px;
        color: var(--muted);
        line-height: 1.5;
      }

      .hero-meta {
        display: grid;
        gap: 10px;
      }

      .hero-stat {
        background: rgba(255, 255, 255, 0.04);
        padding: 12px 14px;
        border-radius: 14px;
      }

      .hero-stat span {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--muted);
        margin-bottom: 6px;
      }

      .hero-stat strong {
        font-size: 1.1rem;
      }

      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 24px 0 12px;
      }

      .section-title h2 {
        margin: 0;
        font-size: 1.2rem;
      }

      .filters {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .filter-btn {
        background: transparent;
        color: var(--muted);
        border: 1px solid rgba(255, 255, 255, 0.08);
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.78rem;
        cursor: pointer;
      }

      .filter-btn.active {
        background: var(--accent-soft);
        border-color: transparent;
        color: var(--accent);
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
        gap: 18px;
      }

      .book-card {
        background: var(--panel);
        border-radius: 16px;
        padding: 12px;
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-height: 270px;
      }

      .cover {
        border-radius: 12px;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(245, 185, 66, 0.2), rgba(90, 138, 255, 0.3));
        height: 180px;
        position: relative;
      }

      .cover img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cover-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 12px;
        color: #fff;
        font-weight: 600;
      }

      .book-title {
        font-weight: 600;
        font-size: 0.95rem;
      }

      .book-author {
        color: var(--muted);
        font-size: 0.85rem;
      }

      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .badge {
        font-size: 0.7rem;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--muted);
      }

      .badge.ok {
        color: #0f172a;
        background: var(--success);
      }

      .badge.warn {
        color: #1f2937;
        background: var(--warning);
      }

      .badge.dim {
        color: #0f172a;
        background: #cbd5f5;
      }

      .panel {
        background: var(--panel);
        border-radius: 18px;
        padding: 18px 20px;
        box-shadow: var(--shadow);
      }

      .status-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .status-item span {
        display: block;
        color: var(--muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        margin-bottom: 6px;
      }

      .status-value {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: var(--muted);
      }

      .dot.ok {
        background: var(--success);
      }

      .dot.warn {
        background: var(--warning);
      }

      .setup-panel {
        background: rgba(15, 18, 25, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 24px;
        margin-top: 24px;
        display: none;
      }

      .setup-panel input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: #0f1115;
        color: var(--text);
      }

      .setup-panel button {
        margin-top: 12px;
        padding: 10px 16px;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #161a23;
        font-weight: 600;
        cursor: pointer;
      }

      .empty {
        padding: 32px;
        border-radius: 16px;
        border: 1px dashed rgba(255, 255, 255, 0.1);
        color: var(--muted);
        text-align: center;
      }

      @media (max-width: 980px) {
        .app-shell {
          grid-template-columns: 1fr;
        }
        .sidebar {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 20px;
          z-index: 2;
        }
        .nav-section {
          display: none;
        }
        .hero {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">BMS</div>
        <div class="nav-section">
          <div class="nav-title">Library</div>
          <div class="nav-link active">Book Pool</div>
          <div class="nav-link">Downloads</div>
          <div class="nav-link">Diagnostics</div>
        </div>
        <div class="nav-section">
          <div class="nav-title">System</div>
          <div class="nav-link">Settings</div>
          <div class="nav-link">Accounts</div>
        </div>
      </aside>
      <div class="main">
        <div class="topbar">
          <div class="search">
            <span>🔍</span>
            <input id="search" type="search" placeholder="Search your Book Pool" />
          </div>
          <span class="pill">Bookdarr Media Server</span>
        </div>

        <section class="hero">
          <div>
            <h1>Book Pool Library</h1>
            <p>
              A Plex-inspired bookshelf that mirrors your Bookdarr Book Pool. Books are enriched
              with Open Library metadata and organized for quick access across devices.
            </p>
            <div class="filters" id="filters">
              <button class="filter-btn active" data-filter="all">All Books</button>
              <button class="filter-btn" data-filter="ebook">Ebooks</button>
              <button class="filter-btn" data-filter="audiobook">Audiobooks</button>
              <button class="filter-btn" data-filter="needs">Needs Files</button>
            </div>
          </div>
          <div class="hero-meta">
            <div class="hero-stat">
              <span>Total Titles</span>
              <strong id="stat-total">--</strong>
            </div>
            <div class="hero-stat">
              <span>With Ebooks</span>
              <strong id="stat-ebooks">--</strong>
            </div>
            <div class="hero-stat">
              <span>With Audiobooks</span>
              <strong id="stat-audio">--</strong>
            </div>
          </div>
        </section>

        <section id="setup-panel" class="setup-panel">
          <h2>First-Run Setup</h2>
          <p>Create the first admin account to unlock the library.</p>
          <div class="status-grid">
            <div>
              <span class="nav-title">Username (email)</span>
              <input id="setup-username" type="email" placeholder="admin@example.com" />
            </div>
            <div>
              <span class="nav-title">Password</span>
              <input id="setup-password" type="password" placeholder="password" />
            </div>
          </div>
          <button id="setup-submit">Create Admin User</button>
          <div id="setup-status" style="margin-top: 10px; color: var(--muted);"></div>
        </section>

        <section class="section-title">
          <h2>Library</h2>
          <span class="pill">Open Library matched</span>
        </section>
        <div id="library-grid" class="grid">
          <div class="empty">Loading Book Pool…</div>
        </div>

        <section class="section-title">
          <h2>System Status</h2>
          <span class="pill">Config</span>
        </section>
        <div class="panel">
          <div id="settings" class="status-grid">Loading settings…</div>
        </div>
      </div>
    </div>

    <script>
      const state = {
        filter: 'all',
        query: '',
        library: []
      };

      const libraryGrid = document.getElementById('library-grid');
      const filterButtons = document.querySelectorAll('.filter-btn');
      const searchInput = document.getElementById('search');
      const setupPanel = document.getElementById('setup-panel');
      const setupStatus = document.getElementById('setup-status');
      const setupButton = document.getElementById('setup-submit');

      filterButtons.forEach((button) => {
        button.addEventListener('click', () => {
          filterButtons.forEach((btn) => btn.classList.remove('active'));
          button.classList.add('active');
          state.filter = button.dataset.filter;
          renderLibrary();
        });
      });

      searchInput.addEventListener('input', (event) => {
        state.query = event.target.value.toLowerCase();
        renderLibrary();
      });

      function renderLibrary() {
        const filtered = state.library.filter((item) => {
          if (state.filter === 'ebook' && !item.hasEbook) return false;
          if (state.filter === 'audiobook' && !item.hasAudiobook) return false;
          if (state.filter === 'needs' && (item.hasEbook || item.hasAudiobook)) return false;

          if (state.query) {
            const haystack = [item.title, item.author].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(state.query);
          }
          return true;
        });

        if (!filtered.length) {
          libraryGrid.innerHTML = '<div class="empty">No books match this view.</div>';
          return;
        }

        libraryGrid.innerHTML = filtered.map((item) => {
          const cover = item.coverUrl
            ? '<img src="' + item.coverUrl + '" alt="' + item.title + ' cover" loading="lazy" />'
            : '<div class="cover-fallback">' + item.title + '</div>';

          const ebookBadge = item.hasEbook ? '<span class="badge ok">Ebook</span>' : '<span class="badge dim">No Ebook</span>';
          const audioBadge = item.hasAudiobook ? '<span class="badge ok">Audiobook</span>' : '<span class="badge dim">No Audio</span>';
          const statusBadge = item.bookdarrStatus && item.bookdarrStatus !== 'Available'
            ? '<span class="badge warn">' + item.bookdarrStatus + '</span>'
            : '<span class="badge">Ready</span>';

          return (
            '<article class="book-card">' +
              '<div class="cover">' + cover + '</div>' +
              '<div class="book-title">' + item.title + '</div>' +
              '<div class="book-author">' + (item.author ?? 'Unknown author') + '</div>' +
              '<div class="badges">' + ebookBadge + audioBadge + statusBadge + '</div>' +
            '</article>'
          );
        }).join('');
      }

      function updateStats() {
        const total = state.library.length;
        const ebooks = state.library.filter((item) => item.hasEbook).length;
        const audio = state.library.filter((item) => item.hasAudiobook).length;
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-ebooks').textContent = ebooks;
        document.getElementById('stat-audio').textContent = audio;
      }

      fetch('/auth/setup')
        .then((response) => response.json())
        .then((data) => {
          if (data.required) {
            setupPanel.style.display = 'block';
          }
        })
        .catch(() => {});

      setupButton?.addEventListener('click', () => {
        const username = document.getElementById('setup-username').value;
        const password = document.getElementById('setup-password').value;
        setupStatus.textContent = 'Creating user...';
        fetch('/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Setup failed.';
              setupStatus.textContent = message;
              return;
            }
            setupStatus.textContent = 'Setup complete. Refresh to continue.';
          })
          .catch(() => {
            setupStatus.textContent = 'Setup failed.';
          });
      });

      fetch('/library')
        .then((response) => response.json())
        .then((data) => {
          state.library = Array.isArray(data) ? data : [];
          updateStats();
          renderLibrary();
        })
        .catch(() => {
          libraryGrid.innerHTML = '<div class="empty">Unable to load Book Pool.</div>';
        });

      fetch('/settings')
        .then((response) => response.json())
        .then((data) => {
          const items = [
            ['Bookdarr', data.bookdarr?.configured ? 'Connected' : 'Missing', data.bookdarr?.configured],
            ['Book Pool Path', data.bookdarr?.poolPath ?? 'Not set'],
            ['Database', data.database?.configured ? 'Configured (' + data.database?.type + ')' : 'Missing', data.database?.configured],
            ['SMTP', data.smtp?.configured ? 'Configured' : 'Missing', data.smtp?.configured],
            ['Diagnostics', data.diagnostics?.required ? 'Required' : 'Optional', data.diagnostics?.required],
            ['Diagnostics Repo', data.diagnostics?.repo ?? 'Not set', data.diagnostics?.configured],
            ['Auth Secrets', data.auth?.configured ? 'Configured' : 'Missing', data.auth?.configured],
            ['Invite Codes', data.auth?.inviteCodesConfigured ? 'Configured' : 'Missing', data.auth?.inviteCodesConfigured],
            ['Open Library', data.openLibrary?.baseUrl ?? 'Not set'],
          ];

          const settingsEl = document.getElementById('settings');
          settingsEl.innerHTML = items
            .map((item) => {
              const label = item[0];
              const value = item[1];
              const ok = item[2];
              const statusClass = ok === undefined ? '' : ok ? 'ok' : 'warn';
              return (
                '<div class="status-item">' +
                  '<span>' + label + '</span>' +
                  '<div class="status-value">' +
                    '<div class="dot ' + statusClass + '"></div>' +
                    '<strong>' + value + '</strong>' +
                  '</div>' +
                '</div>'
              );
            })
            .join('');
        })
        .catch(() => {
          document.getElementById('settings').textContent = 'Unable to load settings.';
        });
    </script>
  </body>
</html>`;
  }
}
