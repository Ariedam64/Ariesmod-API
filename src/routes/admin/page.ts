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
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #0f172a;
      color: #e5e7eb;
    }
    header {
      padding: 16px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      border-bottom: 1px solid #1f2937;
      background: radial-gradient(circle at top left, #020617, #020617);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    h1 {
      font-size: 18px;
      margin: 0;
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    h1 span.label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ca3af;
      background: rgba(15,23,42,0.8);
      border-radius: 999px;
      padding: 2px 8px;
      border: 1px solid #1f2937;
    }
    header .right {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: #9ca3af;
    }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid #1f2937;
      background: rgba(15,23,42,0.8);
      font-size: 11px;
      color: #9ca3af;
    }
    .tag span.dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
      background: #22c55e;
    }
    main {
      padding: 16px 24px 32px 24px;
    }
    .layout {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 16px;
      align-items: flex-start;
    }
    .sidebar {
      border-radius: 10px;
      border: 1px solid #1f2937;
      background: radial-gradient(circle at top left, #020617, #020617);
      padding: 10px;
    }
    .sidebar h2 {
      margin: 0 0 4px 0;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
    }
    .nav-section {
      margin-top: 10px;
    }
    .nav-section-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
    }
    .nav-list li {
      border-radius: 6px;
      padding: 4px 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      color: #9ca3af;
    }
    .nav-list li span.name {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .nav-list li span.badge {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 999px;
      background: rgba(15,23,42,0.8);
      border: 1px solid #1f2937;
      color: #6b7280;
    }
    .nav-list li.active {
      background: linear-gradient(90deg, #1f2937, #0f172a);
      color: #e5e7eb;
    }
    .nav-list li:hover {
      background: rgba(31,41,55,0.9);
    }
    .content-card {
      border-radius: 10px;
      border: 1px solid #1f2937;
      background: radial-gradient(circle at top left, #1f2937, #020617);
      padding: 12px;
      overflow: auto;
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;
    }
    .controls label {
      font-size: 12px;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .controls select,
    .controls input {
      background: #020617;
      border-radius: 6px;
      border: 1px solid #1f2937;
      color: #e5e7eb;
      font-size: 12px;
      padding: 4px 6px;
      min-width: 0;
    }
    .controls input[type="number"] {
      width: 80px;
    }
    button {
      border-radius: 6px;
      border: 1px solid #1f2937;
      background: #1d4ed8;
      color: white;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    button.secondary {
      background: rgba(15,23,42,0.9);
      color: #e5e7eb;
    }
    button.danger {
      background: #b91c1c;
    }
    button:disabled {
      opacity: 0.6;
      cursor: default;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 12px;
      margin-top: 8px;
    }
    th, td {
      border-bottom: 1px solid #111827;
      padding: 4px 6px;
      vertical-align: top;
      max-width: 260px;
      word-break: break-word;
    }
    th {
      text-align: left;
      color: #9ca3af;
      font-weight: 500;
      position: sticky;
      top: 0;
      background: #020617;
      z-index: 1;
    }
    tr:hover td {
      background: rgba(148,163,184,0.06);
    }
    .monospace {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
        "Courier New", monospace;
      font-size: 11px;
    }
    .pill {
      border-radius: 999px;
      padding: 2px 8px;
      border: 1px solid #1f2937;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
    }
    .pill span.dot {
      width: 6px;
      height: 6px;
      border-radius: 999px;
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
    .section-title {
      font-size: 13px;
      font-weight: 500;
      margin: 0 0 4px 0;
    }
    .section-subtitle {
      font-size: 11px;
      color: #9ca3af;
      margin: 0 0 10px 0;
    }
    .split {
      display: grid;
      grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
      gap: 12px;
      align-items: flex-start;
    }
    textarea.sql-editor {
      width: 100%;
      min-height: 140px;
      background: #020617;
      border-radius: 8px;
      border: 1px solid #1f2937;
      color: #e5e7eb;
      font-size: 12px;
      padding: 8px;
      resize: vertical;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
        "Courier New", monospace;
    }
    .results {
      max-height: 260px;
      overflow: auto;
      border-radius: 8px;
      border: 1px solid #1f2937;
      background: #020617;
      padding: 8px;
    }
    pre {
      margin: 0;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
        "Courier New", monospace;
      font-size: 11px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .forms-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 12px;
    }
    .forms-grid .card {
      border-radius: 8px;
      border: 1px solid #1f2937;
      background: #020617;
      padding: 8px;
    }
    .forms-grid form {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .forms-grid label {
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .forms-grid input,
    .forms-grid select {
      background: #020617;
      border-radius: 6px;
      border: 1px solid #1f2937;
      color: #e5e7eb;
      font-size: 12px;
      padding: 4px 6px;
    }
    .forms-grid button {
      margin-top: 4px;
      align-self: flex-start;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 999px;
      border: 1px solid #1f2937;
      background: rgba(15,23,42,0.9);
      color: #9ca3af;
    }
    .badge strong {
      color: #e5e7eb;
    }
    .footer {
      margin-top: 8px;
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
    }
    .footer button {
      background: rgba(15,23,42,0.9);
    }
    .footer a {
      color: #60a5fa;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }

    #forms-results {
      font-family: inherit;
      font-size: 12px;
    }
    .card-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    .player-card {
      border-radius: 8px;
      border: 1px solid #1f2937;
      background: #020617;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .player-card-header {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .player-avatar {
      width: 40px;
      height: 40px;
      border-radius: 999px;
      overflow: hidden;
      border: 1px solid #1f2937;
      background: #111827;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      color: #9ca3af;
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
      font-size: 13px;
      font-weight: 500;
    }
    .player-id {
      font-size: 11px;
      color: #9ca3af;
    }
    .player-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 4px;
    }
    .player-tags .pill {
      font-size: 10px;
      padding: 1px 6px;
    }
    .player-meta {
      font-size: 11px;
      color: #9ca3af;
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }
    .section-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #6b7280;
      margin-bottom: 4px;
    }
    .relationship-card {
      border-radius: 8px;
      border: 1px solid #1f2937;
      background: #020617;
      padding: 8px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .relationship-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 6px;
    }
    .relationship-status {
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 999px;
      border: 1px solid #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .relationship-status.pending {
      color: #eab308;
    }
    .relationship-status.accepted {
      color: #22c55e;
    }
    .relationship-status.rejected {
      color: #ef4444;
    }
    .rl-card {
      border-radius: 8px;
      border: 1px solid #1f2937;
      background: #020617;
      padding: 8px;
      font-size: 11px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    @media (max-width: 900px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    @media (max-width: 640px) {
      header {
        padding: 12px 12px;
      }
      main {
        padding: 12px 12px 24px 12px;
      }
      .content-card {
        padding: 10px;
      }
      .forms-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>
        Arie's Mod
        <span class="label">Admin</span>
      </h1>
      <div style="font-size:12px;color:#9ca3af;margin-top:2px;">
        Internal tools for monitoring the mod usage and rate-limits.
      </div>
    </div>
    <div class="right">
      <span class="tag">
        <span class="dot"></span>
        <span>Connected to Postgres</span>
      </span>
      <span class="tag">
        <span>Read-only console</span>
      </span>
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
              <span class="badge">live</span>
            </li>
            <li data-section="stats">
              <span class="name">Rate-limit stats</span>
              <span class="badge">aggregated</span>
            </li>
          </ul>
        </div>
        <div class="nav-section">
          <div class="nav-section-title">Tools</div>
          <ul class="nav-list">
            <li data-section="sql">
              <span class="name">SQL console</span>
              <span class="badge">read-only</span>
            </li>
            <li data-section="forms">
              <span class="name">Forms</span>
              <span class="badge">helpers</span>
            </li>
          </ul>
        </div>
      </aside>
      <section class="content-card">
        <div id="section-tables">
          <h2 class="section-title">Tables</h2>
          <p class="section-subtitle">Browse live tables and virtual stats views.</p>
          <div class="controls">
            <label>
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
            <label>
              Limit
              <input type="number" id="table-limit" value="100" min="1" max="500" />
            </label>
            <label>
              Offset
              <input type="number" id="table-offset" value="0" min="0" max="100000" />
            </label>
            <button id="table-refresh-btn">Refresh</button>
          </div>
          <div id="table-results" class="results monospace">
            Loading...
          </div>
        </div>

        <div id="section-stats" style="display:none;">
          <h2 class="section-title">Rate-limit stats</h2>
          <p class="section-subtitle">Aggregated view of rate_limit_usage.</p>
          <div class="controls">
            <label>
              Source
              <select id="stats-source-select">
                <option value="stats_requests_per_player">stats_requests_per_player</option>
                <option value="stats_requests_per_day">stats_requests_per_day</option>
                <option value="stats_requests_per_month">stats_requests_per_month</option>
              </select>
            </label>
            <label>
              Limit
              <input type="number" id="stats-limit" value="200" min="1" max="500" />
            </label>
            <label>
              Offset
              <input type="number" id="stats-offset" value="0" min="0" max="100000" />
            </label>
            <button id="stats-refresh-btn">Refresh</button>
          </div>
          <div id="stats-results" class="results monospace">
            Loading...
          </div>
        </div>

        <div id="section-sql" style="display:none;">
          <h2 class="section-title">SQL console</h2>
          <p class="section-subtitle">Read-only console restricted to SELECT queries.</p>
          <div class="split">
            <div>
              <textarea id="sql-input" class="sql-editor" placeholder="SELECT * FROM players LIMIT 10;"></textarea>
              <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
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

        <div id="section-forms" style="display:none;">
          <h2 class="section-title">Forms</h2>
          <p class="section-subtitle">Helpers for common lookups.</p>
          <div class="forms-grid">
            <div class="card">
              <h3 style="font-size:13px;margin:0 0 4px 0;">Rate-limit bucket lookup</h3>
              <p class="section-subtitle">Find rate limits by playerId or IP.</p>
              <form id="rate-limit-form">
                <label>
                  playerId
                  <input id="rate-limit-player-input" type="text" placeholder="optional" />
                </label>
                <label>
                  IP
                  <input id="rate-limit-ip-input" type="text" placeholder="optional" />
                </label>
                <div style="margin-top:4px;display:flex;gap:8px;align-items:center;">
                  <button type="submit">Search</button>
                  <span class="badge">
                    <strong>Source</strong>
                    <span>rate_limit_usage</span>
                  </span>
                </div>
              </form>
            </div>

            <div class="card">
              <h3 style="font-size:13px;margin:0 0 4px 0;">Player lookup</h3>
              <p class="section-subtitle">Search a player by playerId or name</p>
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
                <div style="margin-top:4px;display:flex;gap:8px;align-items:center;">
                  <button type="submit">Search</button>
                  <span class="badge">
                    <strong>Source</strong>
                    <span>players, player_state, rate_limit_usage</span>
                  </span>
                </div>
              </form>
            </div>

            <div class="card">
              <h3 style="font-size:13px;margin:0 0 4px 0;">Player friends</h3>
              <p class="section-subtitle">List relationships for a playerId</p>
              <form id="player-friends-form">
                <label>
                  playerId
                  <input id="player-friends-input" type="text" placeholder="player id" />
                </label>
                <div style="margin-top:4px;display:flex;gap:8px;align-items:center;">
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
          <div>
            <span>Backend: Postgres · Rate-limit monitoring</span>
          </div>
          <div>
            <span>Admin console for Arie's Mod</span>
          </div>
        </div>
      </section>
    </div>
  </main>
  <script>
    const sections = {
      tables: document.getElementById("section-tables"),
      stats: document.getElementById("section-stats"),
      sql: document.getElementById("section-sql"),
      forms: document.getElementById("section-forms"),
    };

    const navItems = Array.from(document.querySelectorAll(".nav-list li"));

    function switchSection(section) {
      for (const key in sections) {
        if (Object.prototype.hasOwnProperty.call(sections, key)) {
          sections[key].style.display = key === section ? "block" : "none";
        }
      }
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

        if (!rows.length) {
          tableResults.textContent = "No rows.";
          return;
        }

        let html = "<table><thead><tr>";
        const keys = Object.keys(rows[0]);
        for (const key of keys) {
          html += "<th>" + escapeHtml(key) + "</th>";
        }
        html += "</tr></thead><tbody>";
        for (const row of rows) {
          html += "<tr>";
          for (const key of keys) {
            html += "<td>" + escapeHtml(row[key]) + "</td>";
          }
          html += "</tr>";
        }
        html += "</tbody></table>";
        tableResults.innerHTML = html;
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

        if (!rows.length) {
          statsResults.textContent = "No rows.";
          return;
        }

        let html = "<table><thead><tr>";
        const keys = Object.keys(rows[0]);
        for (const key of keys) {
          html += "<th>" + escapeHtml(key) + "</th>";
        }
        html += "</tr></thead><tbody>";
        for (const row of rows) {
          html += "<tr>";
          for (const key of keys) {
            html += "<td>" + escapeHtml(row[key]) + "</td>";
          }
          html += "</tr>";
        }
        html += "</tbody></table>";
        statsResults.innerHTML = html;
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

        if (!rows.length) {
          sqlResults.textContent = "No rows.";
          return;
        }

        let html = "<table><thead><tr>";
        const keys = Object.keys(rows[0]);
        for (const key of keys) {
          html += "<th>" + escapeHtml(key) + "</th>";
        }
        html += "</tr></thead><tbody>";
        for (const row of rows) {
          html += "<tr>";
          for (const key of keys) {
            html += "<td>" + escapeHtml(row[key]) + "</td>";
          }
          html += "</tr>";
        }
        html += "</tbody></table>";
        sqlResults.innerHTML = html;
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
      return s.length ? s : (fallback || "—");
    }

    function formatDate(value) {
      if (!value) return "never";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return safe(value);
      return d.toISOString().replace("T", " ").replace(/\\.\\d+Z$/, "Z");
    }

    function renderPlayerCards(rows) {
      if (!rows.length) {
        return "<span style='font-size:12px;color:#9ca3af;'>No matching players.</span>";
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
        return "<span style='font-size:12px;color:#9ca3af;'>No relationships found.</span>";
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
          '      <div style="font-size:11px;color:#9ca3af;">' +
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
          '  <div><span style="font-size:11px;color:#9ca3af;">Requested by:</span> ';
        html +=
          '<span class="monospace">' +
          escapeHtml(row.requested_by || "unknown") +
          "</span></div>";
        html +=
          '  <div style="font-size:11px;color:#9ca3af;">Created: ' +
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
        return "<span style='font-size:12px;color:#9ca3af;'>No matching rate limit usage.</span>";
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
        "<span style='font-size:12px;color:#9ca3af;'>Loading rate limit data...</span>";

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
        "<span style='font-size:12px;color:#9ca3af;'>Loading player lookup...</span>";

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
        "<span style='font-size:12px;color:#9ca3af;'>Loading player friends...</span>";

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
    loadTableData();
  </script>
</body>
</html>`);
  });

  // /admin/table : tables ou vues de stats

}
