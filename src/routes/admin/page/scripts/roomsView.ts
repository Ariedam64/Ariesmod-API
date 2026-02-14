export function getRoomsViewScript(): string {
  return `
var _rmState={limit:100,offset:0};

function rRooms(){
  var ck='rooms_view',c=cg(ck,TTL.d);if(c)bRooms(c);else V.innerHTML=skel(8);
  gj('/admin/rooms-view').then(function(d){cs(ck,d);if(_s==='rooms')bRooms(d)}).catch(function(e){
    if(e.name==='AbortError')return;
    if(!c)V.innerHTML='<div class="em">Failed to load rooms</div>';
  });
}

function bRooms(d){
  var st=d.stats||{},occ=d.occupancy||[],recent=d.recent_rooms||[],live=d.live_rooms||[];
  var x='<div class="phd"><h2>Rooms</h2><p>Live activity and room exploration</p></div>';

  x+='<div class="srow">';
  x+=mkS('Total Rooms',fn(st.total),[{v:fn(st.public),l:'public'},{v:fn(st.private),l:'private'}]);
  x+=mkS('Active Rooms',fn(st.active_1h),[{v:fn(st.active_5m),l:'active 5m'}]);
  x+=mkS('Avg Occupancy',(st.avg_players!=null?Number(st.avg_players).toFixed(2):'0.00'),[{v:'6',l:'max slots'}]);
  x+='</div>';

  x+='<div class="pag" id="rm-pag" style="margin-bottom:8px"></div>';
  x+=mkP('All Rooms (Most to Least Full)','<div id="rm-list">'+skel(8)+'</div>');

  V.innerHTML=x;

  loadRoomsList();
}

function loadRoomsList(){
  var qs='?limit='+(_rmState.limit||100)+'&offset='+(_rmState.offset||0);
  var list=document.getElementById('rm-list');
  if(list)list.innerHTML=skel(6);
  gj('/admin/rooms-list'+qs,{_na:true}).then(function(d){
    var rows=d.rooms||[],total=d.total||rows.length;
    var x='';
    if(rows.length){
      x+='<div class="tw"><table><thead><tr>';
      x+='<th>Room</th><th>Type</th><th>Players</th><th>Updated</th><th>Created</th><th>Creator</th>';
      x+='</tr></thead><tbody>';
      for(var i=0;i<rows.length;i++){
        var r=rows[i];
        var creator=r.creator_id?pl(r.creator_id,r.creator_name||r.creator_id):'<span class="nl">-</span>';
        x+='<tr>';
        x+='<td>'+rl(r.id)+'</td>';
        x+='<td><span class="bd'+(r.is_private?' y':' g')+'">'+(r.is_private?'Private':'Public')+'</span></td>';
        x+='<td><span class="bd">'+fn(r.players_count)+'/6</span></td>';
        x+='<td>'+fd(r.last_updated_at||r.created_at)+'</td>';
        x+='<td>'+fd(r.created_at)+'</td>';
        x+='<td>'+creator+'</td>';
        x+='</tr>';
      }
      x+='</tbody></table></div>';
    }
    if(list)list.innerHTML=x||'<div class="em">No rooms found</div>';
    var pag=document.getElementById('rm-pag');
    if(pag){
      var from=total?(_rmState.offset+1):0,to=_rmState.offset+rows.length;
      pag.innerHTML='<span class="pag-i">'+from+' \\u2013 '+to+' / '+total+'</span>'+
        '<button class="btn btn-s btn-sm" id="rm-prev"'+(_rmState.offset===0?' disabled':'')+'>Prev</button>'+
        '<button class="btn btn-s btn-sm" id="rm-next"'+(_rmState.offset+rows.length>=total?' disabled':'')+'>Next</button>';
      var pv=document.getElementById('rm-prev'),nx=document.getElementById('rm-next');
      if(pv)pv.addEventListener('click',function(){_rmState.offset=Math.max(0,_rmState.offset-_rmState.limit);loadRoomsList()});
      if(nx)nx.addEventListener('click',function(){_rmState.offset+=_rmState.limit;loadRoomsList()});
    }
  }).catch(function(e){
    if(e.name==='AbortError')return;
    if(list)list.innerHTML='<div class="em">Failed to load rooms</div>';
  });
}
`;
}
