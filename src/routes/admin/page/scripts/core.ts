export function getCoreScript(): string {
  return `
var V=document.getElementById('vw'),S=document.getElementById('side'),TL=document.getElementById('top-l'),TR=document.getElementById('top-r');
var _s='',_di=null,_cache={};
var TTL={d:15e3,t:30e3,x:60e3};
function cg(k,t){var c=_cache[k];return c&&Date.now()-c.t<(t||15e3)?c.d:null}
function cs(k,d){_cache[k]={d:d,t:Date.now()}}
var _ab=null;
function ab(){if(_ab)_ab.abort();_ab=new AbortController();return _ab}
async function gj(u,o){var a=o&&o._na?undefined:ab();var r=await fetch(u,{credentials:'include',signal:a?a.signal:undefined,...(o||{})});if(!r.ok)throw new Error(r.statusText||'Error');return r.json()}
async function pj(u,b){var a=ab();var r=await fetch(u,{method:'POST',credentials:'include',signal:a.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});if(!r.ok)throw new Error(r.statusText||'Error');return r.json()}
function h(s){if(s==null)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function fn(n){if(n==null||isNaN(n))return'0';return Number(n).toLocaleString('en-US')}
function fd(d){if(!d)return'-';var t=new Date(d);if(isNaN(t))return'-';return t.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+' '+t.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
function fa(d){if(!d)return'-';var ms=Date.now()-new Date(d).getTime();if(ms<0)return'now';var s=ms/1e3|0;if(s<60)return s+'s';var m=s/60|0;if(m<60)return m+'m';var hr=m/60|0;if(hr<24)return hr+'h';return(hr/24|0)+'d'}
function fc(n){
  if(n==null)return'0';
  n=Number(n);
  function fmt(v,d){var s=v.toFixed(d);s=s.replace(/\.0+$/,'');s=s.replace(/(\.\d)0$/,'$1');return s}
  if(n>=1e12)return fmt(n/1e12,2)+'T';
  if(n>=1e9)return fmt(n/1e9,2)+'B';
  if(n>=1e6)return fmt(n/1e6,1)+'M';
  if(n>=1e3)return fmt(n/1e3,1)+'K';
  return fn(n)
}
function pl(id,nm){if(!id)return'<span class="nl">-</span>';return'<a href="#/player/'+h(id)+'" class="el" title="'+h(id)+'">'+h(nm||id)+'</a>'}
function rl(id){if(!id)return'<span class="nl">-</span>';var s=id.length>20?id.slice(0,18)+'..':id;return'<a href="#/room/'+h(id)+'" class="el" title="'+h(id)+'">'+h(s)+'</a>'}
var TBL_L={players:{id:'p'},rooms:{id:'r',last_updated_by_player_id:'p'},room_players:{room_id:'r',player_id:'p'},player_state:{player_id:'p'},player_privacy:{player_id:'p'},player_relationships:{user_one_id:'p',user_two_id:'p',requested_by:'p'},direct_messages:{sender_id:'p',recipient_id:'p',room_id:'r'},rate_limit_usage:{player_id:'p'},message_rate_limit_usage:{player_id:'p'},blocked_ips:{}};

function nav(x){if(x===location.hash){rt();return}location.hash=x}
function rt(){
  var p=(location.hash.slice(1)||'/dashboard').split('/').filter(Boolean);
  if(_di&&p[0]!=='dashboard'){clearInterval(_di);_di=null}
  document.querySelectorAll('.sl[data-r]').forEach(function(e){var r=e.dataset.r;if(!r)return;r==='/'+p[0]?e.classList.add('on'):e.classList.remove('on')});
  var ctx=document.getElementById('side-ctx'),ci=document.getElementById('side-ctx-items');
  if(p[0]==='player'||p[0]==='room'){ctx.style.display='';var tp=p[0],id=p.slice(1).join('/');ci.innerHTML='<div class="sl on"><span class="ic">'+(tp==='player'?'&#9786;':'&#8962;')+'</span>'+h(tp==='player'?'Player':'Room')+': '+h(id.length>12?id.slice(0,10)+'..':id)+'</div>'}
  else{ctx.style.display='none'}
  _s=p[0];
  switch(p[0]){case'dashboard':rDash();break;case'tables':rTbl(p[1]||'');break;case'sql':rSql();break;case'search':rSrch();break;case'player':rPl(p.slice(1).join('/'));break;case'room':rRm(p.slice(1).join('/'));break;default:rDash()}
}
window.addEventListener('hashchange',rt);
document.addEventListener('click',function(e){
  var tg=e.target.closest('.tg');if(tg){var nd=tg.closest('.nd');if(nd){nd.classList.toggle('cl');var ch=nd.querySelector('.ch');if(ch&&ch.dataset.lz){ch.innerHTML=ch.dataset.lz;delete ch.dataset.lz}}return}
  var jb=e.target.closest('.jb');if(jb){try{showJM(jb.dataset.c||'JSON',JSON.parse(jb.dataset.j))}catch(ex){}return}
  if(e.target.closest('.mo-bg')&&!e.target.closest('.mo')){e.target.closest('.mo-bg').remove();return}
  if(e.target.closest('.mo-x')){var ov=e.target.closest('.mo-bg');if(ov)ov.remove();return}
  var cp=e.target.closest('.cp');if(cp&&cp.dataset.v){navigator.clipboard.writeText(cp.dataset.v).then(function(){cp.classList.add('ok');cp.textContent='Copied';setTimeout(function(){cp.classList.remove('ok');cp.textContent='Copy'},1200)});return}
  var co=e.target.closest('.co-h');if(co){co.classList.toggle('sh');var bd=co.nextElementSibling;if(bd&&bd.classList.contains('co-bd'))bd.classList.toggle('sh');return}
  var tb=e.target.closest('.tab');if(tb&&tb.dataset.t){var bar=tb.closest('.tabs');if(bar){bar.querySelectorAll('.tab').forEach(function(t){t.classList.remove('on')});tb.classList.add('on');var ct=bar.parentElement;if(ct){ct.querySelectorAll('.tp').forEach(function(p){p.style.display='none'});var panel=ct.querySelector('.tp[data-t="'+tb.dataset.t+'"]');if(panel)panel.style.display=''}}return}
  var sl=e.target.closest('.sl[data-r]');if(sl){nav('#'+sl.dataset.r);return}
});
function showJM(t,o){var x='<div class="mo-bg"><div class="mo"><div class="mo-hd"><h3>'+h(t)+'</h3><div style="display:flex;gap:6px"><button class="cp" data-v=\\''+h(JSON.stringify(o,null,2)).replace(/'/g,'&#39;')+'\\'>Copy</button><button class="btn btn-s btn-sm mo-x">Close</button></div></div><div class="mo-bd"><div class="jt">'+jtr(o,0)+'</div></div></div></div>';document.body.insertAdjacentHTML('beforeend',x)}
function deb(f,ms){var t;return function(){var a=arguments,c=this;clearTimeout(t);t=setTimeout(function(){f.apply(c,a)},ms)}}
function skel(n){var x='';for(var i=0;i<(n||5);i++)x+='<div class="sk" style="width:'+(40+Math.random()*50)+'%"></div>';return x}
`;
}
