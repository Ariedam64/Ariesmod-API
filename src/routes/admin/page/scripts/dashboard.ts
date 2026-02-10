export function getDashboardScript(): string {
  return `
async function rDash(){
  var c=cg('dash',TTL.d);if(c)bDash(c);else V.innerHTML=skel(8);
  try{var d=await gj('/admin/overview');cs('dash',d);if(_s==='dashboard')bDash(d)}catch(e){if(e.name==='AbortError')return;if(!c)V.innerHTML='<div class="em">Failed to load</div>'}
  if(!_di)_di=setInterval(async function(){if(_s!=='dashboard')return;try{var d=await gj('/admin/overview',{_na:true});cs('dash',d);bDash(d)}catch(e){}},15e3);
}
function bDash(d){
  var p=d.players||{},r=d.rooms||{},s=d.social||{},m=d.messages||{},sec=d.security||{},ch=d.charts||{};
  TR.innerHTML='<span class="ldot"></span><span style="font-size:11px;color:var(--t2)">'+fn(p.online_5m)+' online</span><span class="bd g">Live</span>';
  TL.innerHTML='<span style="font-size:12px;color:var(--t3)">Last refresh: '+fd(d.ts)+'</span>';
  var x='<div class="phd"><h2>Dashboard</h2><p>Live overview of your game ecosystem</p></div>';

  // Insights row
  x+='<div class="ins">';
  if(s.acceptance_rate)x+='<div class="in"><div class="dot" style="background:'+(s.acceptance_rate>=50?'var(--g)':'var(--y)')+'"></div>Friend acceptance: <b>'+s.acceptance_rate+'%</b></div>';
  if(m.read_rate)x+='<div class="in"><div class="dot" style="background:'+(m.read_rate>=60?'var(--g)':'var(--y)')+'"></div>Message read rate: <b>'+m.read_rate+'%</b></div>';
  x+='</div>';

  // KPI cards
  x+='<div class="srow">';
  x+=mkS('Players',fn(p.total),[{v:fn(p.online_5m),l:'online'},{v:fn(p.active_24h),l:'24h active'},{v:fn(p.with_mod),l:'with mod'}]);
  x+=mkS('New Players',fn(p.new_24h),[{v:fn(p.new_7d),l:'this week'},{v:fn(p.active_7d),l:'active 7d'}]);
  x+=mkS('Rooms',fn(r.total),[{v:fn(r.public),l:'public'},{v:fn(r.private),l:'private'}]);
  x+=mkS('Messages',fn(m.total),[{v:fn(m.today),l:'today'},{v:fn(m.conversations),l:'threads'}]);
  x+=mkS('Friendships',fn(s.accepted),[{v:fn(s.pending),l:'pending'},{v:fn(s.new_24h),l:'new today'}]);
  x+='</div>';

  // Grid panels
  // New players chart (dual bars: mod vs no-mod)
  var np14=ch.new_players_14d||[];
  var npMod=np14.map(function(r){return r.count_mod});
  var npNoMod=np14.map(function(r){return r.count_no_mod});
  var days=np14.map(function(r){return new Date(r.day).toLocaleDateString('en-GB',{day:'numeric',month:'short'})});
  var npMax=1,npTotal=0,npModSum=0,npPeak=0,npPeakDay='';
  for(var i=0;i<np14.length;i++){
    var t=(npMod[i]||0)+(npNoMod[i]||0);
    npTotal+=t;npModSum+=npMod[i]||0;
    if(t>npMax)npMax=t;
    if(t>npPeak){npPeak=t;npPeakDay=days[i]}
  }
  var npAvg=np14.length?Math.round(npTotal/np14.length):0;
  var npModPct=npTotal?Math.round((npModSum/npTotal)*100):0;
  var barH=140;
  var barsHtml='<div class="bars np-bars" style="height:'+barH+'px;margin-top:10px">';
  for(var i=0;i<np14.length;i++){
    var total=(npMod[i]||0)+(npNoMod[i]||0);
    var hM=npMod[i]>0?Math.max(3,Math.round((npMod[i]/npMax)*barH)):0;
    var hN=npNoMod[i]>0?Math.max(3,Math.round((npNoMod[i]/npMax)*barH)):0;
    var hSum=hM+hN;if(hSum>barH){var s=barH/hSum;hM=Math.round(hM*s);hN=Math.round(hN*s)}
    barsHtml+='<div style="flex:1;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-end;gap:1px;height:100%" title="'+days[i]+': '+total+' total ('+npMod[i]+' mod, '+npNoMod[i]+' no mod)">';
    barsHtml+='<div class="bar-seg" style="height:'+hN+'px;background:var(--pb);border-radius:2px 2px 0 0;min-width:0;opacity:.9"></div>';
    barsHtml+='<div class="bar-seg" style="height:'+hM+'px;background:var(--p);border-radius:0 0 2px 2px;min-width:0;opacity:.9"></div>';
    barsHtml+='</div>';
  }
  barsHtml+='</div>';
  var legend='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--t3);margin-top:4px"><span>'+(days[0]||'')+'</span><div style="display:flex;gap:10px"><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:2px;background:var(--p);opacity:.9"></span>With mod</span><span style="display:flex;align-items:center;gap:3px"><span style="width:8px;height:8px;border-radius:2px;background:var(--pb);opacity:.9"></span>Without mod</span></div><span>'+(days[days.length-1]||'')+'</span></div>';
  var npInfo='<div class="chart-info">'
    +'<div class="ci"><div class="ci-l">Total 14d</div><div class="ci-v">'+fn(npTotal)+'</div></div>'
    +'<div class="ci"><div class="ci-l">Avg/day</div><div class="ci-v">'+fn(npAvg)+'</div></div>'
    +'<div class="ci"><div class="ci-l">With mod</div><div class="ci-v">'+npModPct+'%</div></div>'
    +'<div class="ci"><div class="ci-l">Peak</div><div class="ci-v">'+fn(npPeak)+'</div><div class="ci-s">'+(npPeakDay||'')+'</div></div>'
    +'</div>';
  // Security
  var rl24=sec.rate_limit_24h||{};
  var rq=sec.requests_24h||[];
  var rqVals=rq.map(function(r){return r.count});
  var rqLabs=rq.map(function(r){return new Date(r.hour).toLocaleTimeString('en-GB',{hour:'2-digit'})});
  var rqSum=0,rqMax=0,rqMaxIdx=0;
  for(var i=0;i<rqVals.length;i++){rqSum+=rqVals[i]||0;if(rqVals[i]>rqMax){rqMax=rqVals[i];rqMaxIdx=i}}
  var rqAvg=rqVals.length?Math.round(rqSum/rqVals.length):0;
  var rqChart='';
  if(rqVals.length){
    var rqLegend='<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--t3);margin-top:4px"><span>'+(rqLabs[0]||'')+'</span><span>'+(rqLabs[rqLabs.length-1]||'')+'</span></div>';
    rqChart='<div class="sec-chart">'+mkBars(rqVals,'var(--p)')+rqLegend+'</div>';
  }
  var secInfo='<div class="chart-info">'
    +'<div class="ci"><div class="ci-l">Requests 24h</div><div class="ci-v">'+fn(rl24.total_hits)+'</div></div>'
    +'<div class="ci"><div class="ci-l">Avg/hour</div><div class="ci-v">'+fn(rqAvg)+'</div></div>'
    +'<div class="ci"><div class="ci-l">Peak/hour</div><div class="ci-v">'+fn(rqMax)+'</div><div class="ci-s">'+(rqLabs[rqMaxIdx]||'')+'</div></div>'
    +'<div class="ci"><div class="ci-l">Unique IPs</div><div class="ci-v">'+fn(rl24.unique_ips)+'</div></div>'
    +'</div>';

  x+='<div class="g2" style="margin-bottom:10px">';
  x+=mkP('New Players (14 days)','<div class="chart-row">'+npInfo+'<div class="chart-box np-wrap">'+barsHtml+legend+'</div></div>');
  x+=mkP('Security','<div class="chart-row">'+secInfo+'<div class="chart-box">'+rqChart+'</div></div>');
  x+='</div>';

  x+='<div class="g3" style="margin-bottom:10px">';

  // Richest players
  var rich=d.richest_players||[];
  var rch='';for(var i=0;i<Math.min(rich.length,8);i++){var u=rich[i];rch+='<div class="fi">'+pl(u.id,u.name)+'<span style="margin-left:auto;display:flex;gap:8px"><span class="bd">'+fc(u.coins)+'</span></span></div>'}
  x+=mkP('Richest Players',rch||'<div class="em">No data</div>');

  // Most relationships
  var tr=d.top_relationships||[];
  var trh='';for(var i=0;i<Math.min(tr.length,8);i++){var u2=tr[i];trh+='<div class="fi">'+pl(u2.id,u2.name)+'<span class="bd" style="margin-left:auto">'+fn(u2.rel_count)+' rel</span></div>'}
  x+=mkP('Most Relationships',trh||'<div class="em">No data</div>');

  // Top talkers
  var tt=d.top_talkers||[];
  var tth='';for(var i=0;i<Math.min(tt.length,8);i++){var u3=tt[i];tth+='<div class="fi">'+pl(u3.id,u3.name)+'<span class="bd" style="margin-left:auto">'+fn(u3.msg_count)+' msgs</span></div>'}
  x+=mkP('Top Talkers (7d)',tth||'<div class="em">No data</div>');

  x+='</div>';

  // Recent sections
  x+='<div class="g4" style="margin-bottom:10px">';
  var rp=d.recent_players||[];
  var rph='';for(var i=0;i<Math.min(rp.length,10);i++){var p2=rp[i];rph+='<div class="fi"><span class="fi-ts">'+fa(p2.created_at)+'</span>'+pl(p2.id,p2.name)+(p2.has_mod_installed?'<span class="bd b" style="margin-left:auto">mod</span>':'')+'</div>'}
  x+=mkP('Recent New Players',rph||'<div class="em">No recent players</div>');

  var rm=d.recent_messages||[];
  var rmh='';for(var i=0;i<Math.min(rm.length,10);i++){
    var msg=rm[i];
    rmh+='<div class="fi"><span class="fi-ts">'+fa(msg.created_at)+'</span>'+pl(msg.sender_id,msg.sender_name)+' <span style="color:var(--t3)">&rarr;</span> '+pl(msg.recipient_id,msg.recipient_name)+'</div>';
  }
  x+=mkP('Recent New Messages',rmh||'<div class="em">No recent messages</div>');

  var rrq=d.recent_requests||[];
  var rrqh='';for(var i=0;i<Math.min(rrq.length,10);i++){
    var q=rrq[i];
    rrqh+='<div class="fi"><span class="fi-ts">'+fa(q.created_at)+'</span>'+pl(q.user_one_id,q.user_one_name)+' <span style="color:var(--t3)">&rarr;</span> '+pl(q.user_two_id,q.user_two_name)+' <span class="rs '+q.status+'">'+q.status+'</span></div>';
  }
  x+=mkP('Recent Friend Requests',rrqh||'<div class="em">No recent requests</div>');

  var rrn=d.recent_rooms||[];
  var rrnh='';for(var i=0;i<Math.min(rrn.length,10);i++){
    var rm2=rrn[i];
    var cr=rm2.creator_id?(' <span style="color:var(--t3)">&middot;</span> '+pl(rm2.creator_id,rm2.creator_name||rm2.creator_id)):'';
    rrnh+='<div class="fi"><span class="fi-ts">'+fa(rm2.created_at)+'</span>'+rl(rm2.id)+cr+'<span style="margin-left:auto;display:flex;gap:6px;align-items:center"><span class="bd">'+fn(rm2.players_count)+'/6</span><span class="bd'+(rm2.is_private?' y':' g')+'">'+(rm2.is_private?'Private':'Public')+'</span></span></div>';
  }
  x+=mkP('Recent New Rooms',rrnh||'<div class="em">No recent rooms</div>');
  x+='</div>';

  V.innerHTML=x;
}
`;
}
