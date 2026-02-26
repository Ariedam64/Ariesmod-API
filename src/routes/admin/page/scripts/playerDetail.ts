export function getPlayerDetailScript(): string {
  return `
var _chatPid='',_chatLoaded=false,_grpLoaded=false,_chatHdl=null;
async function ldConv(pid){
  var panel=V.querySelector('.tp[data-t="messages"]');
  if(!panel)return;
  panel.innerHTML=skel(5);
  try{
    var d=await gj('/admin/player/'+encodeURIComponent(pid)+'/conversations',{_na:true});
    var convs=d.conversations||[];
    _chatPid=pid;
    var tb=V.querySelector('.tab[data-t="messages"] .tb');if(tb)tb.textContent=String(convs.length);
    if(!convs.length){panel.innerHTML='<div class="em">No conversations</div>';return}
    var x='<div class="cht"><div class="cht-ls">';
    for(var i=0;i<convs.length;i++){
      var c=convs[i];
      var init=(c.other_name||c.other_id||'?');init=init?init.charAt(0).toUpperCase():'?';
      x+='<div class="cht-ci" data-oid="'+h(c.other_id)+'" data-onm="'+h(c.other_name||c.other_id)+'">';
      x+='<div class="cht-ci-av">';
      if(c.other_avatar)x+='<img src="'+h(c.other_avatar)+'" alt="">';
      else x+='<span>'+h(init)+'</span>';
      x+='</div>';
      x+='<div style="flex:1;min-width:0"><div class="cht-ci-nm">'+h(c.other_name||c.other_id)+'</div>';
      x+='<div class="cht-ci-pr">'+h(c.last_body||'')+'</div></div>';
      x+='<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">';
      x+='<span class="cht-ci-ts">'+(c.last_at?fa(c.last_at):'')+'</span>';
      x+='<span class="cht-ci-ct">'+(c.msg_count||0)+'</span></div></div>';
    }
    x+='</div><div class="cht-ms"><div class="cht-empty">Select a conversation</div></div></div>';
    panel.innerHTML=x;
  }catch(e){
    if(e.name==='AbortError')return;
    _chatLoaded=false;
    panel.innerHTML='<div class="em">Error loading conversations</div>';
  }
}
async function ldChat(pid,oid,nm){
  var panel=V.querySelector('.tp[data-t="messages"]');
  var ms=panel?panel.querySelector('.cht-ms'):null;
  if(!ms)return;
  ms.innerHTML='<div class="cht-hd">'+pl(oid,nm)+'</div><div class="cht-bd">'+skel(3)+'</div>';
  if(panel)panel.querySelectorAll('.cht-ci').forEach(function(c){c.classList.remove('on')});
  var active=panel?panel.querySelector('.cht-ci[data-oid="'+oid+'"]'):null;
  if(active)active.classList.add('on');
  try{
    var d=await gj('/admin/player/'+encodeURIComponent(pid)+'/messages/'+encodeURIComponent(oid),{_na:true});
    var msgs=d.messages||[];
    var bd=ms.querySelector('.cht-bd');
    if(!bd)return;
    if(!msgs.length){bd.innerHTML='<div class="cht-empty">No messages</div>';return}
    var x='';
    for(var i=0;i<msgs.length;i++){
      var m=msgs[i],isSnd=m.sender_id===pid;
      x+='<div class="bbl '+(isSnd?'bbl-s':'bbl-r')+'">'+h(m.body)+'</div>';
      x+='<div class="bbl-ts'+(isSnd?' s':'')+'">'+fd(m.created_at)+(m.read_at?' \\u2713':'')+'</div>';
    }
    bd.innerHTML=x;
    bd.scrollTop=bd.scrollHeight;
  }catch(e){
    if(e.name==='AbortError')return;
    var bd=ms.querySelector('.cht-bd');
    if(bd)bd.innerHTML='<div class="em">Error loading messages</div>';
  }
}

async function ldGroups(pid){
  var panel=V.querySelector('.tp[data-t="groups"]');
  if(!panel)return;
  panel.innerHTML=skel(5);
  try{
    var d=await gj('/admin/player/'+encodeURIComponent(pid)+'/groups',{_na:true});
    var groups=d.groups||[];
    _chatPid=pid;
    var tb=V.querySelector('.tab[data-t="groups"] .tb');if(tb)tb.textContent=String(groups.length);
    if(!groups.length){panel.innerHTML='<div class="em">No groups</div>';return}
    var x='<div class="cht"><div class="cht-ls">';
    for(var i=0;i<groups.length;i++){
      var g=groups[i];
      var gname=g.group_name||('Group '+g.group_id);
      var init=(gname||'?').charAt(0).toUpperCase();
      var preview='No messages';
      if(g.last_body){
        var snd=g.last_sender_name||g.last_sender_id||'';
        preview=(snd? (snd+': '):'')+g.last_body;
      }
      x+='<div class="cht-ci" data-gid="'+h(g.group_id)+'" data-gnm="'+h(gname)+'" data-mct="'+h(String(g.member_count||0))+'">';
      x+='<div class="cht-ci-av"><span>'+h(init)+'</span></div>';
      x+='<div style="flex:1;min-width:0"><div class="cht-ci-nm">'+h(gname)+'</div>';
      x+='<div class="cht-ci-pr">'+h(preview)+'</div></div>';
      x+='<div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">';
      x+='<span class="cht-ci-ts">'+(g.last_at?fa(g.last_at):'')+'</span>';
      x+='<span class="cht-ci-ct">'+(g.member_count||0)+'</span></div></div>';
    }
    x+='</div><div class="cht-ms"><div class="cht-empty">Select a group</div></div></div>';
    panel.innerHTML=x;
  }catch(e){
    if(e.name==='AbortError')return;
    _grpLoaded=false;
    panel.innerHTML='<div class="em">Error loading groups</div>';
  }
}

async function ldGroupChat(pid,gid,gnm){
  var panel=V.querySelector('.tp[data-t="groups"]');
  var ms=panel?panel.querySelector('.cht-ms'):null;
  if(!ms)return;
  ms.innerHTML='<div class="cht-hd">'+h(gnm||('Group '+gid))+'</div><div class="cht-bd">'+skel(3)+'</div>';
  if(panel)panel.querySelectorAll('.cht-ci').forEach(function(c){c.classList.remove('on')});
  var active=panel?panel.querySelector('.cht-ci[data-gid="'+gid+'"]'):null;
  if(active)active.classList.add('on');
  try{
    var d=await gj('/admin/player/'+encodeURIComponent(pid)+'/group-messages/'+encodeURIComponent(gid),{_na:true});
    var msgs=d.messages||[];
    var g=d.group||{};
    var name=g.name||gnm||('Group '+gid);
    var mct=(g.member_count!=null?g.member_count:(active&&active.dataset.mct?Number(active.dataset.mct):null));
    var hd=ms.querySelector('.cht-hd');
    if(hd)hd.innerHTML=h(name)+(mct!=null?'<span style="margin-left:auto" class="bd">'+fn(mct)+' members</span>':'');
    var bd=ms.querySelector('.cht-bd');
    if(!bd)return;
    if(!msgs.length){bd.innerHTML='<div class="cht-empty">No messages</div>';return}
    var list=msgs.slice().reverse();
    var x='';
    for(var i=0;i<list.length;i++){
      var m=list[i],isSnd=m.sender_id===pid;
      var sender=m.sender_name||m.sender_id||'Unknown';
      x+='<div class="bbl '+(isSnd?'bbl-s':'bbl-r')+'">'+h(m.body)+'</div>';
      x+='<div class="bbl-ts'+(isSnd?' s':'')+'">'+h(sender)+' \\u00b7 '+fd(m.created_at)+'</div>';
    }
    bd.innerHTML=x;
    bd.scrollTop=bd.scrollHeight;
  }catch(e){
    if(e.name==='AbortError')return;
    var bd=ms.querySelector('.cht-bd');
    if(bd)bd.innerHTML='<div class="em">Error loading messages</div>';
  }
}
async function rPl(id){
  if(!id){V.innerHTML='<div class="em">No player ID</div>';return}
  var ck='pl_'+id,c=cg(ck,TTL.x);if(c)bPl(c,id);else V.innerHTML=skel(10);
  try{var d=await gj('/admin/player/'+encodeURIComponent(id));cs(ck,d);if(_s==='player')bPl(d,id)}catch(e){if(e.name==='AbortError')return;if(!c)V.innerHTML='<div class="em">Player not found</div>'}
}
function bPl(d,id){
  var p=d.player,st=d.state,pr=d.privacy,rels=d.relationships||[],rms=d.room_history||[],rlb=d.rate_limit_buckets||[],mrlb=d.message_rate_limit_buckets||[],lip=d.last_known_ip,lb=d.leaderboard||null;
  var cr=null;for(var i=0;i<rms.length;i++)if(!rms[i].left_at){cr=rms[i];break}
  var x='<div class="bc"><a href="#/dashboard">Dashboard</a><span class="bcs">Player</span></div>';
  x+='<div class="dhd"><div class="dhd-av">';
  if(p.avatar_url)x+='<img src="'+h(p.avatar_url)+'" alt="">';else x+='&#9786;';
  x+='</div><div class="dhd-bd"><div class="dhd-nm">'+h(p.name)+'</div><div class="dhd-mt">';
  x+='<span><b>ID:</b> <span style="font-family:var(--m);font-size:11px">'+h(p.id)+'</span> <button class="cp" data-v="'+h(p.id)+'">Copy</button></span>';
  x+='<span><b>Coins:</b> '+fc(p.coins)+'</span>';
  if(p.has_mod_installed)x+='<span class="bd g">Mod '+(p.mod_version?h(p.mod_version):'?')+'</span>';
  var bgs=p.badges||[];for(var bi=0;bi<bgs.length;bi++){var bg=bgs[bi];x+='<span class="bd '+(bg==='mod_creator'?'p':'y')+'">'+h(bg==='mod_creator'?'Mod Creator':bg==='supporter'?'Supporter':bg)+'</span>'}
  x+='<span><b>Created:</b> '+fd(p.created_at)+'</span>';
  x+='<span><b>Last active:</b> '+fa(p.last_event_at)+'</span>';
  if(lip)x+='<span><b>IP:</b> '+h(lip)+'</span>';
  if(cr)x+='<span><b>Room:</b> '+rl(cr.room_id)+'</span>';
  x+='</div></div></div>';

  var fields=['garden','inventory','stats','activity_log','journal'];
  var stc=0;if(st){for(var i=0;i<fields.length;i++)if(st['has_'+fields[i]])stc++}
  var tabs=[{id:'state',l:'State',b:stc},{id:'privacy',l:'Privacy'},{id:'badges',l:'Badges',b:(p.badges||[]).length||null},{id:'friends',l:'Friends',b:rels.length},{id:'rooms',l:'Rooms',b:rms.length},{id:'groups',l:'Groups',b:0},{id:'messages',l:'Messages',b:0},{id:'leaderboard',l:'Leaderboard'},{id:'limits',l:'Rate Limits',b:rlb.length+mrlb.length}];
  x+='<div>'+mkTabs(tabs,'state');

  x+='<div class="tp" data-t="state">';
  if(st){
    var icons={garden:'&#127793;',inventory:'&#128188;',stats:'&#128200;',activity_log:'&#128221;',journal:'&#128214;'};
    for(var i=0;i<fields.length;i++){var f=fields[i],has=st['has_'+f],sz=st[f+'_size'];
      x+='<div class="sf" data-f="'+f+'" data-pid="'+h(id)+'">';
      x+='<div class="sf-h"><span class="sf-ic">&#9679;</span><span class="sf-nm">'+(icons[f]||'')+' '+f.replace(/_/g,' ')+'</span>';
      if(has){x+='<span class="sf-sz">'+fmtB(sz)+'</span><button class="btn btn-s btn-sm sf-btn">Load</button>'}
      else{x+='<span class="sf-sz" style="color:var(--t3)">empty</span>'}
      x+='</div><div class="sf-bd"></div></div>';
    }
    if(st.updated_at)x+='<div style="font-size:11px;color:var(--t3);margin-top:8px">Last updated: '+fd(st.updated_at)+'</div>';
  }else x+='<div class="em">No state data</div>';
  x+='</div>';

  x+='<div class="tp" data-t="privacy" style="display:none">';
  if(pr){var flags=[['Show Garden',pr.show_garden],['Show Inventory',pr.show_inventory],['Show Coins',pr.show_coins],['Show Activity Log',pr.show_activity_log],['Show Journal',pr.show_journal],['Show Stats',pr.show_stats],['Hide Room',pr.hide_room_from_public_list]];
    x+='<div class="pg">';for(var i=0;i<flags.length;i++){var on=flags[i][1]===true;x+='<div class="pf"><div class="pd '+(on?'on':'off')+'"></div><span>'+h(flags[i][0])+'</span><span style="margin-left:auto;color:var(--t3);font-size:11px">'+(flags[i][1]===null?'null':on?'true':'false')+'</span></div>'}
    x+='</div>';if(pr.updated_at)x+='<div style="font-size:11px;color:var(--t3);margin-top:8px">Updated: '+fd(pr.updated_at)+'</div>';
  }else x+='<div class="em">No privacy settings</div>';
  x+='</div>';

  x+='<div class="tp" data-t="badges" style="display:none">';
  x+='<div class="pg" id="bdg-list-'+h(id)+'">';
  var allBadges=['mod_creator','supporter'];
  var badgeLabels={mod_creator:'Mod Creator',supporter:'Supporter'};
  var curBadges=p.badges||[];
  for(var bi=0;bi<allBadges.length;bi++){
    var bg=allBadges[bi],has=curBadges.indexOf(bg)>=0;
    x+='<div class="pf" id="bdg-row-'+h(id)+'-'+bg+'">';
    x+='<div class="pd '+(has?'on':'off')+'"></div>';
    x+='<span>'+h(badgeLabels[bg])+'</span>';
    x+='<span style="margin-left:auto;display:flex;gap:6px">';
    if(!has){x+='<button class="btn btn-s btn-sm bdg-add" data-pid="'+h(id)+'" data-bg="'+bg+'">Add</button>'}
    else{x+='<button class="btn btn-s btn-sm bdg-rm" style="background:var(--r)" data-pid="'+h(id)+'" data-bg="'+bg+'">Remove</button>'}
    x+='</span></div>';
  }
  x+='</div></div>';

  x+='<div class="tp" data-t="friends" style="display:none">';
  if(rels.length){var cnt={accepted:0,pending:0,rejected:0};for(var i=0;i<rels.length;i++)if(cnt[rels[i].status]!==undefined)cnt[rels[i].status]++;
    x+='<div style="display:flex;gap:12px;margin-bottom:12px;font-size:12px;color:var(--t3)"><span><b style="color:var(--t2)">'+cnt.accepted+'</b> accepted</span><span><b style="color:var(--t2)">'+cnt.pending+'</b> pending</span><span><b style="color:var(--t2)">'+cnt.rejected+'</b> rejected</span></div>';
    for(var i=0;i<rels.length;i++){var r=rels[i];x+='<div class="it"><span class="rs '+r.status+'">'+r.status+'</span>'+pl(r.other_player_id,r.other_player_name)+
      '<span style="margin-left:auto;font-size:11px;color:var(--t3)">'+(r.requested_by===id?'Sent':'Received')+' \\u00b7 '+fa(r.created_at)+'</span></div>'}
  }else x+='<div class="em">No relationships</div>';
  x+='</div>';

  x+='<div class="tp" data-t="rooms" style="display:none">';
  if(rms.length){
    if(cr)x+='<div style="margin-bottom:12px;padding:10px;border-radius:var(--rad);background:var(--pd);border:1px solid var(--pb)"><div style="font-size:10px;font-weight:700;color:var(--p);margin-bottom:4px">CURRENTLY IN</div>'+rl(cr.room_id)+'<span style="font-size:11px;color:var(--t3);margin-left:8px">Joined '+fa(cr.joined_at)+'</span></div>';
    x+='<div class="tw"><table><thead><tr><th>Room</th><th>Type</th><th>Joined</th><th>Left</th></tr></thead><tbody>';
    for(var i=0;i<rms.length;i++){var r=rms[i];x+='<tr><td>'+rl(r.room_id)+'</td><td>'+(r.is_private?'Private':'Public')+'</td><td>'+fd(r.joined_at)+'</td><td>'+(r.left_at?fd(r.left_at):'<span class="by">Active</span>')+'</td></tr>'}
    x+='</tbody></table></div>';
  }else x+='<div class="em">No room history</div>';
  x+='</div>';

  x+='<div class="tp" data-t="messages" style="display:none">';
  x+='<div class="cht-empty" style="padding:40px">Loading conversations...</div>';
  x+='</div>';

  x+='<div class="tp" data-t="groups" style="display:none">';
  x+='<div class="cht-empty" style="padding:40px">Loading groups...</div>';
  x+='</div>';

  x+='<div class="tp" data-t="leaderboard" style="display:none">';
  if(lb){
    var mkRkChg=function(cur,snap){if(snap==null||cur==null)return'<span class="nl">-</span>';var diff=snap-cur;if(diff>0)return'<span style="color:var(--g)">&#9650; '+diff+'</span>';if(diff<0)return'<span style="color:var(--r)">&#9660; '+Math.abs(diff)+'</span>';return'<span style="color:var(--t3)">=</span>'};
    x+='<div class="srow">';
    x+=mkS('Coins Rank',lb.coins_rank!=null?'#'+fn(lb.coins_rank):'Unranked',[{v:fc(lb.coins||0),l:'coins'},{v:mkRkChg(lb.coins_rank,lb.coins_rank_snapshot_24h),l:'24h change'}]);
    x+=mkS('Eggs Hatched Rank',lb.eggs_rank!=null?'#'+fn(lb.eggs_rank):'Unranked',[{v:fc(lb.eggs_hatched||0),l:'eggs hatched'},{v:mkRkChg(lb.eggs_rank,lb.eggs_rank_snapshot_24h),l:'24h change'}]);
    x+='</div>';
  }else{
    x+='<div class="em">No leaderboard data</div>';
  }
  x+='</div>';

  x+='<div class="tp" data-t="limits" style="display:none">';
  if(rlb.length)x+=mkCo('API Rate Limits',rlb.length+' buckets',mkT(rlb,{}),false);
  if(mrlb.length)x+=mkCo('Message Rate Limits',mrlb.length+' buckets',mkT(mrlb,{}),rlb.length>0);
  if(!rlb.length&&!mrlb.length)x+='<div class="em">No rate limit data</div>';
  x+='</div>';

  x+='</div>';
  V.innerHTML=x;

  V.querySelectorAll('.sf-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var sf=btn.closest('.sf');if(!sf||sf.classList.contains('loaded'))return;
      var f=sf.dataset.f,pid=sf.dataset.pid,bd=sf.querySelector('.sf-bd');
      btn.disabled=true;btn.textContent='Loading...';
      gj('/admin/player/'+encodeURIComponent(pid)+'/state/'+encodeURIComponent(f),{_na:true}).then(function(r){
        sf.classList.add('loaded');btn.textContent='Loaded';
        bd.innerHTML='<div class="jt" style="padding:8px;max-height:500px;overflow:auto">'+jtr(r.data,0)+'</div>';
      }).catch(function(e){
        btn.disabled=false;btn.textContent='Load';
        bd.innerHTML='<div class="em" style="color:var(--r)">Error: '+h(e.message)+'</div>';
      });
    });
  });

  V.addEventListener('click',function bdgHdl(e){
    var btn=e.target.closest('.bdg-add,.bdg-rm');
    if(!btn)return;
    var pid=btn.dataset.pid,bg=btn.dataset.bg,isAdd=btn.classList.contains('bdg-add');
    if(!pid||!bg)return;
    btn.disabled=true;
    var prom=isAdd
      ?fetch('/admin/player/'+encodeURIComponent(pid)+'/badge',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({badge:bg})})
      :fetch('/admin/player/'+encodeURIComponent(pid)+'/badge/'+encodeURIComponent(bg),{method:'DELETE'});
    prom.then(function(r){return r.json()}).then(function(){
      var row=V.querySelector('#bdg-row-'+pid+'-'+bg);
      if(!row){return}
      var dot=row.querySelector('.pd');
      var sp=row.querySelector('span:last-child');
      if(isAdd){
        if(dot)dot.className='pd on';
        if(sp)sp.innerHTML='<button class="btn btn-s btn-sm bdg-rm" style="background:var(--r)" data-pid="'+h(pid)+'" data-bg="'+bg+'">Remove</button>';
      }else{
        if(dot)dot.className='pd off';
        if(sp)sp.innerHTML='<button class="btn btn-s btn-sm bdg-add" data-pid="'+h(pid)+'" data-bg="'+bg+'">Add</button>';
      }
    }).catch(function(){btn.disabled=false});
  });

  _chatLoaded=false;_grpLoaded=false;_chatPid=id;
  if(_chatHdl)V.removeEventListener('click',_chatHdl);
  _chatHdl=function(e){
    var tb=e.target.closest('.tab[data-t="messages"]');
    if(tb&&!_chatLoaded){_chatLoaded=true;ldConv(_chatPid)}
    var tg=e.target.closest('.tab[data-t="groups"]');
    if(tg&&!_grpLoaded){_grpLoaded=true;ldGroups(_chatPid)}
    var ci=e.target.closest('.cht-ci');
    if(ci&&ci.dataset.oid){ldChat(_chatPid,ci.dataset.oid,ci.dataset.onm||ci.dataset.oid)}
    if(ci&&ci.dataset.gid){ldGroupChat(_chatPid,ci.dataset.gid,ci.dataset.gnm||('Group '+ci.dataset.gid))}
  };
  V.addEventListener('click',_chatHdl);
  _chatLoaded=true;_grpLoaded=true;
  setTimeout(function(){if(_s==='player'){ldConv(_chatPid);ldGroups(_chatPid)}},0);
}
`;
}
