/* Page Profits : à partir de ton inventaire, propose quoi cuisiner ou fabriquer pour gagner le plus.
   Les listes viennent de profits-data.js. Ce fichier lit (sans jamais l'écrire) ton niveau de cuisine
   et les recettes cochées dans le carnet principal. Ses propres réglages sont enregistrés sous
   la clé « carnet-heartopia-profits-v1 ». */
(function(){
  "use strict";
  var KEY = "carnet-heartopia-profits-v1", MAINKEY = "carnet-heartopia-v2";

  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function norm(s){ return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,""); }
  function fmt(n){ return Math.round(n).toLocaleString("fr-FR"); }
  function intOrNull(v){ v = String(v).trim(); if(v==="") return null; var n = Math.floor(Number(v)); return (isFinite(n) && n>=0) ? n : null; }

  /* ---------- État ---------- */
  function fresh(){
    return {mode:"cuisine", star:0, goal:"gain", byLevel:true, byLearned:false,
      inv:{cuisine:{}, meubles:{}}, price:{cuisine:{}, meubles:{}}, fprice:{}, custom:[], cing:[]};
  }
  var S = fresh();
  (function load(){
    try{
      var o = JSON.parse(localStorage.getItem(KEY) || "null");
      if(!o || typeof o!=="object") return;
      if(o.mode==="cuisine" || o.mode==="meubles") S.mode = o.mode;
      if(typeof o.star==="number" && o.star>=0 && o.star<PD.MULT.length) S.star = Math.floor(o.star);
      if(o.goal==="gain" || o.goal==="value") S.goal = o.goal;
      if(typeof o.byLevel==="boolean") S.byLevel = o.byLevel;
      if(typeof o.byLearned==="boolean") S.byLearned = o.byLearned;
      ["inv","price"].forEach(function(k){
        ["cuisine","meubles"].forEach(function(m){
          if(o[k] && o[k][m] && typeof o[k][m]==="object") S[k][m] = o[k][m];
        });
      });
      if(o.fprice && typeof o.fprice==="object") S.fprice = o.fprice;
      if(Array.isArray(o.cing)) S.cing = o.cing.filter(function(i){ return i && typeof i.id==="string" && typeof i.fr==="string"; });
      if(Array.isArray(o.custom)) S.custom = o.custom.filter(function(r){ return r && typeof r.id==="string" && typeof r.n==="string" && Array.isArray(r.need); });
    }catch(e){}
  })();

  var saveTimer = null, saveEl = document.getElementById("save-state");
  function queueSave(){
    if(saveEl) saveEl.textContent = "Enregistrement…";
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      try{ localStorage.setItem(KEY, JSON.stringify(S)); if(saveEl) saveEl.textContent = "Enregistré sur cet appareil."; }
      catch(e){ if(saveEl) saveEl.textContent = "Impossible d'enregistrer (stockage du navigateur indisponible)."; }
    }, 400);
  }

  /* Niveau de cuisine et recettes cochées, lus dans le carnet principal. */
  function mainInfo(){
    var out = {lvl:null, learned:{}, n:0};
    try{
      var m = JSON.parse(localStorage.getItem(MAINKEY) || "null");
      if(m && typeof m==="object"){
        if(m.levels && typeof m.levels.cuisine==="number") out.lvl = m.levels.cuisine;
        var s = m.seen && m.seen.cuisine;
        if(s && typeof s==="object") Object.keys(s).forEach(function(k){ if(s[k]){ out.learned[k] = 1; out.n++; } });
      }
    }catch(e){}
    return out;
  }

  /* ---------- Jeu de données du mode courant ---------- */
  function ingList(mode){ return mode==="meubles" ? PD.ING.meubles.concat(S.cing) : PD.ING.cuisine; }
  function recList(mode){ return mode==="meubles" ? PD.REC.meubles.concat(S.custom) : PD.REC.cuisine; }

  function ctx(){
    var mode = S.mode, list = ingList(mode), I = {}, G = {}, P = {};
    list.forEach(function(i){
      I[i.id] = i;
      (i.g||[]).forEach(function(g){ (G[g] = G[g] || []).push(i.id); });
    });
    var mult = mode==="cuisine" ? PD.MULT[S.star] : 1;
    var R = recList(mode).map(function(r){
      var t = (mode==="meubles") ? (S.fprice[r.id]!=null ? S.fprice[r.id] : r.t) : r.t;
      return {r:r, value:(t==null ? 0 : Math.round(t*mult)), hasPrice:(t!=null)};
    });
    var ov = S.price[mode];
    list.forEach(function(i){
      if(ov[i.id]!=null) P[i.id] = ov[i.id];
      else if(i.p!=null) P[i.id] = i.p;
      else P[i.id] = null;
    });
    /* Un plat déjà cuisiné vaut, par défaut, son prix de vente. */
    var seenOut = {};
    R.forEach(function(x){
      var o = x.r.out;
      if(o && !seenOut[o]){ seenOut[o] = 1; if(ov[o]==null) P[o] = x.value; }
    });
    return {mode:mode, I:I, G:G, P:P, R:R, inv:S.inv[mode], goal:S.goal, mult:mult};
  }

  /* ---------- Calcul ---------- */
  function groupIds(cx, key){
    var ids = [];
    key.slice(2).split("|").forEach(function(g){
      (cx.G[g]||[]).forEach(function(id){ if(ids.indexOf(id)<0) ids.push(id); });
    });
    return ids;
  }

  /* Essaie de fabriquer une pièce. Renvoie ce qui serait consommé, ou null. */
  function take(cx, x, stock){
    var used = {}, list = [], cost = 0, units = 0, need = x.r.need;
    for(var i=0; i<need.length; i++){
      var key = need[i][0], n = need[i][1];
      units += n;
      if(key.indexOf("g:")===0){
        var ids = groupIds(cx, key).filter(function(id){ return (stock[id]||0)-(used[id]||0) > 0; });
        ids.sort(function(a,b){
          var pa = cx.P[a]||0, pb = cx.P[b]||0;
          if(pa!==pb) return pa-pb;
          return ((stock[b]||0)-(used[b]||0)) - ((stock[a]||0)-(used[a]||0));
        });
        var left = n;
        for(var k=0; k<ids.length && left>0; k++){
          var av = (stock[ids[k]]||0)-(used[ids[k]]||0), q = Math.min(av, left);
          used[ids[k]] = (used[ids[k]]||0)+q; left -= q; list.push([ids[k], q]); cost += q*(cx.P[ids[k]]||0);
        }
        if(left>0) return null;
      } else {
        var have = (stock[key]||0)-(used[key]||0);
        if(have<n) return null;
        used[key] = (used[key]||0)+n; list.push([key, n]); cost += n*(cx.P[key]||0);
      }
    }
    return {list:list, cost:cost, units:units};
  }

  function greedy(cx, eligible, pick){
    var stock = {}, counts = {}, uses = {}, costBy = {}, total = 0, value = 0, cost = 0, guard = 0;
    Object.keys(cx.inv).forEach(function(k){ if(cx.inv[k]>0) stock[k] = cx.inv[k]; });
    while(guard++ < 4000){
      var cands = [];
      for(var i=0; i<eligible.length; i++){
        var x = eligible[i], t = take(cx, x, stock);
        if(!t) continue;
        var g = cx.goal==="gain" ? x.value - t.cost : x.value;
        if(g<=0) continue;
        cands.push({x:x, t:t, g:g});
      }
      if(!cands.length) break;
      var c = pick(cands), id = c.x.r.id;
      c.t.list.forEach(function(p){
        stock[p[0]] -= p[1];
        uses[id] = uses[id] || {}; uses[id][p[0]] = (uses[id][p[0]]||0) + p[1];
      });
      counts[id] = (counts[id]||0)+1;
      costBy[id] = (costBy[id]||0) + c.t.cost;
      total += c.g; value += c.x.value; cost += c.t.cost;
    }
    return {counts:counts, uses:uses, costBy:costBy, stock:stock, total:total, value:value, cost:cost};
  }

  function rng(seed){
    return function(){
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed>>>15, 1 | seed);
      t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t;
      return ((t ^ t>>>14) >>> 0) / 4294967296;
    };
  }

  /* Plusieurs stratégies gloutonnes, dont des variantes aléatoires (graine fixe : résultat stable).
     On garde celle qui rapporte le plus. C'est une très bonne suggestion, pas une preuve d'optimum. */
  function solve(cx, eligible){
    var best = greedy(cx, eligible, function(c){
      return c.reduce(function(a,b){ return (b.g>a.g || (b.g===a.g && b.t.units<a.t.units)) ? b : a; });
    });
    var alt = greedy(cx, eligible, function(c){
      return c.reduce(function(a,b){ return (b.g/b.t.units > a.g/a.t.units) ? b : a; });
    });
    if(alt.total > best.total) best = alt;
    var units = 0;
    Object.keys(cx.inv).forEach(function(k){ units += cx.inv[k]>0 ? cx.inv[k] : 0; });
    var runs = Math.max(0, Math.min(250, Math.floor(2500000 / Math.max(1, eligible.length * Math.max(1, units/2)))));
    var rand = rng(20260710);
    for(var r=0; r<runs; r++){
      var a = [0, 0.5, 1][Math.floor(rand()*3)];
      var res = greedy(cx, eligible, function(c){
        var s = c.map(function(e){ return {e:e, s:e.g/Math.pow(e.t.units, a)}; }).sort(function(p,q){ return q.s-p.s; });
        var u = rand();
        return s[u<0.6 || s.length<2 ? 0 : (u<0.85 || s.length<3 ? 1 : 2)].e;
      });
      if(res.total > best.total) best = res;
    }
    return best;
  }

  /* ---------- Libellés ---------- */
  function ingName(cx, id){ var i = cx.I[id]; return i ? i.fr : id; }
  var GNAME = {fruit:"fruit", veg:"légume", mush:"champignon", drink:"boisson"};
  function groupName(key){ return "un "+key.slice(2).split("|").map(function(g){ return GNAME[g]||g; }).join(" ou un "); }

  function missingText(cx, x){
    var parts = [], total = 0;
    x.r.need.forEach(function(rq){
      var key = rq[0], n = rq[1], have;
      if(key.indexOf("g:")===0){
        have = 0; groupIds(cx, key).forEach(function(id){ have += cx.inv[id]||0; });
        if(have<n){ parts.push((n-have)+" × "+groupName(key)); total += n-have; }
      } else {
        have = cx.inv[key]||0;
        if(have<n){ parts.push((n-have)+" × "+ingName(cx, key)); total += n-have; }
      }
    });
    return {text:parts.join(", "), n:total};
  }

  /* ---------- Affichage ---------- */
  var app = document.getElementById("app");
  var qEl = "";
  var computeTimer = null;

  function groupOpen(cat, cx){
    if(cat==="plats") return false;
    return true;
  }

  function invRow(cx, i){
    var q = cx.inv[i.id] || 0, ov = S.price[S.mode][i.id];
    var shown = ov!=null ? ov : (cx.P[i.id]!=null ? cx.P[i.id] : "");
    var sub = [];
    if(i.en && norm(i.en)!==norm(i.fr)) sub.push(esc(i.en));
    if(i.buy) sub.push("achat "+fmt(i.buy)+" G");
    var search = norm(i.fr+" "+(i.en||""));
    return '<li class="ing'+(q>0?' has':'')+'" data-id="'+esc(i.id)+'" data-s="'+esc(search)+'">'+
      '<div class="ing-n"><strong>'+esc(i.fr)+'</strong>'+(sub.length?'<span class="hint">'+sub.join(" · ")+'</span>':'')+'</div>'+
      '<input type="number" class="qty" min="0" inputmode="numeric" placeholder="0" value="'+(q>0?q:'')+'" aria-label="Quantité de '+esc(i.fr)+'">'+
      '<input type="number" class="pr" min="0" inputmode="numeric" placeholder="?" value="'+shown+'" aria-label="Prix de revente de '+esc(i.fr)+' en G">'+
    '</li>';
  }

  function invHtml(cx){
    var list = ingList(S.mode), h = "";
    PD.CATS[S.mode].forEach(function(c){
      var items = list.filter(function(i){ return i.cat===c.k; });
      if(!items.length) return;
      var n = items.filter(function(i){ return (cx.inv[i.id]||0)>0; }).length;
      h += '<details class="grp" data-cat="'+c.k+'"'+(groupOpen(c.k, cx)?' open':'')+'><summary><span class="t">'+esc(c.t)+'</span><span class="gcount">'+(n?n+' saisi'+(n>1?'s':''):'')+'</span></summary>'+
        '<ul class="list">'+items.map(function(i){ return invRow(cx, i); }).join("")+'</ul></details>';
    });
    return h;
  }

  function optionsHtml(info){
    var h = '<div class="tools popt">';
    if(S.mode==="cuisine"){
      h += '<label class="fld wide"><span>Qualité de tes plats</span><select id="o-star">'+
        PD.MULT.map(function(m,i){ return '<option value="'+i+'"'+(S.star===i?' selected':'')+'>'+(i+1)+(i?' étoiles':' étoile')+' (×'+String(m).replace(".",",")+')</option>'; }).join("")+'</select></label>';
    }
    h += '<label class="fld wide"><span>Objectif</span><select id="o-goal">'+
      '<option value="gain"'+(S.goal==="gain"?' selected':'')+'>Gain net (plat moins ingrédients revendus bruts)</option>'+
      '<option value="value"'+(S.goal==="value"?' selected':'')+'>Valeur de vente la plus haute</option></select></label>';
    h += '</div>';
    if(S.mode==="cuisine"){
      h += '<div class="popt2">'+
        '<label class="chk"><input type="checkbox" id="o-level"'+(S.byLevel?' checked':'')+(info.lvl==null?' disabled':'')+'> Seulement les recettes de mon niveau de cuisine'+(info.lvl!=null?' (niveau '+info.lvl+')':' (niveau inconnu : ouvre d\'abord le carnet)')+'</label>'+
        '<label class="chk"><input type="checkbox" id="o-learned"'+(S.byLearned?' checked':'')+(info.n===0?' disabled':'')+'> Seulement les recettes cochées dans Collections'+(info.n?' ('+info.n+')':' (aucune cochée)')+'</label>'+
      '</div>';
    }
    return h;
  }

  function furnitureHtml(cx){
    var rows = cx.R.map(function(x){
      var custom = S.custom.some(function(c){ return c.id===x.r.id; });
      var need = x.r.need.map(function(n){ return n[1]+" "+ingName(cx, n[0]); }).join(", ");
      var v = S.fprice[x.r.id]!=null ? S.fprice[x.r.id] : (x.r.t!=null ? x.r.t : "");
      return '<li class="frow" data-fid="'+esc(x.r.id)+'"><div class="ing-n"><strong>'+esc(x.r.n)+'</strong><span class="hint">'+esc(need)+'</span></div>'+
        '<input type="number" class="fp" min="0" inputmode="numeric" placeholder="Prix de vente" value="'+v+'" aria-label="Prix de vente de '+esc(x.r.n)+' en G">'+
        (custom?'<button type="button" class="x" data-fdel="'+esc(x.r.id)+'" aria-label="Supprimer '+esc(x.r.n)+'">×</button>':'<span style="width:32px"></span>')+'</li>';
    }).join("");
    return '<details class="grp" open><summary><span class="t">Mes meubles et leur prix de vente</span><span class="gcount">'+cx.R.length+'</span></summary>'+
      '<p class="note">Aucun guide ne publie de prix de revente fiable pour les meubles : saisis celui que tu vois en jeu, il est gardé. Sans prix, un meuble n\'est jamais proposé.</p>'+
      '<ul class="list">'+rows+'</ul>'+
      '<form class="addm" id="addm" autocomplete="off"><strong>Ajouter un meuble</strong>'+
        '<div class="addf"><input type="text" id="fm-n" placeholder="Nom du meuble" aria-label="Nom du meuble" required>'+
        '<input type="number" id="fm-p" min="0" inputmode="numeric" placeholder="Prix de vente (G)" aria-label="Prix de vente">'+
        '<input type="text" id="fm-m" placeholder="Matériaux : 5 Bois, 2 Pierre" aria-label="Matériaux" required>'+
        '<button type="submit" class="btn">Ajouter</button></div><p class="note" id="fm-msg" aria-live="polite"></p></form></details>';
  }

  function render(){
    var info = mainInfo(), cx = ctx();
    var intro = S.mode==="cuisine"
      ? 'Saisis ce que tu as dans ton sac. La page cherche la combinaison de plats qui rapporte le plus et te dit combien en cuisiner.'
      : 'Saisis tes matériaux et le prix de vente de tes meubles. La page cherche ce qu\'il vaut mieux fabriquer.';
    var h = '<div class="tabs" role="group" aria-label="Type de production">'+
      '<button type="button" class="tab" data-mode="cuisine" aria-pressed="'+(S.mode==="cuisine")+'">Cuisine</button>'+
      '<button type="button" class="tab" data-mode="meubles" aria-pressed="'+(S.mode==="meubles")+'">Meubles</button></div>';
    h += '<div class="pcols">';
    h += '<section id="sec-inv"><div><h2>Ton inventaire</h2><p class="sub">'+intro+'</p></div>'+optionsHtml(info)+
      (S.mode==="meubles" ? furnitureHtml(cx) : '')+
      '<div class="tools"><input type="search" id="inv-q" placeholder="Chercher un ingrédient…" aria-label="Chercher dans l\'inventaire" value="'+esc(qEl)+'"><button type="button" class="btn ghost" id="inv-reset">Tout remettre à zéro</button></div>'+
      '<div class="ing-head" aria-hidden="true"><span>Quantité</span><span>Revente</span></div>'+
      '<div id="inv">'+invHtml(cx)+'</div></section>';
    h += '<section id="sec-plan" class="pplan"><div><h2>Ce que je te conseille</h2></div><div id="plan" aria-live="polite"></div></section>';
    h += '</div>';
    app.innerHTML = h;
    filterInv();
    update();
  }

  function filterInv(){
    var q = norm(qEl).trim();
    Array.prototype.forEach.call(app.querySelectorAll("#inv li.ing"), function(li){
      li.hidden = q && li.getAttribute("data-s").indexOf(q)<0;
    });
    Array.prototype.forEach.call(app.querySelectorAll("#inv details.grp"), function(d){
      var vis = d.querySelectorAll("li.ing:not([hidden])").length;
      d.hidden = vis===0;
      if(q && vis) d.open = true;
    });
  }

  function chip(t, cls){ return '<span class="ch'+(cls?' '+cls:'')+'">'+esc(t)+'</span>'; }

  function update(){
    var el = document.getElementById("plan"); if(!el) return;
    var cx = ctx(), info = mainInfo();

    var anyInv = Object.keys(cx.inv).some(function(k){ return cx.inv[k]>0; });
    if(!anyInv){
      el.innerHTML = '<p class="empty">Entre des quantités dans ton inventaire pour obtenir un plan.</p>';
      return;
    }

    /* Recettes retenues */
    var eligible = [], hidden = [], noPrice = [];
    cx.R.forEach(function(x){
      if(!x.hasPrice){ noPrice.push(x); return; }
      if(S.mode==="cuisine"){
        var r = x.r, off = false;
        if(S.byLevel && info.lvl!=null && r.l>info.lvl) off = true;
        if(S.byLearned && info.n>0 && !info.learned[r.c]) off = true;
        if(off){ hidden.push(x); return; }
      }
      eligible.push(x);
    });

    var res = solve(cx, eligible);
    var ids = Object.keys(res.counts);
    var h = "";

    /* Pour comparer : tout revendre tel quel */
    var rawAll = 0;
    Object.keys(cx.inv).forEach(function(k){ if(cx.inv[k]>0 && cx.P[k]!=null) rawAll += cx.inv[k]*cx.P[k]; });

    var count = 0; ids.forEach(function(id){ count += res.counts[id]; });
    var gainNet = res.value - res.cost;

    h += '<div class="strip pstrip">'+
      '<div><span class="label">À '+(S.mode==="cuisine"?'cuisiner':'fabriquer')+'</span><span class="big">'+fmt(count)+'</span></div>'+
      '<div><span class="label">Valeur de vente</span><span class="big">'+fmt(res.value)+'<small> G</small></span></div>'+
      '<div><span class="label">Gain net</span><span class="big">'+(gainNet>=0?'+':'−')+fmt(Math.abs(gainNet))+'<small> G</small></span></div>'+
    '</div>';

    if(!ids.length){
      h += '<p class="empty">Rien de rentable avec cet inventaire.'+
        (S.goal==="gain" ? ' Si tes ingrédients se revendent mieux bruts que cuisinés, la page te conseille de les vendre.' : '')+'</p>';
    } else {
      ids.sort(function(a,b){
        var xa = cx.R.filter(function(x){ return x.r.id===a; })[0], xb = cx.R.filter(function(x){ return x.r.id===b; })[0];
        var ga = res.counts[a]*xa.value - res.costBy[a], gb = res.counts[b]*xb.value - res.costBy[b];
        return gb-ga;
      });
      h += '<ol class="plan">';
      ids.forEach(function(id){
        var x = cx.R.filter(function(y){ return y.r.id===id; })[0], r = x.r, n = res.counts[id];
        var line = n*x.value, cost = res.costBy[id], gain = line - cost;
        var ing = Object.keys(res.uses[id]).sort(function(a,b){ return res.uses[id][b]-res.uses[id][a]; })
          .map(function(k){ return res.uses[id][k]+" "+ingName(cx, k); }).join(", ");
        var chips = "";
        if(S.mode==="cuisine"){
          chips += chip("Niv. "+r.l, "lv");
          if(info.n>0 && !info.learned[r.c]) chips += chip(r.rt ? "Recette : "+r.rt : (r.rp ? "Recette à acheter : "+fmt(r.rp)+" G" : "Pas cochée"));
          if(r.v) chips += chip("ingrédients à vérifier", "ing");
        }
        h += '<li class="prow"><div class="ptop"><span class="pcount">× '+n+'</span><div class="pn"><strong>'+esc(r.n)+'</strong>'+(chips?'<span class="info">'+chips+'</span>':'')+'</div>'+
          '<div class="pv"><strong>'+fmt(line)+' G</strong><span class="hint">'+fmt(x.value)+' G pièce'+(cost>0?' · gain net '+fmt(gain)+' G':'')+'</span></div></div>'+
          '<span class="hint">Consomme : '+esc(ing)+'</span></li>';
      });
      h += '</ol>';

      /* Reste du sac */
      var left = Object.keys(res.stock).filter(function(k){ return res.stock[k]>0; });
      if(left.length){
        h += '<div><span class="label">Il te restera</span><ul class="chips">'+left.map(function(k){ return '<li>'+chip(res.stock[k]+" "+ingName(cx, k))+'</li>'; }).join("")+'</ul></div>';
      }
    }

    if(S.goal==="gain" && rawAll>0 && ids.length){
      h += '<p class="note">Pour comparer : tout revendre tel quel rapporterait environ '+fmt(rawAll)+' G (prix de revente connus). En suivant ce plan et en revendant le reste, environ '+fmt(rawAll+gainNet)+' G.</p>';
    }

    /* Prix inconnus utilisés */
    if(S.goal==="gain"){
      var unk = {};
      ids.forEach(function(id){ Object.keys(res.uses[id]).forEach(function(k){ if(cx.P[k]==null) unk[k] = 1; }); });
      var un = Object.keys(unk);
      if(un.length) h += '<p class="note">Prix de revente inconnu, compté 0 : '+un.map(function(k){ return esc(ingName(cx,k)); }).join(", ")+'. Renseigne-le dans l\'inventaire si tu peux aussi les vendre bruts, le plan sera plus juste.</p>';
    }

    /* Presque possible */
    if(eligible.length){
      var near = [];
      eligible.forEach(function(x){
        if(res.counts[x.r.id]) return;
        var m = missingText(cx, x);
        if(m.n>=1 && m.n<=2){
          near.push({x:x, m:m, v:x.value});
        }
      });
      near.sort(function(a,b){ return (a.m.n-b.m.n) || (b.v-a.v); });
      var seenC = {};
      near = near.filter(function(e){ var k = e.x.r.c || e.x.r.id; if(seenC[k]) return false; seenC[k] = 1; return true; });
      near.sort(function(a,b){ return b.v-a.v; });
      near = near.slice(0, 5);
      if(near.length){
        h += '<div><span class="label">Presque possible</span><ul class="list near">'+near.map(function(e){
          return '<li><div style="flex:1;min-width:0"><strong>'+esc(e.x.r.n)+'</strong><span class="hint">Il te manque : '+esc(e.m.text)+'</span></div><span class="tag soon">'+fmt(e.v)+' G</span></li>';
        }).join("")+'</ul></div>';
      }
    }

    /* Filtres et prix manquants */
    var possibleHidden = hidden.filter(function(x){ return take(cx, x, cx.inv); });
    if(possibleHidden.length){
      h += '<p class="note">Masquées par tes filtres mais réalisables avec ton sac : '+possibleHidden.slice(0,5).map(function(x){ return esc(x.r.n)+(S.mode==="cuisine"?' (niv. '+x.r.l+')':''); }).join(", ")+(possibleHidden.length>5?'…':'')+'.</p>';
    }
    var possibleNoPrice = noPrice.filter(function(x){ return take(cx, x, cx.inv); });
    if(possibleNoPrice.length){
      h += '<p class="note">Réalisable mais sans prix de vente saisi : '+possibleNoPrice.map(function(x){ return esc(x.r.n); }).join(", ")+'. Renseigne le prix dans « Mes meubles ».</p>';
    }

    if(S.mode==="cuisine") h += '<p class="note">Prix de vente 1 étoile tirés de heartopia.live et heartopia.life, multipliés selon la qualité choisie. Les montants changent avec les mises à jour du jeu : vérifie-les en jeu. Les variantes de tartes et de grillades par champignon valent le même prix, elles sont regroupées.</p>';
    el.innerHTML = h;
  }

  function queueUpdate(){ clearTimeout(computeTimer); computeTimer = setTimeout(update, 120); }

  /* ---------- Événements ---------- */
  app.addEventListener("input", function(e){
    var t = e.target, li = t.closest("li[data-id]");
    if(t.classList.contains("qty") && li){
      var id = li.getAttribute("data-id"), v = intOrNull(t.value);
      if(v) S.inv[S.mode][id] = v; else delete S.inv[S.mode][id];
      li.classList.toggle("has", !!v);
      var d = li.closest("details.grp");
      if(d){
        var n = d.querySelectorAll("li.ing.has").length, gc = d.querySelector(".gcount");
        if(gc) gc.textContent = n ? n+" saisi"+(n>1?"s":"") : "";
      }
      queueSave(); queueUpdate(); return;
    }
    if(t.classList.contains("pr") && li){
      var id2 = li.getAttribute("data-id"), v2 = intOrNull(t.value);
      if(v2==null) delete S.price[S.mode][id2]; else S.price[S.mode][id2] = v2;
      queueSave(); queueUpdate(); return;
    }
    if(t.classList.contains("fp")){
      var fr = t.closest("li[data-fid]"), fid = fr.getAttribute("data-fid"), v3 = intOrNull(t.value);
      if(v3==null) delete S.fprice[fid]; else S.fprice[fid] = v3;
      queueSave(); queueUpdate(); return;
    }
    if(t.id==="inv-q"){ qEl = t.value; filterInv(); }
  });

  app.addEventListener("change", function(e){
    var t = e.target;
    if(t.id==="o-star"){ S.star = parseInt(t.value,10)||0; queueSave(); render(); return; }
    if(t.id==="o-goal"){ S.goal = t.value==="value" ? "value" : "gain"; queueSave(); update(); return; }
    if(t.id==="o-level"){ S.byLevel = t.checked; queueSave(); update(); return; }
    if(t.id==="o-learned"){ S.byLearned = t.checked; queueSave(); update(); return; }
  });

  app.addEventListener("click", function(e){
    var m = e.target.closest("[data-mode]");
    if(m){ S.mode = m.getAttribute("data-mode")==="meubles" ? "meubles" : "cuisine"; qEl = ""; queueSave(); render(); return; }
    if(e.target.closest("#inv-reset")){
      if(Object.keys(S.inv[S.mode]).length && !window.confirm("Remettre toutes les quantités à zéro ?")) return;
      S.inv[S.mode] = {}; queueSave(); render(); return;
    }
    var del = e.target.closest("[data-fdel]");
    if(del){
      var id = del.getAttribute("data-fdel");
      S.custom = S.custom.filter(function(c){ return c.id!==id; });
      delete S.fprice[id]; queueSave(); render(); return;
    }
  });

  function slug(s){ return norm(s).replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"") || "x"; }

  /* Ajout d'un meuble : « 5 Bois, 2 Pierre » (ou « Bois x5 »). Les matériaux inconnus sont créés. */
  app.addEventListener("submit", function(e){
    if(e.target.id!=="addm") return;
    e.preventDefault();
    var msg = document.getElementById("fm-msg");
    var name = document.getElementById("fm-n").value.trim();
    var price = intOrNull(document.getElementById("fm-p").value);
    var mats = document.getElementById("fm-m").value;
    var need = [], bad = [];
    mats.split(/[,;\n]+/).forEach(function(part){
      part = part.trim(); if(!part) return;
      var a = /^(\d+)\s*[x×]?\s*(.+)$/i.exec(part), b = /^(.+?)\s*[x×]\s*(\d+)$/i.exec(part), q, label;
      if(a){ q = parseInt(a[1],10); label = a[2].trim(); }
      else if(b){ q = parseInt(b[2],10); label = b[1].trim(); }
      else { bad.push(part); return; }
      if(!q || !label){ bad.push(part); return; }
      var key = norm(label), found = null;
      ingList("meubles").forEach(function(i){ if(norm(i.fr)===key || norm(i.en||"")===key) found = i; });
      if(!found){
        found = {id:"c_"+slug(label), fr:label.charAt(0).toUpperCase()+label.slice(1), en:"", cat:"autres", p:null};
        if(!ingList("meubles").some(function(i){ return i.id===found.id; })) S.cing.push(found);
      }
      need.push([found.id, q]);
    });
    if(!name || !need.length || bad.length){
      msg.textContent = bad.length ? "Je ne comprends pas : « "+bad.join(" ; ")+" ». Écris par exemple : 5 Bois, 2 Pierre." : "Il faut un nom et au moins un matériau.";
      return;
    }
    var id = "u_"+slug(name)+"_"+Date.now().toString(36);
    S.custom.push({id:id, n:name, t:null, need:need});
    if(price!=null) S.fprice[id] = price;
    queueSave(); render();
  });

  render();
  if(saveEl) saveEl.textContent = "Enregistré sur cet appareil.";
})();
