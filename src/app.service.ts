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
        color-scheme: light;
      }
      body {
        margin: 0;
        font-family: "Avenir Next", "Avenir", "Helvetica Neue", Arial, sans-serif;
        background: linear-gradient(135deg, #f6f2e8 0%, #f1f7ff 100%);
        color: #1f2a37;
      }
      main {
        max-width: 880px;
        margin: 64px auto;
        padding: 32px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 24px;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
      }
      h1 {
        margin: 0 0 8px;
        font-size: 2.4rem;
        letter-spacing: -0.02em;
      }
      p {
        margin: 0 0 24px;
        line-height: 1.6;
      }
      .card {
        padding: 20px 24px;
        border-radius: 16px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-top: 16px;
      }
      .label {
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #64748b;
        margin-bottom: 6px;
      }
      .value {
        font-weight: 600;
        font-size: 1rem;
      }
      .status {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: #94a3b8;
      }
      .dot.ok {
        background: #16a34a;
      }
      .dot.warn {
        background: #f59e0b;
      }
      ul {
        padding-left: 18px;
        margin: 8px 0 0;
      }
      code {
        background: #0f172a;
        color: #e2e8f0;
        padding: 2px 6px;
        border-radius: 6px;
        font-size: 0.85rem;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Bookdarr Media Server</h1>
      <p>
        Admin UI placeholder. Settings are loaded from environment variables and
        surfaced here without secrets. This will become the full web admin UI.
      </p>

      <section id="setup-card" class="card" style="display: none">
        <div class="label">First-Run Setup</div>
        <p>Create the first admin user to finish setup.</p>
        <div class="grid">
          <div>
            <div class="label">Username (email)</div>
            <input id="setup-username" type="email" placeholder="admin@example.com" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #cbd5f5" />
          </div>
          <div>
            <div class="label">Password</div>
            <input id="setup-password" type="password" placeholder="password" style="width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #cbd5f5" />
          </div>
        </div>
        <button id="setup-submit" style="margin-top: 16px; padding: 10px 16px; border-radius: 999px; border: none; background: #1f2937; color: #fff; cursor: pointer;">
          Create Admin User
        </button>
        <div id="setup-status" style="margin-top: 12px; color: #334155;"></div>
      </section>

      <section id="settings-card" class="card">
        <div class="label">Current Settings</div>
        <div id="settings" class="grid">Loading settings…</div>
      </section>

      <section class="card" style="margin-top: 20px">
        <div class="label">Expected Environment</div>
        <ul>
          <li><code>BOOKDARR_API_URL</code> and <code>BOOKDARR_API_KEY</code></li>
          <li><code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>SMTP_FROM</code></li>
          <li><code>DIAGNOSTICS_REQUIRED</code> (default true)</li>
        </ul>
      </section>
    </main>

    <script>
      const settingsEl = document.getElementById('settings');
      const settingsCard = document.getElementById('settings-card');
      const setupCard = document.getElementById('setup-card');
      const setupStatus = document.getElementById('setup-status');
      const setupButton = document.getElementById('setup-submit');

      fetch('/auth/setup')
        .then((response) => response.json())
        .then((data) => {
          if (data.required) {
            setupCard.style.display = 'block';
            settingsCard.style.display = 'none';
          }
        })
        .catch(() => {
          // keep setup hidden on error
        });

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
            setupStatus.textContent = 'Setup complete. You can now log in.';
            settingsCard.style.display = 'block';
            setupCard.style.display = 'none';
          })
          .catch(() => {
            setupStatus.textContent = 'Setup failed.';
          });
      });

      fetch('/settings')
        .then((response) => response.json())
        .then((data) => {
          const items = [
            ['Port', data.port],
            ['Bookdarr API', data.bookdarr?.configured ? 'Configured' : 'Missing', data.bookdarr?.configured],
            ['Database', data.database?.configured ? 'Configured (' + data.database?.type + ')' : 'Missing', data.database?.configured],
            ['SMTP', data.smtp?.configured ? 'Configured' : 'Missing', data.smtp?.configured],
            ['Diagnostics Required', data.diagnostics?.required ? 'Yes' : 'No', data.diagnostics?.required],
            ['Diagnostics Repo', data.diagnostics?.repo ?? 'Not set', data.diagnostics?.configured],
            ['Auth Secrets', data.auth?.configured ? 'Configured' : 'Missing', data.auth?.configured],
            ['Invite Codes', data.auth?.inviteCodesConfigured ? 'Configured' : 'Missing', data.auth?.inviteCodesConfigured],
          ];

          settingsEl.innerHTML = items
            .map(([label, value, ok]) => {
              const statusClass = ok === undefined ? '' : ok ? 'ok' : 'warn';
              return \`
                <div>
                  <div class="label">\${label}</div>
                  <div class="status">
                    <span class="dot \${statusClass}"></span>
                    <span class="value">\${value}</span>
                  </div>
                </div>
              \`;
            })
            .join('');
        })
        .catch(() => {
          settingsEl.textContent = 'Unable to load settings.';
        });
    </script>
  </body>
</html>`;
  }
}
