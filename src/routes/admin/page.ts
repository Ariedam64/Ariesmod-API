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
    th.sortable {
      cursor: pointer;
      user-select: none;
    }
    th.sortable.sorted {
      color: #eaf2ff;
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
    .sql-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 10px;
    }
    .sql-presets button {
      background: rgba(255, 255, 255, 0.04);
      border-color: var(--border);
      box-shadow: none;
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
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      align-items: stretch;
    }
    .metric-card {
      position: relative;
      border-radius: 14px;
      border: 1px solid var(--border);
      background: linear-gradient(160deg, rgba(16, 24, 46, 0.92), rgba(10, 16, 30, 0.95));
      padding: 12px;
      box-shadow: var(--card-shadow);
      overflow: hidden;
      isolation: isolate;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-height: 140px;
    }
    .metric-card::after {
      content: "";
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 80% 10%, rgba(34, 211, 238, 0.1), transparent 32%);
      pointer-events: none;
      z-index: 0;
    }
    .metric-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      z-index: 1;
    }
    .metric-title {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
    }
    .live-dot {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: #a8f4ff;
    }
    .live-dot::before {
      content: "";
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #22d3ee;
      box-shadow: 0 0 0 4px rgba(34, 211, 238, 0.16);
      display: inline-block;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 700;
      letter-spacing: -0.02em;
      z-index: 1;
    }
    .metric-sub {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      font-size: 12px;
      color: var(--muted);
      z-index: 1;
    }
    .trend-bar {
      position: relative;
      width: 100%;
      height: 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      overflow: hidden;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .trend-fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      border-radius: 999px;
      background: linear-gradient(90deg, rgba(34, 211, 238, 0.9), rgba(59, 130, 246, 0.85));
      transition: width 0.3s ease;
    }
    .small-muted {
      font-size: 11px;
      color: var(--muted);
      z-index: 1;
    }
    .panel-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 12px;
      align-items: start;
    }
    @media (min-width: 1200px) {
      .panel-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @media (min-width: 1440px) {
      .panel-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    .overview-panel {
      border-radius: 14px;
      border: 1px solid var(--border);
      background: linear-gradient(160deg, rgba(12, 19, 36, 0.92), rgba(9, 14, 27, 0.96));
      padding: 12px;
      box-shadow: var(--card-shadow);
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 210px;
    }
    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .panel-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      letter-spacing: -0.01em;
    }
    .list-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }
    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
    }
    .list-item .item-title {
      font-size: 13px;
      font-weight: 600;
    }
    .list-item .item-sub {
      font-size: 12px;
      color: var(--muted);
      margin-top: 2px;
    }
    .list-item .item-kpis {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
      font-size: 12px;
      color: var(--muted);
    }
    .avatar-stack {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .avatar-stack .avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      overflow: hidden;
      border: 1px solid var(--border);
      background: #111827;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: var(--muted);
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      border-radius: 50%;
    }
    .avatar.sm {
      width: 20px;
      height: 20px;
      border-radius: 50%;
    }
    .avatar-stack.wrap {
      max-width: 220px;
      flex-wrap: wrap;
    }
    .chart-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .chart-bars {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 170px;
      padding: 8px 6px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.02);
    }
    .chart-bar {
      flex: 1;
      min-width: 6px;
      border-radius: 8px 8px 4px 4px;
      background: linear-gradient(180deg, rgba(34, 211, 238, 0.9), rgba(59, 130, 246, 0.6));
      position: relative;
      transition: height 0.25s ease;
    }
    .chart-bar::after {
      content: attr(data-label);
      position: absolute;
      bottom: -18px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      color: var(--muted);
      white-space: nowrap;
    }
    .chart-legend {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: var(--muted);
    }
    .sparkline {
      width: 100%;
      height: 140px;
    }
    .sparkline path {
      fill: none;
      stroke-width: 1.6;
      stroke-linejoin: round;
      stroke-linecap: round;
      opacity: 0.9;
    }
    .sparkline .with-mod {
      stroke: #22d3ee;
      filter: drop-shadow(0 0 6px rgba(34, 211, 238, 0.35));
    }
    .sparkline .without-mod {
      stroke: #f97316;
      filter: drop-shadow(0 0 6px rgba(249, 115, 22, 0.35));
    }
    .legend {
      display: flex;
      gap: 10px;
      align-items: center;
      font-size: 12px;
      color: var(--muted);
    }
    .sparkline-row {
      display: grid;
      grid-template-columns: 60px 1fr;
      align-items: center;
      gap: 10px;
    }
    .sparkline-y {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 140px;
      font-size: 11px;
      color: var(--muted);
    }
    .legend .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .legend .dot.with {
      background: #22d3ee;
      box-shadow: 0 0 8px rgba(34, 211, 238, 0.5);
    }
    .legend .dot.without {
      background: #f97316;
      box-shadow: 0 0 8px rgba(249, 115, 22, 0.5);
    }
    .bar-row {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
    }
    .bar-track {
      flex: 1;
      height: 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid var(--border);
      overflow: hidden;
      position: relative;
    }
    .bar-fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background: linear-gradient(90deg, rgba(34, 211, 238, 0.9), rgba(59, 130, 246, 0.7));
      border-radius: 999px;
      width: 0%;
      transition: width 0.3s ease;
    }
    .tooltip {
      position: fixed;
      z-index: 9999;
      background: rgba(12, 18, 35, 0.96);
      color: var(--text);
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid var(--border-strong);
      box-shadow: 0 10px 30px rgba(5, 10, 22, 0.4);
      font-size: 12px;
      max-width: 320px;
      pointer-events: none;
      opacity: 0;
      transform: translate(-50%, calc(-100% - 10px));
      transition: opacity 0.05s ease;
      white-space: pre-wrap;
      line-height: 1.4;
    }
    .tooltip.visible {
      opacity: 1;
    }
    .pill-ghost {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid var(--border);
      background: rgba(255, 255, 255, 0.04);
      font-size: 11px;
      color: var(--muted);
      white-space: nowrap;
    }
    .inline-error {
      font-size: 12px;
      color: #f97316;
      padding: 8px 10px;
      border: 1px solid rgba(249, 115, 22, 0.3);
      border-radius: 10px;
      background: rgba(249, 115, 22, 0.08);
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
            <li data-section="overview" class="active">
              <span class="name">Overview</span>
              <span class="badge">Live</span>
            </li>
            <li data-section="tables">
              <span class="name">Tables</span>
              <span class="badge">Live</span>
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
        <div id="section-overview" class="section-panel active">
          <div class="section-heading">
            <div>
              <div class="eyebrow">Live</div>
              <h2>Overview</h2>
              <p>Real-time snapshot of players, rooms, social and security.</p>
            </div>
            <div class="inline-badges">
              <span class="chip small">Auto-refresh</span>
              <span class="chip small" id="overview-last-updated">Waiting...</span>
            </div>
          </div>

          <div class="overview-grid">
            <div class="metric-card" id="metric-players">
              <div class="metric-header">
                <div class="metric-title">Players</div>
                <span class="live-dot">Live</span>
              </div>
              <div class="metric-value" id="metric-players-total">—</div>
              <div class="metric-sub">
                <span id="metric-players-mod">— with mod</span>
                <span id="metric-players-online">— online</span>
              </div>
              <div class="trend-bar"><div class="trend-fill" id="metric-players-mod-fill" style="width:0%;"></div></div>
            </div>

            <div class="metric-card" id="metric-rooms">
              <div class="metric-header">
                <div class="metric-title">Rooms</div>
                <span class="live-dot">Live</span>
              </div>
              <div class="metric-value" id="metric-rooms-total">—</div>
              <div class="metric-sub">
                <span id="metric-rooms-public">— public</span>
                <span id="metric-rooms-private">— private</span>
              </div>
              <div class="trend-bar"><div class="trend-fill" id="metric-rooms-active-fill" style="width:0%;"></div></div>
            </div>

            <div class="metric-card" id="metric-social">
              <div class="metric-header">
                <div class="metric-title">Social</div>
                <span class="live-dot">Live</span>
              </div>
              <div class="metric-value" id="metric-social-total">—</div>
              <div class="metric-sub">
                <span id="metric-social-accepted">— accepted</span>
                <span id="metric-social-pending">— pending</span>
                <span id="metric-social-rejected">— rejected</span>
              </div>
              <div class="trend-bar"><div class="trend-fill" id="metric-social-fill" style="width:0%;"></div></div>
            </div>
          </div>

          <div class="panel-grid">
            <div class="overview-panel">
              <div class="panel-head">
                <div>
                  <div class="section-label">Players</div>
                  <div class="panel-title">Momentum</div>
                </div>
                <span class="badge">7d</span>
              </div>
              <div id="overview-momentum" class="list-stack">
                <span class="muted" style="font-size:12px;">Loading...</span>
              </div>
            </div>
            <div class="overview-panel">
              <div class="panel-head">
                <div>
                  <div class="section-label">Economy</div>
                  <div class="panel-title">Health</div>
                </div>
                <span class="badge">Coins</span>
              </div>
              <div id="overview-economy" class="list-stack">
                <span class="muted" style="font-size:12px;">Loading...</span>
              </div>
            </div>
            <div class="overview-panel">
              <div class="panel-head">
                <div>
                  <div class="section-label">Privacy</div>
                  <div class="panel-title">Snapshot</div>
                </div>
                <span class="badge">Flags</span>
              </div>
              <div id="overview-privacy" class="list-stack">
                <span class="muted" style="font-size:12px;">Loading...</span>
              </div>
            </div>
            <div class="overview-panel">
              <div class="panel-head">
                <div>
                  <div class="section-label">Social</div>
                  <div class="panel-title">Top connectors</div>
                </div>
                <span class="badge">24h</span>
              </div>
              <div id="overview-top-connectors" class="list-stack">
                <span class="muted" style="font-size:12px;">Loading...</span>
              </div>
            </div>
            <div class="overview-panel">
              <div class="panel-head">
                <div>
                  <div class="section-label">Security</div>
                  <div class="panel-title">Rate limit</div>
                </div>
                <span class="badge">24h</span>
              </div>
              <div id="overview-security-body" class="list-stack">
                <span class="muted" style="font-size:12px;">Loading...</span>
              </div>
            </div>
          </div>
          <div id="overview-error" class="inline-error" style="display:none;">Unable to load overview.</div>
        </div>

        <div id="section-tables" class="section-panel">
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
              <div class="sql-presets" id="sql-presets"></div>
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
    const OVERVIEW_REFRESH_MS = 15000;

    const sections = {
      overview: document.getElementById("section-overview"),
      tables: document.getElementById("section-tables"),
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

    function buildTableHtml(rows, sortState) {
      if (!rows.length) {
        return "<div class='empty-state'>No rows.</div>";
      }

      const keys = Object.keys(rows[0]);
      let html = "<table><thead><tr>";
      for (const key of keys) {
        const isSorted = sortState && sortState.key === key;
        const dirIcon =
          isSorted && sortState?.dir === "asc"
            ? " ▲"
            : isSorted && sortState?.dir === "desc"
              ? " ▼"
              : "";
        const sortAttrs = sortState
          ? " class='sortable" + (isSorted ? " sorted" : "") + "' data-key='" + escapeHtml(key) + "'"
          : "";
        html += "<th" + sortAttrs + ">" + escapeHtml(key) + dirIcon + "</th>";
      }
      html += "</tr></thead><tbody>";
      for (const row of rows) {
        html += "<tr>";
        for (const key of keys) {
          const { display, tooltip, isJson } = formatCellValue(row[key]);
          const titleAttr = tooltip ? ' data-tooltip="' + escapeHtml(tooltip) + '"' : "";
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

    const numberFormatter = new Intl.NumberFormat("en-US");

    function formatNumber(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) return "0";
      return numberFormatter.format(n);
    }

    function initials(value) {
      if (!value) return "??";
      return String(value)
        .trim()
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }

    function percent(part, total) {
      if (!total || total <= 0) return 0;
      const p = Math.round((Number(part) / Number(total)) * 100);
      if (!Number.isFinite(p)) return 0;
      return Math.min(100, Math.max(0, p));
    }

    function formatTimeAgo(value) {
      if (!value) return "unknown";
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "unknown";
      const diffMs = Date.now() - d.getTime();
      const mins = Math.max(0, Math.floor(diffMs / 60000));
      if (mins < 1) return "just now";
      if (mins < 60) return mins + "m ago";
      const hours = Math.floor(mins / 60);
      if (hours < 24) return hours + "h ago";
      const days = Math.floor(hours / 24);
      return days + "d ago";
    }

    function setWidth(el, width) {
      if (el) {
        el.style.width = width;
      }
    }

    // Overview metrics

    const overviewLastUpdated = document.getElementById("overview-last-updated");
    const overviewError = document.getElementById("overview-error");
    const overviewMomentum = document.getElementById("overview-momentum");
    const overviewEconomy = document.getElementById("overview-economy");
    const overviewPrivacy = document.getElementById("overview-privacy");
    const overviewTopConnectors = document.getElementById("overview-top-connectors");
    const overviewSecurityBody = document.getElementById("overview-security-body");

    let tableRowsCache = [];
    let tableSortState = { key: null, dir: "asc" };

    function sortRows(rows, sortState) {
      if (!sortState || !sortState.key) return rows;
      const key = sortState.key;
      const dir = sortState.dir === "desc" ? -1 : 1;
      return [...rows].sort((a, b) => {
        const va = a[key];
        const vb = b[key];
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        const na = Number(va);
        const nb = Number(vb);
        const bothNum = Number.isFinite(na) && Number.isFinite(nb);
        if (bothNum) {
          return na === nb ? 0 : (na < nb ? -1 : 1) * dir;
        }
        const sa = String(va);
        const sb = String(vb);
        return sa.localeCompare(sb) * dir;
      });
    }

    function renderTableRows(rows, sortState) {
      const sorted = sortRows(rows, sortState);
      return buildTableHtml(sorted, sortState);
    }

    const metricPlayersTotal = document.getElementById("metric-players-total");
    const metricPlayersMod = document.getElementById("metric-players-mod");
    const metricPlayersOnline = document.getElementById("metric-players-online");
    const metricPlayersModFill = document.getElementById("metric-players-mod-fill");

    const metricRoomsTotal = document.getElementById("metric-rooms-total");
    const metricRoomsPublic = document.getElementById("metric-rooms-public");
    const metricRoomsPrivate = document.getElementById("metric-rooms-private");
    const metricRoomsActiveFill = document.getElementById("metric-rooms-active-fill");

    const metricSocialTotal = document.getElementById("metric-social-total");
    const metricSocialAccepted = document.getElementById("metric-social-accepted");
    const metricSocialPending = document.getElementById("metric-social-pending");
    const metricSocialRejected = document.getElementById("metric-social-rejected");
    const metricSocialFill = document.getElementById("metric-social-fill");

    const metricSecurityBlocked = document.getElementById("metric-security-blocked");

    function renderTopRooms(topRooms) {
      if (!topRooms || !topRooms.length) {
        return "<span class='muted' style='font-size:12px;'>No rooms yet.</span>";
      }

      let html = "";
      for (const room of topRooms) {
        const privacy = room.is_private ? "Private" : "Public";
        const created = room.created_at ? formatTimeAgo(room.created_at) : "n/a";
        const players = Array.isArray(room.players) ? room.players : [];
        let avatarHtml = "";
        if (players.length) {
          avatarHtml = "<div class='avatar-stack wrap'>";
          for (const pl of players) {
            const label = initials(pl.name || pl.id || "");
            if (pl.avatar_url) {
              avatarHtml += "<span class='avatar' data-tooltip='" + escapeHtml(pl.name || pl.id) + "'>";
              avatarHtml += "<img src='" + escapeHtml(pl.avatar_url) + "' alt='' />";
              avatarHtml += "</span>";
            } else {
              avatarHtml += "<span class='avatar' data-tooltip='" + escapeHtml(pl.name || pl.id) + "'>" + escapeHtml(label) + "</span>";
            }
          }
          avatarHtml += "</div>";
        } else {
          avatarHtml = "<span class='muted' style='font-size:12px;'>No players in room</span>";
        }

        const ageHours = Number(room.age_hours) || 0;
        const ageDays = Math.floor(ageHours / 24);
        const ageText = ageDays > 0 ? ageDays + "d" : Math.max(1, Math.floor(ageHours)) + "h";

        html += "<div class='list-item'>";
        html += "  <div>";
        html += "    <div class='item-title'>" + escapeHtml(room.id) + "</div>";
        html +=
          "    <div class='item-sub'>" +
          escapeHtml(privacy) +
          " • Created " +
          escapeHtml(created) +
          "</div>";
        html += "    <div style='margin-top:6px;'>" + avatarHtml + "</div>";
        html += "  </div>";
        html += "  <div class='item-kpis'>";
        html += "    <span class='pill-ghost'>" + escapeHtml(ageText) + " old</span>";
        html += "    <span class='pill-ghost'>" + escapeHtml(String(room.players_count ?? 0)) + " players</span>";
        html += "  </div>";
        html += "</div>";
      }
      return html;
    }

    function renderTopConnectors(topConnectors) {
      if (!topConnectors || !topConnectors.length) {
        return "<span class='muted' style='font-size:12px;'>No relationships yet.</span>";
      }

      let html = "";
      for (const row of topConnectors) {
        const name = row.name || row.player_id || "Unknown";
        const label = initials(name);
        let avatar =
          "<span class='avatar sm' data-tooltip='" + escapeHtml(name) + "'>" + escapeHtml(label) + "</span>";
        if (row.avatar_url) {
          avatar =
            "<span class='avatar sm' data-tooltip='" +
            escapeHtml(name) +
            "'><img src='" +
            escapeHtml(row.avatar_url) +
            "' alt='' /></span>";
        }

        html += "<div class='list-item'>";
        html += "  <div style='display:flex;align-items:center;gap:10px;'>";
        html += avatar;
        html += "    <div>";
        html += "      <div class='item-title'>" + escapeHtml(name) + "</div>";
        html +=
          "      <div class='item-sub'>Accepted: " +
          escapeHtml(String(row.accepted ?? 0)) +
          " • Pending: " +
          escapeHtml(String(row.pending ?? 0)) +
          "</div>";
        html += "    </div>";
        html += "  </div>";
        html += "  <div class='item-kpis'>";
        html +=
          "    <span class='pill-ghost'>" +
          escapeHtml(String(row.total_relations ?? 0)) +
          " relations</span>";
        html += "  </div>";
        html += "</div>";
      }
      return html;
    }

    function renderMomentum(momentum, playersTotal) {
      if (!momentum) {
        return "<span class='muted' style='font-size:12px;'>No data.</span>";
      }
      const { new_24h = 0, new_7d = 0, active_24h = 0, active_7d = 0, series_7d = [] } = momentum;
      const total = Number(playersTotal) || 0;
      const cards = [
        { label: "New (24h)", value: new_24h, pct: percent(new_24h, total) },
        { label: "New (7d)", value: new_7d, pct: percent(new_7d, total) },
        { label: "Active (24h)", value: active_24h, pct: percent(active_24h, total) },
        { label: "Active (7d)", value: active_7d, pct: percent(active_7d, total) },
      ];

      const series = Array.isArray(series_7d) ? series_7d : [];
      const maxY = Math.max(
        1,
        ...series.map((row) => Number(row.with_mod) || 0),
        ...series.map((row) => Number(row.without_mod) || 0),
      );
      const n = series.length || 1;
      function toPoints(key) {
        return series.map((row, idx) => {
          const x = n === 1 ? 0 : (idx / (n - 1)) * 100;
          const y = 100 - Math.min(100, Math.max(0, ((Number(row[key]) || 0) / maxY) * 100));
          return { x, y };
        });
      }

      function buildPath(points) {
        if (!points.length) return "";
        if (points.length === 1) {
          const p = points[0];
          return "M " + p.x + " " + p.y;
        }
        let d = "M " + points[0].x + " " + points[0].y;
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          d += " Q " + prev.x + " " + prev.y + " " + midX + " " + midY;
        }
        d += " T " + points[points.length - 1].x + " " + points[points.length - 1].y;
        return d;
      }

      let html = "";
      html += "<div class='list-item'>";
      html += "  <div style='width:100%;'>";
      if (series.length) {
        const withPoints = toPoints("with_mod");
        const withoutPoints = toPoints("without_mod");
        const yTicks = [maxY, Math.round(maxY / 2), 0];
        html += "<div class='sparkline-row'>";
        html += "<div class='sparkline-y'>" + yTicks.map((v) => "<span>" + escapeHtml(formatNumber(v)) + "</span>").join("") + "</div>";
        html +=
          "<svg class='sparkline' viewBox='0 0 100 100' preserveAspectRatio='none'>" +
          "<path class='with-mod' d='" +
          escapeHtml(buildPath(withPoints)) +
          "' />" +
          "<path class='without-mod' d='" +
          escapeHtml(buildPath(withoutPoints)) +
          "' />" +
          "</svg>";
        html += "</div>";
        const dayLabels = series
          .map((row) => {
            const d = row.day ? new Date(row.day) : null;
            const label = d ? d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) : "—";
            return "<span style='font-size:10px;color:var(--muted);'>" + escapeHtml(label) + "</span>";
          })
          .join(" ");
        html += "<div class='legend'><span class='dot with'></span>With mod<span class='dot without'></span>Without mod</div>";
        html += "<div style='display:flex;justify-content:space-between;gap:6px;'>" + dayLabels + "</div>";
      } else {
        html += "<span class='muted' style='font-size:12px;'>No data for last 7 days.</span>";
      }
      html += "  </div>";
      html += "</div>";

      for (const item of cards) {
        html += "<div class='list-item'>";
        html += "  <div>";
        html += "    <div class='item-title'>" + escapeHtml(item.label) + "</div>";
        html += "    <div class='item-sub'>" + escapeHtml(item.pct + "% of players") + "</div>";
        html += "  </div>";
        html += "  <div class='item-kpis'>";
        html += "    <span class='pill-ghost'>" + escapeHtml(String(item.value)) + "</span>";
        html += "    <div class='trend-bar' style='width:120px;'><div class='trend-fill' style='width:" + item.pct + "%;'></div></div>";
        html += "  </div>";
        html += "</div>";
      }
      return html;
    }

    function renderEconomy(economy) {
      if (!economy) {
        return "<span class='muted' style='font-size:12px;'>No data.</span>";
      }
      let html = "";
      html += "<div class='list-item'>";
      html += "  <div>";
      html += "    <div class='item-title'>Totals</div>";
      html += "    <div class='item-sub'>Sum and average coins</div>";
      html += "  </div>";
      html += "  <div class='item-kpis'>";
      html += "    <span class='pill-ghost'>" + escapeHtml(formatNumber(economy.total_coins || 0)) + " total</span>";
      html += "    <span class='pill-ghost'>" + escapeHtml(formatNumber(Math.round(economy.avg_coins || 0))) + " avg</span>";
      html += "  </div>";
      html += "</div>";

      const top = Array.isArray(economy.top) ? economy.top : [];
      if (top.length) {
        html += "<div class='list-item'>";
        html += "  <div>";
        html += "    <div class='item-title'>Top 5 richest</div>";
        html += "    <div class='item-sub'>Players by coins</div>";
        html += "  </div>";
        html += "  <div class='item-kpis' style='align-items:flex-start;gap:6px;'>";
        html += "    <div class='avatar-stack wrap'>";
        for (const pl of top) {
          const label = initials(pl.name || pl.player_id || "");
          const tooltip = (pl.name || "Player") + " • " + formatNumber(pl.coins || 0) + " coins";
          if (pl.avatar_url) {
            html += "<span class='avatar sm' data-tooltip='" + escapeHtml(tooltip) + "'>";
            html += "<img src='" + escapeHtml(pl.avatar_url) + "' alt='' />";
            html += "</span>";
          } else {
            html += "<span class='avatar sm' data-tooltip='" + escapeHtml(tooltip) + "'>" + escapeHtml(label) + "</span>";
          }
        }
        html += "    </div>";
        html += "  </div>";
        html += "</div>";
      }

      return html;
    }

    function renderPrivacy(privacy) {
      if (!privacy || !privacy.total) {
        return "<span class='muted' style='font-size:12px;'>No data.</span>";
      }
      const total = privacy.total || 1;
      const rows = [
        { label: "Show profile", value: privacy.show_profile_true },
        { label: "Show garden", value: privacy.show_garden_true },
        { label: "Show inventory", value: privacy.show_inventory_true },
        { label: "Show coins", value: privacy.show_coins_true },
        { label: "Show activity log", value: privacy.show_activity_log_true },
        { label: "Show journal", value: privacy.show_journal_true },
        { label: "Show stats", value: privacy.show_stats_true },
        { label: "Hide room from list", value: privacy.hide_room_true },
      ];
      let html = "";
      for (const row of rows) {
        const pct = percent(row.value || 0, total);
        html += "<div class='list-item'>";
        html += "  <div>";
        html += "    <div class='item-title'>" + escapeHtml(row.label) + "</div>";
        html += "  </div>";
        html += "  <div class='item-kpis' style='gap:6px;'>";
        html +=
          "    <span class='pill-ghost'>" +
          escapeHtml(String(row.value || 0)) +
          " · " +
          escapeHtml(String(pct) + "%") +
          "</span>";
        html += "    <div class='trend-bar' style='width:120px;'><div class='trend-fill' style='width:" + pct + "%;'></div></div>";
        html += "  </div>";
        html += "</div>";
      }
      return html;
    }

    function renderSecurityPanel(security) {
      if (!security) {
        return "<span class='muted' style='font-size:12px;'>No data.</span>";
      }

      const rl = security.rate_limit || {};
      const hourly = Array.isArray(rl.hourly) ? rl.hourly : [];
      const maxHits = hourly.reduce((max, row) => Math.max(max, Number(row.hits) || 0), 0);
      let chartHtml = "<div class='chart-bars'>";
      if (hourly.length) {
        for (const row of hourly) {
          const hits = Number(row.hits) || 0;
          const pct = maxHits > 0 ? Math.max(4, Math.round((hits / maxHits) * 100)) : 4;
          const hourLabel = row.hour ? new Date(row.hour).getHours().toString().padStart(2, "0") : "--";
          chartHtml +=
            "<div class='chart-bar' style='height:" +
            pct +
            "%' data-tooltip='" +
            escapeHtml(String(hits) + " hits at " + hourLabel + ":00") +
            "' data-label='" +
            escapeHtml(hourLabel) +
            "'></div>";
        }
      } else {
        chartHtml += "<div class='muted' style='font-size:12px;'>No data</div>";
      }
      chartHtml += "</div>";

      let html = "";
      html += "<div class='chart-container'>";
      html += chartHtml;
      html +=
        "<div class='chart-legend'><span>Hits per hour</span><span>Total: " +
        escapeHtml(formatNumber(rl.total_hits ?? 0)) +
        " (last " +
        escapeHtml(String(rl.window_hours ?? 0)) +
        "h)</span></div>";
      html += "</div>";

      html += "<div class='list-item'>";
      html += "  <div>";
      html += "    <div class='item-title'>Blocked IPs</div>";
      html += "    <div class='item-sub'>Current total</div>";
      html += "  </div>";
      html += "  <div class='item-kpis'><span class='pill-ghost'>" + escapeHtml(String(security.blocked_ips ?? 0)) + "</span></div>";
      html += "</div>";

      return html;
    }

    // Tooltips (instant + themed)
    const tooltipEl = document.createElement("div");
    tooltipEl.className = "tooltip";
    document.body.appendChild(tooltipEl);
    let currentTooltipTarget = null;

    function hideTooltip() {
      currentTooltipTarget = null;
      tooltipEl.classList.remove("visible");
    }

    function showTooltip(target, text, x, y) {
      if (!text) {
        hideTooltip();
        return;
      }
      currentTooltipTarget = target;
      tooltipEl.textContent = text;
      tooltipEl.style.left = x + "px";
      tooltipEl.style.top = y + "px";
      tooltipEl.classList.add("visible");
    }

    function getTooltipText(el) {
      if (!el || !(el instanceof HTMLElement)) return "";
      return el.dataset.tooltip || "";
    }

    function findTooltipTarget(target) {
      if (!(target instanceof HTMLElement)) return null;
      return target.closest("[data-tooltip]");
    }

    document.addEventListener("pointerover", (event) => {
      const target = findTooltipTarget(event.target);
      if (!target) {
        hideTooltip();
        return;
      }
      const text = getTooltipText(target);
      showTooltip(target, text, event.clientX, event.clientY);
    });

    document.addEventListener("pointermove", (event) => {
      if (!currentTooltipTarget) return;
      const text = getTooltipText(currentTooltipTarget);
      if (!text) {
        hideTooltip();
        return;
      }
      showTooltip(currentTooltipTarget, text, event.clientX, event.clientY);
    });

    document.addEventListener("pointerout", (event) => {
      const related = findTooltipTarget(event.relatedTarget);
      if (related && related === currentTooltipTarget) {
        return;
      }
      hideTooltip();
    });

    let overviewTimer;

    function updateOverviewUI(data) {
      if (!data) return;

      if (overviewError) {
        overviewError.style.display = "none";
      }

      const players = data.players || {};
      const rooms = data.rooms || {};
      const social = data.social || {};
      const security = data.security || {};
      const rl = security.rate_limit || {};

      if (overviewLastUpdated) {
        overviewLastUpdated.textContent = "Updated " + formatTimeAgo(data.generated_at);
      }

      if (metricPlayersTotal) {
        metricPlayersTotal.textContent = formatNumber(players.total);
      }
      if (metricPlayersMod) {
        metricPlayersMod.textContent = formatNumber(players.with_mod) + " with mod";
      }
      if (metricPlayersOnline) {
        metricPlayersOnline.textContent = formatNumber(players.online) + " online";
      }
      setWidth(metricPlayersModFill, percent(players.with_mod, players.total) + "%");

      if (metricRoomsTotal) {
        metricRoomsTotal.textContent = formatNumber(rooms.total);
      }
      if (metricRoomsPublic) {
        metricRoomsPublic.textContent = formatNumber(rooms.public) + " public";
      }
      if (metricRoomsPrivate) {
        metricRoomsPrivate.textContent = formatNumber(rooms.private) + " private";
      }
      setWidth(metricRoomsActiveFill, percent(rooms.public, rooms.total) + "%");

      if (metricSocialTotal) {
        metricSocialTotal.textContent = formatNumber(social.total);
      }
      if (metricSocialAccepted) {
        metricSocialAccepted.textContent = formatNumber(social.accepted) + " accepted";
      }
      if (metricSocialPending) {
        metricSocialPending.textContent = formatNumber(social.pending) + " pending";
      }
      if (metricSocialRejected) {
        metricSocialRejected.textContent = formatNumber(social.rejected) + " rejected";
      }
      setWidth(
        metricSocialFill,
        percent(social.accepted, Math.max(1, Number(social.total) || 0)) + "%",
      );

      if (overviewMomentum) {
        overviewMomentum.innerHTML = renderMomentum(data.momentum, players.total);
      }
      if (overviewEconomy) {
        overviewEconomy.innerHTML = renderEconomy(data.economy);
      }
      if (overviewPrivacy) {
        overviewPrivacy.innerHTML = renderPrivacy(data.privacy);
      }
      if (metricSecurityBlocked) {
        metricSecurityBlocked.textContent = formatNumber(security.blocked_ips);
      }
      if (overviewTopConnectors) {
        overviewTopConnectors.innerHTML = renderTopConnectors(social.top_connectors || []);
      }
      if (overviewSecurityBody) {
        overviewSecurityBody.innerHTML = renderSecurityPanel(security);
      }
    }

    async function loadOverviewData(isPoll = false) {
      if (!isPoll && overviewError) {
        overviewError.style.display = "none";
      }
      try {
        const data = await fetchJson("/admin/overview");
        updateOverviewUI(data);
      } catch (err) {
        console.error(err);
        if (overviewError) {
          overviewError.style.display = "block";
          overviewError.textContent = "Failed to load overview: " + err.message;
        }
      }
    }

    function startOverviewPolling() {
      if (overviewTimer) {
        clearInterval(overviewTimer);
      }
      overviewTimer = setInterval(() => loadOverviewData(true), OVERVIEW_REFRESH_MS);
    }

    // Tables / stats

    const tableSelect = document.getElementById("table-select");
    const tableLimit = document.getElementById("table-limit");
    const tableOffset = document.getElementById("table-offset");
    const tableResults = document.getElementById("table-results");
    const tableRefreshBtn = document.getElementById("table-refresh-btn");

    async function loadTableData(keepSort = false) {
      const table = tableSelect.value;
      const limit = Number(tableLimit.value) || 100;
      const offset = Number(tableOffset.value) || 0;

      if (!keepSort) {
        tableSortState = { key: null, dir: "asc" };
      }

      tableResults.textContent = "Loading...";

      try {
        const params = new URLSearchParams({
          table,
          limit: String(limit),
          offset: String(offset),
        });
        if (tableSortState.key) {
          params.set("orderBy", tableSortState.key);
          params.set("orderDir", tableSortState.dir || "asc");
        }
        const data = await fetchJson("/admin/table?" + params.toString());
        tableRowsCache = data.rows || [];
        tableResults.innerHTML = renderTableRows(tableRowsCache, tableSortState);
        attachTableSortHandlers();
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

    function attachTableSortHandlers() {
      if (!tableResults) return;
      const headers = tableResults.querySelectorAll("th[data-key]");
      headers.forEach((th) => {
        th.addEventListener("click", () => {
          const key = th.getAttribute("data-key");
          if (!key) return;
          if (tableSortState.key === key) {
            tableSortState.dir = tableSortState.dir === "asc" ? "desc" : "asc";
          } else {
            tableSortState.key = key;
            tableSortState.dir = "asc";
          }
          loadTableData(true);
        });
      });
    }

    // Stats

    // SQL console

    const sqlInput = document.getElementById("sql-input");
    const sqlRunBtn = document.getElementById("sql-run-btn");
    const sqlExampleBtn = document.getElementById("sql-example-btn");
    const sqlResults = document.getElementById("sql-results");
    const sqlPresetsContainer = document.getElementById("sql-presets");

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

    const sqlPresets = [
      {
        label: "Players: newest",
        query: "SELECT id, name, coins, has_mod_installed, created_at FROM public.players ORDER BY created_at DESC LIMIT 50;",
      },
      {
        label: "Players: active 24h",
        query: "SELECT id, name, last_event_at FROM public.players WHERE last_event_at >= now() - interval '24 hours' ORDER BY last_event_at DESC LIMIT 100;",
      },
      {
        label: "Rooms: active",
        query: "SELECT id, is_private, players_count, last_updated_at FROM public.rooms ORDER BY last_updated_at DESC NULLS LAST LIMIT 50;",
      },
      {
        label: "Rooms: top by players",
        query: "SELECT id, is_private, players_count FROM public.rooms ORDER BY players_count DESC NULLS LAST LIMIT 50;",
      },
      {
        label: "Privacy flags",
        query: "SELECT show_profile, show_inventory, show_garden, show_coins, hide_room_from_public_list, updated_at FROM public.player_privacy ORDER BY updated_at DESC LIMIT 50;",
      },
      {
        label: "Relationships counts",
        query: "SELECT status, COUNT(*) AS total FROM public.player_relationships GROUP BY status ORDER BY total DESC;",
      },
      {
        label: "Economy: top coins",
        query: "SELECT id, name, coins FROM public.players ORDER BY coins DESC NULLS LAST LIMIT 20;",
      },
      {
        label: "Rate limit: last hour by player",
        query: "SELECT player_id, SUM(hit_count) AS hits FROM public.rate_limit_usage WHERE bucket_start >= now() - interval '1 hour' GROUP BY player_id ORDER BY hits DESC NULLS LAST LIMIT 50;",
      },
      {
        label: "Rate limit: last hour by IP",
        query: "SELECT ip, SUM(hit_count) AS hits FROM public.rate_limit_usage WHERE bucket_start >= now() - interval '1 hour' GROUP BY ip ORDER BY hits DESC NULLS LAST LIMIT 50;",
      },
      {
        label: "Blocked IPs",
        query: "SELECT ip, reason, blocked_at FROM public.blocked_ips ORDER BY blocked_at DESC;",
      },
    ];

    if (sqlPresetsContainer) {
      sqlPresets.forEach((preset) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "secondary";
        btn.textContent = preset.label;
        btn.addEventListener("click", () => {
          sqlInput.value = preset.query;
          sqlInput.focus();
        });
        sqlPresetsContainer.appendChild(btn);
      });
    }

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
        const coinsDisplay = formatNumber(coins);
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
        if (row.ip) {
          html +=
            "    <div>IP: " +
            escapeHtml(row.ip) +
            "</div>";
        }
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
    switchSection("overview");
    loadOverviewData();
    startOverviewPolling();
    loadTableData();
  </script>
</body>
</html>`);
  });

  // /admin/table : tables ou vues de stats

}
