import type { Application, Request, Response } from "express";

let _cachedHtml: string | null = null;

function getPublicStyles(): string {
  return `<style>
@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes copied{0%{transform:scale(.95);opacity:.7}50%{transform:scale(1.02)}100%{transform:scale(1);opacity:1}}
@keyframes spin{to{transform:rotate(360deg)}}
:root{
  --bg:#07070a;--s1:#0e0e12;--s2:#151519;--s3:#1c1c22;--s4:#25252d;
  --bd:rgba(255,255,255,.05);--bd2:rgba(255,255,255,.08);--bd3:rgba(255,255,255,.12);
  --t1:#f0f0f4;--t2:#9898a8;--t3:#5c5c6e;
  --p:#a78bfa;--p2:#8b6ff0;--pd:rgba(167,139,250,.1);--pb:rgba(167,139,250,.2);
  --g:#34d399;--gd:rgba(52,211,153,.1);
  --y:#fbbf24;
  --r:#f87171;
  --rad:10px;--radl:16px;
  --f:'Outfit',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  --m:'Source Code Pro','SF Mono','Fira Code',Consolas,monospace
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{font-size:14px}
body{background:var(--bg);color:var(--t1);font-family:var(--f);line-height:1.5;-webkit-font-smoothing:antialiased;min-height:100vh}
::selection{background:var(--p);color:#000}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bd3);border-radius:99px}

/* --- HEADER --- */
.page{max-width:1400px;margin:0 auto;padding:0 32px}
@media(max-width:680px){.page{padding:0 16px}}
.hdr{padding-top:40px;padding-bottom:24px;border-bottom:1px solid var(--bd);margin-bottom:24px}
.hdr-top{display:flex;align-items:center;gap:10px;margin-bottom:16px}
.hdr-logo{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,var(--p2),#6d5acf);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#fff;flex-shrink:0}
.hdr-brand{font-size:13px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--p)}
.hdr h1{font-size:28px;font-weight:800;letter-spacing:-.04em;line-height:1.1;margin-bottom:4px}
.hdr-sub{color:var(--t3);font-size:13px;font-weight:500}
.hdr-stats{display:flex;align-items:center;gap:16px;margin-top:14px}
.hdr-stat{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--t2);padding:5px 12px;background:var(--s2);border:1px solid var(--bd);border-radius:99px}
.live-dot{width:6px;height:6px;border-radius:50%;background:var(--g);box-shadow:0 0 6px var(--g);animation:pulse 2s ease-in-out infinite}

/* --- GRID --- */
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:14px}
@media(max-width:680px){.grid{grid-template-columns:1fr}}

/* --- CARD --- */
.card{background:var(--s1);border:1px solid var(--bd2);border-radius:var(--radl);padding:18px;display:flex;flex-direction:column;gap:14px;transition:border-color .2s,box-shadow .2s,transform .2s}
.card:hover{border-color:var(--pb);box-shadow:0 0 0 1px var(--pd),0 8px 24px rgba(0,0,0,.3);transform:translateY(-1px)}
.card.new{animation:fadeIn .35s ease}

/* card header */
.card-hd{display:flex;align-items:center;justify-content:space-between;gap:8px}
.card-id-wrap{display:flex;align-items:center;gap:6px;min-width:0;flex:1}
.card-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,var(--s3),var(--s4));display:flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--t3)}
.card-icon svg{width:14px;height:14px}
.card-icon.dc{background:linear-gradient(135deg,#5865f2,#4752c4);color:#fff}
.card-id{font-family:var(--m);font-size:11px;color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;display:block}
.card-slots{font-size:12px;font-weight:700;padding:4px 10px;border-radius:8px;white-space:nowrap;letter-spacing:-.02em}
.card-slots.s-low{background:var(--gd);color:var(--g)}
.card-slots.s-mid{background:rgba(251,191,36,.1);color:var(--y)}
.card-slots.s-high{background:rgba(248,113,113,.1);color:var(--r)}

/* avatars */
.avs{display:flex;align-items:center;padding:2px 0}
.av{width:34px;height:34px;border-radius:50%;background:var(--s3);border:2.5px solid var(--s1);display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:12px;font-weight:700;color:var(--t3);flex-shrink:0;margin-left:-8px;transition:transform .15s}
.av:first-child{margin-left:0}
.av:hover{transform:scale(1.12);z-index:1}
.av img{width:100%;height:100%;object-fit:cover;display:block}
.av-empty{border:2px dashed var(--bd3);background:transparent}

/* progress bar */
.slot-bar{height:4px;background:var(--s3);border-radius:99px;overflow:hidden}
.slot-fill{height:100%;border-radius:99px;transition:width .4s ease}

/* copy button */
.copy-btn{display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:8px;border:1px solid var(--bd2);background:var(--s2);color:var(--t2);font-size:11px;font-weight:600;font-family:var(--f);cursor:pointer;transition:all .15s;white-space:nowrap}
.copy-btn:hover{background:var(--s3);border-color:var(--bd3);color:var(--t1)}
.copy-btn.copied{background:var(--gd);border-color:rgba(52,211,153,.2);color:var(--g);animation:copied .2s ease}
.copy-btn svg{width:13px;height:13px;flex-shrink:0}

/* --- SKELETON --- */
.sk-card{background:var(--s1);border:1px solid var(--bd2);border-radius:var(--radl);padding:18px;display:flex;flex-direction:column;gap:14px}
.sk{height:12px;border-radius:6px;background:linear-gradient(90deg,var(--s2) 25%,var(--s3) 50%,var(--s2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite}
.sk-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(90deg,var(--s2) 25%,var(--s3) 50%,var(--s2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite;flex-shrink:0}

/* --- EMPTY --- */
.empty{text-align:center;padding:80px 32px;color:var(--t3);grid-column:1/-1}
.empty-icon{width:56px;height:56px;border-radius:16px;background:var(--s2);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;opacity:.5}
.empty h3{font-size:16px;font-weight:700;color:var(--t2);margin-bottom:4px}
.empty p{font-size:13px}

/* --- FOOTER --- */
.footer{padding:28px 0;text-align:center;font-size:12px;color:var(--t3);border-top:1px solid var(--bd);margin-top:32px}
.footer strong{color:var(--p);font-weight:700}

/* --- REFRESH BUTTON --- */
.refresh-btn{display:flex;align-items:center;gap:7px;padding:6px 14px;border-radius:99px;border:1px solid var(--bd2);background:var(--s2);color:var(--t2);font-size:12px;font-weight:600;font-family:var(--f);cursor:pointer;transition:all .15s;user-select:none}
.refresh-btn:hover:not(:disabled){background:var(--s3);border-color:var(--bd3);color:var(--t1)}
.refresh-btn:disabled{opacity:.5;cursor:not-allowed}
.refresh-btn svg{width:14px;height:14px;flex-shrink:0;transition:transform .15s}
.refresh-btn.spinning svg{animation:spin .7s linear infinite}

/* --- ERROR --- */
.err-banner{padding:10px 16px;background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.15);color:var(--r);font-size:12px;font-weight:500;border-radius:var(--rad);margin-bottom:14px;display:none;text-align:center}
</style>`;
}

function getPublicLayout(): string {
  return `
<div class="page">
  <div class="hdr">
    <div class="hdr-top">
      <div class="hdr-logo">A</div>
      <div class="hdr-brand">Arie's Mod</div>
    </div>
    <h1>Public Rooms</h1>
    <div class="hdr-sub">Browse available rooms and jump in</div>
    <div class="hdr-stats">
      <div class="hdr-stat"><div class="live-dot"></div><span id="status">Loading</span></div>
      <div class="hdr-stat" id="room-count-wrap" style="display:none"><span id="room-count">0</span></div>
      <button class="refresh-btn" id="refresh-btn" disabled>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        Refresh
      </button>
    </div>
  </div>
  <div class="err-banner" id="err"></div>
  <div class="grid" id="grid"></div>
  <div class="footer">
    These rooms are powered and made visible by <strong>Aries Mod</strong> users.
  </div>
</div>`;
}

function getPublicScript(): string {
  return `
var grid=document.getElementById('grid');
var statusEl=document.getElementById('status');
var roomCountEl=document.getElementById('room-count');
var roomCountWrap=document.getElementById('room-count-wrap');
var errBanner=document.getElementById('err');
var refreshBtn=document.getElementById('refresh-btn');
var _prev={};
var _loading=true;
var _fetching=false;

function h(s){
  if(s==null)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}

function slotClass(c){
  if(c>=5)return's-high';
  if(c>=3)return's-mid';
  return's-low'
}
function slotColor(c){
  if(c>=5)return'var(--r)';
  if(c>=3)return'var(--y)';
  return'var(--g)'
}

var copySvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
var checkSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
var discordSvg='<svg viewBox="0 -28.5 256 256" xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" fill="#fff"/></svg>';
var globeSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

function isDiscordRoom(id){return /^I-\\d+.*-GC-/.test(id)}

function renderSkeleton(){
  var x='';
  for(var i=0;i<8;i++){
    x+='<div class="sk-card">';
    x+='<div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;gap:8px;align-items:center"><div class="sk" style="width:28px;height:28px;border-radius:8px"></div><div class="sk" style="width:'+(80+Math.random()*60)+'px"></div></div><div class="sk" style="width:36px;border-radius:8px"></div></div>';
    x+='<div style="display:flex;gap:0"><div class="sk-av"></div><div class="sk-av" style="margin-left:-8px"></div><div class="sk-av" style="margin-left:-8px"></div></div>';
    x+='<div class="sk" style="width:60%"></div>';
    x+='<div class="sk" style="width:100%;height:4px"></div>';
    x+='<div class="sk" style="width:70px;height:28px;border-radius:8px"></div>';
    x+='</div>'
  }
  grid.innerHTML=x
}

function buildCard(room){
  var pct=Math.round((room.playersCount/6)*100);
  var pl=room.players||[];

  var isDc=isDiscordRoom(room.id);
  var x='<div class="card-hd">';
  x+='<div class="card-id-wrap"><div class="card-icon'+(isDc?' dc':'')+'">'+( isDc?discordSvg:globeSvg)+'</div>';
  var short=room.id.length>18?room.id.slice(0,16)+'..':room.id;
  x+='<span class="card-id" title="'+h(room.id)+'">'+h(short)+'</span></div>';
  x+='<span class="card-slots '+slotClass(room.playersCount)+'">'+room.playersCount+'/6</span>';
  x+='</div>';

  x+='<div class="avs">';
  for(var i=0;i<pl.length;i++){
    var p=pl[i];
    if(p.avatarUrl){
      x+='<div class="av"><img src="'+h(p.avatarUrl)+'" alt="'+h(p.name)+'" title="'+h(p.name)+'" loading="lazy"></div>'
    }else{
      var init=(p.name||'?').charAt(0).toUpperCase();
      x+='<div class="av" title="'+h(p.name)+'">'+h(init)+'</div>'
    }
  }
  for(var j=pl.length;j<6;j++) x+='<div class="av av-empty"></div>';
  x+='</div>';

  x+='<div class="slot-bar"><div class="slot-fill" style="width:'+pct+'%;background:'+slotColor(room.playersCount)+'"></div></div>';
  x+='<button class="copy-btn" data-id="'+h(room.id)+'">'+copySvg+' Copy ID</button>';

  return x
}

function reconcile(rooms){
  var newIds={};
  for(var i=0;i<rooms.length;i++) newIds[rooms[i].id]=true;

  // remove cards no longer present
  var existing=grid.querySelectorAll('.card[data-rid]');
  for(var i=0;i<existing.length;i++){
    var rid=existing[i].getAttribute('data-rid');
    if(!newIds[rid]){
      existing[i].style.opacity='0';
      existing[i].style.transform='scale(.96)';
      existing[i].style.transition='opacity .2s,transform .2s';
      (function(el){setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el)},200)})(existing[i])
    }
  }

  // update or add
  for(var i=0;i<rooms.length;i++){
    var room=rooms[i];
    var el=grid.querySelector('.card[data-rid="'+CSS.escape(room.id)+'"]');
    if(el){
      // update in-place (no animation replay)
      var prev=_prev[room.id];
      if(!prev||prev.playersCount!==room.playersCount||JSON.stringify(prev.players)!==JSON.stringify(room.players)){
        el.innerHTML=buildCard(room)
      }
    }else{
      // new card
      var div=document.createElement('div');
      div.className='card new';
      div.setAttribute('data-rid',room.id);
      div.innerHTML=buildCard(room);
      grid.appendChild(div);
      // remove animation class after it plays
      (function(d){setTimeout(function(){d.classList.remove('new')},400)})(div)
    }
    _prev[room.id]=room
  }

  // reorder to match server order
  for(var i=0;i<rooms.length;i++){
    var el=grid.querySelector('.card[data-rid="'+CSS.escape(rooms[i].id)+'"]');
    if(el)grid.appendChild(el)
  }
}

function render(data){
  if(!data||!data.rooms||data.rooms.length===0){
    grid.innerHTML='<div class="empty"><div class="empty-icon">&#8962;</div><h3>No rooms available</h3><p>No public rooms right now. Check back later!</p></div>';
    statusEl.textContent='No rooms';
    roomCountWrap.style.display='none';
    return
  }
  // remove skeletons and empty state
  var sks=grid.querySelectorAll('.sk-card');
  for(var i=0;i<sks.length;i++)sks[i].remove();
  var emp=grid.querySelector('.empty');
  if(emp)emp.remove();

  reconcile(data.rooms);
  statusEl.textContent='Live';
  roomCountWrap.style.display='';
  roomCountEl.textContent=data.count+' room'+(data.count!==1?'s':'');
  refreshBtn.disabled=false
}

function setRefreshing(on){
  _fetching=on;
  refreshBtn.disabled=on;
  if(on){refreshBtn.classList.add('spinning')}else{refreshBtn.classList.remove('spinning')}
}

function fetchRooms(){
  if(_fetching)return;
  setRefreshing(true);
  fetch('/public/rooms').then(function(r){
    if(!r.ok)throw new Error(r.status);
    return r.json()
  }).then(function(data){
    _loading=false;
    errBanner.style.display='none';
    render(data);
    setRefreshing(false)
  }).catch(function(){
    if(_loading){
      grid.innerHTML='<div class="empty"><div class="empty-icon">&#9888;</div><h3>Connection failed</h3><p>Check your connection and try again.</p></div>'
    }
    errBanner.textContent='Failed to load rooms.';
    errBanner.style.display='block';
    statusEl.textContent='Error';
    setRefreshing(false)
  })
}

// refresh button
refreshBtn.addEventListener('click',fetchRooms);

// copy handler (delegated)
document.addEventListener('click',function(e){
  var btn=e.target.closest('.copy-btn');
  if(!btn)return;
  var id=btn.getAttribute('data-id');
  if(!id)return;
  navigator.clipboard.writeText(id).then(function(){
    btn.innerHTML=checkSvg+' Copied!';
    btn.classList.add('copied');
    setTimeout(function(){
      btn.innerHTML=copySvg+' Copy ID';
      btn.classList.remove('copied')
    },1500)
  })
});

renderSkeleton();
fetchRooms();
`;
}

function buildPublicRoomsHtml(): string {
  if (_cachedHtml) return _cachedHtml;

  _cachedHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Arie's Mod - Public Rooms</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet">
  ${getPublicStyles()}
</head>
<body>
  ${getPublicLayout()}
  <script>
  (function(){
    ${getPublicScript()}
  })();
  </script>
</body>
</html>`;

  return _cachedHtml;
}

export function registerPublicRoomsPageRoute(app: Application): void {
  app.get("/public/rooms-page", (_req: Request, res: Response) => {
    res.type("html").send(buildPublicRoomsHtml());
  });
}
