export function getSearchScript(): string {
  return `
var _srchFilters=[];
var _srchDeb=null;

function rSrch(){
  _srchFilters=[];
  var x='<div class="phd"><h2>Search &amp; Tools</h2><p>Find players, messages, rooms, relationships, and rate limits</p></div>';

  // 1. PLAYER FINDER (hero, full-width)
  x+='<div class="fc srch-hero"><div class="srch-ic">&#128269;</div><h3>Player Finder</h3><p>Search by name or ID — automatically detects player ID or searches by name</p>';
  x+='<div class="ct"><label>Search</label><input type="text" id="pf-q" placeholder="Type player name or paste ID..."></div>';
  x+='<div class="chips" id="pf-chips">';
  x+='<span class="chip" data-f="online">&#128994; Online now</span>';
  x+='<span class="chip" data-f="has_mod">&#128295; Has mod</span>';
  x+='<span class="chip" data-f="new_week">&#10024; New this week</span>';
  x+='</div>';
  x+='<div class="srch-res" id="pf-res"></div></div>';

  V.innerHTML=x;

  // --- PLAYER FINDER ---
  var pfQ=document.getElementById('pf-q'),pfRes=document.getElementById('pf-res');
  function pfSearch(){
    var q=pfQ.value.trim(),fl=_srchFilters.slice();
    if(!q&&!fl.length){pfRes.innerHTML='';return}
    if(q&&q.length<2){pfRes.innerHTML='<div class="em">Type at least 2 characters</div>';return}
    pfRes.innerHTML='<div class="ld">Searching</div>';
    var body={};if(q)body.query=q;if(fl.length)body.filters=fl;
    pj('/admin/form/player-lookup',body).then(function(d){
      var rows=d.rows||[];if(!rows.length){pfRes.innerHTML='<div class="em">No players found</div>';return}
      var rx='<div style="font-size:12px;color:var(--t3);margin:8px 0">'+rows.length+' result'+(rows.length>1?'s':'')+'</div>';
      for(var i=0;i<rows.length;i++){var r=rows[i];
        rx+='<div class="it"><div class="it-g"><div style="display:flex;align-items:center;gap:8px">'+pl(r.player_id,r.name);
        if(r.has_mod_installed)rx+='<span class="bd g" style="font-size:10px">Mod'+(r.mod_version?' '+h(r.mod_version):'')+'</span>';
        rx+='</div><div style="font-size:11px;color:var(--t3);margin-top:2px">';
        rx+=fc(r.coins)+' coins \\u00b7 '+fa(r.last_event_at)+' \\u00b7 '+fd(r.created_at);
        rx+='</div></div></div>'}
      pfRes.innerHTML=rx;
    }).catch(function(e){if(e.name!=='AbortError')pfRes.innerHTML='<div class="em" style="color:var(--r)">'+h(e.message)+'</div>'});
  }
  _srchDeb=deb(pfSearch,300);
  pfQ.addEventListener('input',_srchDeb);

  document.getElementById('pf-chips').addEventListener('click',function(e){
    var chip=e.target.closest('.chip');if(!chip)return;
    var f=chip.dataset.f;chip.classList.toggle('on');
    var idx=_srchFilters.indexOf(f);if(idx>=0)_srchFilters.splice(idx,1);else _srchFilters.push(f);
    pfSearch();
  });

}
`;
}
