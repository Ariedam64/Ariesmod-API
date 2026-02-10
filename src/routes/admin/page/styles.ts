export function getStyles(): string {
  return `<style>
  @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
  :root{
    --bg:#09090b;--s1:#111113;--s2:#18181b;--s3:#1f1f23;
    --bd:rgba(255,255,255,.06);--bd2:rgba(255,255,255,.1);
    --t1:#fafafa;--t2:#a1a1aa;--t3:#71717a;
    --p:#a78bfa;--pd:rgba(167,139,250,.12);--pb:rgba(167,139,250,.25);
    --g:#4ade80;--gd:rgba(74,222,128,.1);
    --y:#facc15;--yd:rgba(250,204,21,.1);
    --r:#f87171;--rd:rgba(248,113,113,.1);
    --bl:#60a5fa;--bld:rgba(96,165,250,.1);
    --rad:8px;--radl:12px;
    --f:'Inter',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
    --m:'SF Mono','JetBrains Mono','Fira Code',Consolas,monospace;
    --sh:0 1px 2px rgba(0,0,0,.3),0 4px 12px rgba(0,0,0,.2);
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{font-size:14px}
  body{background:var(--bg);color:var(--t1);font-family:var(--f);line-height:1.5;-webkit-font-smoothing:antialiased;min-height:100vh}
  a{color:var(--p);text-decoration:none}a:hover{text-decoration:underline}
  ::selection{background:var(--p);color:#000}
  ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:99px}

  .shell{display:flex;min-height:100vh}

  /* SIDEBAR */
  .side{width:200px;flex-shrink:0;background:var(--s1);border-right:1px solid var(--bd);display:flex;flex-direction:column;position:fixed;top:0;left:0;bottom:0;z-index:40;overflow-y:auto}
  .side-brand{padding:20px 16px 16px;border-bottom:1px solid var(--bd)}
  .side-brand h1{font-size:14px;font-weight:700;letter-spacing:-.02em;background:linear-gradient(135deg,var(--p),#c4b5fd,#818cf8);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
  .side-brand small{font-size:11px;color:var(--t3);display:block;margin-top:2px}
  .side-nav{padding:8px;flex:1}
  .side-section{margin-bottom:14px}
  .side-lbl{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--t3);padding:4px 8px;margin-bottom:2px}
  .sl{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;color:var(--t2);transition:all .12s;border:1px solid transparent}
  .sl:hover{color:var(--t1);background:rgba(255,255,255,.03)}
  .sl.on{color:var(--t1);background:var(--pd);border-color:var(--pb)}
  .sl .ic{width:18px;text-align:center;font-size:13px;opacity:.6}.sl.on .ic{opacity:1}
  .sl .bg{margin-left:auto;font-size:10px;padding:1px 6px;border-radius:99px;background:rgba(255,255,255,.05);color:var(--t3)}
  .side-ctx{margin-top:auto;padding:8px;border-top:1px solid var(--bd)}

  /* MAIN */
  .main{flex:1;margin-left:200px;min-height:100vh}
  .top{position:sticky;top:0;z-index:30;display:flex;align-items:center;gap:8px;padding:10px 24px;height:44px;background:rgba(9,9,11,.85);backdrop-filter:blur(12px) saturate(1.4);border-bottom:1px solid var(--bd)}
  .top-l{display:flex;align-items:center;gap:8px;flex:1;min-width:0}
  .top-r{display:flex;align-items:center;gap:6px}
  .ldot{width:7px;height:7px;border-radius:50%;background:var(--g);box-shadow:0 0 8px var(--g);animation:pulse 2s ease-in-out infinite}
  .vw{padding:24px;animation:fadeIn .2s ease}.vw-in{max-width:none;width:100%}

  /* BADGE */
  .bd{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:600;background:var(--s3);color:var(--t2)}
  .bd.g{background:var(--gd);color:var(--g)}.bd.y{background:var(--yd);color:var(--y)}.bd.r{background:var(--rd);color:var(--r)}.bd.b{background:var(--bld);color:var(--bl)}.bd.pu{background:var(--pd);color:var(--p)}

  /* PAGE HEADER */
  .phd{margin-bottom:24px}.phd h2{font-size:22px;font-weight:700;letter-spacing:-.03em}.phd p{color:var(--t3);font-size:13px;margin-top:2px}
  .bc{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--t3);margin-bottom:12px}.bc a{color:var(--t3)}.bc a:hover{color:var(--p)}.bcs::before{content:'/';opacity:.35}

  /* STAT CARDS */
  .srow{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-bottom:20px}
  .sc{background:var(--s1);border:1px solid var(--bd);border-radius:var(--radl);padding:16px 18px;display:flex;flex-direction:column;gap:6px}
  .sc .sl2{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--t3)}
  .sc .sv{font-size:30px;font-weight:800;letter-spacing:-.04em;line-height:1}
  .sc .ss{display:flex;flex-wrap:wrap;gap:6px 12px}.sc .ss span{font-size:11px;color:var(--t3)}.sc .ss b{color:var(--t2)}

  /* PANELS */
  .g2{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  @media(max-width:1100px){.g2,.g3,.g4{grid-template-columns:1fr}}
  .pn{background:var(--s1);border:1px solid var(--bd);border-radius:var(--radl);padding:16px;display:flex;flex-direction:column}
  .pn-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:8px}
  .pn-t{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--t3)}
  .pn-bd{flex:1;min-height:0}
  .chart-row{display:flex;gap:14px;align-items:stretch}
  .chart-info{width:160px;flex-shrink:0;display:flex;flex-direction:column;gap:10px}
  .chart-info .ci{display:flex;flex-direction:column;gap:2px}
  .chart-info .ci-l{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--t3)}
  .chart-info .ci-v{font-size:18px;font-weight:700;color:var(--t1);line-height:1.1}
  .chart-info .ci-s{font-size:10px;color:var(--t3)}
  .chart-box{flex:1;min-width:0;display:flex;flex-direction:column}
  .np-wrap{height:100%;display:flex;flex-direction:column;gap:6px}
  .sec-chart{flex:1;min-height:120px;display:flex;flex-direction:column}
  .sec-chart .bars{height:100%}
  @media(max-width:900px){
    .chart-row{flex-direction:column}
    .chart-info{width:auto;flex-direction:row;flex-wrap:wrap;gap:12px}
    .chart-info .ci{min-width:120px}
  }

  /* TABLE */
  .tw{overflow-x:auto;border-radius:var(--rad);border:1px solid var(--bd);background:var(--s1)}
  table{width:100%;border-collapse:collapse;font-size:12.5px}
  thead th{padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--t3);background:var(--s2);border-bottom:1px solid var(--bd);position:sticky;top:0;z-index:2;white-space:nowrap}
  th.so{cursor:pointer;user-select:none}th.so:hover{color:var(--t2)}th.sd{color:var(--p)}
  th .aw{font-size:9px;margin-left:3px}
  td{padding:7px 12px;border-bottom:1px solid var(--bd);vertical-align:top;max-width:320px;word-break:break-word}
  tr:hover td{background:rgba(255,255,255,.015)}
  .nl{color:var(--t3);font-style:italic;font-size:11px}
  .by{color:var(--g);font-weight:600}.bn{color:var(--t3)}

  /* ENTITY LINK */
  .el{display:inline-flex;align-items:center;gap:3px;padding:1px 7px;border-radius:5px;font-size:12px;font-weight:500;background:var(--pd);color:var(--p);cursor:pointer;text-decoration:none;transition:background .12s;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .el:hover{background:rgba(167,139,250,.22);text-decoration:none}

  /* JSON */
  .jp{font-family:var(--m);font-size:11px;color:var(--t3);max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .jb{font-size:10px;color:var(--p);cursor:pointer;background:none;border:none;padding:0;font-family:var(--f)}.jb:hover{text-decoration:underline}
  .jt{font-family:var(--m);font-size:11px;line-height:1.7}
  .jt .k{color:#c4b5fd}.jt .s{color:var(--g)}.jt .n{color:var(--y)}.jt .b{color:#fb923c}.jt .nl{color:var(--t3);font-style:italic}.jt .br{color:var(--t3)}
  .jt .tg{cursor:pointer;user-select:none}.jt .tg::before{content:'\\25BE';font-size:9px;color:var(--t3);margin-right:3px;transition:transform .12s;display:inline-block}
  .jt .nd.cl>.tg::before{transform:rotate(-90deg)}.jt .nd.cl>.ch{display:none}.jt .nd:not(.cl)>.tg>.ct{display:none}
  .jt .ct{color:var(--t3);font-size:10px;font-style:italic;margin-left:3px}.jt .ch{padding-left:14px;border-left:1px solid var(--bd);margin-left:3px}

  /* MODAL */
  .mo-bg{position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.65);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center}
  .mo{background:var(--s2);border:1px solid var(--bd2);border-radius:var(--radl);box-shadow:var(--sh);width:min(90vw,720px);max-height:80vh;display:flex;flex-direction:column}
  .mo-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid var(--bd)}.mo-hd h3{font-size:13px;font-weight:700}
  .mo-bd{padding:16px;overflow:auto;flex:1}

  /* CONTROLS */
  .ctrls{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;padding:12px 14px;background:var(--s2);border:1px solid var(--bd);border-radius:var(--rad);margin-bottom:12px}
  .ct{display:flex;flex-direction:column;gap:3px}
  .ct label{font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.05em}
  select,input[type=text],input[type=number],textarea{background:var(--bg);border:1px solid var(--bd2);color:var(--t1);border-radius:6px;padding:6px 10px;font-size:13px;font-family:var(--f);outline:none;transition:border-color .12s,box-shadow .12s}
  select:focus,input:focus,textarea:focus{border-color:var(--pb);box-shadow:0 0 0 2px var(--pd)}
  textarea{font-family:var(--m);font-size:12px;resize:vertical;min-height:100px;width:100%}

  /* BUTTONS */
  .btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:600;font-family:var(--f);cursor:pointer;transition:all .12s;border:none}
  .btn-p{background:var(--p);color:#000}.btn-p:hover{background:#b69dfc}
  .btn-s{background:var(--s3);color:var(--t2);border:1px solid var(--bd2)}.btn-s:hover{background:var(--s2);color:var(--t1)}
  .btn-sm{padding:4px 10px;font-size:11px}.btn:disabled{opacity:.4;cursor:default}

  /* TABS */
  .tabs{display:flex;gap:1px;border-bottom:1px solid var(--bd);margin-bottom:16px}
  .tab{padding:8px 14px;font-size:12px;font-weight:600;color:var(--t3);cursor:pointer;border-bottom:2px solid transparent;transition:all .12s}
  .tab:hover{color:var(--t2)}.tab.on{color:var(--p);border-color:var(--p)}
  .tab .tb{font-size:10px;padding:1px 5px;border-radius:99px;background:rgba(255,255,255,.05);margin-left:4px}

  /* DETAIL */
  .dhd{display:flex;gap:16px;align-items:flex-start;padding:20px;background:var(--s1);border:1px solid var(--bd);border-radius:var(--radl);margin-bottom:16px}
  .dhd-av{width:56px;height:56px;border-radius:var(--rad);background:var(--s3);border:1px solid var(--bd);display:flex;align-items:center;justify-content:center;font-size:22px;color:var(--t3);overflow:hidden;flex-shrink:0}
  .dhd-av img{width:100%;height:100%;object-fit:cover}
  .dhd-bd{flex:1;min-width:0}.dhd-nm{font-size:18px;font-weight:800;letter-spacing:-.03em}
  .dhd-mt{display:flex;flex-wrap:wrap;gap:10px 16px;font-size:12px;color:var(--t3);margin-top:6px}.dhd-mt b{color:var(--t2)}

  /* FORMS */
  .fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:10px}
  .fc{background:var(--s1);border:1px solid var(--bd);border-radius:var(--radl);padding:16px}
  .fc h3{font-size:14px;font-weight:700;margin-bottom:2px}.fc p{font-size:12px;color:var(--t3);margin-bottom:10px}
  .fc form{display:flex;flex-direction:column;gap:8px}
  .fr{display:flex;gap:8px;align-items:flex-end}.fr .ct{flex:1}

  /* ITEMS */
  .it{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--rad);background:var(--s2);border:1px solid var(--bd);margin-bottom:4px;font-size:12px}
  .it-g{flex:1;min-width:0}
  .rs{font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 7px;border-radius:4px}
  .rs.accepted{background:var(--gd);color:var(--g)}.rs.pending{background:var(--yd);color:var(--y)}.rs.rejected{background:var(--rd);color:var(--r)}

  /* MSG */
  .mg{padding:8px 10px;border-radius:var(--rad);background:var(--s2);border:1px solid var(--bd);margin-bottom:4px}
  .mg-t{display:flex;align-items:center;gap:6px;font-size:12px;margin-bottom:3px}
  .mg-b{font-size:12px;color:var(--t2)}.mg-ts{font-size:11px;color:var(--t3);margin-top:3px}

  /* PRIVACY */
  .pg{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:6px}
  .pf{display:flex;align-items:center;gap:7px;padding:8px 10px;border-radius:var(--rad);background:var(--s2);border:1px solid var(--bd);font-size:12px}
  .pd{width:7px;height:7px;border-radius:50%;flex-shrink:0}.pd.on{background:var(--g)}.pd.off{background:var(--r);opacity:.6}

  /* BARS */
  .bars{display:flex;align-items:flex-end;gap:2px;height:80px;position:relative;background-image:linear-gradient(to top,rgba(255,255,255,.06) 1px,transparent 1px);background-size:100% 25%;background-position:0 100%;border-radius:6px}
  .bar{flex:1;min-width:3px;border-radius:3px 3px 0 0;opacity:.85;transition:opacity .12s;position:relative;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
  .bar:hover{opacity:1!important}
  .bar::after,.bar-seg::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,0) 45%);opacity:.35;pointer-events:none}
  .bar-seg{position:relative;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.18)}
  .bars.np-bars{height:100%;min-height:140px}

  /* PROG */
  .prog{height:5px;background:var(--s3);border-radius:99px;overflow:hidden}.prog-f{height:100%;border-radius:99px;transition:width .3s ease}

  /* PAGINATION */
  .pag{display:flex;align-items:center;gap:8px;padding:8px 0;font-size:12px;color:var(--t3)}.pag-i{flex:1}

  /* PRESETS */
  .pres{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}
  .pre{font-size:11px;padding:3px 9px;border-radius:5px;background:var(--s3);color:var(--t3);border:1px solid var(--bd);cursor:pointer;font-family:var(--f)}.pre:hover{color:var(--t2);background:var(--s2)}

  /* COLLAPSIBLE */
  .co-h{display:flex;align-items:center;gap:7px;cursor:pointer;padding:8px 10px;border-radius:var(--rad);background:var(--s2);border:1px solid var(--bd);font-size:13px;font-weight:600;margin-bottom:6px;user-select:none}
  .co-h:hover{background:var(--s3)}.co-a{font-size:9px;color:var(--t3);transition:transform .12s;display:inline-block}
  .co-h.sh .co-a{transform:rotate(-90deg)}.co-h .co-b{margin-left:auto;font-size:10px;color:var(--t3)}.co-bd.sh{display:none}

  /* LOADING */
  .ld{display:flex;align-items:center;justify-content:center;padding:48px;color:var(--t3);gap:8px}
  .ld::after{content:'';width:16px;height:16px;border:2px solid var(--bd2);border-top-color:var(--p);border-radius:50%;animation:spin .5s linear infinite}
  .em{text-align:center;padding:32px;color:var(--t3);font-size:13px}
  .sk{height:12px;border-radius:4px;background:linear-gradient(90deg,var(--s2) 25%,var(--s3) 50%,var(--s2) 75%);background-size:200% 100%;animation:shimmer 1.5s ease infinite;margin-bottom:8px}

  /* COPY */
  .cp{font-size:10px;color:var(--t3);cursor:pointer;background:none;border:1px solid var(--bd);border-radius:4px;padding:1px 7px;font-family:var(--f)}.cp:hover{color:var(--t2)}.cp.ok{color:var(--g);border-color:rgba(74,222,128,.3)}

  /* INSIGHTS */
  .ins{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px}
  .in{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;font-size:12px;font-weight:500;background:var(--s1);border:1px solid var(--bd)}
  .in .dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}

  /* FEED */
  .fi{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px;border-bottom:1px solid var(--bd)}.fi:last-child{border-bottom:none}
  .fi-ts{font-size:11px;color:var(--t3);flex-shrink:0;width:60px}

  /* STATE FIELD LAZY-LOAD */
  .sf{margin-bottom:6px}
  .sf-h{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:var(--rad);background:var(--s2);border:1px solid var(--bd);font-size:12px}
  .sf-ic{font-size:8px;color:var(--t3)}.sf.loaded .sf-ic{color:var(--g)}
  .sf-nm{font-weight:600;text-transform:capitalize}
  .sf-sz{margin-left:auto;font-size:11px;color:var(--t3);font-family:var(--m)}
  .sf-btn{margin-left:8px}
  .sf-bd{padding-left:10px}

  /* SEARCH SECTION */
  .srch-hero{grid-column:1/-1}
  .srch-ic{font-size:20px;margin-bottom:4px;opacity:.6}
  .srch-res{margin-top:8px;max-height:500px;overflow-y:auto}
  .srch-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px}
  @media(max-width:900px){.srch-grid{grid-template-columns:1fr}}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
  .chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:500;font-family:var(--f);cursor:pointer;background:var(--s3);color:var(--t3);border:1px solid var(--bd);transition:all .12s}
  .chip:hover{color:var(--t2);background:var(--s2)}
  .chip.on{color:var(--t1);background:var(--pd);border-color:var(--pb)}

  /* CHAT INTERFACE */
  .cht{display:flex;height:420px;border:1px solid var(--bd);border-radius:var(--rad);overflow:hidden;background:var(--s1)}
  .cht-ls{width:220px;flex-shrink:0;border-right:1px solid var(--bd);overflow-y:auto}
.cht-ci{display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:pointer;border-bottom:1px solid var(--bd);font-size:12px;transition:background .1s}
.cht-ci-av{width:28px;height:28px;border-radius:50%;background:var(--s3);flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;font-size:12px;color:var(--t2)}
.cht-ci-av img{width:100%;height:100%;object-fit:cover;display:block}
  .cht-ci:hover{background:rgba(255,255,255,.03)}
  .cht-ci.on{background:var(--pd);border-right:2px solid var(--p)}
  .cht-ci-nm{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .cht-ci-pr{font-size:11px;color:var(--t3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:150px}
  .cht-ci-ts{font-size:10px;color:var(--t3);margin-left:auto;flex-shrink:0}
  .cht-ci-ct{font-size:10px;padding:1px 5px;border-radius:99px;background:rgba(255,255,255,.05);color:var(--t3);flex-shrink:0}
  .cht-ms{flex:1;display:flex;flex-direction:column;min-width:0}
  .cht-hd{padding:8px 12px;border-bottom:1px solid var(--bd);font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;background:var(--s2)}
  .cht-bd{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:4px}
  .bbl{max-width:75%;padding:7px 11px;border-radius:12px;font-size:12px;line-height:1.4;word-break:break-word}
  .bbl-s{align-self:flex-end;background:var(--pd);color:var(--t1);border-bottom-right-radius:4px}
  .bbl-r{align-self:flex-start;background:var(--s3);color:var(--t2);border-bottom-left-radius:4px}
  .bbl-ts{font-size:10px;color:var(--t3);margin-top:1px;padding:0 4px}
  .bbl-ts.s{text-align:right}
  .cht-empty{display:flex;align-items:center;justify-content:center;flex:1;color:var(--t3);font-size:13px}
  @media(max-width:700px){.cht-ls{width:160px}}
</style>`;
}
