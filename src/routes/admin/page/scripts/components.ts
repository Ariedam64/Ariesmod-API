export function getComponentsScript(): string {
  return `
function jtr(o,d,mx){
  if(mx===undefined)mx=12;
  if(o===null||o===undefined)return'<span class="nl">null</span>';
  if(typeof o==='boolean')return'<span class="b">'+o+'</span>';
  if(typeof o==='number')return'<span class="n">'+o+'</span>';
  if(typeof o==='string'){var s=h(o);return'<span class="s">"'+(s.length>200?s.slice(0,200)+'...':s)+'"</span>'}
  if(d>=mx)return'<span class="nl">[...]</span>';
  var ia=Array.isArray(o),en=ia?o:Object.keys(o),ln=en.length;
  if(ln===0)return'<span class="br">'+(ia?'[]':'{}')+'</span>';
  var cl=d>1,op=ia?'[':'{',cp=ia?']':'}',ch='';
  for(var i=0;i<ln;i++){var k=ia?i:en[i],v=ia?o[i]:o[k];ch+='<div>'+(ia?'<span class="n">'+k+'</span>: ':'<span class="k">"'+h(String(k))+'"</span>: ')+jtr(v,d+1,mx)+'</div>'}
  var la=cl?' data-lz="'+h(ch)+'"':'',cc=cl?'':ch;
  return'<div class="nd'+(cl?' cl':'')+'"><span class="tg"><span class="br">'+op+'</span><span class="ct">'+ln+(ia?' items':' keys')+'</span></span><div class="ch"'+la+'>'+cc+'</div><span class="br">'+cp+'</span></div>';
}
function fmtC(v,c,tn){
  if(v===null||v===undefined)return'<span class="nl">null</span>';
  var lk=(TBL_L[tn]||{})[c];
  if(lk==='p')return pl(v);if(lk==='r')return rl(v);if(lk==='g')return gl(v);
  if(typeof v==='boolean')return'<span class="'+(v?'by':'bn')+'">'+v+'</span>';
  if(typeof v==='object'){var s=JSON.stringify(v),p=s.length>100?s.slice(0,100)+'...':s;return'<div class="jp">'+h(p)+'</div><button class="jb" data-j=\\''+h(s).replace(/'/g,'&#39;')+'\\' data-c="'+h(c)+'">Expand</button>'}
  if(typeof v==='string'&&/^\\d{4}-\\d{2}-\\d{2}T/.test(v))return'<span title="'+h(v)+'">'+fd(v)+'</span>';
  return h(String(v));
}
function mkT(rows,o){
  o=o||{};var tn=o.tn||'',sc=o.sc||'',sd=o.sd||'asc';
  if(!rows||!rows.length)return'<div class="em">No data</div>';
  var cols=Object.keys(rows[0]),x='<div class="tw"><table><thead><tr>';
  for(var i=0;i<cols.length;i++){var c=cols[i],isSrt=c===sc,ar=isSrt?(sd==='asc'?' &#9650;':' &#9660;'):'';x+='<th class="so'+(isSrt?' sd':'')+'" data-c="'+h(c)+'">'+h(c)+'<span class="aw">'+ar+'</span></th>'}
  x+='</tr></thead><tbody>';
  for(var r=0;r<rows.length;r++){x+='<tr>';for(var j=0;j<cols.length;j++){var v=rows[r][cols[j]],isJ=v!==null&&typeof v==='object';x+='<td'+(isJ?' class="jp-c"':'')+'>'+fmtC(v,cols[j],tn)+'</td>'}x+='</tr>'}
  x+='</tbody></table></div>';return x;
}
function mkS(l,v,subs){
  var sx='';if(subs&&subs.length){sx='<div class="ss">';for(var i=0;i<subs.length;i++)sx+='<span><b>'+h(String(subs[i].v))+'</b> '+h(subs[i].l)+'</span>';sx+='</div>'}
  return'<div class="sc"><div class="sl2">'+h(l)+'</div><div class="sv">'+h(String(v))+'</div>'+sx+'</div>';
}
function mkP(t,body,ext){return'<div class="pn"><div class="pn-hd"><span class="pn-t">'+h(t)+'</span>'+(ext||'')+'</div><div class="pn-bd">'+body+'</div></div>'}
function mkTabs(tabs,act){var x='<div class="tabs">';for(var i=0;i<tabs.length;i++){var t=tabs[i];x+='<div class="tab'+(t.id===act?' on':'')+'" data-t="'+h(t.id)+'">'+h(t.l)+(t.b!=null?'<span class="tb">'+h(String(t.b))+'</span>':'')+'</div>'}return x+'</div>'}
function mkBars(vals,color){
  if(!vals||!vals.length)return'<div class="bars"></div>';
  var mx=Math.max.apply(null,vals.concat([1])),x='<div class="bars">';
  for(var i=0;i<vals.length;i++){var pct=vals[i]>0?Math.max(3,(vals[i]/mx)*100):0;x+='<div class="bar" style="height:'+pct+'%;background:'+(color||'var(--p)')+'" title="'+fn(vals[i])+'"></div>'}
  return x+'</div>';
}
function mkCo(t,badge,body,shut){return'<div class="co-h'+(shut?' sh':'')+'"><span class="co-a">&#9660;</span>'+h(t)+(badge?'<span class="co-b">'+h(badge)+'</span>':'')+'</div><div class="co-bd'+(shut?' sh':'')+'">'+body+'</div>'}
function mkProg(pct,color){return'<div class="prog"><div class="prog-f" style="width:'+Math.min(100,Math.max(0,pct))+'%;background:'+(color||'var(--p)')+'"></div></div>'}
function fmtB(b){if(b==null)return'-';if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB'}
`;
}
