import { Injectable } from '@nestjs/common';

const { version: appVersion } = require('../package.json');

@Injectable()
export class AppService {
  getIndexHtml(bootstrap?: {
    token?: string | null;
    refreshToken?: string | null;
    user?: {
      id?: string;
      username?: string;
      email?: string;
      isAdmin?: boolean;
    } | null;
  }): string {
    const boot = bootstrap ?? null;
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bookdarr Media Server</title>
    <script>
      window.__BMS_INTERNAL_BASE = 'http://127.0.0.1:9797';
    </script>
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

      .cover.is-downloading img {
        filter: grayscale(1) brightness(0.65);
      }

      .cover.is-downloading .cover-fallback {
        opacity: 0.4;
      }

      .download-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 14, 20, 0.55);
      }

      .download-ring {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        background: conic-gradient(
          var(--accent) calc(var(--progress, 0) * 1turn),
          rgba(255, 255, 255, 0.12) 0
        );
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .download-ring-inner {
        width: 52px;
        height: 52px;
        border-radius: 50%;
        background: rgba(12, 14, 20, 0.82);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.72rem;
        font-weight: 600;
        letter-spacing: 0.04em;
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

      .badge.read {
        color: #0f172a;
        background: #38bdf8;
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
        opacity: 0;
      }

      .reader-modal.touch-fullscreen.reader-ui-visible .reader-overlay {
        display: flex;
        opacity: 1;
        pointer-events: auto;
      }

      .reader-overlay-actions {
        display: flex;
        align-items: center;
        gap: 10px;
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
        position: relative;
        z-index: 7;
      }

      .reader-modal[data-reader-mode="epub"] .reader-controls #reader-prev,
      .reader-modal[data-reader-mode="epub"] .reader-controls #reader-next,
      .reader-modal[data-reader-mode="readium"] .reader-controls #reader-prev,
      .reader-modal[data-reader-mode="readium"] .reader-controls #reader-next {
        display: none;
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
      .reader-modal[data-reader-mode="readium"] .reader-nav-overlay,
      .reader-modal[data-reader-mode="pdf"] .reader-nav-overlay {
        opacity: 1;
        pointer-events: auto;
      }

      .reader-modal.touch-fullscreen .reader-nav-overlay {
        display: flex;
        opacity: 0;
        pointer-events: none;
      }

      .reader-modal.touch-fullscreen.reader-ui-visible .reader-nav-overlay {
        opacity: 1;
        pointer-events: auto;
      }

      .reader-gesture {
        position: absolute;
        inset: 0;
        z-index: 4;
        pointer-events: none;
      }

      .reader-modal.touch-fullscreen .reader-gesture {
        pointer-events: auto;
      }

      .reader-arrow {
        width: 38px;
        height: 38px;
        border-radius: 999px;
        border: none;
        background: rgba(0, 0, 0, 0.35);
        color: #fff;
        font-size: 1.8rem;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
        cursor: pointer;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.28);
      }

      .reader-arrow:hover {
        background: rgba(0, 0, 0, 0.6);
      }

      .reader-view {
        flex: 1;
        min-height: 0;
        overflow: auto;
        padding: 16px;
        position: relative;
        z-index: 1;
        overscroll-behavior: contain;
      }

      .reader-modal[data-reader-mode="epub"] .reader-view,
      .reader-modal[data-reader-mode="readium"] .reader-view {
        overflow: hidden;
        padding: 0;
        height: 100%;
      }

      .reader-modal.touch-fullscreen .reader-view {
        padding: 0;
        overflow: hidden;
      }

      .reader-modal.reader-dark .reader-view {
        background: #0f1115;
      }

      .reader-modal.reader-dark .reader-canvas {
        filter: invert(1) hue-rotate(180deg);
      }

      .reader-view iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }
      .readium-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .readium-container iframe {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }

      .reader-view .epub-container,
      .reader-view .epub-view {
        width: 100%;
        height: 100%;
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
        z-index: 7;
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

      .form-grid > div {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .form-grid .nav-title {
        display: block;
        margin-bottom: 2px;
      }

      .form-grid label {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text);
      }

      .form-grid input[type="text"],
      .form-grid input[type="number"],
      .form-grid input[type="password"],
      .form-grid input[type="email"],
      .form-grid input[type="search"] {
        width: 100%;
        box-sizing: border-box;
      }

      .form-grid input:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .protocol-toggle {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
      }

      .protocol-toggle input[type="checkbox"] {
        width: auto;
        margin: 0;
      }

      .protocol-toggle label {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      }

      .checkbox-field {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .checkbox-field input[type="checkbox"] {
        width: auto;
        margin: 0;
      }

      .checkbox-label {
        color: var(--muted);
        font-size: 0.9rem;
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
    <script>
      (function() {
        function send(event, meta) {
          try {
            var payload = JSON.stringify({ event: event, meta: meta || {} });
            if (navigator && navigator.sendBeacon) {
              var blob = new Blob([payload], { type: 'application/json' });
              navigator.sendBeacon('/auth/debug-log', blob);
              return;
            }
            fetch('/auth/debug-log', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: payload,
              keepalive: true
            }).catch(function() {});
          } catch (e) {}
        }
        window.__bmsDebug = send;
        send('client_boot', { href: window.location.href });
        window.addEventListener('error', function(e) {
          send('client_error', {
            message: e && e.message,
            source: e && e.filename,
            line: e && e.lineno,
            col: e && e.colno
          });
        });
        window.addEventListener('unhandledrejection', function(e) {
          send('client_unhandledrejection', { reason: String(e && e.reason) });
        });
      })();
    </script>
    <script>
      window.__BMS_BOOTSTRAP__ = ${JSON.stringify(boot)};
    </script>
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
                  <span class="nav-title">Use HTTPS</span>
                  <div class="protocol-toggle">
                    <input id="bookdarr-https" type="checkbox" />
                  </div>
                </div>
              </div>
              <button id="bookdarr-submit">Save Connection</button>
              <div id="bookdarr-status" style="margin-top: 10px; color: var(--muted);"></div>
            </div>
          </section>

          <section class="section-title">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px;">
              <h2>Library</h2>
              <button id="refresh-library" style="padding: 8px 14px; border-radius: 999px;">Refresh</button>
            </div>
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

        <div class="page" data-page="settings">
          <section class="section-title">
            <h2>Settings</h2>
            <span class="pill">Config</span>
          </section>
          <div class="panel">
            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
              <span>Bookdarr Connection</span>
              <span id="settings-bookdarr-title-dot" class="dot warn"></span>
            </h3>
            <div class="status-grid form-grid">
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
                <span class="nav-title">Use HTTPS</span>
                <div class="protocol-toggle">
                  <input id="settings-bookdarr-https" type="checkbox" />
                </div>
              </div>
            </div>
            <div class="status-item" style="margin-top: 12px;">
              <span>Connection Status</span>
              <div class="status-value">
                <div id="settings-bookdarr-dot" class="dot warn"></div>
                <strong id="settings-bookdarr-indicator">Not tested</strong>
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button id="save-bookdarr">Save Bookdarr Settings</button>
              <button id="test-bookdarr">Test Connection</button>
            </div>
            <div id="settings-bookdarr-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>

          <div class="panel" style="margin-top: 20px;">
            <h3 style="margin-top: 0; display: flex; align-items: center; gap: 10px;">
              <span>Email (SMTP)</span>
              <span id="settings-smtp-title-dot" class="dot warn"></span>
            </h3>
            <div class="status-grid form-grid">
              <div>
                <span class="nav-title">SMTP Host</span>
                <input id="settings-smtp-host" type="text" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <span class="nav-title">SMTP Port</span>
                <input id="settings-smtp-port" type="number" placeholder="587" />
              </div>
              <div>
                <span class="nav-title">Username</span>
                <input id="settings-smtp-user" type="text" placeholder="you@example.com" />
              </div>
              <div>
                <span class="nav-title">From Name</span>
                <input id="settings-smtp-from-name" type="text" placeholder="Bookdarr Media Server" />
              </div>
              <div>
                <span class="nav-title">Password</span>
                <input id="settings-smtp-pass" type="password" placeholder="App password" />
              </div>
              <div>
                <span class="nav-title">From Address</span>
                <input id="settings-smtp-from" type="text" placeholder="Bookdarr <you@example.com>" />
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button id="save-smtp">Save SMTP Settings</button>
              <button id="test-smtp">Send Test Email</button>
            </div>
            <div id="settings-smtp-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>

          <div class="panel" style="margin-top: 20px;">
            <h3 style="margin-top: 0;">Reader Compatibility</h3>
            <div class="status-grid form-grid">
              <div>
                <span class="nav-title">Legacy EPUB (epub.js)</span>
                <div class="checkbox-field">
                  <input id="settings-reader-legacy" type="checkbox" />
                  <span class="checkbox-label">Show legacy Read button for compatibility</span>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button id="save-reader-settings">Save Reader Settings</button>
            </div>
            <div id="settings-reader-status" style="margin-top: 8px; color: var(--muted);"></div>
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
          <div class="panel" id="admin-actions-panel" style="margin-top: 20px;">
            <h3 style="margin-top: 0;">Admin Actions</h3>
            <div class="status-grid">
              <div>
                <span class="nav-title">User</span>
                <select id="admin-user-select" style="width: 100%; padding: 10px 12px; border-radius: 10px; background: rgba(10, 12, 18, 0.7); color: var(--text); border: 1px solid rgba(255, 255, 255, 0.1);"></select>
              </div>
              <div>
                <span class="nav-title">New Password</span>
                <input id="admin-reset-password" type="password" placeholder="temporary password" />
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button id="admin-reset-2fa">Reset 2FA</button>
              <button id="admin-reset-password-btn">Reset Password</button>
            </div>
            <div id="admin-actions-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>
          <div class="panel" id="create-user-panel" style="margin-top: 20px;">
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
          <div class="panel" style="margin-top: 20px;">
            <h3 style="margin-top: 0;">Two-Factor Authentication</h3>
            <div id="twofactor-status" style="color: var(--muted); margin-bottom: 12px;">
              Two-factor authentication is disabled.
            </div>
            <div id="twofactor-setup" style="display: none;">
              <div style="display: flex; gap: 16px; flex-wrap: wrap; align-items: center;">
                <img id="twofactor-qr" alt="2FA QR Code" style="width: 160px; height: 160px; background: #0f1115; border-radius: 12px; padding: 8px;" />
                <div>
                  <div style="font-size: 0.85rem; color: var(--muted); margin-bottom: 6px;">Manual key</div>
                  <div id="twofactor-secret" style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.85rem;"></div>
                </div>
              </div>
              <div style="margin-top: 12px; max-width: 240px;">
                <span class="nav-title">Authenticator Code</span>
                <input id="twofactor-code" type="text" placeholder="123456" inputmode="numeric" />
              </div>
              <button id="twofactor-confirm" style="margin-top: 12px;">Enable 2FA</button>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button id="twofactor-start">Set up 2FA</button>
              <button id="twofactor-disable" class="filter-btn">Disable 2FA</button>
            </div>
            <div id="twofactor-message" style="margin-top: 8px; color: var(--muted);"></div>
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
              <div id="login-page-otp-field" style="display: none;">
                <span class="nav-title">Authenticator Code</span>
                <input id="login-page-otp" type="text" placeholder="123456" inputmode="numeric" />
              </div>
            </div>
            <button id="login-page-submit" style="margin-top: 12px;">Log in</button>
            <button id="login-forgot" class="filter-btn" style="margin-top: 12px;">Forgot password?</button>
            <div id="login-page-status" style="margin-top: 8px; color: var(--muted);"></div>
          </div>
          <div class="panel" id="login-reset-panel" style="margin-top: 16px; display: none;">
            <div class="status-grid">
              <div>
                <span class="nav-title">Email</span>
                <input id="reset-email" type="email" placeholder="you@example.com" />
              </div>
              <div>
                <span class="nav-title">Reset Token</span>
                <input id="reset-token" type="text" placeholder="token from email" />
              </div>
              <div>
                <span class="nav-title">New Password</span>
                <input id="reset-password" type="password" placeholder="new password" />
              </div>
              <div>
                <span class="nav-title">Confirm Password</span>
                <input id="reset-password-confirm" type="password" placeholder="confirm new password" />
              </div>
            </div>
            <div style="display: flex; gap: 10px; margin-top: 12px;">
              <button id="reset-request">Send reset email</button>
              <button id="reset-submit">Reset password</button>
              <button id="reset-cancel" class="filter-btn">Back to login</button>
            </div>
            <div id="reset-status" style="margin-top: 8px; color: var(--muted);"></div>
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
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                <button id="detail-refresh" class="filter-btn">Refresh Metadata</button>
                <button id="detail-checkout" class="filter-btn">+ My Library</button>
                <button id="detail-read-toggle" class="filter-btn">Mark Read</button>
                <span id="detail-refresh-status" style="color: var(--muted); font-size: 0.85rem;"></span>
                <span id="detail-checkout-status" style="color: var(--muted); font-size: 0.85rem;"></span>
                <span id="detail-download-status" style="color: var(--muted); font-size: 0.85rem;"></span>
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
          <div class="reader-overlay" id="reader-overlay">
            <button class="reader-back" id="reader-back">Back</button>
            <div class="reader-overlay-actions">
              <button class="reader-back reader-theme-toggle" id="reader-theme-toggle">Dark mode</button>
              <div class="reader-progress-overlay" id="reader-progress-overlay"></div>
            </div>
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
            <button class="reader-button" id="reader-sync">Sync</button>
            <button class="reader-button" id="reader-reset">Restart</button>
            <button class="reader-button" id="reader-theme-toggle-inline">Dark mode</button>
            <a class="reader-button" id="reader-download" href="#" target="_blank" rel="noreferrer">Download</a>
          </div>
          <div class="reader-nav-overlay" id="reader-nav-overlay">
            <button class="reader-arrow" id="reader-prev-arrow" aria-label="Previous page">‹</button>
            <button class="reader-arrow" id="reader-next-arrow" aria-label="Next page">›</button>
          </div>
          <div class="reader-gesture" id="reader-gesture" aria-hidden="true"></div>
          <div class="reader-view" id="reader-view"></div>
        </div>
      </div>
    </div>

    <script type="module">
      import * as pdfjsLib from '/vendor/pdfjs/pdf.mjs';
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.mjs';
      window.pdfjsLib = pdfjsLib;
    </script>
    <script type="module">
      import * as ReadiumNavigator from '/vendor/readium-navigator/index.js';
      import * as ReadiumShared from '/vendor/readium-shared/index.js';
      window.ReadiumNavigator = ReadiumNavigator;
      window.ReadiumShared = ReadiumShared;
    </script>
    <script src="/vendor/jszip/jszip.min.js"></script>
    <script src="/vendor/epub/epub.min.js"></script>
    <script>
      const bootstrap = window.__BMS_BOOTSTRAP__ || null;
      window.__BMS_FORCE_READIUM = ${process.env.FORCE_READIUM === 'true' ? 'true' : 'false'};
      const state = {
        filter: 'all',
        query: '',
        library: [],
        myLibrary: [],
        token: bootstrap?.token || null,
        userId: null,
        isAdmin: false,
        users: []
      };
      let setupRequired = false;
      let bookdarrConfigured = false;
      let legacyEpubEnabled = false;
      let tokenRefreshTimer = null;
      let myLibraryRefreshTimer = null;

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
      const authParam = new URLSearchParams(window.location.search).get('auth');
      const hasAccessCookie = (() => {
        const raw = document.cookie || '';
        if (!raw) return false;
        const parts = raw.split(';');
        for (const part of parts) {
          const trimmed = part.trim();
          if (trimmed.startsWith('bmsAccessToken=')) {
            return trimmed.length > 'bmsAccessToken='.length;
          }
        }
        return false;
      })();
      const libraryFilterSelect = document.getElementById('library-filter');
      const myLibraryFilterSelect = document.getElementById('my-library-filter');
      const refreshLibraryButton = document.getElementById('refresh-library');

      const bookdarrHost = document.getElementById('bookdarr-host');
      const bookdarrPort = document.getElementById('bookdarr-port');
      const bookdarrKey = document.getElementById('bookdarr-key');
      const bookdarrPath = document.getElementById('bookdarr-path');
      const bookdarrHttps = document.getElementById('bookdarr-https');
      const settingsBookdarrHost = document.getElementById('settings-bookdarr-host');
      const settingsBookdarrPort = document.getElementById('settings-bookdarr-port');
      const settingsBookdarrKey = document.getElementById('settings-bookdarr-key');
      const settingsBookdarrHttps = document.getElementById('settings-bookdarr-https');
      const saveBookdarrButton = document.getElementById('save-bookdarr');
      const testBookdarrButton = document.getElementById('test-bookdarr');
      const settingsBookdarrStatus = document.getElementById('settings-bookdarr-status');
      const settingsBookdarrIndicator = document.getElementById('settings-bookdarr-indicator');
      const settingsBookdarrDot = document.getElementById('settings-bookdarr-dot');
      const settingsBookdarrTitleDot = document.getElementById('settings-bookdarr-title-dot');
      const settingsSmtpHost = document.getElementById('settings-smtp-host');
      const settingsSmtpPort = document.getElementById('settings-smtp-port');
      const settingsSmtpUser = document.getElementById('settings-smtp-user');
      const settingsSmtpFromName = document.getElementById('settings-smtp-from-name');
      const settingsSmtpPass = document.getElementById('settings-smtp-pass');
      const settingsSmtpFrom = document.getElementById('settings-smtp-from');
      const saveSmtpButton = document.getElementById('save-smtp');
      const testSmtpButton = document.getElementById('test-smtp');
      const settingsSmtpStatus = document.getElementById('settings-smtp-status');
      const settingsSmtpTitleDot = document.getElementById('settings-smtp-title-dot');
      const settingsReaderLegacy = document.getElementById('settings-reader-legacy');
      const saveReaderSettingsButton = document.getElementById('save-reader-settings');
      const settingsReaderStatus = document.getElementById('settings-reader-status');
      const accountsList = document.getElementById('accounts-list');
      const accountsStatus = document.getElementById('accounts-status');
      const adminActionsPanel = document.getElementById('admin-actions-panel');
      const adminUserSelect = document.getElementById('admin-user-select');
      const adminResetPasswordInput = document.getElementById('admin-reset-password');
      const adminResetTwoFactorButton = document.getElementById('admin-reset-2fa');
      const adminResetPasswordButton = document.getElementById('admin-reset-password-btn');
      const adminActionsStatus = document.getElementById('admin-actions-status');
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
      const twoFactorStatus = document.getElementById('twofactor-status');
      const twoFactorSetup = document.getElementById('twofactor-setup');
      const twoFactorQr = document.getElementById('twofactor-qr');
      const twoFactorSecret = document.getElementById('twofactor-secret');
      const twoFactorCode = document.getElementById('twofactor-code');
      const twoFactorConfirm = document.getElementById('twofactor-confirm');
      const twoFactorStart = document.getElementById('twofactor-start');
      const twoFactorDisable = document.getElementById('twofactor-disable');
      const twoFactorMessage = document.getElementById('twofactor-message');
      const loginPageUsername = document.getElementById('login-page-username');
      const loginPagePassword = document.getElementById('login-page-password');
      const loginPageOtpField = document.getElementById('login-page-otp-field');
      const loginPageOtp = document.getElementById('login-page-otp');
      const loginPageSubmit = document.getElementById('login-page-submit');
      const loginForgot = document.getElementById('login-forgot');
      const loginPageStatus = document.getElementById('login-page-status');
      const resetPanel = document.getElementById('login-reset-panel');
      const resetEmail = document.getElementById('reset-email');
      const resetToken = document.getElementById('reset-token');
      const resetPassword = document.getElementById('reset-password');
      const resetPasswordConfirm = document.getElementById('reset-password-confirm');
      const resetRequestButton = document.getElementById('reset-request');
      const resetSubmitButton = document.getElementById('reset-submit');
      const resetCancelButton = document.getElementById('reset-cancel');
      const resetStatus = document.getElementById('reset-status');
      const createUserPanel = document.getElementById('create-user-panel');
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
      const detailReadToggle = document.getElementById('detail-read-toggle');
      const detailDownloadStatus = document.getElementById('detail-download-status');
      const readerModal = document.getElementById('reader-modal');
      const readerClose = document.getElementById('reader-close');
      const readerBack = document.getElementById('reader-back');
      const readerTitle = document.getElementById('reader-title');
      const readerProgress = document.getElementById('reader-progress');
      const readerProgressOverlay = document.getElementById('reader-progress-overlay');
      const readerPrev = document.getElementById('reader-prev');
      const readerNext = document.getElementById('reader-next');
      const readerSync = document.getElementById('reader-sync');
      const readerReset = document.getElementById('reader-reset');
      const readerPrevArrow = document.getElementById('reader-prev-arrow');
      const readerNextArrow = document.getElementById('reader-next-arrow');
      const readerNavOverlay = document.getElementById('reader-nav-overlay');
      const readerDownload = document.getElementById('reader-download');
      const readerThemeToggle = document.getElementById('reader-theme-toggle');
      const readerThemeToggleInline = document.getElementById('reader-theme-toggle-inline');
      const readerOverlay = document.getElementById('reader-overlay');
      const readerGesture = document.getElementById('reader-gesture');
      const readerView = document.getElementById('reader-view');

      function debugAuthLog(event, meta = {}) {
        try {
          if (window.__bmsDebug) {
            window.__bmsDebug(event, meta);
            return;
          }
          fetch('/auth/debug-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event, meta }),
            keepalive: true,
          }).catch(() => {});
        } catch {}
      }

      function debugReaderLog(event, meta = {}) {
        debugAuthLog('reader_' + event, meta);
      }

      let pdfDoc = null;
      let pdfPage = 1;
      let epubBook = null;
      let epubRendition = null;
      let epubObjectUrl = null;
      let readiumNavigator = null;
      let readiumPublication = null;
      let readiumManifestUrl = null;
      let readiumReadyPromise = null;
      let readiumPositions = [];
      let readiumLastLocator = null;
      let epubLocationsReady = false;
      let epubLocationsGenerating = false;
      let readerBodyOverflow = null;
      let readerMutationObserver = null;
      let readerFile = null;
      let currentDetail = null;
      let readerTheme = 'light';
      let readerResizeBound = false;
      let readerUiVisible = true;
      let readerHistoryPushed = false;
      let readerSectionTotals = new Map();
      let readerSectionOffsets = new Map();
      let readerLastSectionIndex = null;
      let readerLastGlobalPage = null;
      let readerPageMapKey = null;
      let readerNavPending = 0;
      let readerEngine = 'epubjs';
      const readerPageMapVersion = 3;

      if (createUserPanel) {
        createUserPanel.style.display = 'none';
      }

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

      if (!bootstrap?.user) {
        window.location.replace('/login?reason=unauth');
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
      detailReadToggle?.addEventListener('click', toggleReadStatus);
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
        if (readiumNavigator) {
          readiumNavigator.goBackward(false, () => {});
        } else if (epubRendition) {
          readerNavPending = Math.max(readerNavPending - 1, -10);
          epubRendition.prev();
        } else if (pdfDoc) {
          pdfPage = Math.max(1, pdfPage - 1);
          renderPdfPage();
        }
      };
      const goNext = () => {
        if (readiumNavigator) {
          readiumNavigator.goForward(false, () => {});
        } else if (epubRendition) {
          readerNavPending = Math.min(readerNavPending + 1, 10);
          epubRendition.next();
        } else if (pdfDoc) {
          pdfPage = Math.min(pdfDoc.numPages, pdfPage + 1);
          renderPdfPage();
        }
      };

      readerPrev?.addEventListener('click', goPrev);
      readerNext?.addEventListener('click', goNext);
      readerSync?.addEventListener('click', async () => {
        if (!readerFile) return;
        const kind = readerFile.format === '.pdf' ? 'ebook-pdf' : 'ebook-epub';
        await reconcileProgress(kind, readerFile.id);
      });
      readerReset?.addEventListener('click', () => {
        if (!readerFile) return;
        if (!confirm('Restart this book from the beginning?')) return;
        const kind = readerFile.format === '.pdf' ? 'ebook-pdf' : 'ebook-epub';
        resetProgressRemote(kind, readerFile.id);
        if (readerFile.format === '.pdf') {
          pdfPage = 1;
          renderPdfPage();
        } else if (readerFile.format === '.epub') {
          if (readiumNavigator && readiumPublication?.readingOrder?.items?.length) {
            const firstLink = readiumPublication.readingOrder.items[0];
            if (firstLink) {
              readiumNavigator.goLink(firstLink, false, () => {});
            }
          } else if (epubRendition) {
            try {
              epubRendition.display();
            } catch {}
          }
        }
      });
      readerPrevArrow?.addEventListener('click', goPrev);
      readerNextArrow?.addEventListener('click', goNext);
      readerThemeToggle?.addEventListener('click', () => {
        setReaderUiVisible(true);
        applyReaderTheme(readerTheme === 'dark' ? 'light' : 'dark');
      });
      readerThemeToggleInline?.addEventListener('click', () => {
        setReaderUiVisible(true);
        applyReaderTheme(readerTheme === 'dark' ? 'light' : 'dark');
      });
      readerBack?.addEventListener('click', () => {
        setReaderUiVisible(true);
      });

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

      function attachReaderGesture(target) {
        if (!target || !isTouchDevice()) {
          return;
        }
        let startX = null;
        let startY = null;
        const onEnd = (endX, endY, eventTarget) => {
          const overlayRect = readerOverlay?.getBoundingClientRect?.();
          const withinOverlay = overlayRect
            ? endX >= overlayRect.left && endX <= overlayRect.right && endY >= overlayRect.top && endY <= overlayRect.bottom
            : false;
          if (eventTarget && eventTarget.closest && (
            eventTarget.closest('.reader-arrow') ||
            eventTarget.closest('.reader-back') ||
            eventTarget.closest('.reader-theme-toggle')
          )) {
            startX = null;
            startY = null;
            return;
          }
          if (withinOverlay) {
            startX = null;
            startY = null;
            return;
          }
          if (startX == null || startY == null) {
            startX = null;
            startY = null;
            return;
          }
          const deltaX = endX - startX;
          const deltaY = endY - startY;
          startX = null;
          startY = null;
          if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
              animatePageTurn('next');
              goNext();
            } else {
              animatePageTurn('prev');
              goPrev();
            }
            return;
          }
          toggleReaderUi();
        };
        if ('PointerEvent' in window) {
          target.addEventListener('pointerdown', (event) => {
            if (event.pointerType !== 'touch') return;
            startX = event.clientX;
            startY = event.clientY;
          }, { passive: true });
          target.addEventListener('pointerup', (event) => {
            if (event.pointerType !== 'touch') return;
            onEnd(event.clientX, event.clientY, event.target);
          }, { passive: true });
        } else {
          target.addEventListener('touchstart', (event) => {
            if (!event.touches || event.touches.length !== 1) return;
            startX = event.touches[0].clientX;
            startY = event.touches[0].clientY;
          }, { passive: true });
          target.addEventListener('touchend', (event) => {
            if (!event.changedTouches || event.changedTouches.length !== 1) {
              startX = null;
              startY = null;
              return;
            }
            onEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY, event.target);
          }, { passive: true });
        }
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
      attachReaderGesture(readerGesture);
      attachReaderGesture(readerNavOverlay);
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
      window.addEventListener('popstate', () => {
        if (readerModal?.classList.contains('active')) {
          closeReader();
        }
      });

      function updateUserMenu(user) {
        if (!userMenu || !userButton || !userAvatar || !userLabel) {
          return;
        }
        if (!user) {
          debugAuthLog('update_user_menu_signed_out', {
            hasToken: Boolean(state.token),
            hasBootstrap: Boolean(bootstrap?.user),
          });
          userAvatar.textContent = '?';
          userLabel.textContent = 'Signed out';
          userMenu.style.display = 'none';
          state.isAdmin = false;
          if (createUserPanel) {
            createUserPanel.style.display = 'none';
          }
          if (adminActionsPanel) {
            adminActionsPanel.style.display = 'none';
          }
          if (!isLoginPage) {
            window.location.replace('/login?reason=unauth');
          }
          return;
        }
        const letter = (user.username || user.email || 'U')[0]?.toUpperCase() ?? 'U';
        userAvatar.textContent = letter;
        userLabel.textContent = user.username || user.email;
        userMenu.style.display = 'block';
        state.isAdmin = Boolean(user.isAdmin);
        if (createUserPanel) {
          createUserPanel.style.display = user.isAdmin ? 'block' : 'none';
        }
        if (adminActionsPanel) {
          adminActionsPanel.style.display = user.isAdmin ? 'block' : 'none';
        }
      }

      function setAuth(token, refreshToken) {
        state.token = token;
        if (token) {
          debugAuthLog('set_auth_token', { hasRefresh: Boolean(refreshToken) });
          setAuthCookie(true);
          setTokenCookies(token, refreshToken ?? safeStorageGet('bmsRefreshToken'));
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
          debugAuthLog('set_auth_cleared');
          setAuthCookie(false);
          setTokenCookies(null, null);
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

      if (bootstrap?.token) {
        debugAuthLog('bootstrap_token_present', { hasUser: Boolean(bootstrap?.user) });
        setAuth(bootstrap.token, bootstrap.refreshToken);
        if (bootstrap.user) {
          updateUserMenu(bootstrap.user);
          state.userId = bootstrap.user.id ?? null;
        }
      }

      function authHeaders() {
        return state.token ? { Authorization: 'Bearer ' + state.token } : {};
      }

      function isAuthenticated() {
        return Boolean(state.token || readCookie('bmsAccessToken') || readCookie('bmsLoggedIn'));
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
        const refreshToken = safeStorageGet('bmsRefreshToken') ?? readCookie('bmsRefreshToken');
        if (!refreshToken) {
          return false;
        }
        try {
          const response = await fetch('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ refreshToken }),
          });
          if (!response.ok) {
            if (state.token) {
              setAuth(null);
            }
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
          return true;
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
        const response = await fetch(url, {
          ...(options ?? {}),
          headers,
          credentials: options?.credentials ?? 'same-origin',
          cache: options?.cache ?? 'no-store',
        });
        if (response.status === 401 && retry) {
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            return fetchWithAuth(url, options, false);
          }
          if (state.token) {
            setAuth(null);
          }
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
      function readHashTokens() {
        const hash = window.location.hash;
        if (!hash || hash.length < 2) return null;
        const params = new URLSearchParams(hash.slice(1));
        const accessToken = params.get('access');
        const refreshToken = params.get('refresh');
        if (!accessToken) return null;
        return { accessToken, refreshToken };
      }

      function readWindowNameTokens() {
        const raw = window.name;
        if (!raw || !raw.startsWith('bms:')) return null;
        try {
          const decoded = atob(raw.slice(4));
          const parsed = JSON.parse(decoded);
          if (!parsed?.accessToken) return null;
          window.name = '';
          return parsed;
        } catch {
          return null;
        }
      }

      function clearAuthParams() {
        const url = new URL(window.location.href);
        if (url.searchParams.has('auth')) {
          url.searchParams.delete('auth');
        }
        if (url.searchParams.has('access')) {
          url.searchParams.delete('access');
        }
        if (url.searchParams.has('refresh')) {
          url.searchParams.delete('refresh');
        }
        url.hash = '';
        history.replaceState(null, '', url.toString());
      }

      function clearHashTokens() {
        if (!window.location.hash) return;
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      async function restoreSession() {
        debugAuthLog('restore_session_start', {
          hasToken: Boolean(state.token),
          authParam,
          hasBootstrapUser: Boolean(bootstrap?.user),
        });
        if (state.token) {
          await ensureFreshToken();
          loadCurrentUser();
          return;
        }
        const windowTokens = readWindowNameTokens();
        if (windowTokens?.accessToken) {
          debugAuthLog('restore_session_window_name', { hasRefresh: Boolean(windowTokens?.refreshToken) });
          setAuth(windowTokens.accessToken, windowTokens.refreshToken ?? undefined);
          clearAuthParams();
          await ensureFreshToken();
          loadCurrentUser();
          return;
        }
        const hashTokens = readHashTokens();
        if (hashTokens?.accessToken) {
          debugAuthLog('restore_session_hash', { hasRefresh: Boolean(hashTokens?.refreshToken) });
          setAuth(hashTokens.accessToken, hashTokens.refreshToken ?? undefined);
          clearHashTokens();
          await ensureFreshToken();
          loadCurrentUser();
          return;
        }
        const cachedToken = safeStorageGet('bmsAccessToken');
        const cachedRefresh = safeStorageGet('bmsRefreshToken');
        const cookieToken = readCookie('bmsAccessToken');
        const cookieRefresh = readCookie('bmsRefreshToken');
        const accessToken = cachedToken || cookieToken;
        const refreshToken = cachedRefresh || cookieRefresh;
        if (accessToken) {
          debugAuthLog('restore_session_cached', {
            cached: Boolean(cachedToken),
            cookie: Boolean(cookieToken),
            hasRefresh: Boolean(refreshToken),
          });
          setAuth(accessToken, refreshToken ?? undefined);
          await ensureFreshToken();
          loadCurrentUser();
          return;
        }
        await refreshAuthToken();
        if (!state.token) {
          if (isAuthenticated()) {
            debugAuthLog('restore_session_auth_cookie_only');
            loadCurrentUser();
            return;
          }
          debugAuthLog('restore_session_no_auth');
          updateUserMenu(null);
          setAuthCookie(false);
        }
      }
      (async () => {
        await restoreSession();
        if (!state.token && !bootstrap?.user && authParam === '1') {
          window.location.replace('/login?reason=authfail');
          return;
        }
        fetch('/auth/setup', { cache: 'no-store' })
          .then((response) => response.json())
          .then(handleSetupStatus)
          .catch(() => {
            if (!isAuthenticated() && !isLoginPage) {
              setAuthCookie(false);
              window.location.href = '/login';
            }
          });
      })();

      function loadSmtpConfig() {
        if (activePage !== 'settings') {
          return;
        }
        fetchWithAuth('/settings/smtp')
          .then((response) => response.json())
          .then((data) => {
            if (settingsSmtpHost) settingsSmtpHost.value = data?.host ?? '';
            if (settingsSmtpPort) settingsSmtpPort.value = data?.port ?? '';
            if (settingsSmtpUser) settingsSmtpUser.value = data?.user ?? '';
            if (settingsSmtpFromName) settingsSmtpFromName.value = data?.fromName ?? '';
            if (settingsSmtpFrom) settingsSmtpFrom.value = data?.from ?? '';
            if (settingsSmtpStatus) {
              settingsSmtpStatus.textContent = data?.configured
                ? 'SMTP configured.'
                : 'SMTP not configured yet.';
            }
            if (data?.configured) {
              testSmtpConfiguredConnection();
            } else {
              setSmtpTitleDot('warn');
            }
          })
          .catch(() => {
            if (settingsSmtpStatus) {
              settingsSmtpStatus.textContent = 'Unable to load SMTP settings.';
            }
            setSmtpTitleDot('warn');
          });
      }

      function loadReaderConfig() {
        fetchWithAuth('/settings/reader')
          .then((response) => response.json())
          .then((data) => {
            legacyEpubEnabled = Boolean(data?.legacyEpubEnabled);
            if (settingsReaderLegacy) settingsReaderLegacy.checked = legacyEpubEnabled;
            if (settingsReaderStatus) {
              settingsReaderStatus.textContent = legacyEpubEnabled
                ? 'Legacy EPUB reader is enabled.'
                : 'Legacy EPUB reader is disabled.';
            }
          })
          .catch(() => {
            if (settingsReaderStatus) {
              settingsReaderStatus.textContent = 'Unable to load reader settings.';
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

      refreshLibraryButton?.addEventListener('click', () => {
        refreshLibraryButton.disabled = true;
        refreshLibraryButton.textContent = 'Refreshing...';
        fetchWithAuth('/library/refresh', { method: 'POST' })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok }) => {
            if (ok) {
              loadLibrary();
              loadMyLibrary();
            }
          })
          .finally(() => {
            refreshLibraryButton.textContent = 'Refresh';
            refreshLibraryButton.disabled = false;
          });
      });

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

      function renderBooks(list, grid, emptyMessage, options = {}) {
        if (!grid) return;
        const filtered = applyFilters(list);
        if (!filtered.length) {
          grid.innerHTML = '<div class="empty">' + (emptyMessage || 'No books match this view.') + '</div>';
          return;
        }

        const showDownloads = options.showDownloads === true;

        grid.innerHTML = filtered.map((item) => {
          const coverSrc = item.coverUrl ? withToken(item.coverUrl) : null;
          const downloadStatus = showDownloads ? item.downloadStatus : null;
          const downloadInfo = getDownloadProgress(downloadStatus);
          const showDownloadOverlay =
            downloadStatus &&
            (downloadInfo.state === 'queued' || downloadInfo.state === 'downloading') &&
            downloadInfo.progress < 1;
          const progressPercent = Math.round(downloadInfo.progress * 100);

          const cover = coverSrc
            ? '<img src="' + coverSrc + '" alt="' + item.title + ' cover" loading="lazy" />'
            : '<div class="cover-fallback">' + item.title + '</div>';
          const overlay = showDownloadOverlay
            ? (
              '<div class="download-overlay">' +
                '<div class="download-ring" style="--progress: ' + downloadInfo.progress + '">' +
                  '<div class="download-ring-inner">' + progressPercent + '%</div>' +
                '</div>' +
              '</div>'
            )
            : '';

          const ebookBadge = item.hasEbook ? '<span class="badge ok">Ebook</span>' : '<span class="badge dim">No Ebook</span>';
          const audioBadge = item.hasAudiobook ? '<span class="badge ok">Audiobook</span>' : '<span class="badge dim">No Audio</span>';
          const checkoutBadge = item.checkedOutByMe ? '<span class="badge warn">Checked Out</span>' : '';
          const readBadge = item.readByMe ? '<span class="badge read">Read</span>' : '';
          const statusBadge = !item.checkedOutByMe && item.bookdarrStatus && item.bookdarrStatus !== 'Available'
            ? '<span class="badge warn">' + item.bookdarrStatus + '</span>'
            : !item.checkedOutByMe
              ? '<span class="badge">Ready</span>'
              : '';

          return (
            '<article class="book-card" data-id="' + item.id + '">' +
              '<div class="cover' + (showDownloadOverlay ? ' is-downloading' : '') + '">' + cover + overlay + '</div>' +
              '<div class="book-title">' + item.title + '</div>' +
              '<div class="book-author">' + (item.author ?? 'Unknown author') + '</div>' +
              '<div class="badges">' + ebookBadge + audioBadge + checkoutBadge + readBadge + statusBadge + '</div>' +
            '</article>'
          );
        }).join('');
      }

      function updateDownloadOverlays(list, grid) {
        if (!grid) return;
        const cards = grid.querySelectorAll('.book-card');
        if (!cards.length) return;
        const cardMap = new Map();
        cards.forEach((card) => {
          const id = card.dataset.id;
          if (id) {
            cardMap.set(id, card);
          }
        });
        list.forEach((item) => {
          const card = cardMap.get(String(item.id));
          if (!card) return;
          const cover = card.querySelector('.cover');
          if (!cover) return;
          const downloadInfo = getDownloadProgress(item.downloadStatus);
          const showDownloadOverlay =
            item.downloadStatus &&
            (downloadInfo.state === 'queued' || downloadInfo.state === 'downloading') &&
            downloadInfo.progress < 1;
          let overlay = cover.querySelector('.download-overlay');
          if (showDownloadOverlay) {
            const progressPercent = Math.round(downloadInfo.progress * 100);
            if (!overlay) {
              overlay = document.createElement('div');
              overlay.className = 'download-overlay';
              overlay.innerHTML =
                '<div class="download-ring" style="--progress: 0">' +
                  '<div class="download-ring-inner">0%</div>' +
                '</div>';
              cover.appendChild(overlay);
            }
            const ring = overlay.querySelector('.download-ring');
            if (ring) ring.style.setProperty('--progress', String(downloadInfo.progress));
            const inner = overlay.querySelector('.download-ring-inner');
            if (inner) inner.textContent = progressPercent + '%';
            cover.classList.add('is-downloading');
          } else {
            if (overlay) overlay.remove();
            cover.classList.remove('is-downloading');
          }
        });
      }

      function renderLibrary() {
        renderBooks(state.library, libraryGrid, 'No books match this view.');
      }

      function renderMyLibrary() {
        renderBooks(state.myLibrary, myLibraryGrid, 'No checked out books yet.', { showDownloads: true });
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

      function hasActiveDownloads(list) {
        return list.some((item) => {
          const status = item.downloadStatus;
          if (!status) return false;
          return status.status === 'queued' || status.status === 'downloading';
        });
      }

      function scheduleMyLibraryRefresh(list) {
        if (!isMyLibraryPage) {
          return;
        }
        if (myLibraryRefreshTimer) {
          clearInterval(myLibraryRefreshTimer);
          myLibraryRefreshTimer = null;
        }
        if (hasActiveDownloads(list)) {
          myLibraryRefreshTimer = setInterval(() => {
            loadMyLibrary();
          }, 2500);
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
        await ensureFreshToken();
        fetchWithAuth('/library/my')
          .then((response) => response.json())
          .then((data) => {
            const next = Array.isArray(data) ? data : [];
            const existingCards = myLibraryGrid?.querySelectorAll('.book-card') ?? [];
            const sameCount = existingCards.length === next.length;
            let sameIds = sameCount;
            if (sameCount) {
              const ids = new Set(Array.from(existingCards).map((card) => card.dataset.id));
              sameIds = next.every((item) => ids.has(String(item.id)));
            }
            state.myLibrary = next;
            if (sameIds) {
              updateDownloadOverlays(state.myLibrary, myLibraryGrid);
            } else {
              renderMyLibrary();
            }
            scheduleMyLibraryRefresh(state.myLibrary);
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

      function getDownloadProgress(status) {
        if (!status) {
          return { progress: 0, state: 'not_started', total: 0, downloaded: 0 };
        }
        const total = Number(status.bytesTotal || 0);
        const downloaded = Number(status.bytesDownloaded || 0);
        let progress = Number(status.progress || 0);
        if (!progress && total > 0) {
          progress = downloaded / total;
        }
        if (!progress && status.fileCount) {
          progress = (status.readyCount || 0) / status.fileCount;
        }
        progress = Math.min(Math.max(progress, 0), 1);
        return {
          progress,
          state: status.status || 'not_started',
          total,
          downloaded,
        };
      }

      function formatDownloadStatus(status) {
        if (!status || status.status === 'not_started') {
          return '';
        }
        if (status.status === 'ready') {
          return 'Downloaded for offline use.';
        }
        if (status.status === 'failed') {
          return 'Download failed. Try checkout again.';
        }
        const { progress, total, downloaded } = getDownloadProgress(status);
        const percent = Math.round(progress * 100);
        if (total > 0) {
          return 'Downloading ' + percent + '% · ' + formatBytes(downloaded) + ' / ' + formatBytes(total);
        }
        return status.status === 'queued' ? 'Queued for download.' : 'Downloading ' + percent + '%';
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

      function setAuthCookie(enabled) {
        const maxAge = 60 * 60 * 24 * 30;
        if (enabled) {
          document.cookie = 'bmsLoggedIn=1; path=/; max-age=' + maxAge + '; samesite=lax';
          return;
        }
        document.cookie = 'bmsLoggedIn=; path=/; max-age=0; samesite=lax';
      }

      function readCookie(name) {
        const raw = document.cookie;
        if (!raw) return null;
        const parts = raw.split(';');
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith(name + '=')) {
            return decodeURIComponent(trimmed.slice(name.length + 1));
          }
        }
        return null;
      }

      function setTokenCookies(accessToken, refreshToken) {
        const maxAge = 60 * 60 * 24 * 30;
        if (accessToken) {
          document.cookie = 'bmsAccessToken=' + encodeURIComponent(accessToken) + '; path=/; max-age=' + maxAge + '; samesite=lax';
        } else {
          document.cookie = 'bmsAccessToken=; path=/; max-age=0; samesite=lax';
        }
        if (refreshToken) {
          document.cookie = 'bmsRefreshToken=' + encodeURIComponent(refreshToken) + '; path=/; max-age=' + maxAge + '; samesite=lax';
        } else {
          document.cookie = 'bmsRefreshToken=; path=/; max-age=0; samesite=lax';
        }
      }

      function isTouchDevice() {
        try {
          const points = navigator?.maxTouchPoints || navigator?.msMaxTouchPoints || 0;
          const ua = navigator?.userAgent || '';
          const isAppleTouch = /iPad|iPhone|iPod/i.test(ua) || (navigator?.platform === 'MacIntel' && points > 1);
          return ('ontouchstart' in window) || points > 0 || isAppleTouch || window.matchMedia('(pointer: coarse)').matches;
        } catch {
          return ('ontouchstart' in window) || (navigator && navigator.maxTouchPoints > 0);
        }
      }

      function withToken(url) {
        if (!state.token || !url || !url.startsWith('/')) return url;
        const joiner = url.includes('?') ? '&' : '?';
        return url + joiner + 'token=' + encodeURIComponent(state.token);
      }

      function toAbsoluteUrl(url) {
        if (!url) return url;
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return window.location.origin + url;
      }

      function toBase64(input) {
        try {
          return btoa(unescape(encodeURIComponent(input)));
        } catch {
          return btoa(input);
        }
      }

      function getReadiumManifestUrl(file) {
        let streamUrl = toAbsoluteUrl(withToken(file.streamUrl));
        const internalBase = window.__BMS_INTERNAL_BASE;
        if (internalBase) {
          try {
            const parsed = new URL(streamUrl);
            streamUrl = internalBase + parsed.pathname + parsed.search;
          } catch {
            // ignore invalid URL
          }
        }
        try {
          const parsed = new URL(streamUrl);
          if (parsed.pathname.startsWith('/library/files/')) {
            streamUrl = (internalBase || window.location.origin) + parsed.pathname + parsed.search;
          }
        } catch {
          // ignore invalid URL
        }
        const encoded = encodeURIComponent(toBase64(streamUrl));
        return {
          pub: encoded,
          self: '/readium/pub/' + encoded + '/manifest.json',
          fetch: '/library/readium/manifest?pub=' + encoded,
        };
      }

      async function readiumFetch(url, options = {}) {
        const headers = { ...(options.headers || {}) };
        if (state.token && !headers['Authorization']) {
          headers['Authorization'] = 'Bearer ' + state.token;
        }
        return fetch(url, {
          ...options,
          headers,
          credentials: 'include',
          cache: 'no-store',
        });
      }

      function progressKey(kind, fileId) {
        const userKey = state.userId ?? 'anon';
        return 'bms:' + kind + ':' + userKey + ':' + fileId;
      }

      function getLocalProgress(kind, fileId) {
        const localKey = progressKey(kind, fileId);
        try {
          const raw = localStorage.getItem(localKey);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      }

      async function fetchServerProgress(kind, fileId) {
        try {
          const response = await fetchWithAuth('/reader/progress/' + kind + '/' + fileId);
          const body = await response.json();
          if (response.ok && body?.data) {
            return { data: body.data, updatedAt: body.updatedAt };
          }
        } catch {
          // ignore
        }
        return null;
      }

      async function loadProgress(kind, fileId) {
        const local = getLocalProgress(kind, fileId);
        const remote = await fetchServerProgress(kind, fileId);
        if (remote?.data) {
          const payload = { ...remote.data, updatedAt: remote.updatedAt };
          localStorage.setItem(progressKey(kind, fileId), JSON.stringify(payload));
          return payload;
        }
        return local;
      }

      function saveProgress(kind, fileId, data) {
        const payload = { ...data, updatedAt: Date.now() };
        try {
          localStorage.setItem(progressKey(kind, fileId), JSON.stringify(payload));
        } catch {
          // ignore storage errors
        }
        fetchWithAuth('/reader/progress/' + kind + '/' + fileId, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data, updatedAt: payload.updatedAt }),
        }).catch(() => {
          // ignore network failures
        });
      }

      function splitProgressPayload(payload) {
        if (!payload) {
          return { data: null, updatedAt: 0 };
        }
        const data = { ...payload };
        const updatedAt = typeof data.updatedAt === 'number' ? data.updatedAt : 0;
        delete data.updatedAt;
        return { data, updatedAt };
      }

      function syncProgress(kind, fileId, data, onDone) {
        const payload = { ...data, updatedAt: Date.now() };
        fetchWithAuth('/reader/progress/' + kind + '/' + fileId + '/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data, updatedAt: payload.updatedAt }),
        })
          .then((response) => response.json())
          .then((body) => {
            if (body?.data && body?.updatedAt) {
              localStorage.setItem(progressKey(kind, fileId), JSON.stringify({
                ...body.data,
                updatedAt: body.updatedAt,
              }));
              if (onDone) onDone(body);
            } else if (onDone) {
              onDone(null);
            }
          })
          .catch(() => {
            if (onDone) onDone(null);
          });
      }

      function resetProgressRemote(kind, fileId) {
        fetchWithAuth('/reader/progress/' + kind + '/' + fileId + '/reset', {
          method: 'POST',
        }).catch(() => {});
        try {
          localStorage.removeItem(progressKey(kind, fileId));
        } catch {}
      }

      async function reconcileProgress(kind, fileId) {
        const localRaw = getLocalProgress(kind, fileId);
        const local = splitProgressPayload(localRaw);
        const remote = await fetchServerProgress(kind, fileId);
        const remoteUpdatedAt = remote?.updatedAt ?? 0;
        if (remote?.data && remoteUpdatedAt >= (local.updatedAt || 0)) {
          const payload = { ...remote.data, updatedAt: remoteUpdatedAt };
          localStorage.setItem(progressKey(kind, fileId), JSON.stringify(payload));
          applySyncedProgress(kind, remote.data);
          return;
        }
        if (local.data) {
          syncProgress(kind, fileId, local.data, (result) => {
            if (!result?.data) return;
            applySyncedProgress(kind, result.data);
          });
        }
      }

      async function loadAndApplyServerProgress(kind, fileId) {
        try {
          const response = await fetchWithAuth('/reader/progress/' + kind + '/' + fileId);
          const body = await response.json();
          if (response.ok && body?.data) {
            localStorage.setItem(progressKey(kind, fileId), JSON.stringify({
              ...body.data,
              updatedAt: body.updatedAt,
            }));
            applySyncedProgress(kind, body.data);
          }
        } catch {
          // ignore
        }
      }

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
        if (readiumNavigator) {
          try {
            const result = readiumNavigator.destroy();
            if (result?.catch) {
              result.catch(() => {});
            }
          } catch {
            // ignore
          }
        }
        epubBook = null;
        epubRendition = null;
        readiumNavigator = null;
        readiumPublication = null;
        readiumManifestUrl = null;
        readiumPositions = [];
        readiumLastLocator = null;
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
        readerSectionTotals = new Map();
        readerSectionOffsets = new Map();
        readerLastSectionIndex = null;
        readerLastGlobalPage = null;
        readerPageMapKey = null;
        readerNavPending = 0;
        readerEngine = 'epubjs';
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

      function getReaderViewportSignature() {
        if (!readerView) return null;
        const width = readerView.clientWidth || 0;
        const height = readerView.clientHeight || 0;
        if (!width || !height) return null;
        const ratio = Math.round((window.devicePixelRatio || 1) * 100) / 100;
        return width + 'x' + height + '@' + ratio;
      }

      function getReaderPageMapKey(fileId) {
        const signature = getReaderViewportSignature();
        if (!signature || !fileId) return null;
        return 'bmsReaderPages:v' + readerPageMapVersion + ':' + fileId + ':' + signature;
      }

      function loadReaderPageMap(fileId) {
        readerPageMapKey = getReaderPageMapKey(fileId);
        if (!readerPageMapKey) return;
        const raw = safeStorageGet(readerPageMapKey);
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (parsed?.version !== readerPageMapVersion) {
            return;
          }
          const totals = Array.isArray(parsed?.totals) ? parsed.totals : [];
          const offsets = Array.isArray(parsed?.offsets) ? parsed.offsets : [];
          readerSectionTotals = new Map(totals);
          readerSectionOffsets = new Map(offsets);
          readerLastGlobalPage = typeof parsed?.lastGlobalPage === 'number' ? parsed.lastGlobalPage : null;
          readerLastSectionIndex = typeof parsed?.lastSectionIndex === 'number' ? parsed.lastSectionIndex : null;
        } catch {
          // ignore
        }
      }

      function persistReaderPageMap() {
        if (!readerPageMapKey) {
          if (readerFile?.id) {
            readerPageMapKey = getReaderPageMapKey(readerFile.id);
          }
        }
        if (!readerPageMapKey) return;
        const payload = {
          version: readerPageMapVersion,
          totals: Array.from(readerSectionTotals.entries()),
          offsets: Array.from(readerSectionOffsets.entries()),
          lastGlobalPage: readerLastGlobalPage,
          lastSectionIndex: readerLastSectionIndex,
          updatedAt: Date.now(),
        };
        safeStorageSet(readerPageMapKey, JSON.stringify(payload));
      }

      function updateReaderThemeButtons() {
        const label = readerTheme === 'dark' ? 'Light mode' : 'Dark mode';
        if (readerThemeToggle) readerThemeToggle.textContent = label;
        if (readerThemeToggleInline) readerThemeToggleInline.textContent = label;
      }

      function applyReaderTheme(theme, persist = true) {
        readerTheme = theme === 'dark' ? 'dark' : 'light';
        if (readerModal) {
          readerModal.classList.toggle('reader-dark', readerTheme === 'dark');
        }
        if (persist) {
          safeStorageSet('bmsReaderTheme', readerTheme);
        }
        updateReaderThemeButtons();
        if (epubRendition && epubRendition.themes) {
          try {
            epubRendition.themes.register('bms-dark', {
              'html, body': {
                background: '#0f1115 !important',
                color: '#e5e7eb !important',
                margin: '0 !important',
                padding: '0 !important',
                overflow: 'hidden !important',
              },
              'body *': {
                color: '#e5e7eb !important',
              },
              a: {
                color: '#93c5fd !important',
              },
            });
            epubRendition.themes.register('bms-light', {
              'html, body': {
                background: '#f8f5ef !important',
                color: '#111827 !important',
                margin: '0 !important',
                padding: '0 !important',
                overflow: 'hidden !important',
              },
              'body *': {
                color: '#111827 !important',
              },
              a: {
                color: '#0f172a !important',
              },
            });
            epubRendition.themes.select(readerTheme === 'dark' ? 'bms-dark' : 'bms-light');
          } catch {
            // ignore theme errors
          }
        }
        applyReadiumTheme();
      }

      function applyReadiumTheme() {
        if (!readerView || !readiumNavigator) return;
        const css =
          readerTheme === 'dark'
            ? 'html,body{background:#0f1115 !important;color:#e5e7eb !important;margin:0 !important;padding:0 !important;width:100% !important;max-width:100% !important;} body *{color:#e5e7eb !important;} a{color:#93c5fd !important;} img,svg,video{max-width:100% !important;height:auto !important;}'
            : 'html,body{background:#f8f5ef !important;color:#111827 !important;margin:0 !important;padding:0 !important;width:100% !important;max-width:100% !important;} body *{color:#111827 !important;} a{color:#0f172a !important;} img,svg,video{max-width:100% !important;height:auto !important;}';
        readerView.querySelectorAll('iframe').forEach((iframe) => {
          try {
            const doc = iframe.contentDocument;
            if (!doc) return;
            let style = doc.getElementById('bms-readium-theme');
            if (!style) {
              style = doc.createElement('style');
              style.id = 'bms-readium-theme';
              (doc.head || doc.documentElement).appendChild(style);
            }
            style.textContent = css;
          } catch {
            // ignore cross-origin
          }
        });
      }

      async function applyReadiumPreferences() {
        if (!readiumNavigator) return;
        try {
          const Prefs = window.ReadiumNavigator?.EpubPreferences ?? window.ReadiumNavigator?.WebPubPreferences;
          if (!Prefs) return;
          await readiumNavigator.submitPreferences(
            new Prefs({
              fontSize: 1.0,
              lineHeight: 1.5,
              textAlign: 'left',
              hyphens: false,
              textNormalization: true,
              scroll: false,
              columnCount: 1,
              minimalLineLength: 20,
              optimalLineLength: 55,
              maximalLineLength: 65,
            }),
          );
          try {
            const editor = readiumNavigator.preferencesEditor;
            if (editor?.preferences) {
              await readiumNavigator.submitPreferences(editor.preferences);
            }
          } catch {
            // ignore preference editor errors
          }
        } catch {
          // ignore preference errors
        }
      }

      function setReaderUiVisible(visible) {
        if (!readerModal) return;
        readerUiVisible = Boolean(visible);
        readerModal.classList.toggle('reader-ui-visible', visible);
        readerModal.classList.toggle('reader-ui-hidden', !visible);
      }

      function updateReaderLayout() {
        if (!readerView) return;
        const card = readerView.closest('.reader-card');
        if (!card) return;
        const header = card.querySelector('.reader-header');
        const controls = card.querySelector('.reader-controls');
        const headerHeight = header ? header.getBoundingClientRect().height : 0;
        const controlsHeight = controls ? controls.getBoundingClientRect().height : 0;
        const available = card.clientHeight - headerHeight - controlsHeight;
        if (available > 0) {
          readerView.style.height = Math.floor(available) + 'px';
        } else {
          readerView.style.height = '100%';
        }
      }

      function toggleReaderUi() {
        if (!readerModal) return;
        setReaderUiVisible(!readerUiVisible);
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

        const resolveSectionIndex = () => {
          const direct = start?.index ?? location?.index;
          if (typeof direct === 'number') {
            return direct;
          }
          const href = start?.href ?? location?.href;
          if (href && epubBook?.spine?.get) {
            try {
              const item = epubBook.spine.get(href);
              if (item && typeof item.index === 'number') {
                return item.index;
              }
            } catch {
              // ignore
            }
          }
          if (href && epubBook?.spine?.items) {
            const index = epubBook.spine.items.findIndex((item) => item?.href === href);
            return index >= 0 ? index : null;
          }
          return null;
        };

        const displayedInfo = (() => {
          const displayed = start?.displayed ?? location?.displayed;
          const page = displayed?.page;
          const total = displayed?.total;
          if (page == null) {
            return null;
          }
          const sectionIndex = resolveSectionIndex();
          if (sectionIndex == null) {
            const fallbackPage = readerLastGlobalPage ?? page;
            readerLastGlobalPage = fallbackPage;
            return { page: fallbackPage, total: null };
          }

          if (readerLastGlobalPage == null) {
            const baselineOffset = 1 - page;
            readerSectionOffsets.set(sectionIndex, baselineOffset);
            readerLastSectionIndex = sectionIndex;
            readerLastGlobalPage = 1;
            return { page: 1, total: null };
          }

          if (total && total > 0) {
            readerSectionTotals.set(sectionIndex, total);
          }

          if (!readerSectionOffsets.has(sectionIndex)) {
            if (sectionIndex === 0) {
              readerSectionOffsets.set(sectionIndex, 0);
            } else if (
              readerSectionOffsets.has(sectionIndex - 1) &&
              readerSectionTotals.has(sectionIndex - 1)
            ) {
              const prevOffset = readerSectionOffsets.get(sectionIndex - 1) ?? 0;
              const prevTotal = readerSectionTotals.get(sectionIndex - 1) ?? 0;
              readerSectionOffsets.set(sectionIndex, prevOffset + prevTotal);
            }
          }

          let offset = readerSectionOffsets.get(sectionIndex);
          if (offset == null) {
            if (readerLastSectionIndex == null) {
              offset = 0;
            } else if (sectionIndex === readerLastSectionIndex) {
              offset = (readerLastGlobalPage ?? page) - (page - 1);
            } else if (sectionIndex > readerLastSectionIndex) {
              offset = (readerLastGlobalPage ?? 0);
            } else {
              offset = 0;
            }
            offset = Math.max(0, offset);
            readerSectionOffsets.set(sectionIndex, offset);
          }

          let globalPage = offset + page;
          if (readerLastGlobalPage != null && readerNavPending !== 0) {
            if (readerNavPending > 0) {
              globalPage = readerLastGlobalPage + 1;
              readerNavPending -= 1;
              readerSectionOffsets.set(sectionIndex, globalPage - page);
            } else if (readerNavPending < 0) {
              globalPage = Math.max(1, readerLastGlobalPage - 1);
              readerNavPending += 1;
              readerSectionOffsets.set(sectionIndex, globalPage - page);
            }
          }

          readerLastSectionIndex = sectionIndex;
          readerLastGlobalPage = globalPage;

          let totalPages = null;
          const spineLength = epubBook?.spine?.items?.length ?? epubBook?.spine?.length ?? 0;
          if (spineLength && readerSectionTotals.size >= spineLength) {
            let sum = 0;
            let complete = true;
            for (let i = 0; i < spineLength; i += 1) {
              const sectionTotal = readerSectionTotals.get(i);
              if (!sectionTotal) {
                complete = false;
                break;
              }
              sum += sectionTotal;
            }
            if (complete) {
              totalPages = sum;
            }
          }
          return { page: globalPage, total: totalPages };
        })();

        if (displayedInfo?.page) {
          pageText = 'Page ' + displayedInfo.page + (displayedInfo.total ? ' / ' + displayedInfo.total : '');
        } else if (cfi && epubBook && epubBook.locations && epubLocationsReady) {
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
        persistReaderPageMap();
      }

      function animatePageTurn(direction) {
        if (!readerView) return;
        if (isTouchDevice()) {
          return;
        }
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

      async function openReader(file, title, engine) {
        if (!readerModal || !readerView) {
          return;
        }
        await ensureFreshToken();
        resetReaderState();
        readerEngine = engine || 'epubjs';
        debugReaderLog('open_reader', {
          fileId: file?.id ?? null,
          format: file?.format ?? null,
          engine: readerEngine,
          streamUrl: file?.streamUrl ?? null,
        });
        readerModal.classList.add('active');
        readerModal.setAttribute('aria-hidden', 'false');
        readerModal.dataset.readerMode =
          file.format === '.epub'
            ? (readerEngine === 'readium' ? 'readium' : 'epub')
            : (file.format === '.pdf' ? 'pdf' : 'other');
        const touchFullscreen = isTouchDevice() && file.format === '.epub';
        readerModal.classList.toggle('touch-fullscreen', touchFullscreen);
        readerModal.classList.toggle('touch-enabled', isTouchDevice());
        setReaderUiVisible(true);
        updateReaderLayout();
        if (touchFullscreen && !readerHistoryPushed) {
          readerHistoryPushed = true;
          history.pushState({ reader: true }, '', window.location.pathname + window.location.search);
        }
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
        readerFile = file;
        loadReaderPageMap(file.id);
        readerView.innerHTML = '<div class="empty">Loading reader...</div>';
        const storedTheme = safeStorageGet('bmsReaderTheme');
        readerTheme = storedTheme === 'dark' ? 'dark' : 'light';
        applyReaderTheme(readerTheme, false);

        const format = file.format;
        if (format === '.pdf') {
          openPdfReader(file);
          return;
        }
        if (format === '.epub') {
          if (readerEngine === 'readium') {
            debugReaderLog('readium_call');
            openReadiumReader(file)
              .then((ok) => {
                debugReaderLog('readium_result', { ok });
                if (!ok) {
                  const forceReadium = window.__BMS_FORCE_READIUM === true;
                  debugReaderLog('readium_fallback', { forceReadium });
                  if (!forceReadium) {
                    openEpubReader(file);
                  }
                }
              })
              .catch((error) => {
                debugReaderLog('readium_error', {
                  message: error?.message ?? String(error),
                });
                const forceReadium = window.__BMS_FORCE_READIUM === true;
                if (!forceReadium) {
                  openEpubReader(file);
                }
              });
          } else {
            openEpubReader(file);
          }
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
        readerModal.classList.remove('touch-enabled');
        readerModal.classList.remove('reader-ui-visible');
        readerModal.classList.remove('active');
        readerModal.setAttribute('aria-hidden', 'true');
        if (readerBodyOverflow != null) {
          document.body.style.overflow = readerBodyOverflow;
          readerBodyOverflow = null;
        }
        updateReaderProgress('');
        if (readerHistoryPushed) {
          readerHistoryPushed = false;
          try {
            history.replaceState({}, '', window.location.pathname + window.location.search);
          } catch {
            // ignore
          }
        }
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

        loadProgress('ebook-pdf', file.id).then((saved) => {
        const url = withToken(file.streamUrl);
        readerView.innerHTML = '<div class="empty">Loading PDF...</div>';
        pdfjsLib.getDocument(url).promise.then((doc) => {
          pdfDoc = doc;
          pdfPage = saved?.page ?? 1;
          if (pdfPage < 1) pdfPage = 1;
          if (pdfPage > pdfDoc.numPages) pdfPage = pdfDoc.numPages;
          renderPdfPage();
          loadAndApplyServerProgress('ebook-pdf', file.id);
        }).catch(() => {
          readerView.innerHTML = '<div class="empty">Unable to load PDF.</div>';
        });
        }).catch(() => {
          const url = withToken(file.streamUrl);
          readerView.innerHTML = '<div class="empty">Loading PDF...</div>';
          pdfjsLib.getDocument(url).promise.then((doc) => {
            pdfDoc = doc;
            pdfPage = 1;
            renderPdfPage();
            loadAndApplyServerProgress('ebook-pdf', file.id);
          }).catch(() => {
            readerView.innerHTML = '<div class="empty">Unable to load PDF.</div>';
          });
        });
      }

      function updateReadiumProgress(locator) {
        if (!locator) return;
        const href = locator?.href ?? null;
        const normalizedHref = href ? href.replace(/^https?:\\/\\/[^/]+\\//, '') : null;
        const totalPages = readiumPositions?.length || null;
        let pageIndex = null;
        const positionValue =
          typeof locator?.locations?.position === 'number' ? locator.locations.position : null;
        if (positionValue && totalPages) {
          pageIndex = Math.min(Math.max(positionValue, 1), totalPages);
        } else if (normalizedHref && totalPages) {
          const matchIndex = readiumPositions.findIndex((entry) => entry?.href === normalizedHref);
          if (matchIndex >= 0) {
            pageIndex = matchIndex + 1;
          }
        }
        const percent = totalPages && pageIndex ? Math.round((pageIndex / totalPages) * 100) : null;
        const parts = [];
        if (pageIndex && totalPages) {
          parts.push('Page ' + pageIndex + ' / ' + totalPages);
        }
        if (typeof percent === 'number') {
          parts.push(percent + '%');
        }
        if (!parts.length) {
          const progression =
            typeof locator.locations?.totalProgression === 'number'
              ? locator.locations.totalProgression
              : locator.locations?.progression;
          if (typeof progression === 'number') {
            parts.push('Location ' + Math.round(progression * 100) + '%');
          }
        }
        updateReaderProgress(parts.join(' · '));
      }

      function createReadiumFetcher(baseUrl, links) {
        const ReadiumShared = window.ReadiumShared;
        if (!ReadiumShared) {
          return null;
        }
        const client = (input, init) => readiumFetch(input, init);
        const normalizedLinks = (links || [])
          .filter((link) => link && link.href)
          .map((link) => ({
            ...link,
            href: link.href.replace(/(#.*)$/, ''),
          }));
        return new ReadiumShared.HttpFetcher(client, baseUrl, normalizedLinks);
      }

      function ensureReadiumReady(timeoutMs = 3000) {
        if (window.ReadiumNavigator && window.ReadiumShared) {
          return Promise.resolve(true);
        }
        if (readiumReadyPromise) {
          return readiumReadyPromise;
        }
        readiumReadyPromise = new Promise((resolve) => {
          const start = Date.now();
          const timer = setInterval(() => {
            if (window.ReadiumNavigator && window.ReadiumShared) {
              clearInterval(timer);
              resolve(true);
              return;
            }
            if (Date.now() - start > timeoutMs) {
              clearInterval(timer);
              resolve(false);
            }
          }, 50);
        });
        return readiumReadyPromise;
      }

      async function openReadiumReader(file) {
        if (!readerView) {
          debugReaderLog('readium_missing_view');
          return false;
        }
        debugReaderLog('readium_enter');
        const ready = await ensureReadiumReady();
        if (!ready) {
          debugReaderLog('readium_not_ready');
          return false;
        }
        const ReadiumNavigator = window.ReadiumNavigator;
        const ReadiumShared = window.ReadiumShared;
        if (!ReadiumNavigator || !ReadiumShared) {
          debugReaderLog('readium_missing_globals');
          return false;
        }

        debugReaderLog('readium_open_start', {
          fileId: file?.id ?? null,
          format: file?.format ?? null,
          streamUrl: file?.streamUrl ?? null,
        });
        readerView.innerHTML = '<div class="empty">Loading EPUB...</div>';
        updateReaderLayout();
        const refreshFileFromDetail = async () => {
          const bookId = currentDetail?.id ?? detailModal?.dataset?.bookId;
          if (!bookId) {
            return false;
          }
          try {
            const response = await fetchWithAuth('/library/' + bookId);
            const body = await response.json();
            if (!response.ok || !body) {
              return false;
            }
            const updated = (body.ebookFiles || []).find((entry) => entry?.id === file?.id);
            if (!updated) {
              return false;
            }
            file.streamUrl = updated.streamUrl ?? file.streamUrl;
            file.fileName = updated.fileName ?? file.fileName;
            file.format = updated.format ?? file.format;
            return true;
          } catch {
            return false;
          }
        };

        const fetchManifest = async (retry = false, refreshed = false) => {
          const manifestTargets = getReadiumManifestUrl(file);
          readiumManifestUrl = manifestTargets.self;
          debugReaderLog('readium_manifest_url', {
            url: manifestTargets.self,
            fetch: manifestTargets.fetch,
            retry,
            refreshed,
          });
          const response = await readiumFetch(manifestTargets.fetch);
          if (!response.ok) {
            debugReaderLog('readium_manifest_status', { status: response.status, retry, refreshed });
            if (!retry && (response.status === 401 || response.status === 403 || response.status >= 500)) {
              const refreshedAuth = await refreshAuthToken();
              if (refreshedAuth) {
                return fetchManifest(true, refreshed);
              }
            }
            if (!refreshed) {
              const refreshedDetail = await refreshFileFromDetail();
              if (refreshedDetail) {
                return fetchManifest(retry, true);
              }
            }
            throw new Error('Failed to load Readium manifest');
          }
          return response.json();
        };

        let manifestJson = null;
        try {
          manifestJson = await fetchManifest(false);
        } catch {
          debugReaderLog('readium_manifest_error');
          readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          return false;
        }

        const manifest = ReadiumShared.Manifest.deserialize(manifestJson);
        if (!manifest) {
          debugReaderLog('readium_manifest_invalid');
          readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          return false;
        }
        const manifestSelf = toAbsoluteUrl(readiumManifestUrl);
        manifest.setSelfLink(manifestSelf);
        const manifestBase = manifestSelf.replace(/manifest\.json.*$/i, '');
        debugReaderLog('readium_manifest_self', { self: manifestSelf, base: manifestBase });

        const normalizeReadiumHref = (href) => {
          if (!href || typeof href !== 'string') return href;
          if (href.startsWith(manifestBase)) {
            const trimmed = href.slice(manifestBase.length);
            return trimmed.replace(/^\\//, '');
          }
          return href;
        };
        const normalizeReadiumLocator = (locator) => {
          if (!locator || !locator.href) return locator;
          const normalizedHref = normalizeReadiumHref(locator.href);
          if (!normalizedHref || normalizedHref === locator.href) return locator;
          try {
            return new ReadiumShared.Locator({
              href: normalizedHref,
              type: locator.type ?? 'text/html',
              title: locator.title,
              locations: locator.locations,
              text: locator.text,
            });
          } catch {
            return locator;
          }
        };
        const ensureReadiumPosition = (locator, positionFallback) => {
          if (!locator || !locator.href) return locator;
          const existing = locator.locations;
          const position =
            typeof existing?.position === 'number' && existing.position > 0
              ? existing.position
              : positionFallback;
          if (!position) return locator;
          try {
            return new ReadiumShared.Locator({
              href: locator.href,
              type: locator.type ?? 'text/html',
              title: locator.title,
              locations: new ReadiumShared.LocatorLocations({
                fragments: existing?.fragments,
                progression: existing?.progression,
                totalProgression: existing?.totalProgression,
                position,
                otherLocations: existing?.otherLocations,
              }),
              text: locator.text,
            });
          } catch {
            return locator;
          }
        };

        const allLinks = [];
        const seen = new Set();
        const resolveHref = (href) => {
          if (!href) return href;
          if (href.startsWith('http://') || href.startsWith('https://')) {
            try {
              const parsed = new URL(href);
              const host = (parsed.hostname || '').toLowerCase();
              if (host === '127.0.0.1' || host === '0.0.0.0' || host === 'localhost' || host === '::1') {
                const replacement = parsed.pathname + parsed.search + parsed.hash;
                return new URL(replacement, manifestBase).toString();
              }
              return parsed.toString();
            } catch {
              return href;
            }
          }
          try {
            return new URL(href, manifestBase).toString();
          } catch {
            return manifestBase + href.replace(/^\\//, '');
          }
        };
        const pushLink = (link) => {
          if (!link || !link.href) return;
          const resolvedHref = resolveHref(link.href);
          if (!resolvedHref) return;
          if (seen.has(resolvedHref)) return;
          seen.add(resolvedHref);
          allLinks.push({
            ...link,
            href: resolvedHref,
          });
        };
        const linkList = Array.isArray(manifest.links?.items) ? manifest.links.items : [];
        const readingOrderList = Array.isArray(manifest.readingOrder?.items)
          ? manifest.readingOrder.items
          : [];
        const resourceList = Array.isArray(manifest.resources?.items)
          ? manifest.resources.items
          : [];
        const resolveManifestRel = (rel) => {
          if (!rel) return [];
          return Array.isArray(rel) ? rel : [rel];
        };
        const findPositionListHref = () => {
          if (!Array.isArray(manifestJson?.links)) {
            return null;
          }
          const link = manifestJson.links.find((entry) => {
            const rels = resolveManifestRel(entry?.rel);
            return rels.includes('http://readium.org/position-list');
          });
          return link?.href ?? null;
        };
        linkList.forEach(pushLink);
        readingOrderList.forEach(pushLink);
        resourceList.forEach(pushLink);
        debugReaderLog('readium_manifest_links', {
          links: linkList.length,
          readingOrder: readingOrderList.length,
          resources: resourceList.length,
          total: allLinks.length,
        });

        // Force Readium assets to resolve under /readium instead of /pub.
        manifest.baseURL = manifestBase;
        const baseUrl = manifestBase;
        const fetcher = createReadiumFetcher(baseUrl, allLinks);
        if (!fetcher) {
          debugReaderLog('readium_fetcher_missing');
          readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          return false;
        }
        readiumPublication = new ReadiumShared.Publication({ manifest, fetcher });
        debugReaderLog('readium_publication_ready', { baseUrl });

        readerView.innerHTML = '';
        const container = document.createElement('div');
        container.className = 'readium-container';
        readerView.appendChild(container);
        debugReaderLog('readium_container_ready');

        let initialLocator = undefined;
        try {
          const saved = await loadProgress('ebook-epub', file.id);
          if (saved?.locator) {
            initialLocator = saved.locator;
          }
        } catch {
          initialLocator = undefined;
        }
        initialLocator = normalizeReadiumLocator(initialLocator);

        const listeners = {
          frameLoaded: () => {
            applyReadiumTheme();
            setTimeout(() => {
              applyReadiumTheme();
            }, 150);
            updateReaderLayout();
            debugReaderLog('readium_frame_loaded');
          },
          positionChanged: (locator) => {
            if (locator) {
              const normalized = normalizeReadiumLocator(locator);
              const positioned = ensureReadiumPosition(
                normalized,
                readiumPositions[0]?.locations?.position ?? 1,
              );
              readiumLastLocator = positioned ?? normalized ?? locator;
              saveProgress('ebook-epub', file.id, { locator: positioned });
              updateReadiumProgress(positioned ?? normalized ?? locator);
              debugReaderLog('readium_position_changed', {
                href: positioned?.href ?? normalized?.href ?? locator?.href ?? null,
                progression: (positioned ?? normalized ?? locator)?.locations?.progression ?? null,
                totalProgression: (positioned ?? normalized ?? locator)?.locations?.totalProgression ?? null,
                position: (positioned ?? normalized ?? locator)?.locations?.position ?? null,
              });
            }
          },
          tap: () => {
            toggleReaderUi();
            return true;
          },
          click: () => false,
          zoom: () => {},
          scroll: () => {},
          customEvent: () => {},
          handleLocator: () => false,
          textSelected: () => {},
        };

        readiumPositions = [];
        try {
          const positionHref = findPositionListHref();
          if (positionHref) {
            const positionsUrl = resolveHref(positionHref);
            if (positionsUrl) {
              const response = await readiumFetch(positionsUrl);
              if (response.ok) {
                const json = await response.json();
                const rawPositions = Array.isArray(json?.positions) ? json.positions : [];
                const parsed = rawPositions
                  .map((entry) => ReadiumShared.Locator.deserialize(entry))
                  .filter(Boolean);
                if (parsed.length) {
                  readiumPositions = parsed
                    .map((locator, index) =>
                      ensureReadiumPosition(normalizeReadiumLocator(locator), index + 1),
                    )
                    .filter(Boolean);
                }
              }
            }
          }
        } catch (error) {
          debugReaderLog('readium_positions_error', {
            message: error?.message ?? String(error),
          });
        }
        if (!readiumPositions.length) {
          try {
            const fetched = await readiumPublication.positionsFromManifest();
            if (Array.isArray(fetched) && fetched.length) {
              readiumPositions = fetched
                .map((locator, index) =>
                  ensureReadiumPosition(normalizeReadiumLocator(locator), index + 1),
                )
                .filter(Boolean);
            }
          } catch (error) {
            debugReaderLog('readium_positions_error', {
              message: error?.message ?? String(error),
            });
          }
        }
        if (!readiumPositions.length && readiumPublication?.readingOrder?.items?.length) {
          readiumPositions = readiumPublication.readingOrder.items
            .map((link, index) =>
              ensureReadiumPosition(
                normalizeReadiumLocator(
                  new ReadiumShared.Locator({
                    href: link.href,
                    type: link.type ?? 'text/html',
                    title: link.title,
                    locations: new ReadiumShared.LocatorLocations({ progression: 0 }),
                  }),
                ),
                index + 1,
              ),
            )
            .filter(Boolean);
        }

        if (!readiumPositions.length) {
          debugReaderLog('readium_positions_empty');
        }
        window.__bmsReadiumPositions = readiumPositions;
        if (initialLocator && readiumPositions.length) {
          const normalizedInitial = normalizeReadiumLocator(initialLocator);
          const match = readiumPositions.find((entry) => entry?.href === normalizedInitial?.href);
          if (match) {
            initialLocator = ensureReadiumPosition(normalizedInitial, match.locations?.position ?? 1);
          } else {
            initialLocator = ensureReadiumPosition(normalizedInitial, 1);
          }
        } else if (readiumPositions.length) {
          initialLocator = readiumPositions[0];
        }

        const Prefs = ReadiumNavigator.EpubPreferences ?? ReadiumNavigator.WebPubPreferences;
        const Defaults = ReadiumNavigator.EpubDefaults ?? ReadiumNavigator.WebPubDefaults;
        readiumNavigator = new ReadiumNavigator.EpubNavigator(
          container,
          readiumPublication,
          listeners,
          readiumPositions,
          initialLocator,
          {
            preferences: new Prefs({
              iOSPatch: true,
              iPadOSPatch: true,
              textNormalization: true,
              fontSize: 1.0,
              lineHeight: 1.5,
              textAlign: 'left',
              hyphens: false,
              scroll: false,
              columnCount: 1,
              minimalLineLength: 20,
              optimalLineLength: 55,
              maximalLineLength: 65,
            }),
            defaults: new Defaults({
              iOSPatch: true,
              iPadOSPatch: true,
              textNormalization: true,
              fontSize: 1.0,
              lineHeight: 1.5,
              textAlign: 'left',
              hyphens: false,
              scroll: false,
              columnCount: 1,
              minimalLineLength: 20,
              optimalLineLength: 55,
              maximalLineLength: 65,
            }),
          },
        );
        debugReaderLog('readium_nav_ready');

        try {
          await readiumNavigator.load();
          await applyReadiumPreferences();
          applyReadiumTheme();
          debugReaderLog('readium_load_ok');
        } catch (error) {
          debugReaderLog('readium_load_error', {
            message: error?.message ?? String(error),
          });
          readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          return false;
        }

        return true;
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

      async function openEpubReader(file) {
        if (!readerView) return;
        if (!window['ePub'] || !window['JSZip']) {
          readerView.innerHTML = '<div class="empty">EPUB reader unavailable.</div>';
          return;
        }

        readerView.innerHTML = '<div class="empty">Loading EPUB...</div>';
        updateReaderLayout();
        const timeout = setTimeout(() => {
          if (!epubRendition && readerView) {
            readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          }
        }, 8000);

        let saved = null;
        try {
          saved = await loadProgress('ebook-epub', file.id);
        } catch {
          saved = null;
        }

        const mountRendition = (book) => {
          if (!readerView) {
            return;
          }
          readerView.innerHTML = '';
          const width = readerView.clientWidth || readerView.offsetWidth;
          const height = readerView.clientHeight || readerView.offsetHeight;
          epubRendition = book.renderTo(readerView, {
            width: width || '100%',
            height: height || '100%',
          });
          if (epubRendition.flow) {
            try {
              epubRendition.flow('paginated');
            } catch {
              // ignore
            }
          }
          if (epubRendition.spread) {
            try {
              epubRendition.spread('none');
            } catch {
              // ignore
            }
          }
          applyReaderTheme(readerTheme, false);
          if (!readerResizeBound) {
            readerResizeBound = true;
            window.addEventListener('resize', () => {
              updateReaderLayout();
              if (epubRendition) {
                try {
                  epubRendition.resize();
                } catch {
                  // ignore
                }
              }
            });
            window.addEventListener('orientationchange', () => {
              updateReaderLayout();
              if (epubRendition) {
                try {
                  epubRendition.resize();
                } catch {
                  // ignore
                }
              }
            });
          }

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
              try {
                epubRendition.resize();
              } catch {
                // ignore
              }
              setTimeout(() => {
                if (!readerView || !epubRendition) return;
                const iframe = readerView.querySelector('iframe');
                const bodyText = iframe?.contentDocument?.body?.innerText?.trim?.() ?? '';
                if (!bodyText) {
                  try {
                    epubRendition.display(displayTarget);
                    epubRendition.resize();
                  } catch {
                    // ignore
                  }
                }
              }, 400);
            });
          }
          epubRendition.on('relocated', (location) => {
            if (location?.start?.cfi) {
              saveProgress('ebook-epub', file.id, { cfi: location.start.cfi });
            }
            updateEpubPageNumbers(location);
            try {
              epubRendition.resize();
            } catch {
              // ignore
            }
          });
          epubRendition.on('rendered', (_section, view) => {
            const iframeEl = view?.iframe ?? view?.element?.querySelector?.('iframe') ?? view;
            if (iframeEl) {
              try {
                const doc = iframeEl.contentDocument;
                if (doc?.body) {
                  doc.body.style.margin = '0';
                  doc.body.style.padding = '0';
                }
                attachSwipeTarget(doc?.body || doc?.documentElement);
              } catch {
                // ignore
              }
              attachSwipeToIframe(iframeEl);
            }
            applyReaderTheme(readerTheme, false);
            scanReaderIframes();
          });
          setTimeout(() => {
            try {
              epubRendition.resize();
            } catch {
              // ignore
            }
          }, 120);
        };

        const openFromUrl = async (url) => {
          try {
            epubBook = window['ePub'](url, { openAs: 'epub' });
            if (epubBook?.ready) {
              await epubBook.ready;
            }
            clearTimeout(timeout);
            mountRendition(epubBook);
            prepareEpubLocations();
            return true;
          } catch {
            return false;
          }
        };

        try {
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
            const fallbackOk = await openFromUrl(withToken(file.streamUrl));
            if (!fallbackOk) {
              throw new Error('Failed to load EPUB');
            }
            loadAndApplyServerProgress('ebook-epub', file.id);
            return;
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
          loadAndApplyServerProgress('ebook-epub', file.id);
        } catch {
          const fallbackOk = await openFromUrl(withToken(file.streamUrl));
          if (fallbackOk) {
            loadAndApplyServerProgress('ebook-epub', file.id);
            return;
          }
          clearTimeout(timeout);
          if (readerView) {
            readerView.innerHTML = '<div class="empty">Unable to load EPUB.</div>';
          }
        }
      }

      function applySyncedProgress(kind, data) {
        if (!readerFile || !data) {
          return;
        }
        if (kind === 'ebook-pdf' && typeof data.page === 'number') {
          pdfPage = Math.max(1, data.page);
          if (pdfDoc && pdfPage > pdfDoc.numPages) {
            pdfPage = pdfDoc.numPages;
          }
          renderPdfPage();
        } else if (kind === 'ebook-epub') {
          if (data.locator && readiumNavigator) {
            try {
              readiumNavigator.go(data.locator, false, () => {});
            } catch {
              // ignore
            }
          } else if (data.cfi && epubRendition) {
            try {
              epubRendition.display(data.cfi);
            } catch {
              // ignore
            }
          }
        } else if (kind === 'audio' && typeof data.time === 'number') {
          const player = document.querySelector('.detail-player');
          if (player) {
            try {
              player.currentTime = data.time;
            } catch {}
          }
        }
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
          loadProgress('audio', activeFile.id).then((saved) => {
            if (saved?.time) {
              player.currentTime = Math.min(saved.time, Math.max(0, player.duration - 1));
            }
          }).catch(() => {});
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
              if (file.format === '.epub') {
                openReader(file, detailTitle?.textContent, 'readium');
              } else {
                openReader(file, detailTitle?.textContent, 'epubjs');
              }
            });
            actions.appendChild(readButton);
            if (file.format === '.epub' && legacyEpubEnabled) {
              const legacyButton = document.createElement('button');
              legacyButton.textContent = 'Legacy Read';
              legacyButton.addEventListener('click', () => {
                openReader(file, detailTitle?.textContent, 'epubjs');
              });
              actions.appendChild(legacyButton);
            }
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
          detailCheckout.textContent = data?.checkedOutByMe ? 'Return to Library' : '+ My Library';
        }
        if (detailReadToggle) {
          detailReadToggle.style.display = state.token ? 'inline-flex' : 'none';
          detailReadToggle.textContent = data?.readByMe ? 'Mark Unread' : 'Mark Read';
        }
        if (detailCheckoutStatus) {
          detailCheckoutStatus.textContent = '';
        }
        if (detailDownloadStatus) {
          detailDownloadStatus.textContent = formatDownloadStatus(data?.downloadStatus);
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
        if (detailDownloadStatus) detailDownloadStatus.textContent = '';
        if (detailCheckout) {
          detailCheckout.textContent = '+ My Library';
          detailCheckout.style.display = state.token ? 'inline-flex' : 'none';
        }
        if (detailReadToggle) {
          detailReadToggle.textContent = 'Mark Read';
          detailReadToggle.style.display = state.token ? 'inline-flex' : 'none';
        }
        currentDetail = null;

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
        const action = currentDetail?.checkedOutByMe ? 'return' : 'checkout';
        if (detailCheckoutStatus) {
          detailCheckoutStatus.textContent =
            action === 'return' ? 'Returning book...' : 'Adding to My Library...';
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
              detailCheckoutStatus.textContent = action === 'return' ? 'Returned.' : 'Added to My Library.';
            }
          })
          .catch(() => {
            if (detailCheckoutStatus) {
              detailCheckoutStatus.textContent = 'Unable to update checkout status.';
            }
          });
      }

      async function toggleReadStatus() {
        if (!detailModal || !detailModal.dataset.bookId) {
          return;
        }
        const shouldRead = !currentDetail?.readByMe;
        if (detailCheckoutStatus) {
          detailCheckoutStatus.textContent = shouldRead ? 'Marking as read...' : 'Marking as unread...';
        }

        await ensureFreshToken();
        fetchWithAuth('/library/' + detailModal.dataset.bookId + '/read', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ read: shouldRead }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              if (detailCheckoutStatus) {
                detailCheckoutStatus.textContent =
                  body?.message ?? 'Unable to update read status.';
              }
              return;
            }
            renderBookDetail(body);
            loadLibrary();
            loadMyLibrary();
            if (detailCheckoutStatus) {
              detailCheckoutStatus.textContent = shouldRead ? 'Marked as read.' : 'Marked as unread.';
            }
          })
          .catch(() => {
            if (detailCheckoutStatus) {
              detailCheckoutStatus.textContent = 'Unable to update read status.';
            }
          });
      }

      function closeBookDetail() {
        if (!detailModal) return;
        detailModal.classList.remove('active');
        detailModal.setAttribute('aria-hidden', 'true');
      }

      function loadBookdarrConfig() {
        setBookdarrEnabled(true);
        fetchWithAuth('/settings/bookdarr')
          .then((response) => response.json())
          .then((data) => {
            bookdarrConfigured = Boolean(data?.configured);
            if (settingsBookdarrIndicator) {
              settingsBookdarrIndicator.textContent = data?.configured ? 'Configured' : 'Not configured';
            }
            if (settingsBookdarrDot) {
              settingsBookdarrDot.className = 'dot ' + (data?.configured ? 'ok' : 'warn');
            }
            if (settingsBookdarrTitleDot) {
              settingsBookdarrTitleDot.className = 'dot ' + (data?.configured ? 'warn' : 'warn');
            }
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
            if (data?.configured) {
              bookdarrStatus.textContent = 'Bookdarr is connected.';
              loadLibrary();
              loadMyLibrary();
            }
            updateWizardVisibility();
            if (data?.configured) {
              testBookdarrConnection(false);
            }
            syncBookdarrPortState(bookdarrPort, bookdarrHttps);
            syncBookdarrPortState(settingsBookdarrPort, settingsBookdarrHttps);
          })
          .catch(() => {
            bookdarrConfigured = false;
            bookdarrStatus.textContent = 'Unable to load Bookdarr settings.';
            updateWizardVisibility();
          });
      }

      function renderAccounts(users) {
        if (!accountsList) {
          return;
        }
        state.users = Array.isArray(users) ? users : [];
        populateAdminSelect(state.users);
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

      function populateAdminSelect(users) {
        if (!adminUserSelect) {
          return;
        }
        adminUserSelect.innerHTML = users
          .filter((user) => !user.isAdmin)
          .map((user) =>
            '<option value="' + user.id + '">' + (user.username || user.email) + '</option>',
          )
          .join('');
      }

      function loadAccounts() {
        if (activePage !== 'accounts') {
          return;
        }
        if (!state.isAdmin) {
          if (accountsStatus) {
            accountsStatus.textContent = 'Admin access required to view all users.';
          }
          if (accountsList) {
            accountsList.innerHTML = '';
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

      function loadTwoFactorStatus() {
        if (activePage !== 'accounts') {
          return;
        }
        fetchWithAuth('/auth/2fa/status')
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              if (twoFactorStatus) twoFactorStatus.textContent = 'Unable to load 2FA status.';
              return;
            }
            const enabled = Boolean(body?.enabled);
            if (twoFactorStatus) {
              twoFactorStatus.textContent = enabled
                ? 'Two-factor authentication is enabled.'
                : 'Two-factor authentication is disabled.';
            }
            if (twoFactorDisable) {
              twoFactorDisable.disabled = !enabled;
            }
          })
          .catch(() => {
            if (twoFactorStatus) twoFactorStatus.textContent = 'Unable to load 2FA status.';
          });
      }

      function loadCurrentUser() {
        fetchWithAuth('/api/me')
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              debugAuthLog('api_me_not_ok', { status: body?.status ?? null });
              updateUserMenu(null);
              state.userId = null;
              return;
            }
            debugAuthLog('api_me_ok', { userId: body?.id ?? null });
            updateUserMenu(body);
            state.userId = body?.id ?? null;
          })
          .catch(() => {
            if (bootstrap?.user) {
              debugAuthLog('api_me_error_fallback_bootstrap', { userId: bootstrap?.user?.id ?? null });
              updateUserMenu(bootstrap.user);
              state.userId = bootstrap.user.id ?? null;
              return;
            }
            debugAuthLog('api_me_error_signed_out');
            updateUserMenu(null);
            state.userId = null;
          });
      }

      function updateWizardVisibility() {
        if (!wizardPanel || activePage !== 'library') {
          return;
        }
        if (setupRequired) {
          wizardPanel.style.display = 'block';
          return;
        }
        if (!state.token) {
          wizardPanel.style.display = 'none';
          return;
        }
        wizardPanel.style.display = bookdarrConfigured ? 'none' : 'block';
      }

      function handleSetupStatus(data) {
        setupRequired = Boolean(data?.required);
        if (data?.required) {
          setupPanel.style.display = 'block';
          bookdarrPanel.style.display = 'block';
          setBookdarrEnabled(false);
          updateWizardVisibility();
        } else {
          setupPanel.style.display = 'none';
          bookdarrPanel.style.display = 'block';
          updateWizardVisibility();
          if (!isAuthenticated() && !isLoginPage) {
            setAuthCookie(false);
            window.location.href = '/login';
          }
        }

        if (isLoginPage && loginPageStatus) {
          loginPageStatus.textContent = data?.required
            ? 'No users yet. Complete first-run setup.'
            : '';
        }
      }

      loadSmtpConfig();
      loadReaderConfig();

      setupButton?.addEventListener('click', () => {
        const username = document.getElementById('setup-username').value;
        const email = setupEmail?.value;
        const password = document.getElementById('setup-password').value;
        setupStatus.textContent = 'Creating user...';

        fetch('/auth/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
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
        const otp = loginPageOtp?.value;
        loginPageStatus.textContent = 'Signing in...';
        fetch('/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ username, password, otp }),
        })
          .then((response) =>
            response.json().then((body) => ({ ok: response.ok, status: response.status, body })),
          )
          .then(({ ok, status, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Login failed.';
              loginPageStatus.textContent = message;
              if (body?.twoFactorRequired || message.toLowerCase().includes('two-factor') || status === 401) {
                if (loginPageOtpField) loginPageOtpField.style.display = 'block';
                if (loginPageOtp) loginPageOtp.focus();
              }
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

      loginPageOtp?.addEventListener('keydown', (event) => {
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

      function showResetPanel(show) {
        if (!resetPanel) return;
        resetPanel.style.display = show ? 'block' : 'none';
        if (loginPageSubmit) loginPageSubmit.style.display = show ? 'none' : 'inline-block';
        if (loginForgot) loginForgot.style.display = show ? 'none' : 'inline-block';
      }

      loginForgot?.addEventListener('click', () => {
        showResetPanel(true);
      });

      resetCancelButton?.addEventListener('click', () => {
        showResetPanel(false);
      });

      resetRequestButton?.addEventListener('click', () => {
        const email = resetEmail?.value;
        if (resetStatus) resetStatus.textContent = 'Sending reset email...';
        fetch('/auth/password/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ email }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to send reset email.';
              if (resetStatus) resetStatus.textContent = message;
              return;
            }
            if (resetStatus) resetStatus.textContent = 'Reset email sent.';
          })
          .catch(() => {
            if (resetStatus) resetStatus.textContent = 'Unable to send reset email.';
          });
      });

      resetSubmitButton?.addEventListener('click', () => {
        const token = resetToken?.value;
        const newPassword = resetPassword?.value;
        const confirm = resetPasswordConfirm?.value;
        if (newPassword !== confirm) {
          if (resetStatus) resetStatus.textContent = 'Passwords do not match.';
          return;
        }
        if (resetStatus) resetStatus.textContent = 'Resetting password...';
        fetch('/auth/password/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ token, newPassword }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to reset password.';
              if (resetStatus) resetStatus.textContent = message;
              return;
            }
            if (resetStatus) resetStatus.textContent = 'Password reset. You can sign in.';
            showResetPanel(false);
          })
          .catch(() => {
            if (resetStatus) resetStatus.textContent = 'Unable to reset password.';
          });
      });

      if (isLoginPage) {
        const resetParam = new URLSearchParams(window.location.search).get('reset');
        if (resetParam) {
          showResetPanel(true);
          if (resetToken) resetToken.value = resetParam;
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
        fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(refreshToken ? { refreshToken } : {}),
        })
          .finally(() => {
            setAuth(null);
            window.location.href = '/login';
          });
      });

      profileButton?.addEventListener('click', () => {
        window.location.href = '/accounts';
      });

      saveSmtpButton?.addEventListener('click', () => {
        const host = settingsSmtpHost?.value?.trim();
        const port = Number(settingsSmtpPort?.value);
        const user = settingsSmtpUser?.value?.trim();
        const fromName = settingsSmtpFromName?.value?.trim();
        const pass = settingsSmtpPass?.value;
        const from = settingsSmtpFrom?.value?.trim();
        if (settingsSmtpStatus) {
          settingsSmtpStatus.textContent = 'Saving...';
        }
        fetchWithAuth('/settings/smtp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ host, port, user, pass, from, fromName }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to save SMTP settings.';
              if (settingsSmtpStatus) settingsSmtpStatus.textContent = message;
              return;
            }
            if (settingsSmtpStatus) settingsSmtpStatus.textContent = 'SMTP settings saved.';
            if (settingsSmtpPass) settingsSmtpPass.value = '';
          })
          .catch(() => {
            if (settingsSmtpStatus) settingsSmtpStatus.textContent = 'Save failed.';
          });
      });

      testSmtpButton?.addEventListener('click', () => {
        const host = settingsSmtpHost?.value?.trim();
        const port = Number(settingsSmtpPort?.value);
        const user = settingsSmtpUser?.value?.trim();
        const fromName = settingsSmtpFromName?.value?.trim();
        const pass = settingsSmtpPass?.value;
        const from = settingsSmtpFrom?.value?.trim();
        if (settingsSmtpStatus) {
          settingsSmtpStatus.textContent = 'Sending test email...';
        }
        setSmtpTitleDot('warn');
        fetchWithAuth('/settings/smtp/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ host, port, user, pass, from, fromName }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok || !body?.ok) {
              const message = body?.message ?? 'Test email failed.';
              if (settingsSmtpStatus) settingsSmtpStatus.textContent = message;
              setSmtpTitleDot('warn');
              return;
            }
            if (settingsSmtpStatus) settingsSmtpStatus.textContent = 'Test email sent.';
            setSmtpTitleDot('ok');
          })
          .catch(() => {
            if (settingsSmtpStatus) settingsSmtpStatus.textContent = 'Test email failed.';
            setSmtpTitleDot('warn');
          });
      });

      saveBookdarrButton?.addEventListener('click', () => {
        const host = settingsBookdarrHost?.value;
        const portValue = settingsBookdarrPort?.value;
        const port = portValue ? Number(portValue) : undefined;
        const apiKey = settingsBookdarrKey?.value;
        const useHttps = settingsBookdarrHttps?.checked;
        settingsBookdarrStatus.textContent = 'Saving...';
        fetchWithAuth('/settings/bookdarr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ host, port, apiKey, useHttps }),
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

      function setBookdarrIndicator(state, message) {
        if (settingsBookdarrIndicator) {
          settingsBookdarrIndicator.textContent = message;
        }
        if (settingsBookdarrDot) {
          settingsBookdarrDot.className = 'dot ' + state;
        }
      }

      function setBookdarrTitleDot(state) {
        if (settingsBookdarrTitleDot) {
          settingsBookdarrTitleDot.className = 'dot ' + state;
        }
      }

      function setSmtpTitleDot(state) {
        if (settingsSmtpTitleDot) {
          settingsSmtpTitleDot.className = 'dot ' + state;
        }
      }

      function testBookdarrConnection(includeInput) {
        const payload = includeInput
          ? {
              host: settingsBookdarrHost?.value,
              port: Number(settingsBookdarrPort?.value),
              apiKey: settingsBookdarrKey?.value,
              useHttps: settingsBookdarrHttps?.checked,
            }
          : undefined;
        if (includeInput) {
          settingsBookdarrStatus.textContent = 'Testing connection...';
          setBookdarrIndicator('warn', 'Testing...');
        }
        setBookdarrTitleDot('warn');
        fetchWithAuth('/settings/bookdarr/test', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload ? JSON.stringify(payload) : JSON.stringify({}),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok || !body?.ok) {
              const message = body?.message ?? 'Connection failed.';
              if (includeInput) {
                settingsBookdarrStatus.textContent = message;
                setBookdarrIndicator('warn', 'Failed');
              }
              setBookdarrTitleDot('warn');
              return;
            }
            if (includeInput) {
              settingsBookdarrStatus.textContent = 'Connection successful.';
              setBookdarrIndicator('ok', 'Connected');
            }
            setBookdarrTitleDot('ok');
          })
          .catch(() => {
            if (includeInput) {
              settingsBookdarrStatus.textContent = 'Connection failed.';
              setBookdarrIndicator('warn', 'Failed');
            }
            setBookdarrTitleDot('warn');
          });
      }

      function testSmtpConfiguredConnection() {
        setSmtpTitleDot('warn');
        fetchWithAuth('/settings/smtp/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok || !body?.ok) {
              setSmtpTitleDot('warn');
              return;
            }
            setSmtpTitleDot('ok');
          })
          .catch(() => {
            setSmtpTitleDot('warn');
          });
      }

      function syncBookdarrPortState(portInput, httpsCheckbox) {
        if (!portInput || !httpsCheckbox) {
          return;
        }
        if (httpsCheckbox.checked) {
          if (!portInput.dataset.prevValue) {
            portInput.dataset.prevValue = portInput.value;
          }
          if (!portInput.value) {
            portInput.value = '443';
          }
          portInput.disabled = true;
        } else {
          portInput.disabled = false;
          if (portInput.dataset.prevValue) {
            portInput.value = portInput.dataset.prevValue;
            delete portInput.dataset.prevValue;
          }
        }
      }

      testBookdarrButton?.addEventListener('click', () => {
        testBookdarrConnection(true);
      });

      settingsBookdarrHttps?.addEventListener('change', () => {
        syncBookdarrPortState(settingsBookdarrPort, settingsBookdarrHttps);
      });

      bookdarrHttps?.addEventListener('change', () => {
        syncBookdarrPortState(bookdarrPort, bookdarrHttps);
      });

      bookdarrButton?.addEventListener('click', () => {
        const host = bookdarrHost.value;
        const portValue = bookdarrPort?.value;
        const port = portValue ? Number(portValue) : undefined;
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
            bookdarrConfigured = true;
            loadLibrary();
            loadMyLibrary();
            updateWizardVisibility();
          })
          .catch(() => {
            bookdarrStatus.textContent = 'Save failed.';
          });
      });

      createUserButton?.addEventListener('click', () => {
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

      adminResetTwoFactorButton?.addEventListener('click', () => {
        if (!adminUserSelect?.value) {
          if (adminActionsStatus) adminActionsStatus.textContent = 'Select a user first.';
          return;
        }
        if (adminActionsStatus) adminActionsStatus.textContent = 'Resetting 2FA...';
        fetchWithAuth('/api/users/' + adminUserSelect.value + '/reset-2fa', { method: 'POST' })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to reset 2FA.';
              if (adminActionsStatus) adminActionsStatus.textContent = message;
              return;
            }
            if (adminActionsStatus) adminActionsStatus.textContent = '2FA reset for selected user.';
            loadAccounts();
          })
          .catch(() => {
            if (adminActionsStatus) adminActionsStatus.textContent = 'Unable to reset 2FA.';
          });
      });

      adminResetPasswordButton?.addEventListener('click', () => {
        if (!adminUserSelect?.value) {
          if (adminActionsStatus) adminActionsStatus.textContent = 'Select a user first.';
          return;
        }
        const newPassword = adminResetPasswordInput?.value;
        if (!newPassword) {
          if (adminActionsStatus) adminActionsStatus.textContent = 'Enter a new password.';
          return;
        }
        if (adminActionsStatus) adminActionsStatus.textContent = 'Resetting password...';
        fetchWithAuth('/api/users/' + adminUserSelect.value + '/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to reset password.';
              if (adminActionsStatus) adminActionsStatus.textContent = message;
              return;
            }
            if (adminActionsStatus) adminActionsStatus.textContent = 'Password reset for selected user.';
            if (adminResetPasswordInput) adminResetPasswordInput.value = '';
          })
          .catch(() => {
            if (adminActionsStatus) adminActionsStatus.textContent = 'Unable to reset password.';
          });
      });

      saveProfileButton?.addEventListener('click', () => {
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

      twoFactorStart?.addEventListener('click', () => {
        if (twoFactorMessage) twoFactorMessage.textContent = 'Preparing 2FA setup...';
        fetchWithAuth('/auth/2fa/setup', { method: 'POST' })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to start 2FA setup.';
              if (twoFactorMessage) twoFactorMessage.textContent = message;
              return;
            }
            if (twoFactorQr) twoFactorQr.src = body?.qrDataUrl ?? '';
            if (twoFactorSecret) twoFactorSecret.textContent = body?.secret ?? '';
            if (twoFactorSetup) twoFactorSetup.style.display = 'block';
            if (twoFactorMessage) twoFactorMessage.textContent = 'Scan the QR code and enter the 6-digit code.';
          })
          .catch(() => {
            if (twoFactorMessage) twoFactorMessage.textContent = 'Unable to start 2FA setup.';
          });
      });

      twoFactorConfirm?.addEventListener('click', () => {
        const code = twoFactorCode?.value;
        if (twoFactorMessage) twoFactorMessage.textContent = 'Enabling 2FA...';
        fetchWithAuth('/auth/2fa/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to enable 2FA.';
              if (twoFactorMessage) twoFactorMessage.textContent = message;
              return;
            }
            if (twoFactorMessage) twoFactorMessage.textContent = 'Two-factor authentication enabled.';
            if (twoFactorSetup) twoFactorSetup.style.display = 'none';
            if (twoFactorCode) twoFactorCode.value = '';
            loadTwoFactorStatus();
          })
          .catch(() => {
            if (twoFactorMessage) twoFactorMessage.textContent = 'Unable to enable 2FA.';
          });
      });

      twoFactorDisable?.addEventListener('click', () => {
        const currentPassword = prompt('Enter your current password to disable 2FA:');
        if (!currentPassword) {
          return;
        }
        if (twoFactorMessage) twoFactorMessage.textContent = 'Disabling 2FA...';
        fetchWithAuth('/auth/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword }),
        })
          .then((response) => response.json().then((body) => ({ ok: response.ok, body })))
          .then(({ ok, body }) => {
            if (!ok) {
              const message = body?.message ?? 'Unable to disable 2FA.';
              if (twoFactorMessage) twoFactorMessage.textContent = message;
              return;
            }
            if (twoFactorMessage) twoFactorMessage.textContent = 'Two-factor authentication disabled.';
            loadTwoFactorStatus();
          })
          .catch(() => {
            if (twoFactorMessage) twoFactorMessage.textContent = 'Unable to disable 2FA.';
          });
      });

      loadLibrary();
      loadMyLibrary();
      loadAccounts();
      loadProfile();
      loadTwoFactorStatus();

      // System status grid removed; settings are now editable panels only.
    </script>
  </body>
</html>`;
  }

  getLoginHtml(): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BMS Login</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0f1115;
        --panel: #1b2130;
        --text: #f6f4ef;
        --muted: #9aa4b2;
        --accent: #f5b942;
        --accent-soft: rgba(245, 185, 66, 0.18);
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at top left, #222838 0%, #0f1115 55%) fixed;
        color: var(--text);
        font-family: "Space Grotesk", "Avenir Next", "Segoe UI", sans-serif;
      }

      .login-shell {
        width: min(420px, 92vw);
        background: var(--panel);
        border-radius: 20px;
        padding: 28px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        box-shadow: 0 18px 40px rgba(5, 8, 20, 0.4);
      }

      .login-brand {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: var(--accent);
        margin-bottom: 12px;
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

      .login-sub {
        color: var(--muted);
        margin: 0 0 20px;
      }

      label {
        display: block;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.18em;
        color: var(--muted);
        margin-bottom: 6px;
      }

      input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(10, 12, 18, 0.7);
        color: var(--text);
        margin-bottom: 14px;
      }

      button {
        width: 100%;
        padding: 10px 12px;
        border-radius: 999px;
        border: none;
        background: var(--accent);
        color: #111;
        font-weight: 600;
        cursor: pointer;
      }

      .panel {
        margin-top: 18px;
      }

      .status {
        margin-top: 10px;
        font-size: 0.85rem;
        color: var(--muted);
        min-height: 20px;
      }

      .status.error {
        color: #ff6b6b;
      }
    </style>
  </head>
  <body>
    <div class="login-shell">
      <div class="login-brand">BMS <span class="version-tag">v${appVersion}</span></div>
      <p class="login-sub">Sign in to your Bookdarr Media Server.</p>

      <div id="setup-panel" class="panel" style="display: none;">
        <form id="setup-form" method="POST" action="/auth/setup/web">
          <label for="setup-username">Username</label>
          <input id="setup-username" name="username" type="text" placeholder="admin" autocomplete="username" />
          <label for="setup-email">Email</label>
          <input id="setup-email" name="email" type="email" placeholder="admin@example.com" autocomplete="email" />
          <label for="setup-password">Password</label>
          <input id="setup-password" name="password" type="password" placeholder="Create a password" autocomplete="new-password" />
          <button id="setup-submit" type="submit">Create Admin</button>
        </form>
      </div>

      <div id="login-panel" class="panel" style="display: none;">
        <form id="login-form" method="POST" action="/auth/login/web">
          <div id="login-credentials">
            <label for="login-username">Username</label>
            <input id="login-username" name="username" type="text" placeholder="Username" autocomplete="username" />
            <label for="login-password">Password</label>
            <input id="login-password" name="password" type="password" placeholder="Password" autocomplete="current-password" />
          </div>
          <div id="login-otp-field" style="display: none;">
            <label for="login-otp">Authenticator code</label>
            <input
              id="login-otp"
              name="otp"
              type="text"
              inputmode="numeric"
              placeholder="123456"
              autocomplete="one-time-code"
            />
            <input id="login-challenge" name="challengeToken" type="hidden" />
          </div>
          <button id="login-submit" type="submit">Log in</button>
        </form>
        <div id="login-status" class="status"></div>
      </div>

      <div id="login-status-global" class="status"></div>
    </div>
    <script>
      const setupPanel = document.getElementById('setup-panel');
      const loginPanel = document.getElementById('login-panel');
      const loginStatus = document.getElementById('login-status');
      const loginStatusGlobal = document.getElementById('login-status-global');

      function clearStoredAuth() {
        try { localStorage.removeItem('bmsAccessToken'); } catch {}
        try { localStorage.removeItem('bmsRefreshToken'); } catch {}
        try { sessionStorage.clear(); } catch {}
        try { window.name = ''; } catch {}
        const cookies = ['bmsAccessToken', 'bmsRefreshToken', 'bmsLoggedIn'];
        cookies.forEach((name) => {
          document.cookie = name + '=; path=/; max-age=0; samesite=lax';
        });
        try {
          if (window.caches && caches.keys) {
            caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
          }
        } catch {}
        fetch('/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({}),
        }).catch(() => {});
      }

      function safeStorageGet(key) {
        try { return localStorage.getItem(key); } catch { return null; }
      }
      function safeStorageSet(key, value) {
        try { localStorage.setItem(key, value); return true; } catch { return false; }
      }

      function readCookie(name) {
        const raw = document.cookie;
        if (!raw) return null;
        const parts = raw.split(';');
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith(name + '=')) {
            return decodeURIComponent(trimmed.slice(name.length + 1));
          }
        }
        return null;
      }

      function setAuthCookie(enabled) {
        const maxAge = 60 * 60 * 24 * 30;
        if (enabled) {
          document.cookie = 'bmsLoggedIn=1; path=/; max-age=' + maxAge + '; samesite=lax';
          return;
        }
        document.cookie = 'bmsLoggedIn=; path=/; max-age=0; samesite=lax';
      }

      function setTokenCookies(accessToken, refreshToken) {
        const maxAge = 60 * 60 * 24 * 30;
        if (accessToken) {
          document.cookie = 'bmsAccessToken=' + encodeURIComponent(accessToken) + '; path=/; max-age=' + maxAge + '; samesite=lax';
        } else {
          document.cookie = 'bmsAccessToken=; path=/; max-age=0; samesite=lax';
        }
        if (refreshToken) {
          document.cookie = 'bmsRefreshToken=' + encodeURIComponent(refreshToken) + '; path=/; max-age=' + maxAge + '; samesite=lax';
        } else {
          document.cookie = 'bmsRefreshToken=; path=/; max-age=0; samesite=lax';
        }
      }

      const loginOtpField = document.getElementById('login-otp-field');
      const loginCredentials = document.getElementById('login-credentials');
      const loginForm = document.getElementById('login-form');
      const loginChallenge = document.getElementById('login-challenge');

      function setStatus(message, isError = false) {
        if (loginStatus) {
          loginStatus.textContent = message || '';
          loginStatus.classList.toggle('error', isError);
        }
        if (loginStatusGlobal) {
          loginStatusGlobal.textContent = message || '';
          loginStatusGlobal.classList.toggle('error', isError);
        }
      }

      function revealOtpField() {
        if (loginOtpField) {
          loginOtpField.style.display = 'block';
        }
        if (loginCredentials) {
          loginCredentials.style.display = 'none';
        }
        if (loginForm) {
          loginForm.setAttribute('action', '/auth/login/2fa/web');
        }
      }

      async function tryRefresh(refreshToken) {
        if (!refreshToken) return false;
        try {
          const response = await fetch('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          if (!response.ok) return false;
          const data = await response.json();
          if (data?.accessToken) {
            setAuthCookie(true);
            setTokenCookies(data.accessToken, data.refreshToken || refreshToken);
            safeStorageSet('bmsAccessToken', data.accessToken);
            if (data.refreshToken) {
              safeStorageSet('bmsRefreshToken', data.refreshToken);
            }
            window.location.href =
              '/auth/complete?access=' +
              encodeURIComponent(data.accessToken) +
              (data.refreshToken || refreshToken ? '&refresh=' + encodeURIComponent(data.refreshToken || refreshToken) : '');
            return true;
          }
        } catch {}
        return false;
      }

      (async () => {
        clearStoredAuth();
        const cachedToken = safeStorageGet('bmsAccessToken');
        const cachedRefresh = safeStorageGet('bmsRefreshToken');
        const cookieToken = readCookie('bmsAccessToken');
        const cookieRefresh = readCookie('bmsRefreshToken');
        const accessToken = cachedToken || cookieToken;
        const refreshToken = cachedRefresh || cookieRefresh;
        if (accessToken) {
          setAuthCookie(true);
          window.location.href =
            '/auth/complete?access=' +
            encodeURIComponent(accessToken) +
            (refreshToken ? '&refresh=' + encodeURIComponent(refreshToken) : '');
          return;
        }
        if (refreshToken) {
          const refreshed = await tryRefresh(refreshToken);
          if (refreshed) return;
        }

        fetch('/auth/setup', { cache: 'no-store' })
          .then((response) => response.json())
          .then((data) => {
            if (data?.required) {
              setupPanel.style.display = 'block';
              loginPanel.style.display = 'none';
              setStatus('Create the first admin account.');
            } else {
              setupPanel.style.display = 'none';
              loginPanel.style.display = 'block';
              setStatus('');
            }
          })
          .catch(() => {
            setupPanel.style.display = 'none';
            loginPanel.style.display = 'block';
          });
        const params = new URLSearchParams(window.location.search);
        const loginError = params.get('error');
        const otpRequired = params.get('otp');
        const challengeToken = params.get('challenge');
        const challengeCookie = readCookie('bmsTwoFactor');
        const setupError = params.get('setupError');
        if (loginError) {
          loginPanel.style.display = 'block';
          setupPanel.style.display = 'none';
          setStatus(loginError, true);
          const normalized = loginError.toLowerCase();
          if (normalized.includes('two-factor') || normalized.includes('2fa') || normalized.includes('otp')) {
            revealOtpField();
          }
        }
        if (otpRequired) {
          revealOtpField();
          setStatus('Enter your authenticator code.');
        }
        if (loginChallenge) {
          loginChallenge.value = challengeToken || challengeCookie || '';
        }
        if (setupError) {
          setupPanel.style.display = 'block';
          loginPanel.style.display = 'none';
          setStatus(setupError, true);
        }
      })();

      document.getElementById('login-form')?.addEventListener('submit', () => {
        setStatus('Signing in...');
      });

      document.getElementById('setup-form')?.addEventListener('submit', () => {
        setStatus('Creating admin...');
      });

      ['login-username', 'login-password'].forEach((id) => {
        document.getElementById(id)?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('login-submit')?.click();
          }
        });
      });

      ['setup-username', 'setup-email', 'setup-password'].forEach((id) => {
        document.getElementById(id)?.addEventListener('keydown', (event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            document.getElementById('setup-submit')?.click();
          }
        });
      });
    </script>
  </body>
</html>`;
  }
}
