/* Page « Ce qui rapporte le plus » : tableau triable et filtrable. Données dans rapporte-data.js. */
(function(){
  "use strict";
  var CATS = [["tout","Tout"],["poissons","Poissons"],["recettes","Recettes"],["cultures","Cultures"],["insectes","Insectes"],["oiseaux","Oiseaux"]];
  var S = {cat:"tout", star:1, sort:"p", dir:-1, q:"", hideEv:false, onlyPrice:true};
  try{ var o = JSON.parse(localStorage.getItem("carnet-heartopia-rapporte")||"{}"); ["cat","star","hideEv","onlyPrice"].forEach(function(k){ if(o[k]!=null) S[k]=o[k]; }); }catch(e){}
  function save(){ try{ localStorage.setItem("carnet-heartopia-rapporte", JSON.stringify({cat:S.cat,star:S.star,hideEv:S.hideEv,onlyPrice:S.onlyPrice})); }catch(e){} }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]; }); }
  function fmt(n){ return n==null ? "" : n.toLocaleString("fr-FR"); }
  var CATNAME = {poissons:"Poisson",recettes:"Recette",cultures:"Culture",insectes:"Insecte",oiseaux:"Oiseau"};

  function price(r){ return r.p ? r.p[S.star-1] : null; }
  function gph(r){ var p = price(r); return (r.h && p!=null) ? p / r.h : null; }

  function rows(){
    var q = S.q.trim().toLowerCase();
    return RP.rows.filter(function(r){
      if(S.cat!=="tout" && r.c!==S.cat) return false;
      if(S.hideEv && (r.ev || /event|collab|Call of Whales|Frostspore|Brick|Director/i.test((r.n||"")+" "+(r.w||"")) && r.c==="poissons")) return false;
      if(S.onlyPrice && price(r)==null) return false;
      if(q && (r.n+" "+(r.w||"")).toLowerCase().indexOf(q)<0) return false;
      return true;
    });
  }
  function val(r,k){
    if(k==="p") return price(r);
    if(k==="gph") return gph(r);
    if(k==="lv") return r.lv==null ? null : r.lv;
    return (r[k]||"").toString().toLowerCase();
  }
  function sorted(list){
    var k = S.sort, d = S.dir;
    return list.slice().sort(function(a,b){
      var x = val(a,k), y = val(b,k);
      if(x==null && y==null) return a.n.localeCompare(b.n);
      if(x==null) return 1; if(y==null) return -1;
      if(x<y) return -d; if(x>y) return d;
      return a.n.localeCompare(b.n);
    });
  }
  function th(k,label,cls){
    var on = S.sort===k, arrow = on ? (S.dir<0?" ↓":" ↑") : "";
    return '<th class="'+(cls||"")+'" aria-sort="'+(on?(S.dir<0?"descending":"ascending"):"none")+'"><button type="button" data-sort="'+k+'">'+label+arrow+'</button></th>';
  }
  function whenCell(r){
    var a = [];
    if(r.t) a.push(r.t); if(r.m) a.push(r.m);
    return a.join(" · ");
  }
  function render(){
    var all = sorted(rows()), missing = RP.rows.filter(function(r){ return (S.cat==="tout"||r.c===S.cat) && price(r)==null; }).length;
    var h = '<section class="full"><div class="rp-tools">';
    h += '<div class="rp-chips" role="group" aria-label="Catégorie">'+CATS.map(function(c){ return '<button type="button" class="rp-chip" data-cat="'+c[0]+'" aria-pressed="'+(S.cat===c[0])+'">'+c[1]+'</button>'; }).join("")+'</div>';
    h += '<div class="rp-ctl"><label>Qualité <select id="star">'+[1,2,3,4,5].map(function(n){ return '<option value="'+n+'"'+(S.star===n?" selected":"")+'>'+n+'★</option>'; }).join("")+'</select></label>';
    h += '<label>Recherche <input type="search" id="q" value="'+esc(S.q)+'" placeholder="Nom, lieu…"></label></div>';
    h += '<div class="rp-ctl"><label class="rp-chk"><input type="checkbox" id="onlyPrice"'+(S.onlyPrice?" checked":"")+'> Seulement ceux qui ont un prix</label>';
    h += '<label class="rp-chk"><input type="checkbox" id="hideEv"'+(S.hideEv?" checked":"")+'> Masquer les événements</label></div></div>';
    h += '<p class="note">'+all.length+' ligne'+(all.length>1?"s":"")+' affichée'+(all.length>1?"s":"")+' · '+missing+' sans prix publié (à vérifier en jeu). Prix de vente à '+S.star+'★, consultés le '+RP.date+'.</p>';
    if(!all.length){ h += '<p class="empty">Rien à afficher avec ces filtres.</p>'; }
    else {
      h += '<div class="rp-wrap"><table class="rp"><thead><tr>'+th("n","Nom")+th("c","Type")+th("lv","Niv.","num")+th("w","Où / ingrédients")+th("t","Heure et météo")+th("p","Prix "+S.star+"★","num")+th("gph","Or/h","num")+'</tr></thead><tbody>';
      h += all.map(function(r){
        var p = price(r), g = gph(r);
        return '<tr><td class="rp-n">'+esc(r.n)+(r.dv?' <span class="rp-flag" title="Les guides ne donnent pas le même temps de pousse : vérifie en jeu">⚠</span>':'')+'</td>'+
          '<td>'+(CATNAME[r.c]||"")+(r.g?' <span class="rp-sub">'+esc(r.g)+'</span>':'')+'</td>'+
          '<td class="num">'+(r.lv!=null?r.lv:"")+'</td>'+
          '<td>'+esc(r.w||"")+'</td>'+
          '<td>'+esc(whenCell(r))+'</td>'+
          '<td class="num">'+(p!=null?'<strong>'+fmt(p)+'</strong> G':'<span class="rp-sub">à vérifier</span>')+'</td>'+
          '<td class="num">'+(g!=null?fmt(Math.round(g))+' G':'')+'</td></tr>';
      }).join("")+'</tbody></table></div>';
    }
    h += '<p class="note">Or/h = prix d\'une récolte divisé par le temps de pousse (le nombre de fruits par récolte n\'est pas publié). ⚠ = temps de pousse différent selon les guides. Les prix 2★ à 5★ absents d\'un guide restent vides. Les insectes et oiseaux n\'ont pas de prix de vente publié.</p></section>';
    var app = document.getElementById("app"), keep = document.activeElement && document.activeElement.id, pos = keep==="q" ? document.activeElement.selectionStart : 0;
    app.innerHTML = h;
    if(keep==="q"){ var el = document.getElementById("q"); el.focus(); try{ el.setSelectionRange(pos,pos); }catch(e){} }
  }
  document.addEventListener("click",function(e){
    var c = e.target.closest("[data-cat]"); if(c){ S.cat = c.getAttribute("data-cat"); if(S.cat==="insectes"||S.cat==="oiseaux") S.onlyPrice = false; save(); render(); return; }
    var s = e.target.closest("[data-sort]"); if(s){ var k = s.getAttribute("data-sort"); if(S.sort===k) S.dir = -S.dir; else { S.sort = k; S.dir = (k==="p"||k==="gph"||k==="lv") ? -1 : 1; } render(); }
  });
  document.addEventListener("input",function(e){
    if(e.target.id==="q"){ S.q = e.target.value; render(); }
  });
  document.addEventListener("change",function(e){
    if(e.target.id==="star"){ S.star = parseInt(e.target.value,10); save(); render(); }
    if(e.target.id==="onlyPrice"){ S.onlyPrice = e.target.checked; save(); render(); }
    if(e.target.id==="hideEv"){ S.hideEv = e.target.checked; save(); render(); }
  });
  render();
})();
