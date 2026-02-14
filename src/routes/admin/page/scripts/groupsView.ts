export function getGroupsViewScript(): string {
  return `
var _gpState={limit:100,offset:0};

function rGroups(){
  var ck='groups_view',c=cg(ck,TTL.d);if(c)bGroups(c);else V.innerHTML=skel(8);
  gj('/admin/groups-view').then(function(d){cs(ck,d);if(_s==='groups')bGroups(d)}).catch(function(e){
    if(e.name==='AbortError')return;
    if(!c)V.innerHTML='<div class="em">Failed to load groups</div>';
  });
}

function bGroups(d){
  var st=d.stats||{};
  var x='<div class="phd"><h2>Groups</h2><p>Overview and group list</p></div>';

  x+='<div class="srow">';
  x+=mkS('Total Groups',fn(st.total),[{v:fn(st.new_24h),l:'new 24h'},{v:fn(st.new_7d),l:'new 7d'}]);
  x+=mkS('Members',fn(st.total_members),[{v:(st.avg_members!=null?Number(st.avg_members).toFixed(2):'0.00'),l:'avg / group'}]);
  x+=mkS('Messages',fn(st.total_messages),[{v:fn(st.messages_24h),l:'last 24h'}]);
  x+='</div>';

  x+='<div class="pag" id="gp-pag" style="margin-bottom:8px"></div>';
  x+=mkP('All Groups (Most to Least Members)','<div id="gp-list">'+skel(8)+'</div>');

  V.innerHTML=x;

  loadGroupsList();
}

function loadGroupsList(){
  var qs='?limit='+(_gpState.limit||100)+'&offset='+(_gpState.offset||0);
  var list=document.getElementById('gp-list');
  if(list)list.innerHTML=skel(6);
  gj('/admin/groups-list'+qs,{_na:true}).then(function(d){
    var rows=d.groups||[],total=d.total||rows.length;
    var x='';
    if(rows.length){
      x+='<div class="tw"><table><thead><tr>';
      x+='<th>Group</th><th>Owner</th><th>Members</th><th>Messages</th><th>Last Msg</th><th>Created</th><th>Updated</th>';
      x+='</tr></thead><tbody>';
      for(var i=0;i<rows.length;i++){
        var g=rows[i];
        var owner=g.owner_id?pl(g.owner_id,g.owner_name||g.owner_id):'<span class="nl">-</span>';
        x+='<tr>';
        x+='<td>'+gl(g.id,g.name||('Group '+g.id))+'</td>';
        x+='<td>'+owner+'</td>';
        x+='<td><span class="bd">'+fn(g.member_count||0)+'</span></td>';
        x+='<td><span class="bd">'+fn(g.message_count||0)+'</span></td>';
        x+='<td>'+(g.last_message_at?fd(g.last_message_at):'<span class="nl">-</span>')+'</td>';
        x+='<td>'+fd(g.created_at)+'</td>';
        x+='<td>'+fd(g.updated_at)+'</td>';
        x+='</tr>';
      }
      x+='</tbody></table></div>';
    }
    if(list)list.innerHTML=x||'<div class="em">No groups found</div>';
    var pag=document.getElementById('gp-pag');
    if(pag){
      var from=total?(_gpState.offset+1):0,to=_gpState.offset+rows.length;
      pag.innerHTML='<span class="pag-i">'+from+' \\u2013 '+to+' / '+total+'</span>'+
        '<button class="btn btn-s btn-sm" id="gp-prev"'+(_gpState.offset===0?' disabled':'')+'>Prev</button>'+
        '<button class="btn btn-s btn-sm" id="gp-next"'+(_gpState.offset+rows.length>=total?' disabled':'')+'>Next</button>';
      var pv=document.getElementById('gp-prev'),nx=document.getElementById('gp-next');
      if(pv)pv.addEventListener('click',function(){_gpState.offset=Math.max(0,_gpState.offset-_gpState.limit);loadGroupsList()});
      if(nx)nx.addEventListener('click',function(){_gpState.offset+=_gpState.limit;loadGroupsList()});
    }
  }).catch(function(e){
    if(e.name==='AbortError')return;
    if(list)list.innerHTML='<div class="em">Failed to load groups</div>';
  });
}
`;
}
