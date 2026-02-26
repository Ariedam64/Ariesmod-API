export function getLeaderboardViewScript(): string {
  return `
function rLeaderboard(){
  var ck='leaderboard_view',c=cg(ck,TTL.d);if(c)bLeaderboard(c);else V.innerHTML=skel(8);
  gj('/admin/leaderboard-view').then(function(d){cs(ck,d);if(_s==='leaderboard')bLeaderboard(d)}).catch(function(e){
    if(e.name==='AbortError')return;
    if(!c)V.innerHTML='<div class="em">Failed to load leaderboard</div>';
  });
}

function bLeaderboard(d){
  var coins=d.coins||[],eggs=d.eggs||[];
  var x='<div class="phd"><h2>Leaderboard</h2><p>Top players by coins and eggs hatched</p></div>';

  x+='<div class="srow">';
  x+=mkS('Top Coins',coins.length?fc(coins[0].total):'-',[{v:coins.length,l:'ranked'}]);
  x+=mkS('Top Eggs Hatched',eggs.length?fc(eggs[0].total):'-',[{v:eggs.length,l:'ranked'}]);
  x+='</div>';

  var tabs=[{id:'coins',l:'Coins',b:coins.length},{id:'eggs',l:'Eggs Hatched',b:eggs.length}];
  x+=mkTabs(tabs,'coins');

  x+=bLbTable(coins,'coins');
  x+=bLbTable(eggs,'eggs');

  V.innerHTML=x;
}

function bLbTable(rows,tabId){
  var x='<div class="tp"'+(tabId==='eggs'?' style="display:none"':'')+' data-t="'+tabId+'">';
  if(!rows.length){x+='<div class="em">No data</div></div>';return x}
  x+='<div class="tw"><table><thead><tr>';
  x+='<th>#</th><th>Player</th><th>Total</th><th>24h Change</th><th>Last Active</th>';
  x+='</tr></thead><tbody>';
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    var plr=r.isAnon?'<span class="nl">anonymous</span>':pl(r.playerId,r.playerName);
    var chg='<span class="nl">-</span>';
    if(r.rankChange!=null){
      if(r.rankChange>0)chg='<span style="color:var(--g)">&#9650; '+r.rankChange+'</span>';
      else if(r.rankChange<0)chg='<span style="color:var(--r)">&#9660; '+Math.abs(r.rankChange)+'</span>';
      else chg='<span style="color:var(--t3)">=</span>';
    }
    x+='<tr>';
    x+='<td><span class="bd">'+r.rank+'</span></td>';
    x+='<td>'+plr+'</td>';
    x+='<td>'+fc(r.total)+'</td>';
    x+='<td>'+chg+'</td>';
    x+='<td>'+(r.lastEventAt?fa(r.lastEventAt):'<span class="nl">-</span>')+'</td>';
    x+='</tr>';
  }
  x+='</tbody></table></div>';
  x+='</div>';
  return x;
}
`;
}
