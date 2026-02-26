export function getBroadcastViewScript(): string {
  return `
var _bcSel={rooms:[],groups:[],players:[]};
var _bcSearchRes={};
var _bcTimer={};

document.addEventListener('click',function(e){
  var cx=e.target.closest('.bc-chip-rm');
  if(cx){var t=cx.dataset.t,i=parseInt(cx.dataset.i);if(t&&!isNaN(i))bcRemSel(t,i);return}
  var ri=e.target.closest('.bc-ri');
  if(ri){
    var t2=ri.dataset.t,i2=parseInt(ri.dataset.i);
    if(t2&&!isNaN(i2)){
      bcAddSelByIdx(t2,i2);
      var drop=document.getElementById('bc-drop-'+t2);
      if(drop)drop.style.display='none';
    }
    return;
  }
  if(!e.target.closest('.bc-srch-wrap')){
    ['rooms','groups','players'].forEach(function(t3){
      var d=document.getElementById('bc-drop-'+t3);
      if(d)d.style.display='none';
    });
  }
});

function rBroadcasts(){
  var ck='broadcasts',c=cg(ck,TTL.d);if(c)bBroadcasts(c);else V.innerHTML=skel(4);
  gj('/admin/broadcasts').then(function(d){cs(ck,d);if(_s==='broadcasts')bBroadcasts(d)}).catch(function(e){
    if(e.name==='AbortError')return;
    if(!c)V.innerHTML='<div class="em">Failed to load broadcasts</div>';
  });
}

function bcSearchSection(type,label,ph){
  var x='<div id="bc-section-'+type+'" style="display:none">';
  x+='<div style="font-size:12px;color:var(--t2);margin-bottom:4px">'+h(label)+'</div>';
  x+='<div class="bc-srch-wrap" style="position:relative">';
  x+='<input type="text" id="bc-search-'+type+'" data-bstype="'+type+'" oninput="bcSearchDelay(this)" placeholder="'+h(ph)+'" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px;box-sizing:border-box">';
  x+='<div id="bc-drop-'+type+'" style="display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;background:var(--s2);border:1px solid var(--b);border-radius:6px;z-index:50;max-height:200px;overflow-y:auto;box-shadow:0 4px 16px rgba(0,0,0,.35)"></div>';
  x+='</div>';
  x+='<div id="bc-chips-'+type+'" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>';
  x+='</div>';
  return x;
}

function bBroadcasts(d){
  _bcSel={rooms:[],groups:[],players:[]};
  var list=d.broadcasts||[];
  var x='<div class="phd"><h2>Broadcasts</h2><p>Send real-time events to players</p></div>';

  x+='<div style="background:var(--s2);border:1px solid var(--b);border-radius:8px;padding:20px;margin-bottom:24px">';
  x+='<div style="font-weight:600;margin-bottom:16px">New Broadcast</div>';
  x+='<div style="display:flex;flex-direction:column;gap:14px">';

  // Action row
  x+='<div style="display:grid;grid-template-columns:160px 1fr;gap:12px;align-items:end">';
  x+='<div><div style="font-size:12px;color:var(--t2);margin-bottom:4px">Action</div>';
  x+='<select id="bc-action" onchange="bcActionChange(this)" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px">';
  x+='<option value="alert">alert</option>';
  x+='<option value="message">message</option>';
  x+='<option value="custom">custom...</option>';
  x+='</select></div>';
  x+='<div id="bc-custom-name-wrap" style="display:none">';
  x+='<div style="font-size:12px;color:var(--t2);margin-bottom:4px">Action name *</div>';
  x+='<input id="bc-custom-action" type="text" placeholder="e.g. show_popup" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px;box-sizing:border-box">';
  x+='</div>';
  x+='</div>';

  // Alert fields (default visible)
  x+='<div id="bc-alert-fields" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
  x+='<div><div style="font-size:12px;color:var(--t2);margin-bottom:4px">Title (optional)</div>';
  x+='<input id="bc-alert-title" type="text" placeholder="Notification title" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px;box-sizing:border-box"></div>';
  x+='<div><div style="font-size:12px;color:var(--t2);margin-bottom:4px">Message *</div>';
  x+='<input id="bc-alert-msg" type="text" placeholder="Alert message" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px;box-sizing:border-box"></div>';
  x+='</div>';

  // Message field
  x+='<div id="bc-message-fields" style="display:none">';
  x+='<div style="font-size:12px;color:var(--t2);margin-bottom:4px">Message *</div>';
  x+='<input id="bc-msg" type="text" placeholder="Message" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px;box-sizing:border-box">';
  x+='</div>';

  // Custom JSON data
  x+='<div id="bc-custom-fields" style="display:none">';
  x+='<div style="font-size:12px;color:var(--t2);margin-bottom:4px">Data (JSON, optional)</div>';
  x+='<textarea id="bc-custom-data" rows="3" placeholder="{}" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px;font-family:monospace;resize:vertical;box-sizing:border-box"></textarea>';
  x+='</div>';

  // Target row
  x+='<div style="display:grid;grid-template-columns:160px 1fr;gap:12px;align-items:start">';
  x+='<div><div style="font-size:12px;color:var(--t2);margin-bottom:4px">Target</div>';
  x+='<select id="bc-target" onchange="bcTargetChange(this)" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px">';
  x+='<option value="all">All players</option>';
  x+='<option value="room">Room(s)</option>';
  x+='<option value="group">Group(s)</option>';
  x+='<option value="players">Specific players</option>';
  x+='</select></div>';
  x+='<div id="bc-target-wrap" style="display:none">';
  x+=bcSearchSection('rooms','Rooms','Search room ID...');
  x+=bcSearchSection('groups','Groups','Search group name or ID...');
  x+=bcSearchSection('players','Players','Search player name or ID...');
  x+='</div>';
  x+='</div>';

  // Expires
  x+='<div style="max-width:260px">';
  x+='<div style="font-size:12px;color:var(--t2);margin-bottom:4px">Expires at (optional)</div>';
  x+='<input id="bc-expires" type="datetime-local" style="width:100%;background:var(--s3);border:1px solid var(--b);border-radius:6px;padding:7px 10px;color:var(--t1);font-size:13px;box-sizing:border-box">';
  x+='</div>';

  // Submit
  x+='<div style="display:flex;align-items:center;gap:12px">';
  x+='<button class="btn btn-s" onclick="bcSend()">Send Broadcast</button>';
  x+='<span id="bc-result" style="font-size:13px"></span>';
  x+='</div>';

  x+='</div></div>';

  // History
  x+='<div style="font-weight:600;margin-bottom:12px">History <span style="color:var(--t3);font-weight:400;font-size:13px">('+list.length+')</span></div>';
  if(!list.length){
    x+='<div class="em">No broadcasts yet</div>';
  }else{
    x+='<div class="tw"><table><thead><tr>';
    x+='<th>ID</th><th>Action</th><th>Data</th><th>Target</th><th>Receipts</th><th>Expires</th><th>Sent</th><th></th>';
    x+='</tr></thead><tbody>';
    for(var i=0;i<list.length;i++){
      var b=list[i];
      var ids=b.target_player_ids||[];
      var tgt=b.target_type==='all'?'All':(b.target_type+' ('+ids.length+')');
      var expired=b.expires_at&&new Date(b.expires_at)<new Date();
      x+='<tr'+(expired?' style="opacity:0.5"':'')+' >';
      x+='<td><span class="bd">'+b.id+'</span></td>';
      x+='<td><code style="font-size:12px">'+h(b.action)+'</code></td>';
      x+='<td>'+(b.data?'<button class="btn btn-s btn-sm jb" data-c="Broadcast data" data-j="'+h(JSON.stringify(b.data))+'">JSON</button>':'<span class="nl">-</span>')+'</td>';
      x+='<td>'+h(tgt)+'</td>';
      x+='<td>'+fn(b.receipt_count||0)+'</td>';
      x+='<td>'+(b.expires_at?(expired?'<span style="color:var(--r)">'+fd(b.expires_at)+'</span>':fd(b.expires_at)):'<span class="nl">-</span>')+'</td>';
      x+='<td>'+fa(b.created_at)+'</td>';
      x+='<td><button class="btn btn-s btn-sm" onclick="bcDel('+b.id+')">Del</button></td>';
      x+='</tr>';
    }
    x+='</tbody></table></div>';
  }

  V.innerHTML=x;
}

function bcActionChange(sel){
  var v=sel.value;
  var cw=document.getElementById('bc-custom-name-wrap');
  var af=document.getElementById('bc-alert-fields');
  var mf=document.getElementById('bc-message-fields');
  var cf=document.getElementById('bc-custom-fields');
  if(cw)cw.style.display=v==='custom'?'':'none';
  if(af)af.style.display=v==='alert'?'grid':'none';
  if(mf)mf.style.display=v==='message'?'':'none';
  if(cf)cf.style.display=v==='custom'?'':'none';
}

function bcTargetChange(sel){
  var v=sel.value;
  var tw=document.getElementById('bc-target-wrap');
  if(tw)tw.style.display=v==='all'?'none':'';
  ['rooms','groups','players'].forEach(function(t){
    var s=document.getElementById('bc-section-'+t);
    if(s)s.style.display=(v==='room'&&t==='rooms')||(v==='group'&&t==='groups')||(v==='players'&&t==='players')?'':'none';
  });
}

function bcSearchDelay(inp){
  var type=inp.dataset.bstype;
  if(!type)return;
  clearTimeout(_bcTimer[type]);
  var q=inp.value;
  _bcTimer[type]=setTimeout(function(){bcDoSearch(type,q)},300);
}

function bcDoSearch(type,q){
  gj('/admin/broadcasts/search/'+type+'?q='+encodeURIComponent(q),{_na:true}).then(function(d){
    bcShowResults(type,d.results||[]);
  }).catch(function(){});
}

function bcShowResults(type,items){
  _bcSearchRes[type]=items;
  var el=document.getElementById('bc-drop-'+type);
  if(!el)return;
  if(!items.length){el.style.display='none';return}
  var x='';
  for(var i=0;i<items.length;i++){
    x+='<div class="bc-ri" data-t="'+h(type)+'" data-i="'+i+'" style="padding:8px 12px;cursor:pointer;font-size:13px'+(i>0?';border-top:1px solid var(--b)':'')+'">';
    x+=h(items[i].label)+'</div>';
  }
  el.innerHTML=x;
  el.style.display='';
}

function bcAddSelByIdx(type,idx){
  var item=(_bcSearchRes[type]||[])[idx];
  if(!item)return;
  var sel=_bcSel[type];
  for(var i=0;i<sel.length;i++){if(sel[i].id===item.id)return}
  _bcSel[type].push({id:item.id,label:item.label});
  bcRenderChips(type);
  var inp=document.getElementById('bc-search-'+type);
  if(inp)inp.value='';
}

function bcRemSel(type,idx){
  _bcSel[type].splice(idx,1);
  bcRenderChips(type);
}

function bcRenderChips(type){
  var items=_bcSel[type];
  var el=document.getElementById('bc-chips-'+type);
  if(!el)return;
  var x='';
  for(var i=0;i<items.length;i++){
    x+='<span style="display:inline-flex;align-items:center;gap:4px;background:var(--s3);border:1px solid var(--b);border-radius:4px;padding:3px 4px 3px 8px;font-size:12px">';
    x+=h(items[i].label);
    x+='<button class="bc-chip-rm" data-t="'+h(type)+'" data-i="'+i+'" style="background:none;border:none;color:var(--t3);cursor:pointer;padding:0 3px;font-size:14px;line-height:1">×</button>';
    x+='</span>';
  }
  el.innerHTML=x;
}

function bcSend(){
  var actionSel=document.getElementById('bc-action').value;
  var action,data;
  var res=document.getElementById('bc-result');

  if(actionSel==='alert'){
    var title=(document.getElementById('bc-alert-title').value||'').trim();
    var msg=(document.getElementById('bc-alert-msg').value||'').trim();
    if(!msg){res.innerHTML='<span style="color:var(--r)">Message is required</span>';return}
    action='alert';
    data=title?{title:title,message:msg}:{message:msg};
  }else if(actionSel==='message'){
    var msg2=(document.getElementById('bc-msg').value||'').trim();
    if(!msg2){res.innerHTML='<span style="color:var(--r)">Message is required</span>';return}
    action='message';
    data={message:msg2};
  }else{
    action=(document.getElementById('bc-custom-action').value||'').trim();
    if(!action){res.innerHTML='<span style="color:var(--r)">Action name is required</span>';return}
    var dataStr=(document.getElementById('bc-custom-data').value||'').trim();
    data=null;
    if(dataStr){try{data=JSON.parse(dataStr)}catch(e){res.innerHTML='<span style="color:var(--r)">Invalid JSON</span>';return}}
  }

  var targetType=document.getElementById('bc-target').value;
  var targetIds=[];
  var targetPlayerIds=[];

  if(targetType==='room'){
    targetIds=_bcSel.rooms.map(function(x){return x.id});
    if(!targetIds.length){res.innerHTML='<span style="color:var(--r)">Select at least one room</span>';return}
  }else if(targetType==='group'){
    targetIds=_bcSel.groups.map(function(x){return x.id});
    if(!targetIds.length){res.innerHTML='<span style="color:var(--r)">Select at least one group</span>';return}
  }else if(targetType==='players'){
    targetPlayerIds=_bcSel.players.map(function(x){return x.id});
    if(!targetPlayerIds.length){res.innerHTML='<span style="color:var(--r)">Select at least one player</span>';return}
  }

  var expires=(document.getElementById('bc-expires').value||'').trim();
  var body={action:action,data:data,targetType:targetType,targetIds:targetIds,targetPlayerIds:targetPlayerIds};
  if(expires)body.expiresAt=new Date(expires).toISOString();

  res.innerHTML='<span style="color:var(--t3)">Sending...</span>';
  pj('/admin/broadcasts',body).then(function(d){
    res.innerHTML='<span style="color:var(--g)">Sent to '+d.sent+' online / '+d.total+' total</span>';
    gj('/admin/broadcasts',{_na:true}).then(function(d2){cs('broadcasts',d2);if(_s==='broadcasts')bBroadcasts(d2)}).catch(function(){});
  }).catch(function(e){
    res.innerHTML='<span style="color:var(--r)">Error: '+h(e.message)+'</span>';
  });
}

function bcDel(id){
  if(!confirm('Delete broadcast #'+id+'?'))return;
  gj('/admin/broadcasts/'+id,{method:'DELETE',_na:true}).then(function(){
    gj('/admin/broadcasts',{_na:true}).then(function(d){cs('broadcasts',d);if(_s==='broadcasts')bBroadcasts(d)}).catch(function(){});
  }).catch(function(e){alert('Delete failed: '+e.message)});
}
`;
}
