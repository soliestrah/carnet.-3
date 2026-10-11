/* Logique du carnet. Les listes viennent de data.js, chargé avant ce fichier. */
(function(){
  var KEY = "carnet-heartopia-v2";
  var OLDKEY = "carnet-heartopia-v1";

  /* ---------- State ---------- */
  function ymd(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function fresh(){
    var s = { dg:11,
      levels:{insectes:4, peche:3, jardinage:3, cuisine:2, oiseaux:2},
      once:{}, daily:{date:ymd(), done:{}}, seen:{}, custom:{}, log:[], hist:{}, alias:{}, cible:{}, notes:{}, codes:"" };
    ORDER.forEach(function(k){ s.seen[k]={}; s.custom[k]=[]; });
    return s;
  }
  function merge(base, src){
    if(!src || typeof src!=="object") return base;
    Object.keys(src).forEach(function(k){
      if(src[k] && typeof src[k]==="object" && !Array.isArray(src[k]) && base[k] && typeof base[k]==="object") merge(base[k], src[k]);
      else base[k]=src[k];
    });
    return base;
  }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function norm(s){ return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""); }

  var state = fresh();
  try {
    var raw = localStorage.getItem(KEY) || localStorage.getItem(OLDKEY);
    if(raw) merge(state, JSON.parse(raw));
  } catch(e){}
  ORDER.forEach(function(k){ if(!state.seen[k]) state.seen[k]={}; if(!Array.isArray(state.custom[k])) state.custom[k]=[]; });
  rollDaily();

  var LVKEY = {insectes:"insectes", oiseaux:"oiseaux", cuisine:"cuisine", cultures:"jardinage"};
  /* Keep ticks made under older bird names. */
  function migrate(){
    if(!Array.isArray(state.log)) state.log = [];
    if(!state.hist || typeof state.hist!=="object") state.hist = {};
    if(!state.alias || typeof state.alias!=="object") state.alias = {};
    if(!state.cible || typeof state.cible!=="object" || Array.isArray(state.cible)) state.cible = {};
    if(!state.notes || typeof state.notes!=="object" || Array.isArray(state.notes)) state.notes = {};
    Object.keys(state.cible).forEach(function(ck){ if(state.cible[ck] && !state.notes[ck]) state.notes[ck] = state.cible[ck]; state.cible[ck] = ""; });
    ORDER.forEach(function(k){ if(!state.alias[k] || typeof state.alias[k]!=="object") state.alias[k] = {}; });
    var alias = {"Pigeon Africain à Olive":"Pigeon olive africain","Sizerin Flammé":"Redpolis","Grand Ara Vert":"Ara de Buffon","Ara Rouge et Vert":"Ara chloroptère"};
    var map = {};
    LISTS.oiseaux.items.forEach(function(x){ map[norm(x.n)] = x.n; });
    var seen = state.seen.oiseaux || {}, out = {};
    Object.keys(seen).forEach(function(k){ out[alias[k] || map[norm(k)] || k] = seen[k]; });
    state.seen.oiseaux = out;
  }
  migrate();

  var tab = "insectes", q = "", onlyMissing = false, onlyLevel = false, fh = [], fw = [], fl = "", so = "", jf = "all", jmax = 40, ioMsg = "", editing = null;
  var wt = "", ww = "", wh = "", onlyTarget = false, tnow = false, tlvl = true, tq = "";
  var dbDoc = null, timer = null;
  var app = document.getElementById("app");
  var saveEl = document.getElementById("save-state");

  function rollDaily(){
    if(!state.daily || state.daily.date!==ymd()){
      if(state.daily && state.daily.date && state.daily.done){
        var n = Object.keys(state.daily.done).filter(function(k){ return state.daily.done[k]; }).length;
        if(n){ if(!state.hist) state.hist = {}; state.hist[state.daily.date] = n; }
      }
      state.daily = {date:ymd(), done:{}};
    }
  }
  function setStatus(t){ saveEl.textContent = t; }
  function queueSave(){ setStatus("Enregistrement…"); clearTimeout(timer); timer = setTimeout(flush, 500); }
  function flush(){
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
    if(dbDoc){
      dbDoc.set(JSON.parse(JSON.stringify(state)))
        .then(function(){ setStatus("Enregistré sur ton compte."); })
        .catch(function(){ setStatus("Enregistré sur cet appareil seulement."); });
    } else { setStatus("Enregistré sur cet appareil."); }
  }

  /* ---------- Helpers ---------- */
  function allItems(k){
    return LISTS[k].items.concat((state.custom[k]||[]).map(function(n){ return {n:n, g:"Ajoutés par toi", m:"", c:1}; }));
  }
  function stats(k){
    var it = allItems(k), d = 0;
    it.forEach(function(x){ if(state.seen[k][x.n]) d++; });
    return {d:d, t:it.length};
  }
  function pct(a,b){ return b? Math.max(0, Math.min(100, Math.round(a/b*100))) : 0; }
  function stepper(act, key, val){
    return '<span class="stepper"><button type="button" data-act="'+act+'" data-k="'+key+'" data-d="-1" aria-label="Diminuer">−</button>'+
      (val===""?"":'<output>'+val+'</output>')+
      '<button type="button" data-act="'+act+'" data-k="'+key+'" data-d="1" aria-label="Augmenter">+</button></span>';
  }
  function check(group, k, t, h, on){
    return '<li><label for="c-'+group+'-'+k+'"><input type="checkbox" id="c-'+group+'-'+k+'" data-chk="'+group+':'+k+'"'+(on?" checked":"")+'><span>'+esc(t)+(h?'<span class="hint">'+esc(h)+'</span>':'')+'</span></label></li>';
  }

  function dailyItem(d){
    if(!d.n) return check("daily",d.k,d.t,d.h,!!state.daily.done[d.k]);
    var s = "";
    for(var i=1;i<=d.n;i++) s += '<label class="sub"><input type="checkbox" data-chk="daily:'+d.k+'_'+i+'" aria-label="'+esc(d.t)+' '+i+'"'+(state.daily.done[d.k+"_"+i]?" checked":"")+'><span>'+i+'</span></label>';
    return '<li><div style="flex:1;min-width:0"><span>'+esc(d.t)+'</span>'+(d.h?'<span class="hint">'+esc(d.h)+'</span>':'')+'<div class="subs">'+s+'</div></div></li>';
  }
  function ymdOf(d){ return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function dayLabel(d){
    if(d===ymd()) return "Aujourd'hui";
    var yd = new Date(); yd.setDate(yd.getDate()-1);
    if(d===ymdOf(yd)) return "Hier";
    var p = d.split("-");
    return new Date(+p[0], +p[1]-1, +p[2]).toLocaleDateString("fr-FR", {weekday:"long", day:"numeric", month:"long"});
  }
  /* Name shown for an entry: the player's own name if set, else the guide's. */
  function disp(l, n){ var a = state.alias && state.alias[l]; return (a && a[n]) ? a[n] : n; }
  function logAdd(l, n){
    state.log.push({d:ymd(), l:l, n:n});
    if(state.log.length>1000) state.log = state.log.slice(-1000);
  }
  function logRemove(l, n){
    for(var i=state.log.length-1; i>=0; i--){
      if(state.log[i].l===l && state.log[i].n===n){ state.log.splice(i,1); break; }
    }
  }

  /* ---------- CSV export / import ---------- */
  /* csv:start */
  function csvField(v){
    v = String(v==null ? "" : v);
    if(/^[=+\-@]/.test(v)) v = "'"+v;
    return /[;,"\r\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v;
  }
  function parseCsv(text){
    text = String(text).replace(/^﻿/,"");
    var first = text.split(/\r?\n/)[0] || "";
    var d = first.split(";").length >= first.split(",").length ? ";" : ",";
    var rows = [], row = [], f = "", inq = false;
    for(var i=0; i<text.length; i++){
      var c = text.charAt(i);
      if(inq){
        if(c==='"'){ if(text.charAt(i+1)==='"'){ f += '"'; i++; } else inq = false; }
        else f += c;
      } else if(c==='"') inq = true;
      else if(c===d){ row.push(f); f = ""; }
      else if(c==="\n"){ row.push(f); rows.push(row); row = []; f = ""; }
      else if(c!=="\r") f += c;
    }
    if(f!=="" || row.length){ row.push(f); rows.push(row); }
    return rows;
  }
  /* csv:end */
  function buildCsv(){
    var rows = [["type","cle","valeur","date","alias"]];
    rows.push(["reglage","dg",state.dg,""]);
    Object.keys(state.levels).forEach(function(k){ rows.push(["reglage",k,state.levels[k],""]); });
    Object.keys(state.once).forEach(function(k){ if(state.once[k]) rows.push(["inventaire",k,1,""]); });
    var dates = {};
    state.log.forEach(function(x){ dates[x.l+"|"+x.n] = x.d; });
    ORDER.forEach(function(k){
      Object.keys(state.seen[k]).forEach(function(n){ rows.push(["collection",k,n,dates[k+"|"+n]||""]); });
      (state.custom[k]||[]).forEach(function(n){ rows.push(["ajout",k,n,""]); });
    });
    var hist = {};
    Object.keys(state.hist).forEach(function(d){ hist[d] = state.hist[d]; });
    var tn = DAILY.filter(function(d){ return state.daily.done[d.k]; }).length;
    if(tn) hist[ymd()] = tn;
    ORDER.forEach(function(k){
      Object.keys(state.alias[k]||{}).forEach(function(n){ rows.push(["alias",k,n,"",state.alias[k][n]]); });
    });
    Object.keys(state.cible).forEach(function(ck){
      var i = ck.indexOf("|"); if(i<1) return;
      rows.push(["cible", ck.slice(0,i), ck.slice(i+1), "", state.notes[ck]||""]);
    });
    Object.keys(state.notes).forEach(function(ck){
      var i = ck.indexOf("|"); if(i<1 || !state.notes[ck] || hasOwn(state.cible, ck)) return;
      rows.push(["note", ck.slice(0,i), ck.slice(i+1), "", state.notes[ck]]);
    });
    Object.keys(hist).sort().forEach(function(d){ rows.push(["routine",d,hist[d],""]); });
    return rows.map(function(r){ return r.map(csvField).join(";"); }).join("\r\n")+"\r\n";
  }
  function setIo(m){
    ioMsg = m;
    var el = document.getElementById("io-msg");
    if(el) el.textContent = m;
  }
  async function doExport(){
    var text = buildCsv(), name = "carnet-heartopia-"+ymd()+".csv";
    var hasRuntime = !!(window.claude && window.claude.use);
    try{
      var dl = hasRuntime ? await window.claude.use("downloads") : null;
      if(dl){ await dl.save({filename:name, data:"﻿"+text}); setIo("Fichier prêt : "+name); return; }
    }catch(e){
      setIo(e && e.code==="declined" ? "Téléchargement annulé." : "Téléchargement impossible ici. Utilise « Copier le CSV ».");
      return;
    }
    if(hasRuntime){ setIo("Téléchargement indisponible ici. Utilise « Copier le CSV »."); return; }
    try{
      var blob = new Blob(["﻿"+text], {type:"text/csv;charset=utf-8"});
      var url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
      setIo("Fichier téléchargé : "+name);
    }catch(e){ setIo("Téléchargement impossible. Utilise « Copier le CSV »."); }
  }
  function doCopy(){
    var text = buildCsv();
    function fallback(){
      var ta = document.getElementById("io-paste");
      if(ta){ ta.value = text; var dt = ta.closest("details"); if(dt) dt.open = true; ta.focus(); ta.select(); }
      setIo("Copie refusée par le navigateur : le texte est dans la zone ci-dessous, copie-le à la main.");
    }
    try{
      navigator.clipboard.writeText(text).then(function(){ setIo("CSV copié dans le presse-papiers."); }, fallback);
    }catch(e){ fallback(); }
  }
  function doImport(text){
    var rows;
    try{ rows = parseCsv(text); }catch(e){ setIo("Fichier illisible."); return; }
    if(!rows.length){ setIo("Fichier vide."); return; }
    if(norm(String(rows[0][0]||"")).trim()!=="type"){ setIo("Ce fichier ne ressemble pas à un export du carnet : la première colonne doit s'appeler « type »."); return; }
    var added = 0, settings = 0, skipped = 0, dateRe = /^\d{4}-\d{2}-\d{2}$/;
    function clean(v){ v = String(v||"").trim(); if(/^'[=+\-@]/.test(v)) v = v.slice(1); return v; }
    rows.slice(1).forEach(function(r){
      var type = clean(r[0]), key = clean(r[1]), val = clean(r[2]), date = clean(r[3]);
      if(!type) return;
      if(type==="reglage"){
        var num = parseInt(val,10);
        if(isNaN(num)){ skipped++; return; }
        num = Math.max(1, Math.min(99, num));
        if(key==="dg"){ state.dg = num; settings++; }
        else if(Object.prototype.hasOwnProperty.call(state.levels, key)){ state.levels[key] = num; settings++; }
        else skipped++;
      } else if(type==="inventaire"){
        if(key){ state.once[key] = (val==="1"); settings++; } else skipped++;
      } else if(type==="routine"){
        var c = parseInt(val,10);
        if(dateRe.test(key) && !isNaN(c)){ state.hist[key] = Math.max(state.hist[key]||0, c); settings++; } else skipped++;
      } else if(type==="collection" || type==="ajout"){
        if(ORDER.indexOf(key)<0 || !val){ skipped++; return; }
        if(!allItems(key).some(function(x){ return x.n===val; })) state.custom[key].push(val);
        if(type==="collection"){
          if(!state.seen[key][val]){ state.seen[key][val] = true; added++; }
          if(dateRe.test(date) && !state.log.some(function(x){ return x.l===key && x.n===val; })) state.log.push({d:date, l:key, n:val});
        }
      } else if(type==="cible"){
        var cn = clean(r[4]), ck = key+"|"+val;
        if(ORDER.indexOf(key)>=0 && val){ state.cible[ck] = ""; if(cn) state.notes[ck] = cn; settings++; } else skipped++;
      } else if(type==="note"){
        var nn = clean(r[4]), nk = key+"|"+val;
        if(ORDER.indexOf(key)>=0 && val && nn){ state.notes[nk] = nn; settings++; } else skipped++;
      } else if(type==="alias"){
        var al = clean(r[4]);
        if(ORDER.indexOf(key)>=0 && val && al){ if(al!==val) state.alias[key][val] = al; settings++; } else skipped++;
      } else skipped++;
    });
    state.log.sort(function(a,b){ return a.d<b.d ? -1 : (a.d>b.d ? 1 : 0); });
    if(state.log.length>1000) state.log = state.log.slice(-1000);
    render(); queueSave();
    setIo("Import terminé : "+added+" coché"+(added>1?"s":"")+" ajouté"+(added>1?"s":"")+", "+settings+" réglage"+(settings>1?"s":"")+" repris"+(skipped?", "+skipped+" ligne"+(skipped>1?"s":"")+" ignorée"+(skipped>1?"s":""):"")+".");
  }
  function backupHtml(){
    return '<div class="backup"><div><h3>Sauvegarde CSV</h3><p class="sub">Exporte tout ton carnet dans un fichier, puis réimporte-le quand tu veux : après un nettoyage du navigateur, sur un autre appareil ou dans la version GitHub. L\'import s\'ajoute à ce que tu as déjà.</p></div>'+
      '<div class="row"><button type="button" class="btn" data-export>Exporter en CSV</button><button type="button" class="btn ghost" data-copy>Copier le CSV</button></div>'+
      '<div class="row"><label for="io-file" class="chk">Importer un CSV</label><input type="file" id="io-file" accept=".csv,text/csv,text/plain"></div>'+
      '<details><summary>Coller du texte CSV à la place</summary><textarea id="io-paste" aria-label="Texte CSV à importer" spellcheck="false"></textarea><button type="button" class="btn ghost" data-paste>Importer ce texte</button></details>'+
      '<p class="note" id="io-msg" aria-live="polite">'+esc(ioMsg)+'</p></div>';
  }

  /* ---------- Render ---------- */
  function render(){
    var y = window.scrollY;
    var dg = state.dg;
    var doneN = DAILY.filter(function(d){return state.daily.done[d.k];}).length;
    var next = PALIERS.filter(function(p){return p.l>dg;})[0];

    var h = '';
    h += '<div class="strip">'+
      '<div><span class="label">Niveau de bâtisseur</span><div class="row"><span class="big">'+dg+'</span>'+stepper("dg","dg","")+'</div></div>'+
      '<div><span class="label">Aujourd\'hui</span><span class="big">'+doneN+'<small> / '+DAILY.length+'</small></span></div>'+
      '<div><span class="label">Espèces cochées</span><span class="big"><span id="sum-d">0</span><small> / <span id="sum-t">0</span></small></span></div>'+
      '<div><span class="label">Prochain palier</span><span class="big">'+(next?('Niv. '+next.l):'Tous passés')+'</span></div>'+
    '</div>';

    h += '<div class="cols">';

    h += '<section id="sec-routine"><div><h2>Routine du jour</h2><p class="sub">Se remet à zéro chaque matin.</p></div><ul class="list">'+
      DAILY.map(dailyItem).join("")+'</ul>'+
      '<label class="label" for="codes" style="margin-top:14px;display:block">Codes disponibles</label><textarea id="codes" class="codes" placeholder="Colle ici les codes à utiliser…">'+esc(state.codes||"")+'</textarea></section>';

    h += '<section id="sec-passions"><div><h2>Passions</h2><p class="sub">Le chiffre jaune indique où dépenser tes tickets d\'amélioration en premier.</p></div><div>'+
      PASSIONS.map(function(p){
        return '<div class="passion"><span class="rank'+(p.r>=4?' later':'')+'" title="Priorité '+p.r+'">'+p.r+'</span>'+
          '<div><div class="pname">'+p.n+'</div><span class="hint">Mentor : '+p.m+'. '+esc(p.h)+'</span></div>'+
          stepper("lvl",p.k,state.levels[p.k])+'</div>';
      }).join("")+
      '<div class="passion"><span class="rank later">·</span><div><div class="pname">Chat et chien</div><span class="hint">Mme Joan, à partir du niveau 12</span></div>'+
        (dg>=12?'<span class="tag ok">Disponible</span>':'<span class="tag">Verrouillé</span>')+'</div>'+
    '</div></section>';

    h += '<section id="sec-paliers"><div><h2>Paliers de bâtisseur</h2><p class="sub">Change ton niveau en haut de page pour mettre cette liste à jour.</p></div><ul class="list">'+
      PALIERS.map(function(p){
        var reached = dg>=p.l;
        var tag = reached ? '<span class="tag ok">Atteint</span>' : '<span class="tag soon">Dans '+(p.l-dg)+' niv.</span>';
        var extra = (p.chk && reached) ? '<label for="c-once-'+p.chk+'" style="margin-top:6px;display:flex;gap:12px;cursor:pointer"><input type="checkbox" id="c-once-'+p.chk+'" data-chk="once:'+p.chk+'"'+(state.once[p.chk]?" checked":"")+'><span>'+esc(p.chkt)+'</span></label>' : '';
        return '<li style="flex-direction:column;gap:2px"><div class="row" style="justify-content:space-between;width:100%"><strong>Niveau '+p.l+' · '+esc(p.t)+'</strong>'+tag+'</div><span class="hint">'+esc(p.h)+'</span>'+extra+'</li>';
      }).join("")+'</ul></section>';

    h += '<section class="full" id="sec-cibles"><div><h2>À chasser</h2><p class="sub">Tout ce que tu n\'as pas encore attrapé (insectes, poissons, oiseaux), sans rien à étoiler. L\'étoile ☆ sert seulement à épingler quelques priorités en haut de la liste.</p></div><div id="targets"></div></section>';

    h += '<section class="full" id="sec-ou"><div><h2>Où aller maintenant ?</h2><p class="sub">Choisis l\'heure et la météo en jeu : les zones sont classées par nombre d\'insectes et d\'oiseaux que tu n\'as pas encore et qui peuvent s\'y trouver.</p></div><div id="where"></div></section>';

    h += '<section class="full" id="sec-collections"><div><h2>Collections</h2><p class="sub">Coche ce que tu as déjà. Ce qui manque à la liste, ajoute-le toi-même.</p></div><div id="coll"></div></section>';

    h += '<section class="full" id="sec-journal"><div><h2>Journal</h2><p class="sub">Ce que tu as coché, jour par jour, et ta régularité sur la routine.</p></div><div id="journal"></div>'+backupHtml()+'</section>';

    h += '</div>';
    app.innerHTML = h;
    renderColl();
    renderJournal();
    window.scrollTo(0, y);
  }

  function renderJournal(){
    var el = document.getElementById("journal"); if(!el) return;
    var log = state.log;
    var wk = new Date(); wk.setDate(wk.getDate()-6);
    var wkS = ymdOf(wk);
    var weekN = log.filter(function(x){ return x.d>=wkS; }).length;
    var keys = {};
    log.forEach(function(x){ keys[x.l+"|"+x.n] = 1; });
    var undated = 0;
    ORDER.forEach(function(k){ Object.keys(state.seen[k]).forEach(function(n){ if(!keys[k+"|"+n]) undated++; }); });

    var cells = "", full = 0;
    for(var i=13; i>=0; i--){
      var dd = new Date(); dd.setDate(dd.getDate()-i);
      var ds = ymdOf(dd);
      var n = ds===ymd() ? DAILY.filter(function(d){ return state.daily.done[d.k]; }).length : (state.hist[ds]||0);
      if(n>=DAILY.length) full++;
      cells += '<div class="hcol" title="'+esc(dayLabel(ds))+' : '+n+' / '+DAILY.length+'"><div class="hbar"><i style="height:'+pct(n,DAILY.length)+'%"></i></div><span>'+"DLMMJVS".charAt(dd.getDay())+'</span></div>';
    }

    var h = '<div><span class="label">Routine, 14 derniers jours</span><div class="hist" role="img" aria-label="Cases de routine cochées par jour sur 14 jours">'+cells+'</div>'+
            '<p class="note">Routine complète : '+full+' jour'+(full>1?'s':'')+' sur 14.</p></div>';

    h += '<div class="tabs" style="margin-top:18px"><button type="button" class="tab" data-jf="all" aria-pressed="'+(jf==="all")+'">Tout</button>'+
      ORDER.map(function(k){ return '<button type="button" class="tab" data-jf="'+k+'" aria-pressed="'+(jf===k)+'">'+LISTS[k].label+'</button>'; }).join("")+'</div>';

    h += '<p class="note" style="margin-top:10px"><strong>'+weekN+'</strong> coché'+(weekN>1?'s':'')+' ces 7 derniers jours · <strong>'+log.length+'</strong> au total dans le journal'+
         (undated?' · '+undated+' coché'+(undated>1?'s':'')+' avant le journal, sans date':'')+'</p>';

    var list = log.slice().reverse().filter(function(x){ return jf==="all" || x.l===jf; });
    var shown = list.slice(0, jmax), cur = null, gh = "";
    shown.forEach(function(x){
      if(x.d!==cur){
        if(cur!==null) gh += '</ul></div>';
        gh += '<div class="jday"><div class="label">'+esc(dayLabel(x.d))+'</div><ul class="list">';
        cur = x.d;
      }
      gh += '<li><span style="flex:1;min-width:0">'+esc(disp(x.l, x.n))+'</span><span class="tag">'+esc(LISTS[x.l] ? LISTS[x.l].label : x.l)+'</span></li>';
    });
    if(cur!==null) gh += '</ul></div>';
    if(!shown.length) gh = '<div class="empty">Rien de coché pour l\'instant. Chaque case cochée dans Collections apparaîtra ici avec sa date.</div>';
    h += gh;
    if(list.length>jmax) h += '<p style="margin-top:14px"><button type="button" class="btn ghost" data-jmore>Voir plus ('+(list.length-jmax)+' restants)</button></p>';
    el.innerHTML = h;
  }

  /* ---------- Détails : lieu, heure, météo, ingrédients ---------- */
  var HF = {Dawn:["aube","Aube"], Day:["jour","Journée"], Dusk:["crep","Crépuscule"], Night:["nuit","Nuit"]};
  var WF = {Sunny:["soleil","Ensoleillé"], Rainy:["pluie","Pluie"], Rainbow:["arc","Arc-en-ciel"]};
  var GFR = {"Forest":"Forêt","Suburbs, central area and homes":"Banlieue, centre et maisons","Fishing Village":"Village de pêcheurs","Flower Field and Amethyst Beach":"Champ de fleurs et plage d'Améthyste","Onsen Mountain":"Montagne des onsen","Waterside":"Bord de l'eau","Events and attractors":"Événements et attractifs","Location not yet known":"Lieu pas encore connu","Dreamlight Cinematics event":"Événement Dreamlight Cinematics","Modular Streets event":"Événement Modular Streets","Winter frost season":"Saison de givre (hiver)","River":"Rivière","Lake":"Lac","Sea":"Mer","Events":"Événements","Special collaboration":"Collaborations spéciales","Conditions not confirmed yet":"Conditions pas encore confirmées","More birds (location not yet known)":"Autres oiseaux (lieu pas encore connu)","Jams and sauces":"Confitures et sauces","Pies":"Tourtes","Grilled and bizarre":"Grillades et plats étranges","Drinks and cakes":"Boissons et gâteaux","Main dishes and desserts":"Plats et desserts (par niveau)"};
  function gfr(g){ return GFR[g] || g.replace(/^Level (\d+)$/,"Niveau $1"); }
  function unlockFr(s){
    var v = s.replace(/^unlocked by /,""), m;
    if(v==="default") return "Disponible dès le départ";
    if((m=/^purchase from (.+)/.exec(v))) return "Recette achetée chez "+m[1];
    if(/^burning/.test(v)) return "Se débloque en faisant brûler un "+(/drink/.test(v)?"breuvage":"plat");
    if(v==="Cooking hobby") return "Débloquée avec la passion Cuisine";
    if((m=/^(.+) quest$/.exec(v))) return "Débloquée par la quête « "+m[1]+" »";
    return "Se débloque après : "+v;
  }
  function parse(k, x){
    if(x.p) return x.p;
    var p = {lieu:"", h:[], w:[], extra:[], niv:"", ing:[], src:""}, parts = (x.m||"").split(" · ");
    if(k==="cuisine"){
      parts.forEach(function(s){
        if(/^Niv\. \d+$/.test(s)) p.niv = s;
        else if(/^unlocked by /.test(s)) p.src = unlockFr(s);
        else if(s) p.ing = s.split(", ");
      });
    } else if(SPECIES.indexOf(k)>=0){
      parts.forEach(function(s, i){
        var t = s.split(/, | and /);
        if(i===0) p.lieu = s;
        else if(t.every(function(v){ return HF[v]; })) p.h = t;
        else if(t.every(function(v){ return WF[v]; })) p.w = t;
        else p.extra.push(s);
      });
      if(/not yet known|not confirmed/i.test(p.lieu)) p.lieu = "";
    }
    x.p = p; return p;
  }
  function keys(a, M){ return a.map(function(v){ return M[v][0]; }).join(" "); }
  function names(a, M){ return a.map(function(v){ return M[v][1]; }).join(" · "); }
  function sel(id, val, lab, opts){
    return '<select id="'+id+'" aria-label="'+esc(lab)+'"><option value="">'+esc(lab)+'</option>'+
      opts.map(function(o){ return '<option value="'+esc(o[0])+'"'+(val===o[0]?' selected':'')+'>'+esc(o[1])+'</option>'; }).join("")+'</select>';
  }
  function tg(id, M, arr){
    return Object.keys(M).map(function(k){ return '<button type="button" class="tab" data-tg="'+id+':'+M[k][0]+'" aria-pressed="'+(arr.indexOf(M[k][0])>-1)+'">'+M[k][1]+'</button>'; }).join("");
  }
  function detail(k, x){
    var p = parse(k, x), c = [];
    if(x.c || !x.m) return "";
    if(k==="cuisine"){
      if(p.niv) c.push('<span class="ch lv">Cuisine '+p.niv.replace("Niv. ","niv. ")+'</span>');
      p.ing.forEach(function(s){ c.push('<span class="ch ing">'+esc(s)+'</span>'); });
      return (c.length ? '<span class="info">'+c.join("")+'</span>' : '')+(p.src ? '<span class="hint">🔓 '+esc(p.src)+'</span>' : '');
    }
    if(k==="cultures"){
      var q = (x.m||"").split(" · ");
      q.forEach(function(s){ if(/^Niv\. \d+$/.test(s)) c.push('<span class="ch lv">Jardinage '+s.replace("Niv. ","niv. ")+'</span>'); else if(s) c.push('<span class="ch">'+esc(s)+'</span>'); });
      return '<span class="info">'+c.join("")+'</span>';
    }
    var clock = p.extra.filter(function(s){ return /^\d\d:\d\d–\d\d:\d\d$/.test(s); });
    var ex = p.extra.filter(function(s){ return clock.indexOf(s)<0; });
    var lieu = [p.lieu].concat(ex).filter(Boolean).join(" · ");
    c.push('<span class="ch pl">📍 '+(lieu ? esc(lieu) : "Lieu inconnu")+'</span>');
    if(p.h.length) c.push('<span class="ch">🕐 '+names(p.h, HF)+'</span>');
    if(clock.length) c.push('<span class="ch" title="Heures du serveur">🕐 '+esc(clock.join(" · "))+'</span>');
    if(p.w.length) c.push('<span class="ch">🌦 '+names(p.w, WF)+'</span>');
    return '<span class="info">'+c.join("")+'</span>';
  }
  /* Somme des ingrédients des recettes manquantes à mon niveau de cuisine. */
  function shopping(items){
    var t = {}, n = 0;
    items.forEach(function(x){
      if(x.c || state.seen.cuisine[x.n] || (x.l && x.l > state.levels.cuisine)) return;
      var p = parse("cuisine", x); if(!p.ing.length) return; n++;
      p.ing.forEach(function(s){ var m = /^(\d+) (.+)$/.exec(s); t[m?m[2]:s] = (t[m?m[2]:s]||0) + (m?+m[1]:1); });
    });
    var ks = Object.keys(t).sort(); if(!ks.length) return "";
    return '<details class="shop"><summary>Ingrédients pour mes '+n+' recettes manquantes (à mon niveau)</summary><ul class="chips">'+
      ks.map(function(k){ return '<li class="ch ing">'+t[k]+' × '+esc(k)+'</li>'; }).join("")+'</ul></details>';
  }
  function refreshShop(){
    var s = document.getElementById("shop"); if(!s) return;
    var o = s.querySelector("details"), w = o && o.open;
    s.innerHTML = shopping(allItems("cuisine"));
    o = s.querySelector("details"); if(o && w) o.open = true;
  }



  /* ---------- À chasser : étoiles et notes ---------- */
  function hasOwn(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }
  function isTarget(l, n){ return Object.prototype.hasOwnProperty.call(state.cible, l+"|"+n); }
  function starBtn(l, n){
    var on = isTarget(l, n);
    return '<button type="button" class="x star" data-star="'+esc(l+"|"+n)+'" aria-pressed="'+on+'" aria-label="'+(on?'Retirer des priorités : ':'Épingler en priorité : ')+esc(disp(l,n))+'" title="Priorité">'+(on?"★":"☆")+'</button>';
  }
  function setTargetUI(key){
    var i = key.indexOf("|"), l = key.slice(0,i), n = key.slice(i+1), on = isTarget(l, n);
    Array.prototype.forEach.call(app.querySelectorAll("[data-star]"), function(b){
      if(b.getAttribute("data-star")!==key) return;
      b.outerHTML = starBtn(l, n);
    });
    Array.prototype.forEach.call(app.querySelectorAll("#groups li"), function(li){
      var b = li.querySelector("[data-star]");
      if(b && b.getAttribute("data-star")===key) li.setAttribute("data-t", on?"1":"0");
    });
  }
  /* « ok » = possible avec l'heure et la météo choisies, « maybe » = le guide ne le précise pas. */
  /* Heure du serveur (poissons) : quatre plages de 6 h. */
  var SERVER = [["dawn","🌅 Aube · 00–06 h",0],["morning","☀️ Matin · 06–12 h",6],["afternoon","🌤️ Après-midi · 12–18 h",12],["night","🌙 Soir et nuit · 18–24 h",18]];
  function clockOf(p){
    var m = p.extra.filter(function(s){ return /^\d\d:\d\d–\d\d:\d\d$/.test(s); })[0];
    return m || "";
  }
  /* Pas d'horaire noté = toute la journée. */
  function fishOk(p, key){
    var c = clockOf(p); if(!c) return true;
    var s = +c.slice(0,2), e = +c.slice(6,8), b = 0;
    SERVER.forEach(function(t){ if(t[0]===key) b = t[2]; });
    return s<e ? (b>=s && b<e) : (b>=s || b<e);
  }
  function tcond(k, x){
    if(k!=="insectes" && k!=="oiseaux" && k!=="poissons") return "ok";
    var p = parse(k, x), u = false;
    if(k==="poissons"){ if(wh && !fishOk(p, wh)) return "no"; }
    else if(wt){ if(!p.h.length) u = true; else if(p.h.indexOf(wt)<0) return "no"; }
    if(ww){ if(!p.w.length) u = true; else if(p.w.indexOf(ww)<0) return "no"; }
    return u ? "maybe" : "ok";
  }
  function renderTargets(){
    var el = document.getElementById("targets"); if(!el) return;
    var open = null, prev = el.querySelectorAll("details.zone");
    if(prev.length){ open = {}; Array.prototype.forEach.call(prev, function(d){ if(d.open) open[d.getAttribute("data-z")] = 1; }); }
    var qq = norm(tq.trim()), pins = [], groups = [], hiddenCond = 0, hiddenLvl = 0, left = 0;
    SPECIES.forEach(function(k){
      var rows = [], lv = LVKEY[k] ? (state.levels[LVKEY[k]] || 1) : 99;
      allItems(k).forEach(function(x){
        if(state.seen[k][x.n]) return;
        left++;
        if(qq && norm(disp(k, x.n)+" "+x.n).indexOf(qq)<0) return;
        if(tlvl && x.l && x.l > lv){ hiddenLvl++; return; }
        var c = tcond(k, x);
        if(tnow && c==="no"){ hiddenCond++; return; }
        var r = {k:k, x:x, c:c};
        if(isTarget(k, x.n)) pins.push(r); else rows.push(r);
      });
      if(rows.length) groups.push({k:k, rows:rows});
    });
    var row = function(r, withTag){
      var key = r.k+"|"+r.x.n;
      return '<li><div style="flex:1;min-width:0"><span class="pname">'+esc(disp(r.k, r.x.n))+'</span>'+(r.c==="maybe" ? ' <span class="tag soon">à vérifier</span>' : '')+(withTag ? ' <span class="tag">'+esc(LISTS[r.k].label)+'</span>' : '')+detail(r.k, r.x)+
        '<input type="text" class="rin" style="width:100%;margin-top:6px" data-note="'+esc(key)+'" value="'+esc(state.notes[key]||"")+'" maxlength="200" placeholder="Note (ex. vu près du phare, raté 3 fois)" aria-label="Note pour '+esc(disp(r.k, r.x.n))+'"></div>'+
        '<button type="button" class="btn ghost" data-got="'+esc(key)+'">Attrapé</button>'+starBtn(r.k, r.x.n)+'</li>';
    };
    var h = '<div class="tools"><input type="search" id="tq" placeholder="Chercher dans ce qui reste" value="'+esc(tq)+'" aria-label="Chercher dans ce qui reste">'+
      '<label class="chk" for="tlvl"><input type="checkbox" id="tlvl"'+(tlvl?' checked':'')+'>À mon niveau de passion</label>'+
      '<label class="chk" for="tnow"><input type="checkbox" id="tnow"'+(tnow?' checked':'')+'>Possibles avec l\'heure et la météo de « Où aller »</label></div>';
    var shown = pins.length; groups.forEach(function(g){ shown += g.rows.length; });
    h += '<p class="note"><strong>'+shown+'</strong> à chasser'+(left!==shown ? ' sur '+left+' non attrapés' : '')+'.'+
      (hiddenLvl ? ' '+hiddenLvl+' masqué'+(hiddenLvl>1?'s':'')+' car au-dessus de ton niveau de passion.' : '')+
      (hiddenCond ? ' '+hiddenCond+' masqué'+(hiddenCond>1?'s':'')+' par l\'heure ou la météo.' : '')+'</p>';
    if(!shown){
      h += '<div class="empty">'+(left ? 'Rien ne correspond à ces filtres.' : 'Tout est attrapé. Bravo !')+'</div>';
    }
    if(pins.length){
      h += '<details class="zone" data-z="__pins"'+(open ? (open.__pins?' open':'') : ' open')+'><summary><span class="t">★ Mes priorités</span><span class="gcount">'+pins.length+'</span></summary><ul class="list">'+pins.map(function(r){ return row(r, true); }).join("")+'</ul></details>';
    }
    groups.forEach(function(g, i){
      var isOpen = open ? !!open[g.k] : (!pins.length && i===0);
      h += '<details class="zone" data-z="'+g.k+'"'+(isOpen?' open':'')+'><summary><span class="t">'+esc(LISTS[g.k].label)+'</span><span class="gcount">'+g.rows.length+'</span></summary><ul class="list">'+g.rows.map(function(r){ return row(r, false); }).join("")+'</ul></details>';
    });
    el.innerHTML = h;
  }

  /* ---------- Où aller maintenant ? ---------- */
  var ZONES = [
    [/event/i, "Événements"], [/not yet known|not confirmed/i, "Lieu pas encore connu"],
    [/onsen/i, "Montagne des onsen"], [/flower|whale mountain|amethyst/i, "Champ de fleurs et plage d'Améthyste"],
    [/fishing|wharf|lighthouse|pier/i, "Village de pêcheurs"], [/sea|ocean|beach/i, "Mer et plages"],
    [/lake|river|waterside/i, "Bord de l'eau"], [/forest|deer|jump puzzle/i, "Forêt"],
    [/suburb|home|house|central|blanc/i, "Banlieue, centre et maisons"]
  ];
  function zoneOf(k, x, p){
    if(k==="insectes") return gfr(x.g);
    if(k==="poissons") return "Pêche · "+gfr(x.g);
    var l = (p.lieu||"").split(", ")[0];
    if(!l) return "Lieu pas encore connu";
    for(var i=0;i<ZONES.length;i++) if(ZONES[i][0].test(l)) return ZONES[i][1];
    return "Autre lieu";
  }
  var ZSKIP = /vénement|pas encore|ollaboration|attractifs|givre/;
  function whereData(){
    var zs = {}, order = [];
    ["insectes","oiseaux","poissons"].forEach(function(k){
      var lv = state.levels[k] || 99;
      allItems(k).forEach(function(x){
        if(x.c || state.seen[k][x.n] || (x.l && x.l > lv)) return;
        var p = parse(k, x), z = zoneOf(k, x, p);
        if(ZSKIP.test(z)) return;
        var unsure = false;
        if(k==="poissons"){ if(wh && !fishOk(p, wh)) return; }
        else if(wt){ if(!p.h.length) unsure = true; else if(p.h.indexOf(wt)<0) return; }
        if(ww){ if(!p.w.length) unsure = true; else if(p.w.indexOf(ww)<0) return; }
        if(!zs[z]){ zs[z] = {z:z, ok:[], maybe:[]}; order.push(zs[z]); }
        (unsure ? zs[z].maybe : zs[z].ok).push({k:k, x:x, p:p});
      });
    });
    return order.sort(function(a,b){ return (b.ok.length-a.ok.length) || (b.maybe.length-a.maybe.length) || a.z.localeCompare(b.z); });
  }
  function renderWhere(){
    var el = document.getElementById("where"); if(!el) return;
    var open = null, prev = el.querySelectorAll("details.zone");
    if(prev.length){ open = {}; Array.prototype.forEach.call(prev, function(d){ if(d.open) open[d.getAttribute("data-z")] = 1; }); }
    var data = whereData();
    var h = '<div class="tools"><span class="label">Heure</span>'+Object.keys(HF).map(function(k){ return '<button type="button" class="tab" data-wt="'+k+'" aria-pressed="'+(wt===k)+'">'+HF[k][1]+'</button>'; }).join("")+'</div>'+
            '<div class="tools"><span class="label">Heure du serveur (poissons)</span>'+SERVER.map(function(t){ return '<button type="button" class="tab" data-wh="'+t[0]+'" aria-pressed="'+(wh===t[0])+'">'+t[1]+'</button>'; }).join("")+'</div>'+
            '<div class="tools"><span class="label">Météo</span>'+Object.keys(WF).map(function(k){ return '<button type="button" class="tab" data-ww="'+k+'" aria-pressed="'+(ww===k)+'">'+WF[k][1]+'</button>'; }).join("")+'</div>';
    h += '<p class="note">Seuls les insectes, oiseaux et poissons pas encore cochés sont comptés (insectes et oiseaux à ton niveau de passion). « Heure » vaut pour les insectes et oiseaux, « Heure du serveur » pour les poissons : un poisson sans horaire noté est compté toute la journée. Les poissons d\'événements ne sont pas classés. Une entrée dont l\'heure ou la météo n\'est pas précisée par le guide passe dans « à vérifier ».</p>';
    if(!data.length) h += '<div class="empty">Rien à chasser avec ces conditions : tout est coché, ou aucune espèce connue ne correspond.</div>';
    data.forEach(function(d, i){
      var isOpen = open ? !!open[d.z] : i===0;
      [d.ok, d.maybe].forEach(function(a){ a.sort(function(p, q){ return (isTarget(q.k,q.x.n)?1:0) - (isTarget(p.k,p.x.n)?1:0); }); });
      var cnt = function(a, k){ return a.filter(function(r){ return r.k===k; }).length; };
      var all = d.ok.concat(d.maybe), ni = cnt(all,"insectes"), no = cnt(all,"oiseaux"), nf = cnt(all,"poissons");
      var sub = [ni ? ni+" insecte"+(ni>1?"s":"") : "", no ? no+" oiseau"+(no>1?"x":"") : "", nf ? nf+" poisson"+(nf>1?"s":"") : ""].filter(Boolean).join(" · ");
      h += '<details class="zone" data-z="'+esc(d.z)+'"'+(isOpen?' open':'')+'><summary><span class="t">'+esc(d.z)+'</span><span class="gcount">'+sub+(d.maybe.length ? ' (dont '+d.maybe.length+' à vérifier)' : '')+'</span></summary><ul class="list">';
      all.forEach(function(r, j){
        var maybe = j>=d.ok.length;
        var det = [r.p.lieu].concat(clockOf(r.p) ? [clockOf(r.p)] : [], r.p.h.length ? [names(r.p.h, HF)] : [], r.p.w.length ? [names(r.p.w, WF)] : []).filter(Boolean).join(" · ");
        h += '<li><span style="flex:1;min-width:0">'+esc(disp(r.k, r.x.n))+(det ? '<span class="hint">'+esc(det)+'</span>' : '')+'</span>'+
             starBtn(r.k, r.x.n)+(maybe ? '<span class="tag soon">à vérifier</span>' : '')+'<span class="tag">'+esc(LISTS[r.k].label)+'</span></li>';
      });
      h += '</ul></details>';
    });
    el.innerHTML = h;
  }

  function renderColl(){
    var el = document.getElementById("coll"); if(!el) return;
    var L = LISTS[tab], items = allItems(tab), groups = [], map = {};
    var hasL = !!LVKEY[tab] && items.some(function(x){ return x.l; });
    items.forEach(function(x){
      if(!map[x.g]){ map[x.g] = {g:x.g, it:[]}; groups.push(map[x.g]); }
      map[x.g].it.push(x);
    });
    var isSp = SPECIES.indexOf(tab)>=0, zones = {};
    items.forEach(function(x){ var l = parse(tab,x).lieu; if(l) zones[l.split(", ")[0]] = 1; });
    if(!zones[fl]) fl = "";
    if((so==="lieu" && !isSp) || (so==="niv" && tab!=="cuisine")) so = "";
    var zoneOpts = Object.keys(zones).sort().map(function(z){ return [z,z]; });
    var sortOpts = [["az","A → Z"],["za","Z → A"]].concat(isSp ? [["lieu","Par lieu"]] : tab==="cuisine" ? [["niv","Par niveau"]] : []);
    if(so){
      var cmp = function(a,b){ return disp(tab,a.n).localeCompare(disp(tab,b.n),"fr",{sensitivity:"base"}); };
      var by = function(f){
        var m = {}, o = [];
        items.slice().sort(cmp).forEach(function(x){ var g = f(x); if(!m[g]){ m[g] = {g:g, it:[]}; o.push(m[g]); } m[g].it.push(x); });
        return o;
      };
      if(so==="az") groups = [{g:"Tous, de A à Z", it:items.slice().sort(cmp)}];
      else if(so==="za") groups = [{g:"Tous, de Z à A", it:items.slice().sort(cmp).reverse()}];
      else if(so==="lieu") groups = by(function(x){ var l = parse(tab,x).lieu; return l ? l.split(", ")[0] : "Lieu inconnu"; }).sort(function(a,b){ return a.g==="Lieu inconnu" ? 1 : b.g==="Lieu inconnu" ? -1 : a.g.localeCompare(b.g); });
      else if(so==="niv") groups = by(function(x){ return x.l ? "Niveau "+x.l : "Sans niveau"; }).sort(function(a,b){ return (parseInt(a.g.slice(7),10)||0)-(parseInt(b.g.slice(7),10)||0); });
    }
    var h = '<div class="tabs" role="tablist" aria-label="Collections">'+
      ORDER.map(function(k){
        return '<button type="button" class="tab" role="tab" id="tab-'+k+'" data-tab="'+k+'" aria-selected="'+(k===tab)+'">'+LISTS[k].label+' <small data-tc="'+k+'"></small></button>';
      }).join("")+'</div>';
    h += '<div class="row" style="justify-content:space-between;width:100%"><span class="pname"><span data-pd></span> / <span data-pt></span> cochés</span></div>'+
         '<div class="bar" role="img" aria-label="Progression"><i data-bar style="width:0%"></i></div>';
    h += '<p class="note">'+esc(L.note)+(SPECIES.indexOf(tab)>=0?' Une heure ou une météo absente veut dire que le guide ne la précise pas : les filtres heure et météo gardent ces entrées.':'')+(L.src?' Sources : '+L.src.map(function(s){ return '<a href="'+s.u+'" target="_blank" rel="noopener">'+esc(s.t)+'</a>'; }).join(', ')+'.':'')+'</p>';
    if(items.length){
      h += '<div class="tools"><input type="search" id="q" placeholder="Chercher dans '+esc(L.label.toLowerCase())+'" value="'+esc(q)+'" aria-label="Chercher">'+
           '<label class="chk" for="miss"><input type="checkbox" id="miss"'+(onlyMissing?' checked':'')+'>Seulement ce qui me manque</label>'+'<label class="chk" for="tgt"><input type="checkbox" id="tgt"'+(onlyTarget?' checked':'')+'>Seulement mes priorités ★</label>'+
           (hasL?'<label class="chk" for="lvl"><input type="checkbox" id="lvl"'+(onlyLevel?' checked':'')+'>À mon niveau de passion ('+state.levels[LVKEY[tab]]+')</label>':'')+sel("so",so,"Ordre du guide",sortOpts)+(isSp ? sel("fl",fl,"Tous les lieux",zoneOpts) : '')+'</div><div class="tools">'+(isSp ? '<span class="label">Heure</span>'+tg("fh",HF,fh)+'<span class="label">Météo</span>'+tg("fw",WF,fw) : '')+'<button type="button" class="btn ghost" data-reset>Réinitialiser les filtres</button></div>'+(tab==="cuisine" ? '<div id="shop">'+shopping(items)+'</div>' : '');
    }
    h += '<div id="groups">';
    if(!items.length){
      h += '<div class="empty">Rien ici pour l\'instant. Ajoute ta première entrée ci-dessous.</div>';
    }
    groups.forEach(function(gr){
      h += '<details class="grp" open><summary><span class="t">'+esc(gfr(gr.g))+'</span><span class="gcount"></span></summary><ul class="list">';
      gr.it.forEach(function(x, i){
        var id = 's-'+tab+'-'+norm(gr.g).replace(/[^a-z0-9]+/g,'')+'-'+i;
        var dn = disp(tab, x.n), ed = editing && editing.l===tab && editing.n===x.n;
        var meta = dn!==x.n ? "Nom d'origine : "+x.n : "", det = detail(tab, x), pp = x.p;
        var box = '<input type="checkbox" id="'+id+'" data-seen="'+esc(x.n)+'"'+(state.seen[tab][x.n]?' checked':'')+'>';
        h += '<li data-l="'+(x.l||0)+'" data-s="'+esc(norm(dn+' '+x.n+' '+gr.g+' '+x.m))+'" data-h="'+keys(pp.h,HF)+'" data-w="'+keys(pp.w,WF)+'" data-p="'+esc(pp.lieu||"")+'" data-t="'+(isTarget(tab,x.n)?1:0)+'">';
        if(ed){
          h += box+'<form class="renf" data-ren="'+esc(x.n)+'"><input type="text" id="ren-in" class="rin" value="'+esc(dn)+'" maxlength="80" aria-label="Nom dans ton jeu" autocomplete="off">'+
               '<button class="btn" type="submit">OK</button><button class="btn ghost" type="button" data-rencancel>Annuler</button></form>';
        } else {
          h += '<label for="'+id+'">'+box+'<span>'+esc(dn)+(meta?'<span class="hint">'+esc(meta)+'</span>':'')+det+'</span></label>'+
               starBtn(tab, x.n)+'<button type="button" class="x" data-edit="'+esc(x.n)+'" aria-label="Renommer '+esc(dn)+'" title="Renommer">✎</button>'+
               (x.c?'<button type="button" class="x" data-del="'+esc(x.n)+'" aria-label="Retirer '+esc(dn)+'">×</button>':'');
        }
        h += '</li>';
      });
      h += '</ul></details>';
    });
    h += '</div>';
    h += '<form class="addf" id="add-form"><input type="text" id="add-name" placeholder="Ajouter à '+esc(L.label.toLowerCase())+'" aria-label="Nom à ajouter" maxlength="80" autocomplete="off"><button class="btn" type="submit">Ajouter</button></form>';
    el.innerHTML = h;
    applyFilter();
    refreshCounts();
  }

  function applyFilter(){
    var qq = norm(q).trim();
    var groups = app.querySelectorAll("details.grp");
    Array.prototype.forEach.call(groups, function(g){
      var any = false;
      Array.prototype.forEach.call(g.querySelectorAll("li"), function(li){
        var cb = li.querySelector("input[type=checkbox]");
        var hh = li.getAttribute("data-h")||"", ww = li.getAttribute("data-w")||"";
        var lp = li.getAttribute("data-p")||"";
        var m = (!fh.length||!hh||fh.some(function(k){ return hh.indexOf(k)>-1; })) && (!fw.length||!ww||fw.some(function(k){ return ww.indexOf(k)>-1; })) && (!fl||lp.indexOf(fl)>-1) && (!qq || li.getAttribute("data-s").indexOf(qq)>-1) && !(onlyMissing && cb && cb.checked) && !(onlyTarget && li.getAttribute("data-t")!=="1") &&
                !(onlyLevel && LVKEY[tab] && parseInt(li.getAttribute("data-l"),10) > (state.levels[LVKEY[tab]]||1));
        li.hidden = !m; if(m) any = true;
      });
      g.hidden = !any;
    });
  }

  function refreshCounts(){
    renderWhere();
    renderTargets();
    var sd = 0, st = 0;
    SPECIES.forEach(function(k){ var s = stats(k); sd += s.d; st += s.t; });
    var a = document.getElementById("sum-d"), b = document.getElementById("sum-t");
    if(a) a.textContent = sd; if(b) b.textContent = st;
    ORDER.forEach(function(k){
      var el = app.querySelector('[data-tc="'+k+'"]'); if(!el) return;
      var s = stats(k); el.textContent = s.d+"/"+s.t;
    });
    var cur = stats(tab);
    var pd = app.querySelector("[data-pd]"), pt = app.querySelector("[data-pt]"), br = app.querySelector("[data-bar]");
    if(pd) pd.textContent = cur.d; if(pt) pt.textContent = cur.t; if(br) br.style.width = pct(cur.d, cur.t)+"%";
    Array.prototype.forEach.call(app.querySelectorAll("details.grp"), function(g){
      var lis = g.querySelectorAll("li"), c = 0;
      Array.prototype.forEach.call(lis, function(li){ var cb = li.querySelector("input[type=checkbox]"); if(cb && cb.checked) c++; });
      var gc = g.querySelector(".gcount"); if(gc) gc.textContent = c+" / "+lis.length;
    });
  }

  /* ---------- Events ---------- */
  app.addEventListener("click", function(e){
    var b = e.target.closest("[data-act]");
    if(b){
      var d = parseInt(b.getAttribute("data-d"),10), k = b.getAttribute("data-k"), a = b.getAttribute("data-act");
      if(a==="dg") state.dg = Math.max(1, Math.min(99, state.dg+d));
      if(a==="lvl") state.levels[k] = Math.max(1, Math.min(99, (state.levels[k]||1)+d));
      render(); queueSave(); return;
    }
    if(e.target.closest("[data-export]")){ doExport(); return; }
    if(e.target.closest("[data-copy]")){ doCopy(); return; }
    if(e.target.closest("[data-paste]")){ var ta = document.getElementById("io-paste"); if(ta) doImport(ta.value); return; }
    var eb = e.target.closest("[data-edit]");
    if(eb){
      editing = {l:tab, n:eb.getAttribute("data-edit")};
      renderColl();
      var ri = document.getElementById("ren-in"); if(ri){ ri.focus(); ri.select(); }
      return;
    }
    if(e.target.closest("[data-rencancel]")){ editing = null; renderColl(); return; }
    var jb = e.target.closest("[data-jf]");
    if(jb){ jf = jb.getAttribute("data-jf"); jmax = 40; renderJournal(); return; }
    var jm = e.target.closest("[data-jmore]");
    if(jm){ jmax += 40; renderJournal(); return; }
    var sb = e.target.closest("[data-star]");
    if(sb){
      var sk = sb.getAttribute("data-star");
      if(Object.prototype.hasOwnProperty.call(state.cible, sk)) delete state.cible[sk]; else state.cible[sk] = "";
      setTargetUI(sk); applyFilter(); renderTargets(); queueSave(); return;
    }
    var gb = e.target.closest("[data-got]");
    if(gb){
      var gk = gb.getAttribute("data-got"), gi = gk.indexOf("|"), gl = gk.slice(0,gi), gn = gk.slice(gi+1);
      if(state.seen[gl] && !state.seen[gl][gn]){ state.seen[gl][gn] = true; logAdd(gl, gn); }
      renderColl(); renderJournal(); queueSave(); return;
    }
    var wb = e.target.closest("[data-wt],[data-ww],[data-wh]");
    if(wb){
      if(wb.hasAttribute("data-wt")){ var vt = wb.getAttribute("data-wt"); wt = wt===vt ? "" : vt; }
      else if(wb.hasAttribute("data-wh")){ var vh = wb.getAttribute("data-wh"); wh = wh===vh ? "" : vh; }
      else { var vw = wb.getAttribute("data-ww"); ww = ww===vw ? "" : vw; }
      renderWhere(); renderTargets(); return;
    }
    var tgb = e.target.closest("[data-tg]");
    if(tgb){
      var pr = tgb.getAttribute("data-tg").split(":"), arr = pr[0]==="fh" ? fh : fw, ix = arr.indexOf(pr[1]);
      if(ix<0) arr.push(pr[1]); else arr.splice(ix,1);
      tgb.setAttribute("aria-pressed", String(ix<0)); applyFilter(); return;
    }
    if(e.target.closest("[data-reset]")){ fh = []; fw = []; fl = ""; q = ""; onlyMissing = false; onlyLevel = false; onlyTarget = false; renderColl(); return; }
    var t = e.target.closest("[data-tab]");
    if(t){ tab = t.getAttribute("data-tab"); q = ""; editing = null; renderColl(); return; }
    var x = e.target.closest("[data-del]");
    if(x){
      var n = x.getAttribute("data-del");
      state.custom[tab] = state.custom[tab].filter(function(v){ return v!==n; });
      if(state.seen[tab][n]) logRemove(tab, n);
      delete state.seen[tab][n];
      renderColl(); renderJournal(); queueSave();
    }
  });
  app.addEventListener("change", function(e){
    var t = e.target;
    if(t.id==="fl"){ fl = t.value; applyFilter(); return; }
    if(t.id==="so"){ so = t.value; renderColl(); return; }
    if(t.id==="tgt"){ onlyTarget = t.checked; applyFilter(); return; }
    if(t.id==="tnow"){ tnow = t.checked; renderTargets(); return; }
    if(t.id==="tlvl"){ tlvl = t.checked; renderTargets(); return; }
    if(t.hasAttribute("data-note")){ queueSave(); return; }
    if(t.id==="miss"){ onlyMissing = t.checked; applyFilter(); return; }
    if(t.id==="lvl"){ onlyLevel = t.checked; applyFilter(); return; }
    if(t.id==="io-file"){
      var f = t.files && t.files[0]; if(!f) return;
      var rd = new FileReader();
      rd.onload = function(){ doImport(String(rd.result)); };
      rd.onerror = function(){ setIo("Lecture du fichier impossible."); };
      rd.readAsText(f, "utf-8");
      t.value = "";
      return;
    }
    var c = t.getAttribute("data-chk"), s = t.getAttribute("data-seen");
    if(c){
      var p = c.split(":");
      if(p[0]==="daily"){
        rollDaily(); state.daily.done[p[1]] = t.checked;
        var par = p[1].split("_")[0], d0 = DAILY.filter(function(d){ return d.k===par && d.n; })[0];
        if(d0){ var all = true; for(var i=1;i<=d0.n;i++) if(!state.daily.done[par+"_"+i]) all = false; state.daily.done[par] = all; }
        var dn = DAILY.filter(function(d){ return state.daily.done[d.k]; }).length;
        if(dn) state.hist[ymd()] = dn; else delete state.hist[ymd()];
      }
      else state.once[p[1]] = t.checked;
      render(); queueSave();
    } else if(s!==null){
      if(t.checked){ state.seen[tab][s] = true; logAdd(tab, s); }
      else { delete state.seen[tab][s]; logRemove(tab, s); }
      refreshCounts(); renderJournal(); refreshShop(); queueSave();
    }
  });
  app.addEventListener("input", function(e){
    if(e.target.id==="q"){ q = e.target.value; applyFilter(); }
    if(e.target.id==="tq"){ tq = e.target.value; var pos = e.target.selectionStart; renderTargets(); var nb = document.getElementById("tq"); if(nb){ nb.focus(); try{ nb.setSelectionRange(pos, pos); }catch(_){} } return; }
    if(e.target.id==="codes"){ state.codes = e.target.value; queueSave(); }
    if(e.target.hasAttribute("data-note")){ var nk2 = e.target.getAttribute("data-note"); if(e.target.value) state.notes[nk2] = e.target.value; else delete state.notes[nk2]; queueSave(); }
  });
  app.addEventListener("submit", function(e){
    var rf = e.target.getAttribute("data-ren");
    if(rf!==null){
      e.preventDefault();
      var nv = (document.getElementById("ren-in").value||"").trim();
      if(nv && nv!==rf) state.alias[tab][rf] = nv; else delete state.alias[tab][rf];
      editing = null; renderColl(); renderJournal(); queueSave();
      return;
    }
    if(e.target.id!=="add-form") return;
    e.preventDefault();
    var inp = document.getElementById("add-name");
    var n = (inp.value||"").trim();
    if(!n) return;
    function same(x){ return norm(x.n)===norm(n) || norm(disp(tab, x.n))===norm(n); }
    var hit = allItems(tab).filter(same)[0], exists = !!hit;
    if(!exists){ state.custom[tab].push(n); }
    var nm = exists ? hit.n : n;
    if(!state.seen[tab][nm]){ state.seen[tab][nm] = true; logAdd(tab, nm); }
    q = "";
    renderColl(); renderJournal(); queueSave();
    var again = document.getElementById("add-name"); if(again) again.focus();
  });

  app.addEventListener("keydown", function(e){
    if(e.key==="Escape" && editing){ editing = null; renderColl(); }
  });

  render();
  setStatus("Enregistré sur cet appareil.");

  /* Section navigation with scroll tracking. */
  var nav = document.getElementById("nav"), navLinks = nav.querySelectorAll("a[data-go]"), curNav = null, ticking = false;
  nav.addEventListener("click", function(e){
    var a = e.target.closest("a[data-go]"); if(!a) return;
    e.preventDefault();
    var target = document.getElementById(a.getAttribute("data-go"));
    var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(target) target.scrollIntoView({behavior: calm ? "auto" : "smooth", block:"start"});
  });
  function spy(){
    ticking = false;
    var cur = navLinks[0];
    Array.prototype.forEach.call(navLinks, function(a){
      var sec = document.getElementById(a.getAttribute("data-go"));
      if(sec && sec.getBoundingClientRect().top <= 110) cur = a;
    });
    if(window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = navLinks[navLinks.length-1];
    if(cur===curNav) return;
    curNav = cur;
    Array.prototype.forEach.call(navLinks, function(a){
      if(a===cur) a.setAttribute("aria-current","true"); else a.removeAttribute("aria-current");
    });
    nav.scrollLeft = cur.offsetLeft - (nav.clientWidth - cur.offsetWidth)/2;
  }
  window.addEventListener("scroll", function(){ if(!ticking){ ticking = true; requestAnimationFrame(spy); } }, {passive:true});
  spy();

  /* Account-backed storage lights up when available. */
  (async function(){
    try{
      if(!window.claude || !window.claude.use) return;
      var user = await window.claude.use("user");
      var db = await window.claude.use("db");
      if(!user || !db) return;
      var id = await user.id();
      if(!id) return;
      var ref = db.doc("data/users/"+id+"/progress");
      var snap = await ref.get();
      if(snap.exists){
        state = merge(fresh(), snap.data());
        ORDER.forEach(function(k){ if(!state.seen[k]) state.seen[k]={}; if(!Array.isArray(state.custom[k])) state.custom[k]=[]; });
        rollDaily();
        migrate();
        try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e){}
        render();
      }
      dbDoc = ref;
      setStatus(snap.exists ? "Enregistré sur ton compte." : "Prêt à enregistrer sur ton compte.");
    }catch(e){ /* stay on local storage */ }
  })();
})();
