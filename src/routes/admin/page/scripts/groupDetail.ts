export function getGroupDetailScript(): string {
  return `
async function rGp(id){
  if(!id){V.innerHTML='<div class="em">No group ID</div>';return}
  var ck='gp_'+id,c=cg(ck,TTL.x);if(c)bGp(c,id);else V.innerHTML=skel(8);
  try{var d=await gj('/admin/group/'+encodeURIComponent(id));cs(ck,d);if(_s==='group')bGp(d,id)}catch(e){if(e.name==='AbortError')return;if(!c)V.innerHTML='<div class="em">Group not found</div>'}
}
function bGp(d,id){
  var g=d.group||{},mem=d.members||[],msgs=d.messages||[],act=d.activity||[],st=d.stats||{};
  var x='<div class="bc"><a href="#/dashboard">Dashboard</a><span class="bcs">Group</span></div>';
  x+='<div class="dhd"><div class="dhd-av">&#9776;</div><div class="dhd-bd">';
  x+='<div class="dhd-nm">'+h(g.name||('Group '+id))+'</div><div class="dhd-mt">';
  x+='<span><b>ID:</b> <span style="font-family:var(--m);font-size:11px">'+h(String(g.id||id))+'</span> <button class="cp" data-v="'+h(String(g.id||id))+'">Copy</button></span>';
  if(g.owner_id)x+='<span><b>Owner:</b> '+pl(g.owner_id,g.owner_name||g.owner_id)+'</span>';
  x+='<span><b>Members:</b> '+fn(st.member_count||mem.length)+'</span>';
  x+='<span><b>Messages:</b> '+fn(st.message_count||msgs.length)+'</span>';
  if(st.last_message_at)x+='<span><b>Last msg:</b> '+fa(st.last_message_at)+'</span>';
  if(st.last_activity_at)x+='<span><b>Last activity:</b> '+fa(st.last_activity_at)+'</span>';
  if(g.created_at)x+='<span><b>Created:</b> '+fd(g.created_at)+'</span>';
  if(g.updated_at)x+='<span><b>Updated:</b> '+fd(g.updated_at)+'</span>';
  x+='</div></div></div>';

  var tabs=[{id:'members',l:'Members',b:mem.length},{id:'messages',l:'Messages',b:msgs.length},{id:'activity',l:'Activity',b:act.length}];
  x+='<div>'+mkTabs(tabs,'members');

  x+='<div class="tp" data-t="members">';
  if(mem.length){
    for(var i=0;i<mem.length;i++){
      var m=mem[i];
      var nm=m.name||m.player_id||'Unknown';
      var init=nm?nm.charAt(0).toUpperCase():'?';
      x+='<div class="it"><div style="width:28px;height:28px;border-radius:50%;background:var(--s3);overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--t2);flex-shrink:0">';
      if(m.avatar_url)x+='<img src="'+h(m.avatar_url)+'" style="width:100%;height:100%;object-fit:cover" alt="">';else x+='<span>'+h(init)+'</span>';
      x+='</div><div class="it-g"><div style="display:flex;align-items:center;gap:8px">'+pl(m.player_id,nm);
      if(m.role)x+='<span class="bd'+(m.role==='owner'?' g':'')+'">'+h(m.role)+'</span>';
      x+='</div><div style="font-size:11px;color:var(--t3);margin-top:2px">';
      x+='Joined '+fa(m.joined_at);
      if(m.last_event_at)x+=' \\u00b7 Last active '+fa(m.last_event_at);
      x+='</div></div></div>';
    }
  }else x+='<div class="em">No members</div>';
  x+='</div>';

  x+='<div class="tp" data-t="messages" style="display:none">';
  if(msgs.length){
    for(var j=0;j<msgs.length;j++){
      var msg=msgs[j];
      var snd=msg.sender_id?pl(msg.sender_id,msg.sender_name||msg.sender_id):'<span class="nl">-</span>';
      var body=msg.body?String(msg.body).trim():'';
      x+='<div class="mg"><div class="mg-t">'+snd+'<span style="color:var(--t3);margin-left:auto">'+fd(msg.created_at)+'</span></div>';
      if(body)x+='<div class="mg-b">'+h(body)+'</div>';
      x+='</div>';
    }
  }else x+='<div class="em">No messages</div>';
  x+='</div>';

  x+='<div class="tp" data-t="activity" style="display:none">';
  if(act.length){
    for(var k=0;k<act.length;k++){
      var a=act[k];
      var actor=a.actor_id?pl(a.actor_id,a.actor_name||a.actor_id):'<span class="nl">-</span>';
      var member=a.member_id?pl(a.member_id,a.member_name||a.member_id):'';
      var desc='';
      if(a.type==='group_created')desc='Created by '+actor;
      else if(a.type==='group_deleted')desc='Deleted by '+actor;
      else if(a.type==='group_member_added')desc='Added '+member+' by '+actor;
      else if(a.type==='group_member_removed')desc='Removed '+member+' by '+actor;
      else if(a.type==='group_renamed'){
        var oldName=a.meta&&a.meta.oldName?String(a.meta.oldName):'';
        desc='Renamed by '+actor+(oldName?(' <span style="color:var(--t3)">('+h(oldName)+' &rarr; '+h(g.name||'')+')</span>'):'');
      }else desc=a.type||'Event';
      x+='<div class="fi"><span class="fi-ts">'+fa(a.created_at)+'</span>'+desc+'</div>';
    }
  }else x+='<div class="em">No activity</div>';
  x+='</div>';

  x+='</div>';
  V.innerHTML=x;

}
`;
}
