export function getLayout(): string {
  return `
<div class="shell">
  <aside class="side" id="side">
    <div class="side-brand">
      <h1>Arie's Mod</h1>
      <small>Admin Panel</small>
    </div>
    <nav class="side-nav">
      <div class="side-section">
        <div class="side-lbl">Overview</div>
        <div class="sl on" data-r="/dashboard"><span class="ic">&#9632;</span>Dashboard</div>
      </div>
      <div class="side-section">
        <div class="side-lbl">Database</div>
        <div class="sl" data-r="/tables"><span class="ic">&#9776;</span>Tables</div>
        <div class="sl" data-r="/sql"><span class="ic">&gt;_</span>SQL Console<span class="bg">R/O</span></div>
      </div>
      <div class="side-section">
        <div class="side-lbl">Explore</div>
        <div class="sl" data-r="/search"><span class="ic">&#8981;</span>Search</div>
      </div>
      <div class="side-section">
        <div class="side-lbl">Social</div>
        <div class="sl" data-r="/rooms"><span class="ic">&#8962;</span>Rooms</div>
        <div class="sl" data-r="/groups"><span class="ic">&#9776;</span>Groups</div>
      </div>
    </nav>
    <div class="side-ctx" id="side-ctx" style="display:none">
      <div class="side-lbl">Context</div>
      <div id="side-ctx-items"></div>
    </div>
  </aside>
  <div class="main">
    <header class="top" id="top">
      <div class="top-l" id="top-l"></div>
      <div class="top-r" id="top-r"></div>
    </header>
    <div class="vw"><div class="vw-in" id="vw"></div></div>
  </div>
</div>`;
}
