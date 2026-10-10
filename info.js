/* Infos enrichies : lieux, heures, météo, recettes.
   Lit le détail de chaque entrée de data.js (« Forest · Dusk, Night · Rainy and Rainbow »)
   et le transforme en informations lisibles en français.
   Rien ici ne change les noms des entrées : les cases déjà cochées restent cochées. */
var INFO = (function(){
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];}); }
  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  var TIMES = [["dawn","Aube","🌅"],["day","Jour","🌤️"],["dusk","Crépuscule","🌇"],["night","Nuit","🌙"]];
  var WEATHER = [["sunny","Ensoleillé","☀️"],["rainy","Pluie","🌧️"],["rainbow","Arc-en-ciel","🌈"]];
  var NOTIME = "Heure non précisée", NOWEATHER = "Météo non précisée";
  function tl(k){ for(var i=0;i<TIMES.length;i++) if(TIMES[i][0]===k) return TIMES[i]; }
  function wl(k){ for(var i=0;i<WEATHER.length;i++) if(WEATHER[i][0]===k) return WEATHER[i]; }

  /* ---------- Lieux ---------- */
  var LOC = {
    "forest":"Forêt","forest island":"Île de la forêt","deer tower":"Tour du cerf",
    "spirit oak pine forest":"Forêt des pins et chênes spirituels","jump puzzle":"Parcours de saut",
    "rocks near houses":"Rochers près des maisons","suburbs":"Banlieue","central area":"Centre-ville","home":"Maison",
    "fishing village square":"Place du village de pêcheurs","fishing village":"Village de pêcheurs",
    "wharf":"Quai","lighthouse":"Phare","east pier":"Jetée est",
    "flower field":"Champ de fleurs","windmill flower field":"Champ de fleurs du moulin","whale mountain":"Montagne de la baleine",
    "amethyst beach":"Plage d'améthyste","ruins":"Ruines","onsen mountain":"Montagne des onsen",
    "crater lake":"Lac du cratère","stone cliff":"Falaise de pierre","onsen stone cliff":"Falaise de pierre des onsen",
    "lake shore forest":"Forêt au bord du lac","river bank":"Berge de la rivière","suburban lakeshore":"Rive du lac de banlieue",
    "waterside":"Bord de l'eau","inflatable insect attractor":"Attracteur d'insectes gonflable",
    "location not yet known":"Lieu pas encore connu","conditions not confirmed yet":"Conditions pas encore confirmées",
    "lake shore":"Rive du lac","lake":"Lac","river":"Rivière","shallow river":"Rivière peu profonde","tranquil river":"Rivière tranquille",
    "giantwood river":"Rivière du bois géant","rosy river":"Rivière rosée","onsen mountain lake":"Lac de la montagne des onsen",
    "suburban lake":"Lac de banlieue","forest lake":"Lac de la forêt","forest lake shore":"Rive du lac de la forêt","meadow lake":"Lac de la prairie",
    "zephyr sea":"Mer Zéphyr","east sea":"Mer de l'Est","ocean":"Océan","whale sea":"Mer des baleines","old sea":"Vieille mer",
    "old ocean seaside":"Bord de mer, vieil océan","seaside":"Bord de mer","seaside and beaches":"Bord de mer et plages",
    "purple light beach":"Plage de lumière violette","east side seaside":"Bord de mer, côté est",
    "around the lighthouse":"Autour du phare","below forest island":"Sous l'île de la forêt","on blanc's head":"Sur la tête de Blanc"
  };
  var LOCKEYS = Object.keys(LOC).sort(function(a,b){ return b.length-a.length; });
  function trOne(s){
    s = s.trim();
    var k = s.toLowerCase();
    if(LOC[k]) return LOC[k];
    var m = /^(.+) event$/i.exec(s);
    if(m) return "Événement « "+m[1]+" »";
    var out = k;
    LOCKEYS.forEach(function(w){ out = out.split(w).join(LOC[w]); });
    return cap(out);
  }
  function trLoc(en){
    return en.split(/,\s*/).map(function(part){
      return part.split(/ in (?:the )?/i).map(trOne).join(" — ");
    }).join(", ");
  }
  /* Grande zone d'une espèce, pour « organiser par lieu » (oiseaux). */
  var REGIONS = [
    [/event/, "Événements"], [/not yet known/, "Lieu pas encore connu"],
    [/onsen/, "Montagne des onsen"], [/flower|whale mountain|amethyst/, "Champ de fleurs et plage d'améthyste"],
    [/fishing|wharf|lighthouse|pier/, "Village de pêcheurs"], [/sea|ocean|beach/, "Mer et plages"],
    [/lake|river|waterside/, "Bord de l'eau"], [/forest|deer|jump puzzle/, "Forêt"],
    [/suburb|home|central|blanc/, "Banlieue, centre-ville et maisons"]
  ];
  function regionOf(en){
    var s = en.toLowerCase();
    for(var i=0;i<REGIONS.length;i++) if(REGIONS[i][0].test(s)) return REGIONS[i][1];
    return "Autre lieu";
  }

  /* ---------- Titres de groupes ---------- */
  var GRP = {
    "Forest":"Forêt","Suburbs, central area and homes":"Banlieue, centre-ville et maisons","Fishing Village":"Village de pêcheurs",
    "Flower Field and Amethyst Beach":"Champ de fleurs et plage d'améthyste","Onsen Mountain":"Montagne des onsen","Waterside":"Bord de l'eau",
    "Events and attractors":"Événements et attracteurs","Location not yet known":"Lieu pas encore connu",
    "Dreamlight Cinematics event":"Événement Dreamlight Cinematics","Modular Streets event":"Événement Modular Streets","Winter frost season":"Saison de givre (hiver)",
    "River":"Rivière","Lake":"Lac","Sea":"Mer","Events":"Événements","Special collaboration":"Collaborations spéciales","Conditions not confirmed yet":"Conditions pas encore confirmées",
    "More birds (location not yet known)":"Autres oiseaux (lieu pas encore connu)",
    "Jams and sauces":"Confitures et sauces","Pies":"Tourtes","Grilled and bizarre":"Grillades et plats bizarres","Drinks and cakes":"Boissons et gâteaux","Main dishes and desserts":"Plats et desserts"
  };
  function trGroup(g){
    if(GRP[g]) return GRP[g];
    var m = /^Level (\d+)$/.exec(g); if(m) return "Niveau "+m[1];
    return g;
  }

  /* ---------- Espèces : lieu, heure, météo ---------- */
  function parseSpecies(x){
    if(x._p) return x._p;
    var parts = x.m ? x.m.split(" · ") : [];
    var locEn = parts[0] || "";
    var o = {locEn:locEn, loc:locEn?trLoc(locEn):"", times:[], weather:[], extra:[]};
    parts.slice(1).forEach(function(p){
      var used = false;
      TIMES.forEach(function(t){ if(new RegExp("\\b"+cap(t[0])+"\\b").test(p)){ if(o.times.indexOf(t[0])<0) o.times.push(t[0]); used = true; } });
      WEATHER.forEach(function(w){ if(new RegExp("\\b"+cap(w[0])+"\\b").test(p)){ if(o.weather.indexOf(w[0])<0) o.weather.push(w[0]); used = true; } });
      if(!used) o.extra.push(trOne(p));
    });
    o.times = TIMES.map(function(t){return t[0];}).filter(function(k){ return o.times.indexOf(k)>-1; });
    o.weather = WEATHER.map(function(w){return w[0];}).filter(function(k){ return o.weather.indexOf(k)>-1; });
    x._p = o; return o;
  }
  function chip(cls, icon, text, title){
    return '<span class="chip '+cls+'"'+(title?' title="'+esc(title)+'"':'')+'>'+(icon?icon+' ':'')+esc(text)+'</span>';
  }
  function row(label, chips){ return '<span class="det"><span class="dl">'+label+'</span>'+chips+'</span>'; }

  function speciesView(tab, x){
    var p = parseSpecies(x), h = "", txt = [p.loc, p.locEn];
    var unknownLoc = !p.locEn || /not yet known|not confirmed/i.test(p.locEn);
    h += row("Où", (p.loc ? chip(unknownLoc?"muted":"loc","📍",p.loc,p.locEn) : chip("muted","📍","Lieu non précisé")) +
      p.extra.map(function(e){ return chip("loc","🎫",e); }).join(""));
    if(tab==="insectes"){
      h += row("Quand", p.times.length ? p.times.map(function(k){ var t=tl(k); txt.push(t[1]); return chip("time",t[2],t[1]); }).join("") : chip("muted","🕐",NOTIME));
    }
    if(tab==="insectes" || tab==="oiseaux"){
      h += row("Météo", p.weather.length ? p.weather.map(function(k){ var w=wl(k); txt.push(w[1]); return chip("wx",w[2],w[1]); }).join("") : chip("muted","🌥️",NOWEATHER));
    }
    return {html:'<span class="info">'+h+'</span>', t:p.times.join(" "), w:p.weather.join(" "), can:true, txt:txt.concat(p.extra).join(" ")};
  }

  /* ---------- Recettes ---------- */
  var ING = {
    "fruit":"fruit","vegetable":"légume","mushroom":"champignon","wheat":"blé","egg":"œuf","milk":"lait","sugar":"sucre",
    "red sugar":"sucre rouge","orange sugar":"sucre orange","yellow sugar":"sucre jaune","violet sugar":"sucre violet",
    "green sugar":"sucre vert","blue sugar":"sucre bleu","indigo sugar":"sucre indigo","cheese":"fromage","fish":"poisson",
    "shellfish":"crustacé ou coquillage|crustacés ou coquillages","potato":"pomme de terre|pommes de terre","tomato":"tomate","lettuce":"laitue|laitues",
    "black truffle":"truffe noire","meat":"viande","carrot":"carotte","apple":"pomme","corn":"maïs","butter":"beurre",
    "coffee bean":"grain de café|grains de café","coffee beans":"grain de café|grains de café","eggplant":"aubergine","cooking oil":"huile de cuisson","tomato sauce":"sauce tomate",
    "raspberry":"framboise","blueberry":"myrtille","strawberry":"fraise","mandarin":"mandarine","grape":"raisin","pineapple":"ananas|ananas","cocoa":"cacao|cacao",
    "oyster mushroom":"pleurote","shiitake mushroom":"shiitake|shiitakés","button mushroom":"champignon de Paris|champignons de Paris","penny bun mushroom":"cèpe",
    "drink":"boisson","fruit or vegetable":"fruit ou légume|fruits ou légumes"
  };
  function singular(w){
    if(ING[w]) return w;
    var c = [w.replace(/ies$/,"y"), w.replace(/oes$/,"o"), w.replace(/es$/,""), w.replace(/s$/,"")];
    for(var i=0;i<c.length;i++) if(ING[c[i]]) return c[i];
    return null;
  }
  function frIng(en, n){
    var any = /^any /i.test(en), base = en.replace(/^any /i,"").trim().toLowerCase();
    var parts = base.split(" or ").map(function(b){
      var k = singular(b), e = k ? ING[k] : null;
      if(!e) return cap(b);
      var ab = e.split("|"); return (n>1 && ab[1]) ? ab[1] : ab[0];
    });
    var s = parts.join(" ou ");
    return any ? s+" au choix" : s;
  }
  function parseRecipe(x){
    if(x._r) return x._r;
    var r = {lvl:0, ing:[], unlock:""};
    (x.m ? x.m.split(" · ") : []).forEach(function(p){
      var m = /^Niv\. (\d+)$/.exec(p);
      if(m) r.lvl = +m[1];
      else if(/^unlocked by /i.test(p)) r.unlock = p.replace(/^unlocked by /i,"");
      else r.ing = p.split(/,\s*/);
    });
    x._r = r; return r;
  }
  function unlockInfo(r, c){
    var u = r.unlock, lo = u.toLowerCase(), m;
    if(!u){
      if(r.lvl) return {cat:"Au niveau de passion Cuisine", txt:"Se débloque au niveau "+r.lvl+" de la passion Cuisine (mentor : Massimo)"};
      return {cat:"Non précisé", txt:"Façon de la débloquer non précisée dans mes sources"};
    }
    if(lo==="default") return {cat:"Dès le départ", txt:"Disponible dès le départ"};
    if(lo==="cooking hobby") return {cat:"Au lancement de la passion Cuisine", txt:"Débloquée avec la passion Cuisine"};
    if(c.recipes[lo]) return {cat:"Après une autre recette", txt:"Se débloque en cuisinant d'abord", pre:c.recipes[lo]};
    if((m = /^(.+) quest$/i.exec(u))) return {cat:"Quête, personnage ou achat", txt:"Via la quête « "+m[1]+" »"};
    if((m = /^purchase from (.+)$/i.exec(u))) return {cat:"Quête, personnage ou achat", txt:"À acheter chez "+m[1]};
    if((m = /^burning any (food|drink)$/i.exec(u))) return {cat:"En brûlant un plat", txt:"En brûlant "+(m[1].toLowerCase()==="food"?"un plat":"une boisson")};
    return {cat:"Quête, personnage ou achat", txt:"Débloquée via "+u};
  }
  function recipeView(x, c){
    var r = parseRecipe(x), u = unlockInfo(r, c), h = "", txt = [];
    var ing = r.ing.map(function(tok){
      var m = /^(\d+)\s+(.+)$/.exec(tok.trim()), n = m ? +m[1] : 0, name = m ? m[2] : tok.trim();
      var rec = c.recipes[name.toLowerCase()];
      if(rec){
        var ok = c.done(rec);
        txt.push(rec);
        return chip("rec"+(ok?" ok":""),"🍽",(n?n+" × ":"")+c.disp(rec)+(ok?" ✓":""),"Une autre recette à avoir préparée");
      }
      var fr = frIng(name, n || (/s$/i.test(name)?2:1));
      txt.push(fr, name);
      return chip("ing","",(n?n+" × ":"")+fr, name);
    });
    h += row("Il te faut", ing.length ? ing.join("") : chip("muted","","Ingrédients non listés dans mes sources"));
    var rc = "";
    if(r.lvl) rc += chip("lvl","🎓","Passion Cuisine niv. "+r.lvl);
    if(u.pre){
      var done = c.done(u.pre);
      rc += chip(done?"ok":"todo","📖",u.txt+" : "+c.disp(u.pre)+(done?" ✓":""));
      txt.push(u.pre);
    } else rc += chip("loc","📖",u.txt);
    var can = (!r.lvl || r.lvl<=c.lvl) && (!u.pre || c.done(u.pre));
    if(can && !c.done(x.n)) rc += chip("ok","✅","Prête à débloquer");
    h += row("Où la trouver", rc);
    txt.push(u.txt);
    return {html:'<span class="info">'+h+'</span>', t:"", w:"", can:can, txt:txt.join(" ")};
  }

  /* ---------- Façons d'organiser une collection ---------- */
  var MODES = {
    insectes:[{k:"def",l:"Par région"},{k:"time",l:"Par heure"},{k:"weather",l:"Par météo"}],
    poissons:[{k:"def",l:"Par type d'eau"},{k:"spot",l:"Par lieu de pêche"}],
    oiseaux:[{k:"def",l:"Par niveau de passion"},{k:"loc",l:"Par lieu"},{k:"weather",l:"Par météo"}],
    cuisine:[{k:"def",l:"Par type de plat"},{k:"lvl",l:"Par niveau requis"},{k:"unlock",l:"Par façon de la débloquer"}],
    cultures:[{k:"def",l:"Liste simple"}]
  };
  function modes(tab){ return MODES[tab] || MODES.cultures; }

  var TIMELBL = TIMES.map(function(t){ return t[2]+" "+t[1]; }).concat(["🕐 "+NOTIME]);
  var WXLBL = WEATHER.map(function(w){ return w[2]+" "+w[1]; }).concat(["🌥️ "+NOWEATHER]);

  function groupsFor(tab, x, mode, c){
    if(x.c) return ["Ajoutés par toi"];
    if(mode==="def") return [trGroup(x.g)];
    if(tab==="cuisine"){
      var r = parseRecipe(x);
      if(mode==="lvl") return [r.lvl ? "Niveau "+r.lvl : "Sans niveau indiqué"];
      if(mode==="unlock") return [unlockInfo(r, c).cat];
      return [trGroup(x.g)];
    }
    var p = parseSpecies(x);
    if(mode==="time") return p.times.length ? p.times.map(function(k){ var t=tl(k); return t[2]+" "+t[1]; }) : ["🕐 "+NOTIME];
    if(mode==="weather") return p.weather.length ? p.weather.map(function(k){ var w=wl(k); return w[2]+" "+w[1]; }) : ["🌥️ "+NOWEATHER];
    if(mode==="spot") return [p.loc ? p.loc.split(", ")[0] : "Lieu non précisé"];
    if(mode==="loc") return [regionOf(p.locEn)];
    return [trGroup(x.g)];
  }
  function orderGroups(tab, mode, groups){
    var fixed = null;
    if(mode==="time") fixed = TIMELBL; else if(mode==="weather") fixed = WXLBL;
    function rank(g){
      if(g==="Ajoutés par toi") return 9999;
      if(fixed){ var i = fixed.indexOf(g); return i<0 ? 500 : i; }
      if(tab==="cuisine" && mode==="lvl"){ var m=/(\d+)/.exec(g); return m ? +m[1] : 900; }
      return -1; /* garde l'ordre d'apparition */
    }
    return groups.map(function(g,i){ return {g:g, i:i, r:rank(g.g)}; })
      .sort(function(a,b){ if(a.r<0 && b.r<0) return a.i-b.i; return (a.r<0?a.i:a.r)-(b.r<0?b.i:b.r) || a.i-b.i; })
      .map(function(o){ return o.g; });
  }
  function view(tab, x, c){
    if(x.c) return {html:"", t:"", w:"", can:true, txt:""};
    if(tab==="cuisine") return recipeView(x, c);
    if(tab==="insectes" || tab==="poissons" || tab==="oiseaux") return speciesView(tab, x);
    return {html:"", t:"", w:"", can:true, txt:""};
  }

  return {TIMES:TIMES, WEATHER:WEATHER, modes:modes, groupsFor:groupsFor, orderGroups:orderGroups, view:view, trGroup:trGroup, trLoc:trLoc, regionOf:regionOf};
})();
