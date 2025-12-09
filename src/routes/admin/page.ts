import type { Application, Request, Response } from "express";
import { adminAuth } from "./common";

export function registerAdminPageRoutes(app: Application): void {
  app.get("/admin", adminAuth, (_req: Request, res: Response) => {
    res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Arie's Mod – Admin</title>
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #050a16;
      --bg-strong: #0b132b;
      --panel: rgba(12, 18, 35, 0.9);
      --panel-strong: rgba(16, 24, 46, 0.9);
      --border: #1f2a44;
      --border-strong: #24304b;
      --muted: #9fb0c2;
      --text: #eaf2ff;
      --accent: #22d3ee;
      --accent-2: #f97316;
      --card-shadow: 0 18px 45px rgba(5, 10, 22, 0.4);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at 20% -10%, rgba(34, 211, 238, 0.16), transparent 28%),
        radial-gradient(circle at 80% 0%, rgba(249, 115, 22, 0.14), transparent 26%),
        radial-gradient(circle at 30% 90%, rgba(59, 130, 246, 0.12), transparent 26%),
        var(--bg);
      color: var(--text);
      font-family: "Space Grotesk", "Inter", system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header.topbar {
      position: sticky;
      top: 0;
      z-index: 12;
      padding: 18px 28px;
      background: linear-gradient(135deg, rgba(14, 19, 34, 0.95), rgba(10, 15, 30, 0.92));
      border-bottom: 1px solid var(--border);
      box-shadow: 0 12px 35px rgba(5, 10, 22, 0.45);
      backdrop-filter: blur(12px);
    }
    .topbar-content {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 18px;
    }
    .brand h1 {
      margin: 4px 0 2px 0;
      font-size: 22px;
      letter-spacing: -0.01em;
    }
    .eyebrow {
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-size: 11px;
      color: var(--muted);
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .muted {
      color: var(--muted);
    }
    .status {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
      justify-content: flex-end;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
      font-size: 12px;
      color: var(--muted);
    }
    .chip.success {
      border-color: rgba(34, 211, 238, 0.4);
      color: #a8f4ff;
      background: rgba(34, 211, 238, 0.08);
    }
    .chip .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22d3ee;
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.8);
    }
    .pill-soft {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(34, 211, 238, 0.12);
      border: 1px solid rgba(34, 211, 238, 0.25);
      color: #9be7ff;
      font-size: 12px;
    }
    main {
      flex: 1;
      min-height: 0;
      padding: 22px 28px 32px;
    }
    .layout {
      display: grid;
      grid-template-columns: 270px minmax(0, 1fr);
      gap: 18px;
      align-items: stretch;
      min-height: calc(100vh - 150px);
    }
    .sidebar {
      position: sticky;
      top: 94px;
      align-self: start;
      border-radius: 16px;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(14, 20, 38, 0.96), rgba(11, 18, 35, 0.9));
      padding: 14px;
      box-shadow: var(--card-shadow);
    }
    .sidebar h2 {
      margin: 0 0 6px 0;
      font-size: 13px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .nav-section {
      margin-top: 14px;
    }
    .nav-section-title {
      font-size: 12px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .nav-list li {
      border-radius: 12px;
      padding: 10px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      color: var(--text);
      border: 1px solid var(--border);
      background: linear-gradient(120deg, rgba(18, 27, 52, 0.95), rgba(12, 19, 36, 0.92));
      transition: border-color 0.2s ease, transform 0.15s ease, background 0.2s ease;
    }
    .nav-list li .name {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    .nav-list li .badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      color: var(--muted);
      background: rgba(255, 255, 255, 0.03);
    }
    .nav-list li.active {
      border-color: rgba(34, 211, 238, 0.5);
      box-shadow: 0 8px 30px rgba(34, 211, 238, 0.1);
      background: linear-gradient(120deg, rgba(34, 211, 238, 0.1), rgba(11, 18, 35, 0.95));
      transform: translateY(-1px);
    }
    .nav-list li:hover {
      border-color: rgba(34, 211, 238, 0.35);
    }
    .sidebar-note {
      margin-top: 14px;
      font-size: 12px;
      color: var(--muted);
      line-height: 1.5;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px dashed var(--border);
      background: rgba(255, 255, 255, 0.02);
    }
    .content-card {
      border-radius: 18px;
      border: 1px solid var(--border);
      background: linear-gradient(180deg, rgba(16, 24, 46, 0.9), rgba(9, 14, 27, 0.92));
      padding: 18px;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: calc(100vh - 150px);
      overflow: hidden;
      position: relative;
      isolation: isolate;
    }
    .content-card::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 18px;
      pointer-events: none;
      background: radial-gradient(circle at 60% 20%, rgba(34, 211, 238, 0.08), transparent 30%);
      z-index: 0;
    }
    .section-panel {
      display: none;
      flex-direction: column;
      gap: 12px;
      height: 100%;
      min-height: 0;
      position: relative;
      z-index: 1;
    }
    .section-panel.active {
      display: flex;
    }
    .section-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .section-heading h2 {
      margin: 2px 0;
      font-size: 18px;
      letter-spacing: -0.01em;
    }
    .section-heading p {
      margin: 4px 0 0 0;
      color: var(--muted);
      font-size: 13px;
    }
    .inline-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .chip.small {
      font-size: 11px;
      padding: 6px 10px;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: flex-end;
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
    }
    .control {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
      color: var(--muted);
      min-width: 180px;
    }
    .control.compact {
      min-width: 110px;
    }
    .control select,
    .control input {
      background: var(--bg-strong);
      border-radius: 10px;
      border: 1px solid var(--border-strong);
      color: var(--text);
      font-size: 13px;
      padding: 8px 10px;
      min-width: 0;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .control input[type="number"] {
      width: 100%;
    }
    .control select:focus,
    .control input:focus {
      border-color: rgba(34, 211, 238, 0.6);
      box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
    }
    button {
      border-radius: 10px;
      border: 1px solid rgba(34, 211, 238, 0.4);
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.9), rgba(20, 148, 189, 0.9));
      color: #041018;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: transform 0.15s ease, box-shadow 0.2s ease;
      box-shadow: 0 12px 25px rgba(34, 211, 238, 0.25);
    }
    button:hover {
      transform: translateY(-1px);
    }
    button.secondary {
      background: rgba(255, 255, 255, 0.04);
      color: var(--text);
      border-color: var(--border);
      box-shadow: none;
    }
    button.danger {
      background: linear-gradient(135deg, #f87171, #b91c1c);
      color: #fffaf6;
      border-color: #b91c1c;
      box-shadow: 0 12px 26px rgba(185, 28, 28, 0.35);
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
      transform: none;
      box-shadow: none;
    }
    .results {
      flex: 1;
      min-height: 360px;
      overflow: auto;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--panel);
      padding: 10px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      font-family: "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
    }
    .empty-state {
      color: var(--muted);
      font-size: 13px;
      padding: 10px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 12.5px;
      margin-top: 0;
      min-width: 100%;
    }
    th,
    td {
      border-bottom: 1px solid #0f172a;
      padding: 8px 10px;
      vertical-align: top;
      max-width: 360px;
      word-break: break-word;
    }
    th {
      text-align: left;
      color: var(--muted);
      font-weight: 600;
      position: sticky;
      top: 0;
      background: var(--panel-strong);
      z-index: 2;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      font-size: 11px;
    }
    tr:hover td {
      background: rgba(34, 211, 238, 0.05);
    }
    td.cell {
      background: transparent;
    }
    td.json {
      background: rgba(34, 211, 238, 0.03);
      border-left: 2px solid rgba(34, 211, 238, 0.2);
    }
    .cell-text {
      display: inline-block;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .monospace {
      font-family: "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 12px;
    }
    .pill {
      border-radius: 999px;
      padding: 2px 8px;
      border: 1px solid var(--border);
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
    }
    .pill .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--muted);
    }
    .pill .dot.green {
      background: #22c55e;
    }
    .pill .dot.red {
      background: #ef4444;
    }
    .pill .dot.yellow {
      background: #eab308;
    }
    .section-label {
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 6px;
    }
    .split {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      gap: 12px;
      align-items: start;
    }
    textarea.sql-editor {
      width: 100%;
      min-height: 180px;
      background: var(--bg-strong);
      border-radius: 12px;
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 13px;
      padding: 10px;
      resize: vertical;
      font-family: "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
      outline: none;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    textarea.sql-editor:focus {
      border-color: rgba(34, 211, 238, 0.6);
      box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
    }
    pre {
      margin: 0;
      font-family: "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace;
      font-size: 11px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .forms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 12px;
      margin-top: 8px;
    }
    .forms-grid .card {
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--panel);
      padding: 12px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
    }
    .forms-grid form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .forms-grid label {
      font-size: 12px;
      color: var(--muted);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .forms-grid input,
    .forms-grid select {
      background: var(--bg-strong);
      border-radius: 10px;
      border: 1px solid var(--border);
      color: var(--text);
      font-size: 13px;
      padding: 8px 10px;
      outline: none;
    }
    .forms-grid input:focus,
    .forms-grid select:focus {
      border-color: rgba(34, 211, 238, 0.6);
      box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.12);
    }
    .forms-grid button {
      margin-top: 2px;
      align-self: flex-start;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.04);
      color: var(--muted);
    }
    .badge strong {
      color: var(--text);
    }
    .footer {
      margin-top: auto;
      padding: 10px 4px 2px 4px;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: var(--muted);
      border-top: 1px solid var(--border);
    }
    .footer button {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--border);
      box-shadow: none;
      color: var(--text);
      padding: 6px 10px;
      font-size: 11px;
    }
    .card-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 10px;
    }
    .player-card,
    .relationship-card,
    .rl-card {
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--panel);
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 12px;
    }
    .player-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .player-avatar {
      width: 44px;
      height: 44px;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid var(--border);
      background: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: var(--muted);
    }
    .player-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .player-main {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .player-name {
      font-size: 14px;
      font-weight: 600;
    }
    .player-id {
      font-size: 12px;
      color: var(--muted);
    }
    .player-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .player-tags .pill {
      font-size: 10px;
      padding: 2px 7px;
    }
    .player-meta {
      font-size: 12px;
      color: var(--muted);
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }
    .relationship-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .relationship-status {
      font-size: 10px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid var(--border);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .relationship-status.pending {
      color: #eab308;
      border-color: rgba(234, 179, 8, 0.4);
    }
    .relationship-status.accepted {
      color: #22c55e;
      border-color: rgba(34, 197, 94, 0.4);
    }
    .relationship-status.rejected {
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.4);
    }
    #forms-results {
      font-family: inherit;
      font-size: 12px;
    }
    @media (max-width: 1080px) {
      .layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: relative;
        top: auto;
      }
      .content-card {
        min-height: auto;
      }
      .section-heading {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    @media (max-width: 720px) {
      header.topbar {
        padding: 14px 16px;
      }
      main {
        padding: 14px 16px 24px;
      }
      .content-card,
      .sidebar {
        padding: 12px;
      }
      .split {
        grid-template-columns: 1fr;
      }
      .controls {
        flex-direction: column;
        align-items: stretch;
      }
      .control {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="topbar-content">
      <div class="brand">
        <div class="eyebrow">Arie's Mod</div>
        <div class="title-row">
          <h1>Admin Console</h1>
          <span class="pill-soft">Live</span>
        </div>
        <p class="muted">Monitoring, live tables, rate limits and helper tools.</p>
      </div>
      <div class="status">
        <div class="chip success"><span class="dot"></span>Postgres</div>
        <div class="chip">Read-only console</div>
      </div>
    </div>
  </header>
  <main>
    <div class="layout">
      <aside class="sidebar">
        <h2>Sections</h2>
        <div class="nav-section">
          <div class="nav-section-title">Data</div>
          <ul class="nav-list">
            <li data-section="tables" class="active">
              <span class="name">Tables</span>
              <span class="badge">Live</span>
            </li>
            <li data-section="stats">
              <span class="name">Rate-limit stats</span>
              <span class="badge">Aggregated</span>
            </li>
          </ul>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Tools</div>
          <ul class="nav-list">
            <li data-section="sql">
              <span class="name">SQL console</span>
              <span class="badge">Read-only</span>
            </li>
            <li data-section="forms">
              <span class="name">Forms</span>
              <span class="badge">Helpers</span>
            </li>
          </ul>
        </div>
        <div class="sidebar-note">
          Visual refresh + sticky navigation. Tables stretch to the bottom with scrollable data and JSON previews are now trimmed for speed.
        </div>
      </aside>
      <section class="content-card">
        <div id="section-tables" class="section-panel active">
          <div class="section-heading">
            <div>
              <div class="eyebrow">Data</div>
              <h2>Tables</h2>
              <p>Browse live tables and virtual stats views.</p>
            </div>
            <div class="inline-badges">
              <span class="chip small">Live data</span>
              <span class="chip small">Paginated</span>
            </div>
          </div>
          <div class="controls">
            <label class="control">
              Table
              <select id="table-select">
                <optgroup label="Real tables">
                  <option value="players">players</option>
                  <option value="rooms">rooms</option>
                  <option value="player_state">player_state</option>
                  <option value="player_privacy">player_privacy</option>
                  <option value="player_relationships">player_relationships</option>
                  <option value="room_players">room_players</option>
                  <option value="blocked_ips">blocked_ips</option>
                  <option value="rate_limit_usage">rate_limit_usage</option>
                </optgroup>
                <optgroup label="Stats views">
                  <option value="stats_requests_per_player">stats_requests_per_player</option>
                  <option value="stats_requests_per_day">stats_requests_per_day</option>
                  <option value="stats_requests_per_month">stats_requests_per_month</option>
                </optgroup>
              </select>
            </label>
            <label class="control compact">
              Limit
              <input type="number" id="table-limit" value="100" min="1" max="500" />
            </label>
            <label class="control compact">
              Offset
              <input type="number" id="table-offset" value="0" min="0" max="100000" />
            </label>
            <button id="table-refresh-btn">Refresh</button>
          </div>
          <div id="table-results" class="results monospace">
            Loading...
          </div>
        </div>

        <div id="section-stats" class="section-panel">
          <div class="section-heading">
            <div>
              <div class="eyebrow">Data</div>
              <h2>Rate-limit stats</h2>
              <p>Aggregated view of rate_limit_usage.</p>
            </div>
            <div class="inline-badges">
              <span class="chip small">Pre-aggregated</span>
              <span class="chip small">Read-only</span>
            </div>
          </div>
          <div class="controls">
            <label class="control">
              Source
              <select id="stats-source-select">
                <option value="stats_requests_per_player">stats_requests_per_player</option>
                <option value="stats_requests_per_day">stats_requests_per_day</option>
                <option value="stats_requests_per_month">stats_requests_per_month</option>
              </select>
            </label>
            <label class="control compact">
              Limit
              <input type="number" id="stats-limit" value="200" min="1" max="500" />
            </label>
            <label class="control compact">
              Offset
              <input type="number" id="stats-offset" value="0" min="0" max="100000" />
            </label>
            <button id="stats-refresh-btn">Refresh</button>
          </div>
          <div id="stats-results" class="results monospace">
            Loading...
          </div>
        </div>

        <div id="section-sql" class="section-panel">
          <div class="section-heading">
            <div>
              <div class="eyebrow">Tools</div>
              <h2>SQL console</h2>
              <p>Read-only console restricted to SELECT queries.</p>
            </div>
            <div class="inline-badges">
              <span class="chip small">Monospace</span>
              <span class="chip small">No mutations</span>
            </div>
          </div>
          <div class="split">
            <div>
              <textarea id="sql-input" class="sql-editor" placeholder="SELECT id, created_at, coins FROM players ORDER BY created_at DESC LIMIT 10;"></textarea>
              <div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                <button id="sql-run-btn">Run</button>
                <button id="sql-example-btn" class="secondary">Example</button>
                <span class="badge">
                  <strong>Note</strong>
                  <span>Only SELECT queries are allowed.</span>
                </span>
              </div>
            </div>
            <div>
              <div class="results monospace" id="sql-results">
                Waiting for query...
              </div>
            </div>
          </div>
        </div>

        <div id="section-forms" class="section-panel">
          <div class="section-heading">
            <div>
              <div class="eyebrow">Tools</div>
              <h2>Forms</h2>
              <p>Helpers for common lookups.</p>
            </div>
            <div class="inline-badges">
              <span class="chip small">Quick access</span>
              <span class="chip small">Read-only</span>
            </div>
          </div>
          <div class="forms-grid">
            <div class="card">
              <h3 style="font-size:14px;margin:0 0 4px 0;">Rate-limit bucket lookup</h3>
              <p class="muted" style="margin:0 0 8px 0;">Find rate limits by playerId or IP.</p>
              <form id="rate-limit-form">
                <label>
                  playerId
                  <input id="rate-limit-player-input" type="text" placeholder="optional" />
                </label>
                <label>
                  IP
                  <input id="rate-limit-ip-input" type="text" placeholder="optional" />
                </label>
                <div style="margin-top:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  <button type="submit">Search</button>
                  <span class="badge">
                    <strong>Source</strong>
                    <span>rate_limit_usage</span>
                  </span>
                </div>
              </form>
            </div>

            <div class="card">
              <h3 style="font-size:14px;margin:0 0 4px 0;">Player lookup</h3>
              <p class="muted" style="margin:0 0 8px 0;">Search a player by playerId or name</p>
              <form id="player-lookup-form">
                <label>
                  Search type
                  <select id="player-lookup-type">
                    <option value="playerId">playerId</option>
                    <option value="name">Name contains</option>
                  </select>
                </label>
                <label>
                  Value
                  <input id="player-lookup-value" type="text" placeholder="playerId or name" />
                </label>
                <div style="margin-top:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  <button type="submit">Search</button>
                  <span class="badge">
                    <strong>Source</strong>
                    <span>players, player_state, rate_limit_usage</span>
                  </span>
                </div>
              </form>
            </div>

            <div class="card">
              <h3 style="font-size:14px;margin:0 0 4px 0;">Player friends</h3>
              <p class="muted" style="margin:0 0 8px 0;">List relationships for a playerId</p>
              <form id="player-friends-form">
                <label>
                  playerId
                  <input id="player-friends-input" type="text" placeholder="player id" />
                </label>
                <div style="margin-top:4px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                  <button type="submit">Search</button>
                  <span class="badge">
                    <strong>Source</strong>
                    <span>player_relationships</span>
                  </span>
                </div>
              </form>
            </div>
          </div>

          <div id="forms-results" class="results" style="margin-top:12px;">
            Waiting for form submission...
          </div>
        </div>

        <div class="footer">
          <span>Backend: Postgres · Rate-limit monitoring</span>
          <span>Admin console for Arie's Mod</span>
        </div>
      </section>
    </div>
  </main>
  <script>
    const MAX_TEXT_PREVIEW = 220;
    const MAX_JSON_PREVIEW = 160;
    const MAX_TOOLTIP = 900;

    const sections = {
      tables: document.getElementById("section-tables"),
      stats: document.getElementById("section-stats"),
      sql: document.getElementById("section-sql"),
      forms: document.getElementById("section-forms"),
    };

    const navItems = Array.from(document.querySelectorAll(".nav-list li"));

    function switchSection(section) {
      Object.keys(sections).forEach((key) => {
        const el = sections[key];
        if (!el) return;
        if (key === section) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });
      navItems.forEach((item) => {
        if (item.dataset.section === section) {
          item.classList.add("active");
        } else {
          item.classList.remove("active");
        }
      });
    }

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const section = item.dataset.section;
        if (section) {
          switchSection(section);
        }
      });
    });

    async function fetchJson(path, options) {
      const res = await fetch(path, options);
      if (!res.ok) {
        const text = await res.text();
        throw new Error("HTTP " + res.status + ": " + text);
      }
      return res.json();
    }

    function escapeHtml(value) {
      if (value == null) return "";
      return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function isLikelyJsonString(value) {
      if (typeof value !== "string") return false;
      const trimmed = value.trim();
      if (!trimmed) return false;
      return (
        (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
        (trimmed.startsWith("[") && trimmed.endsWith("]"))
      );
    }

    function formatCellValue(value) {
      if (value === null || value === undefined || value === "") {
        return { display: "—", tooltip: "", isJson: false };
      }

      let raw;
      let isJson = false;

      if (typeof value === "object") {
        isJson = true;
        try {
          raw = JSON.stringify(value);
        } catch {
          raw = String(value);
        }
      } else {
        raw = String(value);
        isJson = isLikelyJsonString(raw);
      }

      const limit = isJson ? MAX_JSON_PREVIEW : MAX_TEXT_PREVIEW;
      const trimmed = raw.trim();
      const truncated =
        trimmed.length > limit
          ? trimmed.slice(0, limit) +
            "… (+" +
            (trimmed.length - limit) +
            " chars)"
          : trimmed;

      const tooltip =
        trimmed.length > limit
          ? trimmed.slice(0, Math.min(trimmed.length, MAX_TOOLTIP)) +
            (trimmed.length > MAX_TOOLTIP ? "…" : "")
          : "";

      return {
        display: truncated || "—",
        tooltip,
        isJson,
      };
    }

    function buildTableHtml(rows) {
      if (!rows.length) {
        return "<div class='empty-state'>No rows.</div>";
      }

      const keys = Object.keys(rows[0]);
      let html = "<table><thead><tr>";
      for (const key of keys) {
        html += "<th>" + escapeHtml(key) + "</th>";
      }
      html += "</tr></thead><tbody>";
      for (const row of rows) {
        html += "<tr>";
        for (const key of keys) {
          const { display, tooltip, isJson } = formatCellValue(row[key]);
          const titleAttr = tooltip ? ' title="' + escapeHtml(tooltip) + '"' : "";
          const classAttr = isJson ? ' class="json cell"' : ' class="cell"';
          html += "<td" + classAttr + titleAttr + ">";
          html += '<span class="cell-text">' + escapeHtml(display) + "</span>";
          html += "</td>";
        }
        html += "</tr>";
      }
      html += "</tbody></table>";
      return html;
    }

    // Tables / stats

    const tableSelect = document.getElementById("table-select");
    const tableLimit = document.getElementById("table-limit");
    const tableOffset = document.getElementById("table-offset");
    const tableResults = document.getElementById("table-results");
    const tableRefreshBtn = document.getElementById("table-refresh-btn");

    async function loadTableData() {
      const table = tableSelect.value;
      const limit = Number(tableLimit.value) || 100;
      const offset = Number(tableOffset.value) || 0;

      tableResults.textContent = "Loading...";

      try {
        const params = new URLSearchParams({
          table,
          limit: String(limit),
          offset: String(offset),
        });
        const data = await fetchJson("/admin/table?" + params.toString());
        const rows = data.rows || [];

        tableResults.innerHTML = buildTableHtml(rows);
      } catch (err) {
        console.error(err);
        tableResults.textContent = "Error loading data.";
      }
    }

    tableRefreshBtn.addEventListener("click", () => {
      loadTableData();
    });

    tableSelect.addEventListener("change", () => {
      loadTableData();
    });

    // Stats

    const statsSourceSelect = document.getElementById("stats-source-select");
    const statsLimit = document.getElementById("stats-limit");
    const statsOffset = document.getElementById("stats-offset");
    const statsResults = document.getElementById("stats-results");
    const statsRefreshBtn = document.getElementById("stats-refresh-btn");

    async function loadStatsData() {
      const table = statsSourceSelect.value;
      const limit = Number(statsLimit.value) || 200;
      const offset = Number(statsOffset.value) || 0;

      statsResults.textContent = "Loading...";

      try {
        const params = new URLSearchParams({
          table,
          limit: String(limit),
          offset: String(offset),
        });
        const data = await fetchJson("/admin/table?" + params.toString());
        const rows = data.rows || [];

        statsResults.innerHTML = buildTableHtml(rows);
      } catch (err) {
        console.error(err);
        statsResults.textContent = "Error loading stats.";
      }
    }

    statsRefreshBtn.addEventListener("click", () => {
      loadStatsData();
    });

    statsSourceSelect.addEventListener("change", () => {
      loadStatsData();
    });

    // SQL console

    const sqlInput = document.getElementById("sql-input");
    const sqlRunBtn = document.getElementById("sql-run-btn");
    const sqlExampleBtn = document.getElementById("sql-example-btn");
    const sqlResults = document.getElementById("sql-results");

    sqlExampleBtn.addEventListener("click", () => {
      sqlInput.value = "SELECT id, created_at, coins FROM players ORDER BY created_at DESC LIMIT 10;";
    });

    sqlRunBtn.addEventListener("click", async () => {
      const query = sqlInput.value.trim();
      if (!query) {
        sqlResults.textContent = "Enter a query first.";
        return;
      }

      sqlResults.textContent = "Running query...";

      try {
        const res = await fetch("/admin/sql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ query }),
        });
        if (!res.ok) {
          const text = await res.text();
          sqlResults.textContent = "HTTP " + res.status + ": " + text;
          return;
        }
        const data = await res.json();
        const rows = data.rows || [];

        sqlResults.innerHTML = buildTableHtml(rows);
      } catch (err) {
        console.error(err);
        sqlResults.textContent = "Error running query.";
      }
    });

    // Forms

    const rateLimitForm = document.getElementById("rate-limit-form");
    const rateLimitPlayerInput = document.getElementById("rate-limit-player-input");
    const rateLimitIpInput = document.getElementById("rate-limit-ip-input");

    const playerLookupForm = document.getElementById("player-lookup-form");
    const playerLookupType = document.getElementById("player-lookup-type");
    const playerLookupValue = document.getElementById("player-lookup-value");

    const playerFriendsForm = document.getElementById("player-friends-form");
    const playerFriendsInput = document.getElementById("player-friends-input");

    const formsResults = document.getElementById("forms-results");

    function safe(value, fallback) {
      if (value === null || value === undefined) return fallback || "—";
      const s = String(value);
      return s.length ? s : fallback || "—";
    }

    function formatDate(value) {
      if (!value) return "never";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return safe(value);
      return d.toISOString().replace("T", " ").replace(/\\.\\d+Z$/, "Z");
    }

    function renderPlayerCards(rows) {
      if (!rows.length) {
        return "<span style='font-size:12px;color:var(--muted);'>No matching players.</span>";
      }

      let html = "<div class='section-label'>Players</div>";
      html += "<div class='card-list'>";

      for (const row of rows) {
        const name = row.name || row.player_id || "Unknown";
        const initials = name.slice(0, 2).toUpperCase();
        const avatarUrl = row.avatar_url;

        let avatarHtml;
        if (avatarUrl) {
          avatarHtml =
            '<div class="player-avatar"><img src="' +
            escapeHtml(avatarUrl) +
            '" alt="avatar" /></div>';
        } else {
          avatarHtml =
            '<div class="player-avatar">' + escapeHtml(initials) + "</div>";
        }

        const rawCoins = row.coins == null ? 0 : Number(row.coins);
        const coins = Number.isNaN(rawCoins) ? 0 : rawCoins;
        const coinsDisplay = String(coins);
        const hasMod = !!row.has_mod_installed;
        const rawReq = row.total_requests == null ? 0 : Number(row.total_requests);
        const totalReq = Number.isNaN(rawReq) ? 0 : rawReq;

        const lastEvent = row.last_event_at;
        const createdAt = row.created_at;

        const inRoom = !!row.current_room_id;
        let roomText;
        if (inRoom) {
          roomText =
            "Room: " +
            row.current_room_id +
            " (" +
            (row.current_room_is_private ? "private" : "public") +
            ")";
        } else {
          roomText = "Not in room";
        }

        const hasGarden = !!row.garden;
        const hasInventory = !!row.inventory;
        const hasStats = !!row.stats;

        html += '<div class="player-card">';
        html += '  <div class="player-card-header">';
        html += avatarHtml;
        html += '    <div class="player-main">';
        html +=
          '      <div class="player-name">' + escapeHtml(name) + "</div>";
        html +=
          '      <div class="player-id">ID: ' +
          escapeHtml(row.player_id) +
          "</div>";
        html += "    </div>";
        html += "  </div>";
        html += '  <div class="player-tags">';
        html +=
          '    <span class="pill"><span class="dot ' +
          (coins > 0 ? "yellow" : "") +
          '"></span><span>' +
          escapeHtml(coinsDisplay + " coins") +
          "</span></span>";
        html +=
          '    <span class="pill"><span class="dot ' +
          (hasMod ? "green" : "red") +
          '"></span><span>Mod: ' +
          (hasMod ? "enabled" : "disabled") +
          "</span></span>";
        html +=
          '    <span class="pill"><span class="dot"></span><span>' +
          escapeHtml(String(totalReq) + " requests") +
          "</span></span>";
        html +=
          '    <span class="pill"><span class="dot ' +
          (inRoom ? "green" : "") +
          '"></span><span>' +
          escapeHtml(roomText) +
          "</span></span>";
        html += "  </div>";
        html += '  <div class="player-meta">';
        html +=
          "    <div>Created: " +
          escapeHtml(formatDate(createdAt)) +
          "</div>";
        html +=
          "    <div>Last event: " +
          escapeHtml(formatDate(lastEvent)) +
          "</div>";
        html +=
          "    <div>Garden: " +
          (hasGarden ? "yes" : "no") +
          " · Inventory: " +
          (hasInventory ? "yes" : "no") +
          " · Stats: " +
          (hasStats ? "yes" : "no") +
          "</div>";
        html += "  </div>";
        html += "</div>";
      }

      html += "</div>";
      return html;
    }

    function renderRelationshipsCards(rows, playerId) {
      if (!rows.length) {
        return "<span style='font-size:12px;color:var(--muted);'>No relationships found.</span>";
      }

      let html = "<div class='section-label'>Player relationships</div>";
      html += "<div class='card-list'>";

      for (const row of rows) {
        const otherId =
          row.other_player_id ||
          (row.user_one_id === playerId ? row.user_two_id : row.user_one_id);
        const status = (row.status || "").toLowerCase();

        html += '<div class="relationship-card">';
        html += '  <div class="relationship-header">';
        html += '    <div>';
        html +=
          '      <div style="font-size:12px;font-weight:500;">Other player</div>';
        html +=
          '      <div style="font-size:12px;color:var(--muted);">' +
          escapeHtml(otherId || "unknown") +
          "</div>";
        html += "    </div>";
        html +=
          '    <div class="relationship-status ' +
          escapeHtml(status) +
          '">';
        html += escapeHtml(status || "unknown");
        html += "    </div>";
        html += "  </div>";
        html +=
          '  <div><span style="font-size:11px;color:var(--muted);">Requested by:</span> ';
        html +=
          '<span class="monospace">' +
          escapeHtml(row.requested_by || "unknown") +
          "</span></div>";
        html +=
          '  <div style="font-size:11px;color:var(--muted);">Created: ' +
          escapeHtml(formatDate(row.created_at)) +
          "<br/>Updated: " +
          escapeHtml(formatDate(row.updated_at)) +
          "</div>";
        html += "</div>";
      }

      html += "</div>";
      return html;
    }

    function renderRateLimitCards(rows) {
      if (!rows.length) {
        return "<span style='font-size:12px;color:var(--muted);'>No matching rate limit usage.</span>";
      }

      let html = "<div class='section-label'>Rate limit buckets</div>";
      html += "<div class='card-list'>";

      for (const row of rows) {
        html += '<div class="rl-card">';
        html +=
          "<div><strong>Bucket</strong>: " +
          escapeHtml(formatDate(row.bucket_start)) +
          "</div>";
        html +=
          "<div><strong>IP</strong>: " +
          escapeHtml(row.ip ?? "—") +
          "</div>";
        html +=
          "<div><strong>Player</strong>: " +
          escapeHtml(row.player_id ?? "—") +
          "</div>";
        html +=
          "<div><strong>Hits</strong>: " +
          escapeHtml(row.hit_count) +
          "</div>";
        html += "</div>";
      }

      html += "</div>";
      return html;
    }

    rateLimitForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const pid = rateLimitPlayerInput.value.trim();
      const ip = rateLimitIpInput.value.trim();

      if (!pid && !ip) {
        formsResults.innerHTML =
          "<span style='font-size:12px;color:#f97316;'>Provide a playerId or IP.</span>";
        return;
      }

      formsResults.innerHTML =
        "<span style='font-size:12px;color:var(--muted);'>Loading rate limit data...</span>";

      try {
        const res = await fetch("/admin/form/rate-limit-player", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ playerId: pid || null, ip: ip || null }),
        });

        if (!res.ok) {
          const text = await res.text();
          formsResults.innerHTML =
            "<span style='font-size:12px;color:#f97316;'>HTTP " +
            res.status +
            ": " +
            escapeHtml(text) +
            "</span>";
          return;
        }

        const data = await res.json();
        const buckets = data.rows || [];
        formsResults.innerHTML = renderRateLimitCards(buckets);
      } catch (err) {
        console.error(err);
        formsResults.innerHTML =
          "<span style='font-size:12px;color:#f97316;'>Error loading rate limit data.</span>";
      }
    });

    playerLookupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const type = playerLookupType.value;
      const value = playerLookupValue.value.trim();

      if (!value || (type === "name" && value.length < 2)) {
        formsResults.innerHTML =
          "<span style='font-size:12px;color:#f97316;'>Provide a valid value (name: at least 2 chars).</span>";
        return;
      }

      formsResults.innerHTML =
        "<span style='font-size:12px;color:var(--muted);'>Loading player lookup...</span>";

      try {
        const res = await fetch("/admin/form/player-lookup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ type, value }),
        });

        if (!res.ok) {
          const text = await res.text();
          formsResults.innerHTML =
            "<span style='font-size:12px;color:#f97316;'>HTTP " +
            res.status +
            ": " +
            escapeHtml(text) +
            "</span>";
          return;
        }

        const data = await res.json();
        const rows = data.rows || [];
        formsResults.innerHTML = renderPlayerCards(rows);
      } catch (err) {
        console.error(err);
        formsResults.innerHTML =
          "<span style='font-size:12px;color:#f97316;'>Error loading player lookup.</span>";
      }
    });

    playerFriendsForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const playerId = playerFriendsInput.value.trim();

      if (!playerId) {
        formsResults.innerHTML =
          "<span style='font-size:12px;color:#f97316;'>Provide a playerId.</span>";
        return;
      }

      formsResults.innerHTML =
        "<span style='font-size:12px;color:var(--muted);'>Loading player friends...</span>";

      try {
        const res = await fetch("/admin/form/player-friends", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({ playerId }),
        });

        if (!res.ok) {
          const text = await res.text();
          formsResults.innerHTML =
            "<span style='font-size:12px;color:#f97316;'>HTTP " +
            res.status +
            ": " +
            escapeHtml(text) +
            "</span>";
          return;
        }

        const data = await res.json();
        const rows = data.rows || [];
        formsResults.innerHTML = renderRelationshipsCards(rows, playerId);
      } catch (err) {
        console.error(err);
        formsResults.innerHTML =
          "<span style='font-size:12px;color:#f97316;'>Error loading player friends.</span>";
      }
    });

    // Initial load
    switchSection("tables");
    loadTableData();
  </script>
</body>
</html>`);
  });

  // /admin/table : tables ou vues de stats

}
