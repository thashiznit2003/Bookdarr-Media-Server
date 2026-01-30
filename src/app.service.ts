import { Injectable } from '@nestjs/common';

const { version: appVersion } = require('../package.json');

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

      .brand-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
      }

      .brand {
        font-weight: 600;
        font-size: 1.3rem;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--accent);
      }

      .version-tag {
        font-size: 0.65rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        padding: 4px 8px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
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

      .topbar-right {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-menu {
        position: relative;
      }

      .user-button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text);
        cursor: pointer;
      }

      .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--accent);
        color: #161a23;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .user-dropdown {
        position: absolute;
        right: 0;
        top: calc(100% + 8px);
        background: var(--panel);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 8px;
        min-width: 180px;
        box-shadow: var(--shadow);
        display: none;
        z-index: 10;
      }

      .user-dropdown button {
        width: 100%;
        padding: 8px 10px;
        border-radius: 10px;
        border: none;
        background: transparent;
        color: var(--text);
        cursor: pointer;
        text-align: left;
      }

      .user-dropdown button:hover {
        background: rgba(255, 255, 255, 0.06);
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

      .setup-panel label {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.85rem;
        color: var(--muted);
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

      .wizard {
        display: grid;
        gap: 20px;
        margin: 24px 0 36px;
      }

      .wizard-header h2 {
        margin: 0 0 6px;
      }

      .wizard-header p {
        margin: 0;
        color: var(--muted);
      }

      .page {
        display: none;
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
        <div class="brand-row">
          <div class="brand">BMS</div>
          <div class="version-tag">v${appVersion}</div>
        </div>
        <div class="nav-section">
          <div class="nav-title">Library</div>
          <a class="nav-link" href="/" data-page-link="library">Book Pool</a>
          <a class="nav-link" href="/downloads" data-page-link="downloads">Downloads</a>
          <a class="nav-link" href="/diagnostics" data-page-link="diagnostics">Diagnostics</a>
        </div>
        <div class="nav-section">
          <div class="nav-title">System</div>
          <a class="nav-link" href="/settings" data-page-link="settings">Settings</a>
          <a class="nav-link" href="/accounts" data-page-link="accounts">Accounts</a>
        </div>
      </aside>
      <div class="main">
        <div class="topbar">
          <div class="search" id="search-wrap">
            <span>🔍</span>
            <input id="search" type="search" placeholder="Search your Book Pool" />
          </div>
          <div class="topbar-right">
            <span class="pill">Bookdarr Media Server</span>
            <div class="user-menu" id="user-menu">
              <button class="user-button" id="user-button">
                <div class="user-avatar" id="user-avatar">?</div>
                <span id="user-label">Signed out</span>
              </button>
              <div class="user-dropdown" id="user-dropdown">
                <button id="profile-button">Edit Profile</button>
                <button id="logout-button">Log out</button>
              </div>
            </div>
          </div>
        </div>

        <div class="page" data-page="library">
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

          <section id="wizard" class="wizard">
            <div class="wizard-header">
              <h2>First-Run Setup</h2>
              <p>Create your admin account, sign in, and connect Bookdarr.</p>
            </div>

            <div id="setup-panel" class="setup-panel">
              <h3>Step 1: Create the first admin account</h3>
              <div class="status-grid">
                <div>
                  <span class="nav-title">Username</span>
                  <input id="setup-username" type="text" placeholder="admin" />
                </div>
                <div>
                  <span class="nav-title">Email (for password resets)</span>
                  <input id="setup-email" type="email" placeholder="admin@example.com" />
                </div>
                <div>
                  <span class="nav-title">Password</span>
                  <input id="setup-password" type="password" placeholder="password" />
                </div>
                <div>
                  <span class="nav-title">Auth Access Secret</span>
                  <input id="auth-access-secret" type="password" placeholder="Paste or generate" />
                </div>
                <div>
                  <span class="nav-title">Auth Refresh Secret</span>
                  <input id="auth-refresh-secret" type="password" placeholder="Paste or generate" />
                </div>
              </div>
              <button id="setup-submit">Create Admin User</button>
              <div id="setup-status" style="margin-top: 10px; color: var(--muted);"></div>
            </div>

            <div id="login-panel" class="setup-panel">
              <h3>Step 2: Log in</h3>
              <p>Sign in to connect your Bookdarr instance.</p>
              <div class="status-grid">
                <div>
                  <span class="nav-title">Username</span>
                  <input id="login-username" type="text" placeholder="admin" />
                </div>
                <div>
                  <span class="nav-title">Password</span>
                  <input id="login-password" type="password" placeholder="password" />
                </div>
              </div>
              <button id="login-submit">Log in</button>
              <div id="login-status" style="margin-top: 10px; color: var(--muted);"></div>
            </div>

            <div id="bookdarr-panel" class="setup-panel">
              <h3>Step 3: Connect Bookdarr</h3>
              <p>Provide the IP address, port, and API key for your Bookdarr instance.</p>
              <div class="status-grid">
                <div>
                  <span class="nav-title">IP address / Host</span>
                  <input id="bookdarr-host" type="text" placeholder="192.168.0.103" />
                </div>
                <div>
                  <span class="nav-title">Port</span>
                  <input id="bookdarr-port" type="number" placeholder="8787" />
                </div>
                <div>
                  <span class="nav-title">API Key</span>
                  <input id="bookdarr-key" type="password" placeholder="Bookdarr API key" />
                </div>
                <div>
                  <span class="nav-title">Book Pool Path</span>
                  <input id="bookdarr-path" type="text" placeholder="/api/v1/user/library/pool" />
                </div>
                <div>
                  <span class="nav-title">Protocol</span>
                  <label>
                    <input id="bookdarr-https" type="checkbox" /> Use HTTPS
                  </label>
                </div>
              </div>
              <button id="bookdarr-submit">Save Connection</button>
              <div id="bookdarr-status" style="margin-top: 10px; color: var(--muted);"></div>
            </div>
          </section>

          <section class="section-title">
            <h2>Library</h2>
          </section>
          <div id="library-grid" class="grid">
            <div class="empty">Loading Book Pool…</div>
          </div>
        </div>

        <div class="page" data-page="downloads">
          <section class="section-title">
            <h2>Downloads</h2>
            <span class="pill">Coming soon</span>
          </section>
          <div class="panel">
            <p style="margin: 0; color: var(--muted);">
              Download management will appear here once Bookdarr sync is enabled.
            </p>
          </div>
        </div>

        <div class="page" data-page="diagnostics">
          <section class="section-title">
            <h2>Diagnostics</h2>
          </section>
          <div class="panel">
            <p style="margin: 0; color: var(--muted);">
              Diagnostics uploads are mandatory during development. Status and logs will surface here.
            </p>
          </div>
        </div>

        <div class="page" data-page="settings">
          <section class="section-title">
            <h2>System Status</h2>
            <span class="pill">Config</span>
          </section>
          <div class="panel">
            <div id="settings" class="status-grid">Loading settings…</div>
          </div>

          <section class="section-title" style="margin-top: 28px;">
            <h2>Bookdarr Connection</h2>
            <span class="pill">Library</span>
          </section>
          <div class="panel">
            <div class="status-grid">
              <div>
                <span class="nav-title">IP address / Host</span>
                <input id="settings-bookdarr-host" type="text" placeholder="192.168.0.103" />
              </div>
              <div>
                <span class="nav-title">Port</span>
                <input id="settings-bookdarr-port" type="number" placeholder="8787" />
              </div>
              <div>
                <span class="nav-title">API Key</span>
                <input id="settings-bookdarr-key" type="password" placeholder="Bookdarr API key" />
              </div>
              <div>
                <span class="nav-title">Book Pool Path</span>
                <input id="settings-bookdarr-path" type="text" placeholder="/api/v1/user/library/pool" />
              </div>
              <div>
                <span class="nav-title">Protocol</span>
                <label>
                  <input id="settings-bookdarr-https" type="checkbox" /> Use HTTPS
                </label>
              </div>
            </div>
            <button id="save-bookdarr" style="margin-top: 12px;">Save Bookdarr Settings</button>
            <div id="settings-bookdarr-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>

          <section class="section-title" style="margin-top: 28px;">
            <h2>Auth Secrets</h2>
            <span class="pill">JWT</span>
          </section>
          <div class="panel">
            <div class="status-grid">
              <div>
                <span class="nav-title">Access Secret</span>
                <input id="settings-access-secret" type="password" placeholder="Set access secret" />
              </div>
              <div>
                <span class="nav-title">Refresh Secret</span>
                <input id="settings-refresh-secret" type="password" placeholder="Set refresh secret" />
              </div>
            </div>
            <button id="save-auth-secrets" style="margin-top: 12px;">Save Auth Secrets</button>
            <div id="auth-secret-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>
        </div>

        <div class="page" data-page="accounts">
          <section class="section-title">
            <h2>Accounts</h2>
            <span class="pill">Admin</span>
          </section>
          <div class="panel">
            <div id="accounts-status" style="color: var(--muted); margin-bottom: 12px;">
              Log in as an admin to manage users.
            </div>
            <div id="accounts-list" class="status-grid"></div>
          </div>
          <div class="panel" style="margin-top: 20px;">
            <h3 style="margin-top: 0;">Create User</h3>
            <div class="status-grid">
              <div>
                <span class="nav-title">Username</span>
                <input id="new-user-username" type="text" placeholder="reader1" />
              </div>
              <div>
                <span class="nav-title">Email</span>
                <input id="new-user-email" type="email" placeholder="reader@example.com" />
              </div>
              <div>
                <span class="nav-title">Password</span>
                <input id="new-user-password" type="password" placeholder="password" />
              </div>
              <div>
                <span class="nav-title">Admin</span>
                <label>
                  <input id="new-user-admin" type="checkbox" /> Grant admin access
                </label>
              </div>
            </div>
            <button id="create-user" style="margin-top: 12px;">Create User</button>
            <div id="create-user-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>
          <div class="panel" style="margin-top: 20px;">
            <h3 style="margin-top: 0;">My Profile</h3>
            <div class="status-grid">
              <div>
                <span class="nav-title">Username</span>
                <input id="profile-username" type="text" placeholder="username" />
              </div>
              <div>
                <span class="nav-title">Email</span>
                <input id="profile-email" type="email" placeholder="you@example.com" />
              </div>
              <div>
                <span class="nav-title">Current Password</span>
                <input id="profile-current-password" type="password" placeholder="current password" />
              </div>
              <div>
                <span class="nav-title">New Password</span>
                <input id="profile-new-password" type="password" placeholder="new password" />
              </div>
            </div>
            <button id="save-profile" style="margin-top: 12px;">Save Profile</button>
            <div id="profile-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>
        </div>

        <div class="page" data-page="login">
          <section class="section-title">
            <h2>Sign in</h2>
            <span class="pill">BMS</span>
          </section>
          <div class="panel">
            <div class="status-grid">
              <div>
                <span class="nav-title">Username or Email</span>
                <input id="login-page-username" type="text" placeholder="admin" />
              </div>
              <div>
                <span class="nav-title">Password</span>
                <input id="login-page-password" type="password" placeholder="password" />
              </div>
            </div>
            <button id="login-page-submit" style="margin-top: 12px;">Log in</button>
            <div id="login-page-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>
        </div>
      </div>
    </div>

    <script>
      const state = {
        filter: 'all',
        query: '',
        library: [],
        token: null
      };

      const libraryGrid = document.getElementById('library-grid');
      const filterButtons = document.querySelectorAll('.filter-btn');
      const searchInput = document.getElementById('search');
      const searchWrap = document.getElementById('search-wrap');
      const wizardPanel = document.getElementById('wizard');
      const setupPanel = document.getElementById('setup-panel');
      const setupEmail = document.getElementById('setup-email');
      const setupStatus = document.getElementById('setup-status');
      const setupButton = document.getElementById('setup-submit');
      const authAccessInput = document.getElementById('auth-access-secret');
      const authRefreshInput = document.getElementById('auth-refresh-secret');
      const loginPanel = document.getElementById('login-panel');
      const loginStatus = document.getElementById('login-status');
      const loginButton = document.getElementById('login-submit');
      const loginUsername = document.getElementById('login-username');
      const bookdarrPanel = document.getElementById('bookdarr-panel');
      const bookdarrStatus = document.getElementById('bookdarr-status');
      const bookdarrButton = document.getElementById('bookdarr-submit');
      const pageSections = document.querySelectorAll('[data-page]');
      const navLinks = document.querySelectorAll('[data-page-link]');
      const activePage = window.location.pathname.replace('/', '') || 'library';
      const isLibraryPage = activePage === 'library';
      const isLoginPage = activePage === 'login';

      const bookdarrHost = document.getElementById('bookdarr-host');
      const bookdarrPort = document.getElementById('bookdarr-port');
      const bookdarrKey = document.getElementById('bookdarr-key');
      const bookdarrPath = document.getElementById('bookdarr-path');
      const bookdarrHttps = document.getElementById('bookdarr-https');
      const settingsAccess = document.getElementById('settings-access-secret');
      const settingsRefresh = document.getElementById('settings-refresh-secret');
      const saveAuthButton = document.getElementById('save-auth-secrets');
      const authSecretStatus = document.getElementById('auth-secret-status');
      const settingsBookdarrHost = document.getElementById('settings-bookdarr-host');
      const settingsBookdarrPort = document.getElementById('settings-bookdarr-port');
      const settingsBookdarrKey = document.getElementById('settings-bookdarr-key');
      const settingsBookdarrPath = document.getElementById('settings-bookdarr-path');
      const settingsBookdarrHttps = document.getElementById('settings-bookdarr-https');
      const saveBookdarrButton = document.getElementById('save-bookdarr');
      const settingsBookdarrStatus = document.getElementById('settings-bookdarr-status');
      const accountsList = document.getElementById('accounts-list');
      const accountsStatus = document.getElementById('accounts-status');
      const createUserButton = document.getElementById('create-user');
      const createUserStatus = document.getElementById('create-user-status');
      const newUserUsername = document.getElementById('new-user-username');
      const newUserEmail = document.getElementById('new-user-email');
      const newUserPassword = document.getElementById('new-user-password');
      const newUserAdmin = document.getElementById('new-user-admin');
      const profileUsername = document.getElementById('profile-username');
      const profileEmail = document.getElementById('profile-email');
      const profileCurrentPassword = document.getElementById('profile-current-password');
      const profileNewPassword = document.getElementById('profile-new-password');
      const saveProfileButton = document.getElementById('save-profile');
      const profileStatus = document.getElementById('profile-status');
      const loginPageUsername = document.getElementById('login-page-username');
      const loginPagePassword = document.getElementById('login-page-password');
      const loginPageSubmit = document.getElementById('login-page-submit');
      const loginPageStatus = document.getElementById('login-page-status');
      const userMenu = document.getElementById('user-menu');
      const userButton = document.getElementById('user-button');
      const userDropdown = document.getElementById('user-dropdown');
      const userAvatar = document.getElementById('user-avatar');
      const userLabel = document.getElementById('user-label');
      const profileButton = document.getElementById('profile-button');
      const logoutButton = document.getElementById('logout-button');

      pageSections.forEach((section) => {
        section.style.display = section.dataset.page === activePage ? 'block' : 'none';
      });

      navLinks.forEach((link) => {
        if (link.dataset.pageLink === activePage) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      if (!isLibraryPage && searchWrap) {
        searchWrap.style.display = 'none';
      }

      if (wizardPanel) {
        wizardPanel.style.display = isLibraryPage ? 'block' : 'none';
      }

      function updateUserMenu(user) {
        if (!userMenu || !userButton || !userAvatar || !userLabel) {
          return;
        }
        if (!user) {
          userAvatar.textContent = '?';
          userLabel.textContent = 'Signed out';
          userMenu.style.display = 'none';
          return;
        }
        const letter = (user.username || user.email || 'U')[0]?.toUpperCase() ?? 'U';
        userAvatar.textContent = letter;
        userLabel.textContent = user.username || user.email;
        userMenu.style.display = 'block';
      }

      function setAuth(token, refreshToken) {
        state.token = token;
        if (token) {
          localStorage.setItem('bmsAccessToken', token);
          if (refreshToken) {
            localStorage.setItem('bmsRefreshToken', refreshToken);
          }
          loginPanel.style.display = 'none';
          bookdarrPanel.style.display = 'block';
          setBookdarrEnabled(true);
          loadBookdarrConfig();
          loadAccounts();
          loadProfile();
          fetch('/api/me', { headers: authHeaders() })
            .then((response) => response.json())
            .then((data) => {
              updateUserMenu(data);
            })
            .catch(() => {
              updateUserMenu(null);
            });
        } else {
          localStorage.removeItem('bmsAccessToken');
          localStorage.removeItem('bmsRefreshToken');
          setBookdarrEnabled(false);
          updateUserMenu(null);
        }
      }

      function authHeaders() {
        return state.token ? { Authorization: 'Bearer ' + state.token } : {};
      }

      function setBookdarrEnabled(enabled) {
        [bookdarrHost, bookdarrPort, bookdarrKey, bookdarrPath, bookdarrHttps].forEach((input) => {
          if (input) {
            input.disabled = !enabled;
          }
        });
        if (bookdarrButton) {
          bookdarrButton.disabled = !enabled;
        }
        if (!enabled && bookdarrStatus) {
          bookdarrStatus.textContent = 'Log in to connect Bookdarr.';
        }
      }

      setBookdarrEnabled(false);
      const cachedToken = localStorage.getItem('bmsAccessToken');
      const cachedRefresh = localStorage.getItem('bmsRefreshToken');
      if (cachedToken) {
        setAuth(cachedToken, cachedRefresh ?? undefined);
      }
      if (!cachedToken) {
        updateUserMenu(null);
      }

      let authSecretsConfigured = false;
      let setupRequired = false;

      function loadAuthSecretsStatus() {
        fetch('/api/settings/auth')
          .then((response) => response.json())
          .then((data) => {
            authSecretsConfigured = Boolean(
              data?.accessSecretConfigured && data?.refreshSecretConfigured,
            );
            if (authSecretStatus && activePage === 'settings') {
              authSecretStatus.textContent = authSecretsConfigured
                ? 'Auth secrets are configured.'
                : 'Auth secrets are not configured.';
            }
          })
          .catch(() => {
            if (authSecretStatus && activePage === 'settings') {
              authSecretStatus.textContent = 'Unable to load auth secrets.';
            }
          });
      }

      function saveAuthSecrets(accessSecret, refreshSecret, statusEl) {
        if (!accessSecret || !refreshSecret) {
          statusEl.textContent = 'Both auth secrets are required.';
          return Promise.resolve(false);
        }

        statusEl.textContent = 'Saving auth secrets...';
        return fetch('/api/settings/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ accessSecret, refreshSecret }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to save auth secrets.';
              statusEl.textContent = message;
              return false;
            }
            authSecretsConfigured = true;
            statusEl.textContent = 'Auth secrets saved.';
            return true;
          })
          .catch(() => {
            statusEl.textContent = 'Unable to save auth secrets.';
            return false;
          });
      }

      if (isLibraryPage) {
        filterButtons.forEach((button) => {
          button.addEventListener('click', () => {
            filterButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            state.filter = button.dataset.filter;
            renderLibrary();
          });
        });

        searchInput?.addEventListener('input', (event) => {
          state.query = event.target.value.toLowerCase();
          renderLibrary();
        });
      }

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

      function loadLibrary() {
        if (!isLibraryPage) {
          return;
        }
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
      }

      function loadBookdarrConfig() {
        if (!state.token) {
          setBookdarrEnabled(false);
          return;
        }
        setBookdarrEnabled(true);
        fetch('/settings/bookdarr', { headers: authHeaders() })
          .then((response) => response.json())
          .then((data) => {
            if (data?.apiUrl) {
              try {
                const url = new URL(data.apiUrl);
                bookdarrHost.value = url.hostname;
                bookdarrPort.value = url.port || (url.protocol === 'https:' ? '443' : '80');
                bookdarrHttps.checked = url.protocol === 'https:';
                if (settingsBookdarrHost) settingsBookdarrHost.value = url.hostname;
                if (settingsBookdarrPort) settingsBookdarrPort.value = url.port || (url.protocol === 'https:' ? '443' : '80');
                if (settingsBookdarrHttps) settingsBookdarrHttps.checked = url.protocol === 'https:';
              } catch {
                // ignore parse errors
              }
            }
            if (data?.poolPath && bookdarrPath) {
              bookdarrPath.value = data.poolPath;
            }
            if (bookdarrPath && !bookdarrPath.value) {
              bookdarrPath.value = '/api/v1/user/library/pool';
            }
            if (settingsBookdarrPath) {
              settingsBookdarrPath.value = data?.poolPath ?? '/api/v1/user/library/pool';
            }
            if (data?.configured) {
              bookdarrStatus.textContent = 'Bookdarr is connected.';
              loadLibrary();
            }
            if (data?.configured && wizardPanel) {
              wizardPanel.style.display = 'none';
            }
          })
          .catch(() => {
            bookdarrStatus.textContent = 'Unable to load Bookdarr settings.';
          });
      }

      function renderAccounts(users) {
        if (!accountsList) {
          return;
        }
        if (!users.length) {
          accountsList.innerHTML = '<div class="empty">No users found.</div>';
          return;
        }
        accountsList.innerHTML = users
          .map((user) => {
            const role = user.isAdmin ? 'Admin' : 'User';
            const status = user.isActive ? 'Active' : 'Disabled';
            return (
              '<div class="status-item">' +
                '<span>' + user.username + '</span>' +
                '<div class="status-value">' +
                  '<div class="dot ' + (user.isActive ? 'ok' : 'warn') + '"></div>' +
                  '<strong>' + role + ' · ' + status + '</strong>' +
                '</div>' +
              '</div>'
            );
          })
          .join('');
      }

      function loadAccounts() {
        if (activePage !== 'accounts') {
          return;
        }
        if (!state.token) {
          if (accountsStatus) {
            accountsStatus.textContent = 'Log in as an admin to manage users.';
          }
          return;
        }
        if (accountsStatus) {
          accountsStatus.textContent = 'Loading users...';
        }
        fetch('/api/users', { headers: authHeaders() })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to load users.';
              if (accountsStatus) {
                accountsStatus.textContent = message;
              }
              return;
            }
            if (accountsStatus) {
              accountsStatus.textContent = 'Users loaded.';
            }
            renderAccounts(Array.isArray(body) ? body : []);
          })
          .catch(() => {
            if (accountsStatus) {
              accountsStatus.textContent = 'Unable to load users.';
            }
          });
      }

      function loadProfile() {
        if (activePage !== 'accounts') {
          return;
        }
        if (!state.token) {
          if (profileStatus) {
            profileStatus.textContent = 'Log in to edit your profile.';
          }
          return;
        }
        fetch('/api/me', { headers: authHeaders() })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              profileStatus.textContent = body?.message ?? 'Unable to load profile.';
              return;
            }
            if (profileUsername) profileUsername.value = body?.username ?? '';
            if (profileEmail) profileEmail.value = body?.email ?? '';
            if (profileStatus) profileStatus.textContent = '';
          })
          .catch(() => {
            if (profileStatus) profileStatus.textContent = 'Unable to load profile.';
          });
      }

      function handleSetupStatus(data) {
        setupRequired = Boolean(data?.required);
        if (data?.required) {
          setupPanel.style.display = 'block';
          loginPanel.style.display = 'none';
          bookdarrPanel.style.display = 'block';
          setBookdarrEnabled(false);
        } else {
          setupPanel.style.display = 'none';
          loginPanel.style.display = 'block';
          bookdarrPanel.style.display = 'block';
          if (!state.token && isLibraryPage) {
            window.location.href = '/login';
          }
        }

        if (isLoginPage && loginPageStatus) {
          loginPageStatus.textContent = data?.required
            ? 'No users yet. Complete first-run setup.'
            : '';
        }
      }

      fetch('/auth/setup')
        .then((response) => response.json())
        .then(handleSetupStatus)
        .catch(() => {});

      loadAuthSecretsStatus();

      setupButton?.addEventListener('click', () => {
        const username = document.getElementById('setup-username').value;
        const email = setupEmail?.value;
        const password = document.getElementById('setup-password').value;
        const accessSecret = authAccessInput?.value;
        const refreshSecret = authRefreshInput?.value;
        setupStatus.textContent = 'Preparing setup...';

        const createUser = () => {
          setupStatus.textContent = 'Creating user...';
          fetch('/auth/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
          })
            .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
            .then(({ ok, body }) => {
              if (!ok) {
                const message = body?.message ?? 'Setup failed.';
                setupStatus.textContent = message;
                return;
              }
              setupStatus.textContent = 'Admin created. Connect Bookdarr below.';
              setupPanel.style.display = 'none';
              loginPanel.style.display = 'none';
              setAuth(body?.tokens?.accessToken, body?.tokens?.refreshToken);
            })
            .catch(() => {
              setupStatus.textContent = 'Setup failed.';
            });
        };

        fetch('/api/settings/auth')
          .then((response) => response.json())
          .then((data) => {
            authSecretsConfigured = Boolean(
              data?.accessSecretConfigured && data?.refreshSecretConfigured,
            );

            if (!authSecretsConfigured) {
              saveAuthSecrets(accessSecret, refreshSecret, setupStatus).then((saved) => {
                if (saved) {
                  createUser();
                }
              });
              return;
            }

            createUser();
          })
          .catch(() => {
            setupStatus.textContent = 'Unable to confirm auth secrets.';
          });
      });

      loginButton?.addEventListener('click', () => {
        const username = loginUsername?.value;
        const password = document.getElementById('login-password').value;
        loginStatus.textContent = 'Signing in...';
        fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Login failed.';
              loginStatus.textContent = message;
              return;
            }
            loginStatus.textContent = 'Signed in.';
            setAuth(body?.tokens?.accessToken, body?.tokens?.refreshToken);
          })
          .catch(() => {
            loginStatus.textContent = 'Login failed.';
          });
      });

      loginPageSubmit?.addEventListener('click', () => {
        const username = loginPageUsername?.value;
        const password = loginPagePassword?.value;
        loginPageStatus.textContent = 'Signing in...';
        fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Login failed.';
              loginPageStatus.textContent = message;
              return;
            }
            loginPageStatus.textContent = 'Signed in.';
            setAuth(body?.tokens?.accessToken, body?.tokens?.refreshToken);
            window.location.href = '/';
          })
          .catch(() => {
            loginPageStatus.textContent = 'Login failed.';
          });
      });

      if (isLoginPage) {
        if (setupRequired) {
          loginPageStatus.textContent = 'No users yet. Complete first-run setup.';
        }
      }

      userButton?.addEventListener('click', () => {
        if (!userDropdown) return;
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
      });

      document.addEventListener('click', (event) => {
        if (!userDropdown || !userMenu) return;
        if (!userMenu.contains(event.target)) {
          userDropdown.style.display = 'none';
        }
      });

      logoutButton?.addEventListener('click', () => {
        const refreshToken = localStorage.getItem('bmsRefreshToken');
        if (!refreshToken) {
          setAuth(null);
          window.location.href = '/login';
          return;
        }
        fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
          .finally(() => {
            setAuth(null);
            window.location.href = '/login';
          });
      });

      profileButton?.addEventListener('click', () => {
        window.location.href = '/accounts';
      });

      saveAuthButton?.addEventListener('click', () => {
        const accessSecret = settingsAccess?.value;
        const refreshSecret = settingsRefresh?.value;
        saveAuthSecrets(accessSecret, refreshSecret, authSecretStatus);
      });

      saveBookdarrButton?.addEventListener('click', () => {
        if (!state.token) {
          settingsBookdarrStatus.textContent = 'Log in to update Bookdarr.';
          return;
        }
        const host = settingsBookdarrHost?.value;
        const port = Number(settingsBookdarrPort?.value);
        const apiKey = settingsBookdarrKey?.value;
        const poolPath = settingsBookdarrPath?.value;
        const useHttps = settingsBookdarrHttps?.checked;
        settingsBookdarrStatus.textContent = 'Saving...';
        fetch('/settings/bookdarr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ host, port, apiKey, poolPath, useHttps }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Save failed.';
              settingsBookdarrStatus.textContent = message;
              return;
            }
            settingsBookdarrStatus.textContent = 'Bookdarr settings saved.';
            loadBookdarrConfig();
          })
          .catch(() => {
            settingsBookdarrStatus.textContent = 'Save failed.';
          });
      });

      bookdarrButton?.addEventListener('click', () => {
        if (!state.token) {
          bookdarrStatus.textContent = 'Please log in first.';
          return;
        }
        const host = bookdarrHost.value;
        const port = Number(bookdarrPort.value);
        const apiKey = bookdarrKey.value;
        const poolPath = bookdarrPath?.value;
        const useHttps = bookdarrHttps.checked;
        bookdarrStatus.textContent = 'Saving connection...';
        fetch('/settings/bookdarr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ host, port, apiKey, poolPath, useHttps }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Save failed.';
              bookdarrStatus.textContent = message;
              return;
            }
            bookdarrStatus.textContent = 'Bookdarr connected.';
            loadLibrary();
            if (wizardPanel) {
              wizardPanel.style.display = 'none';
            }
          })
          .catch(() => {
            bookdarrStatus.textContent = 'Save failed.';
          });
      });

      createUserButton?.addEventListener('click', () => {
        if (!state.token) {
          createUserStatus.textContent = 'Log in as an admin to create users.';
          return;
        }
        const username = newUserUsername?.value;
        const email = newUserEmail?.value;
        const password = newUserPassword?.value;
        const isAdmin = Boolean(newUserAdmin?.checked);
        createUserStatus.textContent = 'Creating user...';
        fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ username, email, password, isAdmin }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to create user.';
              createUserStatus.textContent = message;
              return;
            }
            createUserStatus.textContent = 'User created.';
            if (newUserUsername) newUserUsername.value = '';
            if (newUserEmail) newUserEmail.value = '';
            if (newUserPassword) newUserPassword.value = '';
            if (newUserAdmin) newUserAdmin.checked = false;
            loadAccounts();
          })
          .catch(() => {
            createUserStatus.textContent = 'Unable to create user.';
          });
      });

      saveProfileButton?.addEventListener('click', () => {
        if (!state.token) {
          profileStatus.textContent = 'Log in to edit your profile.';
          return;
        }
        const username = profileUsername?.value;
        const email = profileEmail?.value;
        const currentPassword = profileCurrentPassword?.value;
        const newPassword = profileNewPassword?.value;
        profileStatus.textContent = 'Saving profile...';
        fetch('/api/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({ username, email, currentPassword, newPassword }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to update profile.';
              profileStatus.textContent = message;
              return;
            }
            profileStatus.textContent = 'Profile updated.';
            if (profileCurrentPassword) profileCurrentPassword.value = '';
            if (profileNewPassword) profileNewPassword.value = '';
            updateUserMenu(body);
          })
          .catch(() => {
            profileStatus.textContent = 'Unable to update profile.';
          });
      });

      loadLibrary();
      loadAccounts();
      loadProfile();

      fetch('/api/settings')
        .then((response) => response.json())
        .then((data) => {
          const items = [
            ['Bookdarr', data.bookdarr?.configured ? 'Connected' : 'Missing', data.bookdarr?.configured],
            ['Book Pool Path', data.bookdarr?.poolPath ?? 'Not set'],
            ['Database', data.database?.configured ? 'Configured (' + data.database?.type + ')' : 'Missing', data.database?.configured],
            ['SMTP', data.smtp?.configured ? 'Configured' : 'Missing', data.smtp?.configured],
            ['Diagnostics', data.diagnostics?.required ? 'Required' : 'Optional', data.diagnostics?.required],
            ['Diagnostics Repo', data.diagnostics?.repo ?? 'Not set', data.diagnostics?.configured],
            ['Auth Access Secret', data.auth?.configured ? 'Configured' : 'Missing', data.auth?.configured],
            ['Auth Refresh Secret', data.auth?.configured ? 'Configured' : 'Missing', data.auth?.configured],
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
