export function getTablesScript(): string {
  return `
var _ts={t:'players',l:100,o:0,ob:'',od:'asc'};
function rTbl(pre){
  if(pre)_ts.t=pre;_ts.o=0;_ts.ob='';_ts.od='asc';
  var tbls=['players','rooms','room_players','player_state','player_privacy','player_relationships','direct_messages','blocked_ips','rate_limit_usage','message_rate_limit_usage','stats_requests_per_player','stats_requests_per_day','stats_requests_per_month'];
  var opts='';for(var i=0;i<tbls.length;i++)opts+='<option value="'+tbls[i]+'"'+(tbls[i]===_ts.t?' selected':'')+'>'+tbls[i]+'</option>';
  V.innerHTML='<div class="phd"><h2>Tables</h2><p>Browse database tables</p></div>'+
    '<div class="ctrls">'+
      '<div class="ct"><label>Table</label><select id="ts">'+opts+'</select></div>'+
      '<div class="ct"><label>Limit</label><input type="number" id="tl" value="'+_ts.l+'" min="1" max="500" style="width:80px"></div>'+
      '<button class="btn btn-p" id="tb">Load</button>'+
      '<div class="pag" id="tp" style="margin-left:auto"></div>'+
    '</div>'+
    '<div id="tr">'+skel(6)+'</div>';
  var se=document.getElementById('ts'),le=document.getElementById('tl'),be=document.getElementById('tb');
  se.addEventListener('change',function(){_ts.t=se.value;_ts.o=0;_ts.ob='';_ts.od='asc';lTbl()});
  be.addEventListener('click',function(){_ts.t=se.value;_ts.l=parseInt(le.value)||100;_ts.o=0;_ts.ob='';_ts.od='asc';lTbl()});
  lTbl();
}
async function lTbl(){
  var s=_ts,ck='tbl_'+s.t+'_'+s.l+'_'+s.o+'_'+s.ob+'_'+s.od;
  var c=cg(ck,TTL.t),re=document.getElementById('tr');if(!re)return;
  if(c)bTbl(c);else re.innerHTML=skel(6);
  try{var u='/admin/table?table='+encodeURIComponent(s.t)+'&limit='+s.l+'&offset='+s.o;
    if(s.ob)u+='&orderBy='+encodeURIComponent(s.ob)+'&orderDir='+s.od;
    var d=await gj(u);cs(ck,d);if(_s==='tables')bTbl(d);
  }catch(e){if(e.name==='AbortError')return;if(!c&&re)re.innerHTML='<div class="em">Failed to load table data</div>'}
}
function bTbl(d){
  var s=_ts,rows=d.rows||[],re=document.getElementById('tr'),pe=document.getElementById('tp');if(!re)return;
  if(pe){var fr=s.o+1,to=s.o+rows.length;
    pe.innerHTML='<span class="pag-i">'+fr+' \\u2013 '+to+'</span>'+
      '<button class="btn btn-s btn-sm" id="tpv"'+(s.o===0?' disabled':'')+'>Prev</button>'+
      '<button class="btn btn-s btn-sm" id="tpn"'+(rows.length<s.l?' disabled':'')+'>Next</button>';
    var pv=document.getElementById('tpv'),pn=document.getElementById('tpn');
    if(pv)pv.addEventListener('click',function(){s.o=Math.max(0,s.o-s.l);lTbl()});
    if(pn)pn.addEventListener('click',function(){s.o+=s.l;lTbl()});
  }
  re.innerHTML=mkT(rows,{tn:s.t,sc:s.ob,sd:s.od});
  var ths=re.querySelectorAll('th.so');
  for(var i=0;i<ths.length;i++)(function(th){th.addEventListener('click',function(){
    var c=th.dataset.c;if(s.ob===c)s.od=s.od==='asc'?'desc':'asc';else{s.ob=c;s.od='asc'}s.o=0;lTbl();
  })})(ths[i]);
}
`;
}
