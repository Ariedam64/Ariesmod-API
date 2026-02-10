export function getSqlScript(): string {
  return `
var _sqk='aries_sql',_sqm=20;
function _sqg(){try{return JSON.parse(localStorage.getItem(_sqk)||'[]')}catch(e){return[]}}
function _sqa(q){var a=_sqg().filter(function(x){return x!==q});a.unshift(q);if(a.length>_sqm)a.length=_sqm;localStorage.setItem(_sqk,JSON.stringify(a))}
function rSql(){
  var presets=[
    {l:'Players (recent)',q:'SELECT id, name, coins, has_mod_installed, mod_version, created_at FROM players ORDER BY created_at DESC LIMIT 50;'},
    {l:'Players (online)',q:"SELECT id, name, last_event_at, mod_version FROM players WHERE last_event_at >= now() - interval '5 minutes' ORDER BY last_event_at DESC;"},
    {l:'Rooms (active)',q:"SELECT id, is_private, players_count, last_updated_at FROM rooms WHERE last_updated_at >= now() - interval '1 hour' ORDER BY last_updated_at DESC;"},
    {l:'Relationships',q:'SELECT * FROM player_relationships ORDER BY created_at DESC LIMIT 50;'},
    {l:'Messages (recent)',q:'SELECT dm.id, dm.sender_id, dm.recipient_id, dm.body, dm.created_at FROM direct_messages dm ORDER BY dm.created_at DESC LIMIT 50;'},
    {l:'Messages by thread',q:'SELECT conversation_id, count(*) as msg_count FROM direct_messages GROUP BY conversation_id ORDER BY msg_count DESC LIMIT 50;'},
    {l:'Rate limits (1h)',q:"SELECT player_id, ip, sum(hit_count) AS hits FROM rate_limit_usage WHERE bucket_start >= now() - interval '1 hour' GROUP BY player_id, ip ORDER BY hits DESC LIMIT 50;"},
    {l:'Blocked IPs',q:'SELECT * FROM blocked_ips ORDER BY blocked_at DESC;'},
    {l:'Table sizes',q:"SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;"}
  ];
  var ph='<div class="pres">';for(var i=0;i<presets.length;i++)ph+='<button class="pre" data-sq="'+h(presets[i].q)+'">'+h(presets[i].l)+'</button>';ph+='</div>';
  var hist=_sqg(),hh='';
  if(hist.length){var hl='';for(var i=0;i<hist.length;i++)hl+='<div class="it" style="cursor:pointer;font-family:var(--m);font-size:11px" data-sq="'+h(hist[i])+'">'+h(hist[i])+'</div>';
    hh='<div style="margin-top:12px">'+mkCo('Query History',hist.length+' queries',hl,true)+'</div>'}
  V.innerHTML='<div class="phd"><h2>SQL Console</h2><p>Execute read-only queries (SELECT / WITH)</p></div>'+
    ph+
    '<textarea id="sqe" placeholder="SELECT * FROM players LIMIT 10;"></textarea>'+
    '<div style="display:flex;gap:8px;margin:8px 0;align-items:center">'+
      '<button class="btn btn-p" id="sqr">Run Query</button>'+
      '<span style="font-size:11px;color:var(--t3)">Ctrl+Enter to execute</span>'+
      '<button class="btn btn-s btn-sm" id="sqc" style="margin-left:auto;display:none">Copy CSV</button>'+
    '</div>'+
    '<div id="sqo"></div>'+hh;
  var ed=document.getElementById('sqe'),rb=document.getElementById('sqr'),oe=document.getElementById('sqo'),cb=document.getElementById('sqc'),_sqR=null;
  async function run(){
    var q=ed.value.trim();if(!q)return;
    oe.innerHTML='<div class="ld">Executing</div>';cb.style.display='none';
    try{var d=await pj('/admin/sql',{query:q});_sqa(q);var rows=d.rows||[];
      oe.innerHTML='<div style="font-size:12px;color:var(--t3);margin-bottom:8px">'+rows.length+' rows returned</div>'+mkT(rows,{});
      if(rows.length>0){cb.style.display='';_sqR=rows}
    }catch(e){if(e.name==='AbortError')return;oe.innerHTML='<div class="em" style="color:var(--r)">Error: '+h(e.message)+'</div>'}
  }
  rb.addEventListener('click',run);
  ed.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run()}
    if(e.key==='Tab'){e.preventDefault();var st=ed.selectionStart;ed.value=ed.value.substring(0,st)+'  '+ed.value.substring(ed.selectionEnd);ed.selectionStart=ed.selectionEnd=st+2}
  });
  cb.addEventListener('click',function(){
    if(!_sqR||!_sqR.length)return;var cols=Object.keys(_sqR[0]),csv=cols.join(',')+String.fromCharCode(10);
    for(var r=0;r<_sqR.length;r++){var ln='';for(var j=0;j<cols.length;j++){if(j>0)ln+=',';var v=_sqR[r][cols[j]];
      if(v===null||v===undefined){continue}if(typeof v==='object')v=JSON.stringify(v);v=String(v);
      if(v.indexOf(',')>=0||v.indexOf('"')>=0||v.indexOf(String.fromCharCode(10))>=0)v='"'+v.replace(/"/g,'""')+'"';ln+=v}
      csv+=ln+String.fromCharCode(10)}
    navigator.clipboard.writeText(csv).then(function(){cb.textContent='Copied!';setTimeout(function(){cb.textContent='Copy CSV'},1500)});
  });
  var wrap=document.querySelector('.pres');
  if(wrap)wrap.addEventListener('click',function(e){var b=e.target.closest('.pre');if(b&&ed)ed.value=b.dataset.sq});
}
`;
}
