export function getRoomDetailScript(): string {
  return `
async function rRm(id){
  if(!id){V.innerHTML='<div class="em">No room ID</div>';return}
  var ck='rm_'+id,c=cg(ck,TTL.x);if(c)bRm(c,id);else V.innerHTML=skel(8);
  try{var d=await gj('/admin/room/'+encodeURIComponent(id));cs(ck,d);if(_s==='room')bRm(d,id)}catch(e){if(e.name==='AbortError')return;if(!c)V.innerHTML='<div class="em">Room not found</div>'}
}
function bRm(d,id){
  var r=d.room,hist=d.player_history||[],ub=d.updated_by;
  var x='<div class="bc"><a href="#/dashboard">Dashboard</a><span class="bcs">Room</span></div>';
  x+='<div class="dhd"><div class="dhd-av">&#8962;</div><div class="dhd-bd">';
  x+='<div class="dhd-nm">'+h(r.id.length>40?r.id.slice(0,38)+'..':r.id)+'</div><div class="dhd-mt">';
  x+='<span><b>ID:</b> <span style="font-family:var(--m);font-size:11px">'+h(r.id)+'</span> <button class="cp" data-v="'+h(r.id)+'">Copy</button></span>';
  x+='<span class="bd '+(r.is_private?'y':'g')+'">'+(r.is_private?'Private':'Public')+'</span>';
  x+='<span><b>Players:</b> '+fn(r.players_count)+' tracked</span>';
  x+='<span><b>Created:</b> '+fd(r.created_at)+'</span>';
  x+='<span><b>Updated:</b> '+fa(r.last_updated_at)+'</span>';
  if(ub)x+='<span><b>By:</b> '+pl(ub.id,ub.name)+'</span>';
  x+='</div></div></div>';

  var tabs=[{id:'slots',l:'User Slots'},{id:'history',l:'History',b:hist.length}];
  x+='<div>'+mkTabs(tabs,'slots');

  x+='<div class="tp" data-t="slots">';
  if(r.has_user_slots){
    x+='<div id="slot-bd"><div class="ld">Loading user slots</div></div>';
  }else x+='<div class="em">No user slots data</div>';
  x+='</div>';

  x+='<div class="tp" data-t="history" style="display:none">';
  if(hist.length){x+='<div class="tw"><table><thead><tr><th>Player</th><th>Joined</th><th>Left</th></tr></thead><tbody>';
    for(var i=0;i<hist.length;i++){var hp=hist[i];x+='<tr><td>'+pl(hp.player_id,hp.name)+'</td><td>'+fd(hp.joined_at)+'</td><td>'+(hp.left_at?fd(hp.left_at):'<span class="by">Active</span>')+'</td></tr>'}
    x+='</tbody></table></div>';
  }else x+='<div class="em">No player history</div>';
  x+='</div>';

  x+='</div>';
  V.innerHTML=x;

  var bd=document.getElementById('slot-bd');
  if(bd&&r.has_user_slots){
    gj('/admin/room/'+encodeURIComponent(id)+'/slots',{_na:true}).then(function(r){
      if(Array.isArray(r.user_slots)){
        var list='<div style="display:flex;flex-direction:column;gap:6px">';
        for(var i=0;i<r.user_slots.length;i++){
          var u=r.user_slots[i]||{},nm=u.name||'Unknown',pid=u.player_id||'',av=u.avatar_url||'',init=(nm||'?').charAt(0).toUpperCase();
          list+='<div class="it"><div style="width:28px;height:28px;border-radius:50%;background:var(--s3);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--t2);flex-shrink:0">';
          if(av)list+='<img src="'+h(av)+'" style="width:100%;height:100%;object-fit:cover" alt="">';else list+='<span>'+h(init)+'</span>';
          list+='</div><div style="display:flex;flex-direction:column;gap:2px;min-width:0">';
          list+='<div>'+pl(pid,nm)+'</div>';
          if(pid)list+='<div style="font-size:11px;color:var(--t3)">'+h(pid)+'</div>';
          list+='</div><span style="margin-left:auto" class="bd">'+fc(u.coins||0)+'</span></div>';
        }
        list+='</div>';
        bd.innerHTML=list;
      }else{
        bd.innerHTML='<div class="em">No user slots data</div>';
      }
    }).catch(function(e){
      bd.innerHTML='<div class="em" style="color:var(--r)">Error: '+h(e.message)+'</div>';
    });
  }
}
`;
}
