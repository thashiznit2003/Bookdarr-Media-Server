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

      .library-toolbar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        margin-bottom: 18px;
      }

      .filter-select {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.82rem;
        color: var(--muted);
      }

      .filter-select select {
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: var(--text);
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 0.85rem;
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
        object-fit: contain;
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

      .book-card {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .book-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 22px 40px rgba(5, 8, 20, 0.55);
      }

      .detail-modal {
        position: fixed;
        inset: 0;
        background: rgba(7, 10, 16, 0.78);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 24px;
        z-index: 50;
      }

      .detail-modal.active {
        display: flex;
      }

      .detail-card {
        width: min(1100px, 96vw);
        height: min(92vh, 860px);
        overflow: hidden;
        background: var(--panel-strong);
        border-radius: 22px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        position: relative;
      }

      .detail-scroll {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: auto;
      }

      .detail-close {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: none;
        background: rgba(255, 255, 255, 0.12);
        color: var(--text);
        font-size: 1.1rem;
        cursor: pointer;
      }

      .detail-body {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        padding: 26px;
      }

      .detail-cover {
        width: 220px;
        height: 320px;
        border-radius: 16px;
        overflow: hidden;
        background: linear-gradient(135deg, rgba(245, 185, 66, 0.2), rgba(90, 138, 255, 0.3));
        position: relative;
      }

      .detail-cover img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .detail-title {
        margin: 0 0 8px;
        font-size: 1.6rem;
      }

      .detail-author {
        color: var(--muted);
        font-size: 1rem;
        margin-bottom: 12px;
      }

      .detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
      }

      .detail-pill {
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .detail-description {
        color: var(--text);
        line-height: 1.6;
        margin: 0 0 12px;
      }

      .detail-toggle {
        border: none;
        background: none;
        color: var(--accent);
        font-weight: 600;
        cursor: pointer;
        padding: 0;
        margin: 0 0 12px;
        text-align: left;
      }

      .detail-subjects {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .detail-subject {
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 0.72rem;
        background: rgba(90, 138, 255, 0.15);
        color: #d7e2ff;
      }

      .detail-media {
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        padding: 20px 26px 26px;
        display: grid;
        gap: 18px;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      }

      .detail-media-section {
        background: var(--panel);
        border-radius: 16px;
        padding: 16px;
      }

      .detail-media-section h3 {
        margin: 0 0 10px;
        font-size: 1rem;
      }

      .file-list {
        display: grid;
        gap: 8px;
      }

      .file-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.06);
      }

      .file-item button,
      .file-item a {
        border: none;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--accent);
        color: #161a23;
        font-weight: 600;
        text-decoration: none;
        cursor: pointer;
      }

      .detail-player {
        width: 100%;
        margin-bottom: 12px;
      }

      .ebook-frame {
        width: 100%;
        height: 260px;
        border-radius: 12px;
        border: none;
        background: #0f1115;
      }

      .reader-modal {
        position: fixed;
        inset: 0;
        background: rgba(8, 10, 16, 0.92);
        display: none;
        align-items: center;
        justify-content: center;
        padding: 18px;
        z-index: 60;
      }

      .reader-modal.touch-fullscreen {
        padding: 0;
        align-items: stretch;
        justify-content: stretch;
        background: #0f1115;
      }

      .reader-modal.active {
        display: flex;
      }

      .reader-card {
        width: min(1200px, 96vw);
        height: min(90vh, 820px);
        background: var(--panel);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        position: relative;
      }

      .reader-modal.touch-fullscreen .reader-card {
        width: 100vw;
        height: 100vh;
        border-radius: 0;
        border: none;
      }

      .reader-header {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        gap: 12px;
        padding-right: 64px;
      }

      .reader-modal.touch-fullscreen .reader-header,
      .reader-modal.touch-fullscreen .reader-controls {
        display: none;
      }

      .reader-header-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .reader-title {
        font-weight: 600;
      }

      .reader-progress {
        color: var(--muted);
        font-size: 0.85rem;
      }

      .reader-overlay {
        position: absolute;
        top: 12px;
        left: 12px;
        right: 12px;
        display: none;
        align-items: center;
        justify-content: space-between;
        pointer-events: none;
        z-index: 6;
      }

      .reader-modal.touch-fullscreen .reader-overlay {
        display: flex;
      }

      .reader-back {
        border: none;
        background: rgba(255, 255, 255, 0.12);
        color: var(--text);
        padding: 6px 12px;
        border-radius: 999px;
        cursor: pointer;
        font-size: 0.85rem;
        pointer-events: auto;
      }

      .reader-progress-overlay {
        color: #e5e9f2;
        font-size: 0.85rem;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.45);
        pointer-events: none;
      }

      .reader-controls {
        display: flex;
        gap: 8px;
        padding: 12px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .reader-button {
        border: none;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: var(--text);
        cursor: pointer;
      }

      .reader-nav-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 12px;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 5;
      }

      .reader-modal[data-reader-mode="epub"] .reader-nav-overlay,
      .reader-modal[data-reader-mode="pdf"] .reader-nav-overlay {
        opacity: 1;
      }

      .reader-modal.touch-fullscreen .reader-nav-overlay {
        display: none;
      }

      .reader-arrow {
        width: 44px;
        height: 44px;
        border-radius: 999px;
        border: none;
        background: rgba(0, 0, 0, 0.45);
        color: #fff;
        font-size: 1.6rem;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      }

      .reader-arrow:hover {
        background: rgba(0, 0, 0, 0.6);
      }

      .reader-view {
        flex: 1;
        overflow: auto;
        padding: 16px;
        position: relative;
        z-index: 1;
      }

      .reader-modal[data-reader-mode="epub"] .reader-view {
        overflow: hidden;
      }

      .reader-modal.touch-fullscreen .reader-view {
        padding: 0;
        overflow: hidden;
      }

      .reader-view.page-turn-next {
        animation: pageTurnNext 0.25s ease;
      }

      .reader-view.page-turn-prev {
        animation: pageTurnPrev 0.25s ease;
      }

      @keyframes pageTurnNext {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(-24px); opacity: 0.7; }
      }

      @keyframes pageTurnPrev {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(24px); opacity: 0.7; }
      }

      .reader-canvas {
        display: block;
        margin: 0 auto;
        border-radius: 12px;
        background: #0f1115;
      }

      .reader-close {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: none;
        background: rgba(255, 255, 255, 0.12);
        color: var(--text);
        font-size: 1.1rem;
        cursor: pointer;
      }

      .reader-modal.touch-fullscreen .reader-close {
        display: none;
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
        .detail-body {
          grid-template-columns: 1fr;
        }
        .detail-cover {
          width: 100%;
          height: 300px;
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
          <a class="nav-link" href="/my-library" data-page-link="my-library">My Library</a>
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

          <div class="library-toolbar">
            <div class="filter-select">
              <span>Filter</span>
              <select id="library-filter">
                <option value="all">All Books</option>
                <option value="ebook">Ebooks</option>
                <option value="audiobook">Audiobooks</option>
              </select>
            </div>
          </div>

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
              </div>
              <button id="setup-submit">Create Admin User</button>
              <div id="setup-status" style="margin-top: 10px; color: var(--muted);"></div>
            </div>

            <div id="bookdarr-panel" class="setup-panel">
              <h3>Step 2: Connect Bookdarr</h3>
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

        <div class="page" data-page="my-library">
          <section class="hero">
            <div>
              <h1>My Library</h1>
              <p>Your checked out books live here.</p>
            </div>
          </section>

          <div class="library-toolbar">
            <div class="filter-select">
              <span>Filter</span>
              <select id="my-library-filter">
                <option value="all">All Books</option>
                <option value="ebook">Ebooks</option>
                <option value="audiobook">Audiobooks</option>
              </select>
            </div>
          </div>

          <section class="section-title">
            <h2>Checked Out</h2>
          </section>
          <div id="my-library-grid" class="grid">
            <div class="empty">No checked out books yet.</div>
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
                <span class="nav-title">Status</span>
                <div id="auth-secret-status" style="margin-top: 6px; color: var(--muted);">
                  Loading...
                </div>
              </div>
              <div>
                <span class="nav-title">Last rotated</span>
                <div id="auth-secret-updated" style="margin-top: 6px; color: var(--muted);">--</div>
              </div>
            </div>
            <button id="rotate-auth-secrets" style="margin-top: 12px;">Rotate Auth Secrets</button>
            <div id="auth-rotate-status" style="margin-top: 8px; color: var(--muted);"></div>
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

      <div id="book-detail-modal" class="detail-modal" aria-hidden="true">
        <div class="detail-card">
          <button class="detail-close" id="detail-close">✕</button>
          <div class="detail-scroll" id="detail-scroll">
            <div class="detail-body">
              <div class="detail-cover" id="detail-cover"></div>
              <div>
                <h2 class="detail-title" id="detail-title">Loading…</h2>
                <div class="detail-author" id="detail-author"></div>
              <div class="detail-meta" id="detail-meta"></div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                <button id="detail-refresh" class="filter-btn">Refresh Metadata</button>
                <button id="detail-checkout" class="filter-btn">Checkout</button>
                <span id="detail-refresh-status" style="color: var(--muted); font-size: 0.85rem;"></span>
                <span id="detail-checkout-status" style="color: var(--muted); font-size: 0.85rem;"></span>
              </div>
                <p class="detail-description" id="detail-description"></p>
                <button class="detail-toggle" id="detail-description-toggle" style="display: none;">More...</button>
                <div class="detail-subjects" id="detail-subjects"></div>
              </div>
            </div>
            <div class="detail-media">
              <div class="detail-media-section">
                <h3>Audiobook</h3>
                <div id="detail-audio"></div>
              </div>
              <div class="detail-media-section">
                <h3>Ebook</h3>
                <div id="detail-ebook"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="reader-modal" class="reader-modal" aria-hidden="true">
        <div class="reader-card">
          <button class="reader-close" id="reader-close">✕</button>
          <div class="reader-overlay">
            <button class="reader-back" id="reader-back">Back</button>
            <div class="reader-progress-overlay" id="reader-progress-overlay"></div>
          </div>
          <div class="reader-header">
            <div class="reader-header-left">
              <div class="reader-title" id="reader-title">Reader</div>
              <div class="reader-progress" id="reader-progress"></div>
            </div>
          </div>
          <div class="reader-controls">
            <button class="reader-button" id="reader-prev">Prev</button>
            <button class="reader-button" id="reader-next">Next</button>
            <a class="reader-button" id="reader-download" href="#" target="_blank" rel="noreferrer">Download</a>
          </div>
          <div class="reader-nav-overlay" id="reader-nav-overlay">
            <button class="reader-arrow" id="reader-prev-arrow" aria-label="Previous page">‹</button>
            <button class="reader-arrow" id="reader-next-arrow" aria-label="Next page">›</button>
          </div>
          <div class="reader-view" id="reader-view"></div>
        </div>
      </div>
    </div>

    <script type="module">
      import * as pdfjsLib from '/vendor/pdfjs/pdf.mjs';
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.mjs';
      window.pdfjsLib = pdfjsLib;
    </script>
    <script src="/vendor/jszip/jszip.min.js"></script>
    <script src="/vendor/epub/epub.min.js"></script>
    <script>
      const state = {
        filter: 'all',
        query: '',
        library: [],
        myLibrary: [],
        token: null,
        userId: null
      };
      let setupRequired = false;
      let tokenRefreshTimer = null;

      const libraryGrid = document.getElementById('library-grid');
      const myLibraryGrid = document.getElementById('my-library-grid');
      const searchInput = document.getElementById('search');
      const searchWrap = document.getElementById('search-wrap');
      const wizardPanel = document.getElementById('wizard');
      const setupPanel = document.getElementById('setup-panel');
      const setupEmail = document.getElementById('setup-email');
      const setupStatus = document.getElementById('setup-status');
      const setupButton = document.getElementById('setup-submit');
      const bookdarrPanel = document.getElementById('bookdarr-panel');
      const bookdarrStatus = document.getElementById('bookdarr-status');
      const bookdarrButton = document.getElementById('bookdarr-submit');
      const pageSections = document.querySelectorAll('[data-page]');
      const navLinks = document.querySelectorAll('[data-page-link]');
      const activePage = window.location.pathname.replace('/', '') || 'library';
      const isLibraryPage = activePage === 'library' || activePage === 'my-library';
      const isMyLibraryPage = activePage === 'my-library';
      const isLoginPage = activePage === 'login';
      const libraryFilterSelect = document.getElementById('library-filter');
      const myLibraryFilterSelect = document.getElementById('my-library-filter');

      const bookdarrHost = document.getElementById('bookdarr-host');
      const bookdarrPort = document.getElementById('bookdarr-port');
      const bookdarrKey = document.getElementById('bookdarr-key');
      const bookdarrPath = document.getElementById('bookdarr-path');
      const bookdarrHttps = document.getElementById('bookdarr-https');
      const authSecretStatus = document.getElementById('auth-secret-status');
      const authSecretUpdated = document.getElementById('auth-secret-updated');
      const rotateAuthButton = document.getElementById('rotate-auth-secrets');
      const authRotateStatus = document.getElementById('auth-rotate-status');
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
      const detailModal = document.getElementById('book-detail-modal');
      const detailClose = document.getElementById('detail-close');
      const detailCover = document.getElementById('detail-cover');
      const detailTitle = document.getElementById('detail-title');
      const detailAuthor = document.getElementById('detail-author');
      const detailMeta = document.getElementById('detail-meta');
      const detailDescription = document.getElementById('detail-description');
      const detailDescriptionToggle = document.getElementById('detail-description-toggle');
      const detailSubjects = document.getElementById('detail-subjects');
      const detailAudio = document.getElementById('detail-audio');
      const detailEbook = document.getElementById('detail-ebook');
      const detailRefresh = document.getElementById('detail-refresh');
      const detailRefreshStatus = document.getElementById('detail-refresh-status');
      const detailCheckout = document.getElementById('detail-checkout');
      const detailCheckoutStatus = document.getElementById('detail-checkout-status');
      const readerModal = document.getElementById('reader-modal');
      const readerClose = document.getElementById('reader-close');
      const readerBack = document.getElementById('reader-back');
      const readerTitle = document.getElementById('reader-title');
      const readerProgress = document.getElementById('reader-progress');
      const readerProgressOverlay = document.getElementById('reader-progress-overlay');
      const readerPrev = document.getElementById('reader-prev');
      const readerNext = document.getElementById('reader-next');
      const readerPrevArrow = document.getElementById('reader-prev-arrow');
      const readerNextArrow = document.getElementById('reader-next-arrow');
      const readerDownload = document.getElementById('reader-download');
      const readerView = document.getElementById('reader-view');

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
      if (searchInput && activePage === 'my-library') {
        searchInput.placeholder = 'Search your Library';
      }

      if (wizardPanel) {
        wizardPanel.style.display = 'none';
      }

      libraryGrid?.addEventListener('click', (event) => {
        const card = event.target.closest('.book-card');
        if (!card || !card.dataset.id) {
          return;
        }
        openBookDetail(card.dataset.id);
      });
      myLibraryGrid?.addEventListener('click', (event) => {
        const card = event.target.closest('.book-card');
        if (!card || !card.dataset.id) {
          return;
        }
        openBookDetail(card.dataset.id);
      });

      detailClose?.addEventListener('click', closeBookDetail);
      detailRefresh?.addEventListener('click', refreshBookDetail);
      detailCheckout?.addEventListener('click', toggleCheckoutStatus);
      detailDescriptionToggle?.addEventListener('click', toggleDetailDescription);
      detailModal?.addEventListener('click', (event) => {
        if (event.target === detailModal) {
          closeBookDetail();
        }
      });
      readerClose?.addEventListener('click', closeReader);
      readerBack?.addEventListener('click', closeReader);
      readerModal?.addEventListener('click', (event) => {
        if (event.target === readerModal) {
          closeReader();
        }
      });

      const goPrev = () => {
        if (epubRendition) {
          epubRendition.prev();
        } else if (pdfDoc) {
          pdfPage = Math.max(1, pdfPage - 1);
          renderPdfPage();
        }
      };
      const goNext = () => {
        if (epubRendition) {
          epubRendition.next();
        } else if (pdfDoc) {
          pdfPage = Math.min(pdfDoc.numPages, pdfPage + 1);
          renderPdfPage();
        }
      };

      readerPrev?.addEventListener('click', goPrev);
      readerNext?.addEventListener('click', goNext);
      readerPrevArrow?.addEventListener('click', goPrev);
      readerNextArrow?.addEventListener('click', goNext);

      const swipeTargets = new WeakSet();
      function attachSwipeTarget(target) {
        if (!target || swipeTargets.has(target) || !isTouchDevice()) {
          return;
        }
        swipeTargets.add(target);
        let touchStartX = null;
        let touchStartY = null;
        target.addEventListener('touchstart', (event) => {
          if (!event.touches || event.touches.length !== 1) {
            return;
          }
          touchStartX = event.touches[0].clientX;
          touchStartY = event.touches[0].clientY;
        }, { passive: true });
        target.addEventListener('touchend', (event) => {
          if (touchStartX == null || touchStartY == null || !event.changedTouches || event.changedTouches.length !== 1) {
            touchStartX = null;
            touchStartY = null;
            return;
          }
          const deltaX = event.changedTouches[0].clientX - touchStartX;
          const deltaY = event.changedTouches[0].clientY - touchStartY;
          touchStartX = null;
          touchStartY = null;
          if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
            return;
          }
          if (deltaX < 0) {
            animatePageTurn('next');
            goNext();
          } else {
            animatePageTurn('prev');
            goPrev();
          }
        }, { passive: true });
      }

      function attachSwipeToIframe(iframe) {
        if (!iframe) return;
        attachSwipeTarget(iframe);
        try {
          const doc = iframe.contentDocument;
          attachSwipeTarget(doc?.documentElement);
          attachSwipeTarget(doc?.body);
        } catch {
          // ignore cross-origin failures
        }
      }

      function scanReaderIframes() {
        if (!readerView || !isTouchDevice()) return;
        readerView.querySelectorAll('iframe').forEach(attachSwipeToIframe);
      }

      attachSwipeTarget(readerView);
      scanReaderIframes();

      if (readerView && isTouchDevice()) {
        readerMutationObserver = new MutationObserver(() => {
          scanReaderIframes();
        });
        readerMutationObserver.observe(readerView, { childList: true, subtree: true });
      }
      window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeBookDetail();
          closeReader();
        }
      });

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
          safeStorageSet('bmsAccessToken', token);
          if (refreshToken) {
            safeStorageSet('bmsRefreshToken', refreshToken);
          }
          scheduleTokenRefresh();
          bookdarrPanel.style.display = 'block';
          setBookdarrEnabled(true);
          loadBookdarrConfig();
          loadAccounts();
          loadProfile();
          loadMyLibrary();
          loadCurrentUser();
        } else {
          safeStorageRemove('bmsAccessToken');
          safeStorageRemove('bmsRefreshToken');
          setBookdarrEnabled(false);
          updateUserMenu(null);
          state.userId = null;
          scheduleTokenRefresh();
          if (!setupRequired && !isLoginPage) {
            window.location.href = '/login';
          }
        }
      }

      function authHeaders() {
        return state.token ? { Authorization: 'Bearer ' + state.token } : {};
      }

      function parseTokenExpiry(token) {
        if (!token || !token.includes('.')) return null;
        try {
          const payload = token.split('.')[1]
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          const decoded = JSON.parse(atob(payload));
          return decoded?.exp ? decoded.exp * 1000 : null;
        } catch {
          return null;
        }
      }

      async function refreshAuthToken() {
        const refreshToken = safeStorageGet('bmsRefreshToken');
        if (!refreshToken) {
          return false;
        }
        try {
          const response = await fetch('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (!response.ok) {
            setAuth(null);
            return false;
          }
          const body = await response.json();
          const tokens = body?.tokens;
          if (tokens?.accessToken) {
            setAuth(tokens.accessToken, tokens.refreshToken ?? refreshToken);
            return true;
          }
        } catch {
          return false;
        }
        return false;
      }

      async function ensureFreshToken() {
        if (!state.token) {
          return refreshAuthToken();
        }
        const expiry = parseTokenExpiry(state.token);
        if (expiry && Date.now() > expiry - 60 * 1000) {
          return refreshAuthToken();
        }
        return true;
      }

      function scheduleTokenRefresh() {
        if (tokenRefreshTimer) {
          clearTimeout(tokenRefreshTimer);
          tokenRefreshTimer = null;
        }
        if (!state.token) {
          return;
        }
        const expiry = parseTokenExpiry(state.token);
        if (!expiry) {
          return;
        }
        const delay = Math.max(expiry - Date.now() - 60 * 1000, 30 * 1000);
        tokenRefreshTimer = setTimeout(() => {
          refreshAuthToken();
        }, delay);
      }

      async function fetchWithAuth(url, options, retry = true) {
        const headers = {
          ...(options?.headers ?? {}),
          ...authHeaders(),
        };
        const response = await fetch(url, { ...(options ?? {}), headers });
        if (response.status === 401 && retry) {
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            return fetchWithAuth(url, options, false);
          }
          setAuth(null);
        }
        return response;
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
      async function restoreSession() {
        const cachedToken = safeStorageGet('bmsAccessToken');
        const cachedRefresh = safeStorageGet('bmsRefreshToken');
        if (cachedToken) {
          setAuth(cachedToken, cachedRefresh ?? undefined);
          await ensureFreshToken();
          loadCurrentUser();
          return;
        }
        if (cachedRefresh) {
          await refreshAuthToken();
        }
        if (!state.token) {
          updateUserMenu(null);
        }
      }

      restoreSession();

      function loadAuthSecretsStatus() {
        fetch('/api/settings/auth')
          .then((response) => response.json())
          .then((data) => {
            const configured = Boolean(
              data?.configured ??
                (data?.accessSecretConfigured && data?.refreshSecretConfigured),
            );
            if (authSecretStatus && activePage === 'settings') {
              authSecretStatus.textContent = configured
                ? 'Auth secrets are configured.'
                : 'Auth secrets are not configured.';
            }
            if (authSecretUpdated && activePage === 'settings') {
              authSecretUpdated.textContent = data?.updatedAt
                ? new Date(data.updatedAt).toLocaleString()
                : 'Unknown';
            }
          })
          .catch(() => {
            if (authSecretStatus && activePage === 'settings') {
              authSecretStatus.textContent = 'Unable to load auth secrets.';
            }
            if (authSecretUpdated && activePage === 'settings') {
              authSecretUpdated.textContent = 'Unknown';
            }
          });
      }

      if (isLibraryPage) {
        searchInput?.addEventListener('input', (event) => {
          state.query = event.target.value.toLowerCase();
          renderActiveLibrary();
        });
      }

      function setFilter(value) {
        state.filter = value;
        if (libraryFilterSelect) libraryFilterSelect.value = value;
        if (myLibraryFilterSelect) myLibraryFilterSelect.value = value;
        renderActiveLibrary();
      }

      libraryFilterSelect?.addEventListener('change', (event) => {
        setFilter(event.target.value);
      });
      myLibraryFilterSelect?.addEventListener('change', (event) => {
        setFilter(event.target.value);
      });
      if (libraryFilterSelect) libraryFilterSelect.value = state.filter;
      if (myLibraryFilterSelect) myLibraryFilterSelect.value = state.filter;

      function applyFilters(list) {
        return list.filter((item) => {
          if (state.filter === 'ebook' && !item.hasEbook) return false;
          if (state.filter === 'audiobook' && !item.hasAudiobook) return false;

          if (state.query) {
            const haystack = [item.title, item.author].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(state.query);
          }
          return true;
        });
      }

      function renderBooks(list, grid, emptyMessage) {
        if (!grid) return;
        const filtered = applyFilters(list);
        if (!filtered.length) {
          grid.innerHTML = '<div class="empty">' + (emptyMessage || 'No books match this view.') + '</div>';
          return;
        }

        grid.innerHTML = filtered.map((item) => {
          const coverSrc = item.coverUrl ? withToken(item.coverUrl) : null;
          const cover = coverSrc
            ? '<img src="' + coverSrc + '" alt="' + item.title + ' cover" loading="lazy" />'
            : '<div class="cover-fallback">' + item.title + '</div>';

          const ebookBadge = item.hasEbook ? '<span class="badge ok">Ebook</span>' : '<span class="badge dim">No Ebook</span>';
          const audioBadge = item.hasAudiobook ? '<span class="badge ok">Audiobook</span>' : '<span class="badge dim">No Audio</span>';
          const checkoutBadge = item.checkedOutByMe ? '<span class="badge warn">Checked Out</span>' : '';
          const statusBadge = !item.checkedOutByMe && item.bookdarrStatus && item.bookdarrStatus !== 'Available'
            ? '<span class="badge warn">' + item.bookdarrStatus + '</span>'
            : !item.checkedOutByMe
              ? '<span class="badge">Ready</span>'
              : '';

          return (
            '<article class="book-card" data-id="' + item.id + '">' +
              '<div class="cover">' + cover + '</div>' +
              '<div class="book-title">' + item.title + '</div>' +
              '<div class="book-author">' + (item.author ?? 'Unknown author') + '</div>' +
              '<div class="badges">' + ebookBadge + audioBadge + checkoutBadge + statusBadge + '</div>' +
            '</article>'
          );
        }).join('');
      }

      function renderLibrary() {
        renderBooks(state.library, libraryGrid, 'No books match this view.');
      }

      function renderMyLibrary() {
        renderBooks(state.myLibrary, myLibraryGrid, 'No checked out books yet.');
      }

      function renderActiveLibrary() {
        if (activePage === 'my-library') {
          renderMyLibrary();
          return;
        }
        if (activePage === 'library') {
          renderLibrary();
        }
      }

      function updateStats() {
        const total = state.library.length;
        const ebooks = state.library.filter((item) => item.hasEbook).length;
        const audio = state.library.filter((item) => item.hasAudiobook).length;
        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-ebooks').textContent = ebooks;
        document.getElementById('stat-audio').textContent = audio;
      }

      async function loadLibrary() {
        if (activePage !== 'library') {
          return;
        }
        if (!state.token) {
          if (libraryGrid) {
            libraryGrid.innerHTML = '<div class="empty">Log in to view your Book Pool.</div>';
          }
          return;
        }
        await ensureFreshToken();
        fetchWithAuth('/library')
          .then((response) => response.json())
          .then((data) => {
            state.library = Array.isArray(data) ? data : [];
            updateStats();
            renderLibrary();
          })
          .catch(() => {
            if (libraryGrid) {
              libraryGrid.innerHTML = '<div class="empty">Unable to load Book Pool.</div>';
            }
          });
      }

      async function loadMyLibrary() {
        if (activePage !== 'my-library') {
          return;
        }
        if (!state.token) {
          if (myLibraryGrid) {
            myLibraryGrid.innerHTML = '<div class="empty">Log in to view your library.</div>';
          }
          return;
        }
        await ensureFreshToken();
        fetchWithAuth('/library/my')
          .then((response) => response.json())
          .then((data) => {
            state.myLibrary = Array.isArray(data) ? data : [];
            renderMyLibrary();
          })
          .catch(() => {
            if (myLibraryGrid) {
              myLibraryGrid.innerHTML = '<div class="empty">Unable to load your library.</div>';
            }
          });
      }

      function formatBytes(bytes) {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let index = 0;
        let value = bytes;
        while (value >= 1024 && index < units.length - 1) {
          value /= 1024;
          index += 1;
        }
        return value.toFixed(value >= 10 ? 0 : 1) + ' ' + units[index];
      }

      function safeStorageGet(key) {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      }

      function safeStorageSet(key, value) {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch {
          return false;
        }
      }

      function safeStorageRemove(key) {
        try {
          localStorage.removeItem(key);
        } catch {
          // ignore
        }
      }

      function isTouchDevice() {
        return ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0);
      }

      function withToken(url) {
        if (!state.token || !url || !url.startsWith('/')) return url;
        const joiner = url.includes('?') ? '&' : '?';
        return url + joiner + 'token=' + encodeURIComponent(state.token);
      }

      function progressKey(kind, fileId) {
        const userKey = state.userId ?? 'anon';
        return 'bms:' + kind + ':' + userKey + ':' + fileId;
      }

      function loadProgress(kind, fileId) {
        try {
          const raw = localStorage.getItem(progressKey(kind, fileId));
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      }

      function saveProgress(kind, fileId, data) {
        try {
          localStorage.setItem(progressKey(kind, fileId), JSON.stringify({
            ...data,
            updatedAt: Date.now()
          }));
        } catch {
          // ignore storage errors
        }
      }

      let pdfDoc = null;
      let pdfPage = 1;
      let epubBook = null;
      let epubRendition = null;
      let epubObjectUrl = null;
      let epubLocationsReady = false;
      let epubLocationsGenerating = false;
      let readerBodyOverflow = null;
      let readerMutationObserver = null;
      let readerFile = null;
      let currentDetail = null;

      function resetReaderState() {
        if (epubRendition) {
          try {
            epubRendition.destroy();
          } catch {
            // ignore
          }
        }
        if (epubBook) {
          try {
            epubBook.destroy();
          } catch {
            // ignore
          }
        }
        epubBook = null;
        epubRendition = null;
        if (epubObjectUrl) {
          try {
            URL.revokeObjectURL(epubObjectUrl);
          } catch {
            // ignore
          }
          epubObjectUrl = null;
        }
        if (readerMutationObserver) {
          readerMutationObserver.disconnect();
          readerMutationObserver = null;
        }
        epubLocationsReady = false;
        epubLocationsGenerating = false;
        pdfDoc = null;
        pdfPage = 1;
        readerFile = null;
        if (readerView) {
          readerView.innerHTML = '';
        }
      }

      function updateReaderProgress(text) {
        if (readerProgress) {
          readerProgress.textContent = text ?? '';
        }
        if (readerProgressOverlay) {
          readerProgressOverlay.textContent = text ?? '';
        }
      }

      function formatPercent(value) {
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return null;
        }
        return Math.max(0, Math.min(100, Math.round(value * 100)));
      }

      function getEpubLocationsTotal() {
        if (!epubBook || !epubBook.locations) {
          return 0;
        }
        if (typeof epubBook.locations.length === 'function') {
          return epubBook.locations.length();
        }
        if (typeof epubBook.locations.total === 'number') {
          return epubBook.locations.total;
        }
        if (typeof epubBook.locations.length === 'number') {
          return epubBook.locations.length;
        }
        return 0;
      }

      function syncEpubLocation() {
        if (!epubRendition || !epubRendition.currentLocation) {
          return;
        }
        const location = epubRendition.currentLocation();
        if (location) {
          updateEpubPageNumbers(location);
        }
      }

      function prepareEpubLocations() {
        if (!epubBook || !epubBook.locations || epubLocationsReady || epubLocationsGenerating) {
          return;
        }
        epubLocationsGenerating = true;
        const generation = epubBook.locations.generate(1600);
        const finalize = () => {
          if (getEpubLocationsTotal() > 0) {
            epubLocationsReady = true;
            syncEpubLocation();
          }
          epubLocationsGenerating = false;
        };
        if (generation && generation.then) {
          generation.then(finalize).catch(() => {
            epubLocationsGenerating = false;
          });
        } else {
          finalize();
        }
      }

      function updateEpubPageNumbers(location) {
        const start = location?.start ?? null;
        const cfi = start?.cfi ?? null;
        const percentage = formatPercent(start?.percentage ?? null);
        let pageText = null;

        if (cfi && epubBook && epubBook.locations && epubLocationsReady) {
          const total = getEpubLocationsTotal();
          const index = epubBook.locations.locationFromCfi(cfi);
          if (total && index != null && index >= 0) {
            pageText = 'Page ' + (index + 1) + ' / ' + total;
          }
        }

        const parts = [];
        if (pageText) {
          parts.push(pageText);
        }
        if (percentage != null) {
          parts.push(percentage + '%');
        }
        updateReaderProgress(parts.join(' · '));
      }

      function animatePageTurn(direction) {
        if (!readerView) return;
        readerView.classList.remove('page-turn-next', 'page-turn-prev');
        void readerView.offsetWidth;
        readerView.classList.add(direction === 'next' ? 'page-turn-next' : 'page-turn-prev');
        setTimeout(() => {
          readerView.classList.remove('page-turn-next', 'page-turn-prev');
        }, 260);
      }

      function truncateWords(text, limit) {
        const clean = (text ?? '').trim();
        if (!clean) {
          return { text: '', truncated: false };
        }
        const words = clean.split(/\s+/);
        if (words.length <= limit) {
          return { text: clean, truncated: false };
        }
        return { text: words.slice(0, limit).join(' ') + '...', truncated: true };
      }

      let detailDescriptionExpanded = false;
      let detailDescriptionFull = '';

      function setDetailDescription(rawText) {
        detailDescriptionFull = (rawText ?? '').trim();
        detailDescriptionExpanded = false;
        const fallback = detailDescriptionFull || 'No description available yet.';
        const { text, truncated } = truncateWords(fallback, 100);
        if (detailDescription) {
          detailDescription.textContent = truncated ? text : fallback;
        }
        if (detailDescriptionToggle) {
          if (truncated) {
            detailDescriptionToggle.style.display = 'inline-flex';
            detailDescriptionToggle.textContent = 'More...';
          } else {
            detailDescriptionToggle.style.display = 'none';
            detailDescriptionToggle.textContent = 'More...';
          }
        }
      }

      function toggleDetailDescription() {
        if (!detailDescription || !detailDescriptionToggle || !detailDescriptionFull) {
          return;
        }
        if (!detailDescriptionExpanded) {
          detailDescriptionExpanded = true;
          detailDescription.textContent = detailDescriptionFull;
          detailDescriptionToggle.textContent = 'Less';
          return;
        }

        detailDescriptionExpanded = false;
        const { text, truncated } = truncateWords(detailDescriptionFull, 100);
        detailDescription.textContent = truncated ? text : detailDescriptionFull;
        detailDescriptionToggle.textContent = 'More...';
      }

      async function openReader(file, title) {
        if (!readerModal || !readerView) {
          return;
        }
        await ensureFreshToken();
        readerModal.classList.add('active');
        readerModal.setAttribute('aria-hidden', 'false');
        readerModal.dataset.readerMode = file.format === '.epub' ? 'epub' : (file.format === '.pdf' ? 'pdf' : 'other');
        const touchFullscreen = isTouchDevice() && file.format === '.epub';
        readerModal.classList.toggle('touch-fullscreen', touchFullscreen);
        if (touchFullscreen) {
          readerBodyOverflow = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
        }
        if (readerTitle) {
          readerTitle.textContent = title ?? 'Reader';
        }
        if (readerDownload) {
          readerDownload.href = withToken(file.streamUrl);
        }
        updateReaderProgress('');
        resetReaderState();
        readerFile = file;
        readerView.innerHTML = '<div class="empty">Loading reader...</div>';

        const format = file.format;
        if (format === '.pdf') {
          openPdfReader(file);
          return;
        }
        if (format === '.epub') {
          openEpubReader(file);
          return;
        }

        readerView.innerHTML = '<div class="empty">Reader not available for this format.</div>';
      }

      function closeReader() {
        if (!readerModal) {
          return;
        }
        resetReaderState();
        readerModal.dataset.readerMode = 'none';
        readerModal.classList.remove('touch-fullscreen');
        readerModal.classList.remove('active');
        readerModal.setAttribute('aria-hidden', 'true');
        if (readerBodyOverflow != null) {
          document.body.style.overflow = readerBodyOverflow;
          readerBodyOverflow = null;
        }
        updateReaderProgress('');
      }

      function openPdfReader(file) {
        if (!readerView) return;
        if (!window['pdfjsLib']) {
          readerView.innerHTML = '<div class="empty">PDF reader unavailable.</div>';
          return;
        }
        const pdfjsLib = window['pdfjsLib'];
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.mjs';
        }

        const saved = loadProgress('ebook-pdf', file.id);
        const url = withToken(file.streamUrl);
        readerView.innerHTML = '<div class="empty">Loading PDF...</div>';
        pdfjsLib.getDocument(url).promise.then((doc) => {
          pdfDoc = doc;
          pdfPage = saved?.page ?? 1;
          if (pdfPage < 1) pdfPage = 1;
          if (pdfPage > pdfDoc.numPages) pdfPage = pdfDoc.numPages;
          renderPdfPage();
        }).catch(() => {
          readerView.innerHTML = '<div class="empty">Unable to load PDF.</div>';
        });
      }

      function renderPdfPage() {
        if (!pdfDoc || !readerView) return;
        pdfDoc.getPage(pdfPage).then((page) => {
          const viewport = page.getViewport({ scale: 1 });
          const containerWidth = readerView.clientWidth - 32;
          const scale = containerWidth > 0 ? containerWidth / viewport.width : 1;
          const scaledViewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.className = 'reader-canvas';
          const context = canvas.getContext('2d');
          canvas.height = scaledViewport.height;
          canvas.width = scaledViewport.width;
          readerView.innerHTML = '';
          readerView.appendChild(canvas);

          page.render({ canvasContext: context, viewport: scaledViewport });
          updateReaderProgress('Page ' + pdfPage + ' / ' + pdfDoc.numPages);
          saveProgress('ebook-pdf', readerFile.id, { page: pdfPage });
        });
      }

      function openEpubReader(file) {
        if (!readerView) return;
        if (!window['ePub'] || !window['JSZip']) {
          readerView.innerHTML = '<div class="empty">EPUB reader unavailable.</div>';
          return;
        }

        const saved = loadProgress('ebook-epub', file.id);
        readerView.innerHTML = '<div class="empty">Loading EPUB...</div>';
        const timeout = setTimeout(() => {
          if (!epubRendition && readerView) {
            readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          }
        }, 8000);

        const mountRendition = (book) => {
          if (!readerView) {
            return;
          }
          readerView.innerHTML = '';
          epubRendition = book.renderTo(readerView, {
            width: '100%',
            height: '100%',
            spread: 'none',
            flow: 'paginated'
          });

          const displayTarget = saved?.cfi ?? undefined;
          const displayPromise = epubRendition.display(displayTarget);
          if (displayPromise && displayPromise.catch) {
            displayPromise.catch(() => {
              if (readerView) {
                readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
              }
            });
          }
          if (displayPromise && displayPromise.then) {
            displayPromise.then(() => {
              syncEpubLocation();
            });
          }
          epubRendition.on('relocated', (location) => {
            if (location?.start?.cfi) {
              saveProgress('ebook-epub', file.id, { cfi: location.start.cfi });
            }
            updateEpubPageNumbers(location);
          });
          epubRendition.on('rendered', (_section, view) => {
            const iframeEl = view?.iframe ?? view?.element?.querySelector?.('iframe') ?? view;
            if (iframeEl) {
              try {
                const doc = iframeEl.contentDocument;
                if (doc?.documentElement) {
                  doc.documentElement.style.overflow = 'hidden';
                }
                if (doc?.body) {
                  doc.body.style.overflow = 'hidden';
                  doc.body.style.margin = '0';
                }
                attachSwipeTarget(doc?.body || doc?.documentElement);
              } catch {
                // ignore
              }
              attachSwipeToIframe(iframeEl);
            }
            scanReaderIframes();
          });
        };

        (async () => {
          if (epubObjectUrl) {
            try {
              URL.revokeObjectURL(epubObjectUrl);
            } catch {
              // ignore
            }
            epubObjectUrl = null;
          }

          const response = await fetchWithAuth(file.streamUrl);
          if (!response.ok) {
            throw new Error('Failed to load EPUB');
          }
          const blob = await response.blob();
          epubObjectUrl = URL.createObjectURL(blob);
          epubBook = window['ePub'](epubObjectUrl, { openAs: 'epub' });
          if (epubBook.ready) {
            await epubBook.ready;
          }
          clearTimeout(timeout);
          mountRendition(epubBook);
          prepareEpubLocations();
        })().catch(() => {
          clearTimeout(timeout);
          if (readerView) {
            readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          }
        });
      }

      function renderAudioSection(files) {
        if (!detailAudio) return;
        detailAudio.innerHTML = '';
        if (!files.length) {
          detailAudio.innerHTML = '<div class="empty">No audiobook files yet.</div>';
          return;
        }

        const player = document.createElement('audio');
        player.className = 'detail-player';
        player.controls = true;
        let activeFile = files[0];
        player.src = withToken(activeFile.streamUrl);
        player.dataset.fileId = String(activeFile.id);

        let saveTimer = null;
        const applySavedPosition = () => {
          if (!activeFile || !player.duration || Number.isNaN(player.duration)) {
            return;
          }
          const saved = loadProgress('audio', activeFile.id);
          if (saved?.time) {
            player.currentTime = Math.min(saved.time, Math.max(0, player.duration - 1));
          }
        };

        player.addEventListener('loadedmetadata', applySavedPosition);
        player.addEventListener('timeupdate', () => {
          if (!activeFile || Number.isNaN(player.currentTime)) {
            return;
          }
          if (saveTimer) {
            return;
          }
          saveTimer = setTimeout(() => {
            saveProgress('audio', activeFile.id, {
              time: player.currentTime,
              duration: player.duration,
            });
            saveTimer = null;
          }, 2000);
        });

        const list = document.createElement('div');
        list.className = 'file-list';
        files.forEach((file) => {
          const row = document.createElement('div');
          row.className = 'file-item';
          const name = document.createElement('span');
          name.textContent = file.fileName + ' · ' + formatBytes(file.size);
          const button = document.createElement('button');
          button.textContent = 'Play';
          button.addEventListener('click', () => {
            activeFile = file;
            player.src = withToken(file.streamUrl);
            player.play();
          });
          row.appendChild(name);
          row.appendChild(button);
          list.appendChild(row);
        });

        detailAudio.appendChild(player);
        detailAudio.appendChild(list);
      }

      function renderEbookSection(files) {
        if (!detailEbook) return;
        detailEbook.innerHTML = '';
        if (!files.length) {
          detailEbook.innerHTML = '<div class="empty">No ebook files yet.</div>';
          return;
        }

        const list = document.createElement('div');
        list.className = 'file-list';
        files.forEach((file) => {
          const row = document.createElement('div');
          row.className = 'file-item';
          const name = document.createElement('span');
          name.textContent = file.fileName + ' · ' + formatBytes(file.size);
          const actions = document.createElement('div');
          actions.style.display = 'flex';
          actions.style.gap = '8px';

          const isReadable = file.format === '.pdf' || file.format === '.epub';
          if (isReadable) {
            const readButton = document.createElement('button');
            readButton.textContent = 'Read';
            readButton.addEventListener('click', () => {
              openReader(file, detailTitle?.textContent);
            });
            actions.appendChild(readButton);
          }

          const link = document.createElement('a');
          link.href = withToken(file.streamUrl);
          link.target = '_blank';
          link.rel = 'noreferrer';
          link.textContent = 'Download';
          actions.appendChild(link);
          row.appendChild(name);
          row.appendChild(actions);
          list.appendChild(row);
        });

        detailEbook.appendChild(list);
      }

      function renderBookDetail(data) {
        if (!detailModal) return;
        currentDetail = data ?? null;
        if (detailTitle) detailTitle.textContent = data?.title ?? 'Unknown title';
        if (detailAuthor) {
          detailAuthor.textContent = data?.author ?? 'Unknown author';
        }
        if (detailCover) {
          const coverSrc = data?.coverUrl ? withToken(data.coverUrl) : null;
          if (coverSrc) {
            detailCover.innerHTML =
              '<img src="' + coverSrc + '" alt="' + (data.title ?? 'Book') + ' cover" />';
          } else {
            detailCover.innerHTML = '<div class="cover-fallback">' + (data?.title ?? '') + '</div>';
          }
        }

        if (detailMeta) {
          const metaBits = [];
          if (data?.publishYear) metaBits.push('Published ' + data.publishYear);
          if (data?.pageCount) metaBits.push(data.pageCount + ' pages');
          if (data?.bookdarrStatus) metaBits.push(data.bookdarrStatus);
          if (data?.hasAudiobook) metaBits.push('Audiobook ready');
          if (data?.hasEbook) metaBits.push('Ebook ready');
          if (data?.releaseDate) metaBits.push('Release ' + data.releaseDate);
          detailMeta.innerHTML = metaBits
            .map((bit) => '<span class="detail-pill">' + bit + '</span>')
            .join('');
        }

        setDetailDescription(data?.description ?? data?.overview ?? '');

        if (detailSubjects) {
          const subjects = Array.isArray(data?.subjects) ? data.subjects.slice(0, 8) : [];
          detailSubjects.innerHTML = subjects
            .map((subject) => '<span class="detail-subject">' + subject + '</span>')
            .join('');
        }

        renderAudioSection(Array.isArray(data?.audiobookFiles) ? data.audiobookFiles : []);
        renderEbookSection(Array.isArray(data?.ebookFiles) ? data.ebookFiles : []);

        if (detailCheckout) {
          detailCheckout.style.display = state.token ? 'inline-flex' : 'none';
          detailCheckout.textContent = data?.checkedOutByMe ? 'Return to Book Pool' : 'Checkout';
        }
        if (detailCheckoutStatus) {
          detailCheckoutStatus.textContent = '';
        }
      }

      async function openBookDetail(bookId) {
        if (!detailModal) return;
        detailModal.dataset.bookId = String(bookId);
        detailModal.classList.add('active');
        detailModal.setAttribute('aria-hidden', 'false');
        if (detailTitle) detailTitle.textContent = 'Loading...';
        if (detailDescription) detailDescription.textContent = '';
        if (detailDescriptionToggle) {
          detailDescriptionToggle.style.display = 'none';
          detailDescriptionToggle.textContent = 'More...';
        }
        detailDescriptionExpanded = false;
        detailDescriptionFull = '';
        if (detailSubjects) detailSubjects.innerHTML = '';
        if (detailAudio) detailAudio.innerHTML = '';
        if (detailEbook) detailEbook.innerHTML = '';
        if (detailRefreshStatus) detailRefreshStatus.textContent = '';
        if (detailCheckoutStatus) detailCheckoutStatus.textContent = '';
        if (detailCheckout) {
          detailCheckout.textContent = 'Checkout';
          detailCheckout.style.display = state.token ? 'inline-flex' : 'none';
        }
        currentDetail = null;

        if (!state.token) {
          if (detailDescription) {
            detailDescription.textContent = 'Log in to view book details.';
          }
          return;
        }

        await ensureFreshToken();
        fetchWithAuth('/library/' + bookId)
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              if (detailDescription) {
                detailDescription.textContent = body?.message ?? 'Unable to load book details.';
              }
              return;
            }
            renderBookDetail(body);
          })
          .catch(() => {
            if (detailDescription) {
              detailDescription.textContent = 'Unable to load book details.';
            }
          });
      }

      async function refreshBookDetail() {
        if (!detailModal || !detailModal.dataset.bookId) {
          return;
        }
        if (!state.token) {
          if (detailRefreshStatus) {
            detailRefreshStatus.textContent = 'Log in to refresh metadata.';
          }
          return;
        }
        if (detailRefreshStatus) {
          detailRefreshStatus.textContent = 'Refreshing from Open Library...';
        }
        await ensureFreshToken();
        fetchWithAuth('/library/' + detailModal.dataset.bookId + '/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              if (detailRefreshStatus) {
                detailRefreshStatus.textContent =
                  body?.message ?? 'Unable to refresh metadata.';
              }
              return;
            }
            renderBookDetail(body);
            if (detailRefreshStatus) {
              detailRefreshStatus.textContent = 'Metadata refreshed.';
            }
          })
          .catch(() => {
            if (detailRefreshStatus) {
              detailRefreshStatus.textContent = 'Unable to refresh metadata.';
            }
          });
      }

      async function toggleCheckoutStatus() {
        if (!detailModal || !detailModal.dataset.bookId) {
          return;
        }
        if (!state.token) {
          if (detailCheckoutStatus) {
            detailCheckoutStatus.textContent = 'Log in to manage checkouts.';
          }
          return;
        }

        const action = currentDetail?.checkedOutByMe ? 'return' : 'checkout';
        if (detailCheckoutStatus) {
          detailCheckoutStatus.textContent =
            action === 'return' ? 'Returning book...' : 'Checking out...';
        }

        await ensureFreshToken();
        fetchWithAuth('/library/' + detailModal.dataset.bookId + '/' + action, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              if (detailCheckoutStatus) {
                detailCheckoutStatus.textContent =
                  body?.message ?? 'Unable to update checkout status.';
              }
              return;
            }
            renderBookDetail(body);
            loadLibrary();
            loadMyLibrary();
            if (detailCheckoutStatus) {
              detailCheckoutStatus.textContent = action === 'return' ? 'Returned.' : 'Checked out.';
            }
          })
          .catch(() => {
            if (detailCheckoutStatus) {
              detailCheckoutStatus.textContent = 'Unable to update checkout status.';
            }
          });
      }

      function closeBookDetail() {
        if (!detailModal) return;
        detailModal.classList.remove('active');
        detailModal.setAttribute('aria-hidden', 'true');
      }

      function loadBookdarrConfig() {
        if (!state.token) {
          setBookdarrEnabled(false);
          return;
        }
        setBookdarrEnabled(true);
        fetchWithAuth('/settings/bookdarr')
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
              loadMyLibrary();
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
        fetchWithAuth('/api/users')
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
        fetchWithAuth('/api/me')
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

      function loadCurrentUser() {
        if (!state.token) {
          updateUserMenu(null);
          state.userId = null;
          return;
        }
        fetchWithAuth('/api/me')
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              updateUserMenu(null);
              state.userId = null;
              return;
            }
            updateUserMenu(body);
            state.userId = body?.id ?? null;
          })
          .catch(() => {
            updateUserMenu(null);
            state.userId = null;
          });
      }

      function handleSetupStatus(data) {
        setupRequired = Boolean(data?.required);
        if (data?.required) {
          setupPanel.style.display = 'block';
          bookdarrPanel.style.display = 'block';
          setBookdarrEnabled(false);
          if (wizardPanel && activePage === 'library') {
            wizardPanel.style.display = 'block';
          }
        } else {
          setupPanel.style.display = 'none';
          bookdarrPanel.style.display = 'block';
          if (wizardPanel && activePage === 'library') {
            wizardPanel.style.display = state.token ? 'block' : 'none';
          }
          if (!state.token && !isLoginPage) {
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
        .catch(() => {
          if (!state.token && !isLoginPage) {
            window.location.href = '/login';
          }
        });

      loadAuthSecretsStatus();

      setupButton?.addEventListener('click', () => {
        const username = document.getElementById('setup-username').value;
        const email = setupEmail?.value;
        const password = document.getElementById('setup-password').value;
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
            setAuth(body?.tokens?.accessToken, body?.tokens?.refreshToken);
          })
          .catch(() => {
            setupStatus.textContent = 'Setup failed.';
          });
      });

      function handleLoginPage() {
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
      }

      loginPageSubmit?.addEventListener('click', handleLoginPage);

      loginPageUsername?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleLoginPage();
        }
      });

      loginPagePassword?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          handleLoginPage();
        }
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
        const refreshToken = safeStorageGet('bmsRefreshToken');
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

      rotateAuthButton?.addEventListener('click', () => {
        if (!state.token) {
          if (authRotateStatus) {
            authRotateStatus.textContent = 'Log in as an admin to rotate secrets.';
          }
          return;
        }
        const confirmed = window.confirm(
          'Rotating auth secrets will sign out all users. Continue?',
        );
        if (!confirmed) {
          return;
        }
        if (authRotateStatus) {
          authRotateStatus.textContent = 'Rotating auth secrets...';
        }
        fetchWithAuth('/api/settings/auth/rotate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to rotate auth secrets.';
              if (authRotateStatus) {
                authRotateStatus.textContent = message;
              }
              return;
            }
            if (authRotateStatus) {
              authRotateStatus.textContent = 'Auth secrets rotated. Please sign in again.';
            }
            if (authSecretUpdated) {
              authSecretUpdated.textContent = body?.updatedAt
                ? new Date(body.updatedAt).toLocaleString()
                : 'Just now';
            }
            setAuth(null);
          })
          .catch(() => {
            if (authRotateStatus) {
              authRotateStatus.textContent = 'Unable to rotate auth secrets.';
            }
          });
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
        fetchWithAuth('/settings/bookdarr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        fetchWithAuth('/settings/bookdarr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
            loadMyLibrary();
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
        fetchWithAuth('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
        fetchWithAuth('/api/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
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
      loadMyLibrary();
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
