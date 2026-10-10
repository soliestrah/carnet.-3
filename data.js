/* Données du carnet : routine, passions, paliers, listes d'espèces et de recettes.
   C'est ici qu'on corrige un nom ou qu'on ajoute une espèce.
   Chaque entrée s'écrit "Nom|Détail" (le détail est facultatif).
   Un détail qui commence par "Niv. 3" sert au filtre « à mon niveau ». */
  /* ---------- Data ---------- */
  var DAILY = [
    {k:"quetes", t:"Quêtes quotidiennes des habitants", h:"La source la plus régulière d'expérience de bâtisseur."},
    {k:"guide", t:"Missions du Guide de la ville", h:"Elles donnent aussi des tickets et des récompenses."},
    {k:"insectes", t:"Une session d'insectes", h:"Vise une espèce que tu n'as pas encore : région ou heure différente."},
    {k:"peche", t:"Une session de pêche", h:"Cherche les poissons manquants avant de refaire les mêmes."},
    {k:"jardin", t:"Récolter, replanter, arroser", h:"Arroser avec des amis aide pour les couleurs rares."},
    {k:"oiseau", t:"Photographier au moins un oiseau", h:"Chaque photo ajoute une carte d'information."},
    {k:"cuisine", t:"Cuisiner avec ton surplus", h:"Transforme ce qui encombre le sac plutôt que de le jeter."},
    {k:"ranger", t:"Vendre les doublons, ranger le sac", h:"Insectes et poissons en double se vendent. Le reste va à l'entrepôt."}
  ];
  var PASSIONS = [
    {k:"insectes", n:"Insectes", m:"Naniwa", r:1, h:"Se vendent bien. Ta passion la plus avancée."},
    {k:"peche", n:"Pêche", m:"Vanya", r:2, h:"Bon revenu en début de partie."},
    {k:"jardinage", n:"Jardinage", m:"Blanc", r:3, h:"Fournit les ingrédients de la cuisine."},
    {k:"cuisine", n:"Cuisine", m:"Massimo", r:4, h:"Monte-la quand tu as des ingrédients variés."},
    {k:"oiseaux", n:"Oiseaux", m:"Baily J", r:4, h:"Une photo donne une carte d'information."}
  ];
  var PALIERS = [
    {l:12, t:"Soins aux animaux (chat et chien)", h:"Chez Mme Joan, avec un ticket d'extension de passion. Garde-en un.", chk:"joan", chkt:"Ticket donné à Mme Joan"},
    {l:13, t:"+50 emplacements d'entrepôt", h:"Niveau de guilde atteint."},
    {l:17, t:"+50 emplacements d'entrepôt", h:"Niveau de guilde atteint."},
    {l:19, t:"+50 emplacements d'entrepôt", h:"Niveau de guilde atteint."}
  ];
  var ONCE = [
    {k:"sac1", t:"Première amélioration du sac chez Ka Ching", h:"Elle est gratuite. Ka Ching est en périphérie de la ville."},
    {k:"ext", t:"Acheter une extension de sac ou d'entrepôt si besoin", h:"Les extensions ×10 (sac) et ×50 (entrepôt) coûtaient 25 étoiles chacune d'après un guide. Vérifie en jeu."},
    {k:"mat", t:"Ne fabriquer clous, tissus, verre ou argile que pour un projet précis", h:"Les matériaux transformés prennent beaucoup de place."},
    {k:"ing", t:"Garder seulement les ingrédients utiles à la cuisine", h:"Le reste part à l'entrepôt."}
  ];
  var WEEK = [
    ["Lundi", ["Insectes","Nouvelles régions"]],
    ["Mardi", ["Pêche","Poissons manquants"]],
    ["Mercredi", ["Jardin","Cuisine"]],
    ["Jeudi", ["Oiseaux","Photos"]],
    ["Vendredi", ["Insectes ou pêche","Selon tes tickets"]],
    ["Samedi", ["Décoration","Rangement de l'inventaire"]],
    ["Dimanche", ["Entre amis","Arrosage à plusieurs"]]
  ];

  function G(g, arr, lvl){
    return arr.map(function(s){
      var p = s.split("|"), m = p[1]||"", x = {n:p[0], g:g, m:m};
      var mm = /^Niv\. (\d+)/.exec(m); if(mm) x.l = parseInt(mm[1],10);
      if(lvl) x.l = lvl;
      return x;
    });
  }

  var LISTS = {
    insectes:{ label:"Insectes", src:[{t:"PlayNews", u:"https://www.playnews.gg/guides/attrapage-d-insectes-heartopia-guide-detaille-et-liste-complete"},{t:"Heartopia.Life", u:"https://heartopia.life/database/insects/"}],
      note:"50 insectes en noms français (PlayNews), plus 35 autres en noms anglais (Heartopia.Life) que le guide français n'a pas. Les insectes d'événements saisonniers ne sont pas listés. Le niveau est celui de la passion Insectes.",
      items:[].concat(
        G("Papillons",["Apollo|Niv. 1 · Événement Appât à Insectes","Piéride du chou|Niv. 1 · Village de pêche","Machaon|Niv. 1 · Forêt","Aurore|Niv. 1 · Zone centrale","Papillon facteur|Niv. 1 · Événement Appât à Insectes","Morpho de Sulkowsky|Niv. 2 · Attracteur d'insectes gonflable","Azuré commun|Niv. 2 · Zone centrale","Mini papillon de lune|Niv. 3 · Banlieue","Grand mars changeant|Niv. 3 · Champ de fleurs, Montagne Baleine","Trogonoptère de Brooke|Niv. 3 · Terrains résidentiels","Beau léopard|Niv. 4 · Quais du village de pêche","Morio","Paon-du-jour","Sorcière blanche","Ornithoptère vert","Morpho bleu","Tigre du châtaignier"]),
        G("Abeilles",["Bourdon|Niv. 2 · Champ de fleurs","Abeille coucou de Waroona|Niv. 3 · Tour aux cerfs de la forêt","Charpentière aux pieds étalés","Charpentière céruléenne"]),
        G("Libellules",["Grande demoiselle rouge|Niv. 1 · Bord de l'eau","Libellule à quatre taches|Niv. 2 · Rive du lac de banlieue","Libellule à queue blanche"]),
        G("Coléoptères",["Criocère de l'asperge|Niv. 1 · Champ de fleurs","Citron commun|Niv. 1 · Banlieue","Pyrrhocore européen|Niv. 1 · Rochers résidentiels","Scarabée fleur améthyste|Niv. 2 · Rochers résidentiels","Cicindèle verte|Niv. 2 · Montagne Onsen","Coccinelle à sept points|Niv. 2 · Banlieue","Clyte guêpe|Niv. 3 · Forêt","Scarabée couleur de feu|Niv. 3 · Montagne Onsen","Coccinelle à quatre points","Longicorne alpin","Coccinelle asiatique","Scarabée fleur élégant","Scarabée bijou doré","Lucane cerf-volant","Scarabée minotaure","Scarabée cornu"]),
        G("Sauterelles et mantes",["Sauterelle dorée|Niv. 1 · Montagne Onsen","Sauterelle sibérienne|Niv. 2 · Village de pêche","Sauterelle verte|Niv. 3 · Champ de fleurs","Sauterelle verte rose|Niv. 3 · Événement Appât à Insectes","Grande sauterelle rayée","Mante méditerranéenne","Mante asiatique géante","Mante conique"]),
        G("Insectes divers",["Fourmi|Niv. 3 · Place du village de pêche","Punaise bleue"]),
        G("Autres insectes (noms anglais)",["Agrias Butterfly|Lieu pas encore connu","Blue Milkweed Beetle|Lieu pas encore connu","Brown Rhinoceros Beetle|Lieu pas encore connu","Green Flower Chafer|Lieu pas encore connu","Grey-horned Firefly|Lieu pas encore connu","Iridescent Rhinoceros Beetle|Lieu pas encore connu","Morpho Luna|Lieu pas encore connu","Pink-horned Firefly|Lieu pas encore connu","Purple-horned Firefly|Lieu pas encore connu","White-banded Erebus Moth|Lieu pas encore connu","Rainbow Stag Beetle|Événement Appât à Insectes","Cicada","Beautiful Demoiselle","Crimson Marsh Glider","Comet Moth","Picasso Bug","Spanish Moon Moth","Golden Stag Beetle","Mother-Of-Pearl","Bagworm Moth","Hercules Beetle","Morpho Helena","Sunset Morpho","Atlas Beetle","Greater Asian Lady Beetle","Orchid Mantis","Queen Alexandra's Birdwing","Flamer Skimmer","Goliath Beetle","Purple Spotted Swallowtail","Red Milkweed Locust","Green Metalwing","Scarce Morpho","Glasswing Butterfly","Green Snail"])
      )},
    poissons:{ label:"Poissons", src:[{t:"KeenGamer", u:"https://www.keengamer.com/fr/articles/international/guides-fr-2/heartopia-guide-peche-comment-pecher-et-emplacements-des-poissons/"}],
      note:"84 poissons du guide KeenGamer, ce qui couvre presque tous les poissons de zones. Les poissons d'événements (une quarantaine selon d'autres sources) ne sont pas listés. Quelques noms sont restés en anglais dans le guide. Ajoute ce qui manque.",
      items:[].concat(
        G("Mer Calme",["Féra|Aussi : Lac de la Montagne thermale","Poisson-ruban","Faux Chinchard","Pieuvre naine atlantique|Aussi : Mer de la Baleine","Saumon Atlantique|Aussi : Mer de la Baleine","Pagellus bogaraveo","Homard européen","Daurade"]),
        G("Lac de la Montagne thermale",["Grémille","Têtard","Chabot","Crapet-soleil","Crapet arlequin"]),
        G("Rivière peu profonde",["Barbillon","Épinoche"]),
        G("Lac",["Ablette","Carpe noire","Grenouille européenne","Carpe Argentée|Aussi : Lac de banlieue"]),
        G("Rivière",["Perche de rivière","Crevette verte","Tilapia"]),
        G("Rivière Giantwood",["Loche des fleurs","Sandre blanc","Piranha à ventre rouge","Huchon"]),
        G("Rivière tranquille",["Vairon","Lotte","Saumon Kéta"]),
        G("Lac de forêt",["Tanche dorée","Grand Black-bass","Acantharchus pomotis","Écrevisse noble","Large Pearl Mussel","Écrevisse noble bleue","Arctic Char"]),
        G("Lac de banlieue",["Spirlin","Loche des rochers","Moule","Crabe de ruisseau","Rotengle","Ombre chevalier","Aphanius de Corse","European Mudminnow","Brochet tacheté"]),
        G("Océan",["Sardine","Perche de mer","Bonite","Chimère argentée"]),
        G("Mer de l'Est",["Crevette de la mer","Bernard-l'Ermite","Gobie","Églefin","Grondin Perlon","Poisson-lune"]),
        G("Mer de la Baleine",["Saurel","Hippocampe","Maquereau commun","Crabe royal"]),
        G("Ancienne Mer",["Poisson épineux","Poisson clown","Plie commune","Anguille d'Europe"]),
        G("Pêche en mer",["Rouget-barbet","Pieuvre","Baudroie","Turbot","Calmar volant","Roussette","Crabe royal doré","Thon rouge","Lampris-lune","Requin mako","Espadon","Régalec"]),
        G("Lac du champ",["Éperlan","Truite","Poisson rouge"]),
        G("Rivière Rosée",["Zingel Streber","Carpe commune","Blennie de rivière"]),
        G("Lac de prairie",["Koï papillon","Silure glane"]),
        G("Vieille Mer",["Tétraodon"])
      )},
    oiseaux:{ label:"Oiseaux", src:[{t:"KeenGamer", u:"https://www.keengamer.com/fr/articles/international/guides-fr-2/heartopia-guide-complet-de-la-passion-observation-des-oiseaux-tous-les-emplacements-des-oiseaux/"},{t:"Booster Breakerz", u:"https://booster-breakerz.fr/observation-des-oiseaux-heartopia-ou-trouver-les-77-especes"}],
      note:"58 oiseaux classés par niveau de la passion Oiseaux. Les guides en annoncent 77 à 97 au total, donc il peut en manquer : ajoute-les. Certains lieux restent en anglais comme dans les guides.",
      items:[].concat(
        G("Niveau 1",["Panure à moustaches|Montagne thermale","Paon bleu|Événement Nest of Hundreds","Ara bleu et jaune|Événement Nest of Hundreds","Bouvreuil pivoine|Banlieue","Tourterelle turque|Maison","Troglodyte mignon|Forêt","Rougegorge familier|Zone centrale","Grand flamant|Au bord de l'eau","Mésange à longue queue|Sur la tête de Blanc","Canard colvert|Lac","Pigeon impérial pie|Village de pêcheurs","Pigeon vert à nuque rose|Champ de fleurs","Pigeon wonga|Forêt"],1),
        G("Niveau 2",["Pinson des arbres|Champ de fleurs","Sittelle torchepot|Village de pêcheurs","Canard siffleur|Rivière","Mésange charbonnière|Montagne thermale","Goéland|Bord de mer","Pigeon colombin|Zone centrale","Pie-grièche à tête rousse|Banlieue"],2),
        G("Niveau 3",["Goéland d'Audouin|Mer de la Baleine, bord de mer et plages","Diamant à double barre|Village de pêcheurs, phare","Loriot d'Europe|Rivière Rosée","Cormoran huppé|Sous l'île de la Forêt, autour du phare","Eider à tête grise|Rivière","Ara chloroptère|Événement Nest of Hundreds","Tadorne casarca|Lac de banlieue","Mésange à gorge argentée|Forêt (Jump Puzzle)"],3),
        G("Niveau 4",["Faisan de Lady Amherst|Montagne thermale, ruines","Durbec des sapins|Île de la Forêt","Paradoxornis de Przewalski|Village de pêcheurs, place · Ensoleillé ou arc-en-ciel","Jardinier régent|Forêt de pins et de chênes spirituels","Harle piette|Lac de la forêt","Colombe fruitière de Wallace|Champ de fleurs, moulin","Bergeronnette grise|Plage lumière violette"],4),
        G("Niveau 5",["Pigeon olive africain|Montagne thermale, source thermale","Noddi brun|Bord de l'Ancienne Mer","Guêpier d'Europe|Montagne thermale, rivage du lac · Pluie ou arc-en-ciel","Ara de Buffon|Événement Nest of Hundreds · Ensoleillé ou arc-en-ciel","Flamant nain|Lac de la forêt · Pluie ou arc-en-ciel","Gobemouche jaune|Village de pêcheurs, quai"],5),
        G("Niveau 6",["Colombe terrestre cannelle|Village de pêcheurs, quai Est","Grosbec casse-noyaux|Montagne thermale, lac du cratère","Hibou moyen-duc|Montagne thermale, falaise en pierre · Ensoleillé ou arc-en-ciel","Cormoran à face rouge|Ancienne Mer, Mer de la Baleine"],6),
        G("Niveau 7",["Mésange azurée|Champ de fleurs, moulin","Faucon crécerelle|Forêt, tour du cerf · Ensoleillé ou arc-en-ciel","Merlebleu de l'Est|Banlieue · Pluie ou arc-en-ciel","Colombe fruitière jambu|Banlieue","Faucon pèlerin|Montagne thermale, source thermale · Pluie ou arc-en-ciel","Pigeon rose|Champ de fleurs, Montagne Baleine","Redpolis|Forêt de pins et de chênes spirituels","Sterne|Bord de mer Est · Arc-en-ciel","Hibou grand-duc d'Europe|Tour du cerf de la forêt · niveau 7 à 9 selon un autre guide"],7),
        G("Niveau 8",["Érismature à tête blanche|Montagne thermale, bord du lac · Pluie ou arc-en-ciel"],8),
        G("Niveau 9",["Flamant d'Amérique|Champ de fleurs · Arc-en-ciel","Cormoran impérial|Mer de l'Est, Mer Calme","Calliste septicolore|Banlieue"],9)
      )},
    cuisine:{ label:"Cuisine", src:[{t:"mobi.gg", u:"https://mobi.gg/fr/astuces/recettes-heartopia/"}],
      note:"48 recettes d'après le guide mobi.gg. Coche celles que tu as cuisinées. Le jeu peut en compter davantage.",
      items:[].concat(
        G("Confitures et sauces",["Confiture assortie|Niv. 1 · 2 myrtilles, 2 tomates","Confiture de framboises|Niv. 1 · 4 framboises","Sauce tomate|Niv. 1 · 4 tomates","Confiture de myrtilles|Niv. 1 · 4 myrtilles","Confiture de pomme|Niv. 1 · 4 pommes","Confiture d'orange|Niv. 1 · 4 oranges","Confiture de fraises|Niv. 1 · 4 fraises","Confiture d'ananas|Niv. 1 · 4 ananas","Confiture de raisin|4 raisins","Sauce au chocolat"]),
        G("Champignons rôtis",["Champignons rôtis|Niv. 1 · 4 champignons","Pleurotes rôties|Niv. 1 · 4 pleurotes","Lentins de chêne rôtis|Niv. 1 · 4 lentins du chêne","Mousserons rôtis|Niv. 1 · 4 mousserons"]),
        G("Rouleaux de nuage flottant",["Rouleau de nuage flottant à la saveur originale|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants","Rouleau rouge de nuage flottant|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants rouges","Rouleau orange de nuage flottant|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants orange","Rouleau jaune de nuage flottant|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants jaunes","Rouleau violet de nuage flottant|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants violets","Rouleau vert de nuage flottant|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants verts","Rouleau cyan de nuage flottant|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants cyan","Rouleau bleu de nuage flottant|Niv. 1 · 1 œuf, 1 lait, 2 nuages flottants bleus"]),
        G("Tartes",["Tarte de champignons|Niv. 1 · 2 champignons, 1 blé, 1 œuf","Tarte de pleurote|Niv. 1 · 2 pleurotes, 1 blé, 1 œuf","Tarte de lentins du chêne|Niv. 1 · 2 lentins du chêne, 1 blé, 1 œuf","Tarte de mousserons|Niv. 1 · 2 mousserons, 1 blé, 1 œuf","Tarte de truffes|Niv. 1 · 2 truffes noires, 1 blé, 1 œuf","Tarte aux pommes|1 pomme, 1 œuf, 1 blé, 1 beurre"]),
        G("Boissons",["Boisson étrange|Niv. 1 · Café raté","Café|Niv. 2 · 4 grains de café","Café latté|Niv. 2 · 2 grains de café, 2 lait"]),
        G("Plats",["Salade de campagne|Niv. 1 · 2 tomates","Poissons et frites|Niv. 1 · 2 poissons, 2 pommes de terre","Bagel au poisson fumé|Niv. 2 · 1 poisson, 1 fromage, 1 tomage, 1 blé","Risotto aux fruits de mer|Niv. 3 · 2 fruits de mer, 1 blé, 1 tomate","Ragoût rustique|Niv. 3 · 1 tomate, 1 pomme de terre, 1 laitue","Pâtes à la crème de truffes noires|Niv. 3 · 1 truffe, 2 blé, 1 lait","Pizza aux fruits de mer|Niv. 3 · 1 fromage, 1 sauce tomate, 1 blé, 1 poisson","Spaghetti bolognaise|1 viande, 1 tomate, 1 fromage, 1 blé","Soupe épaisse au maïs|1 lait, 2 maïs, 1 beurre","Assortiment de fruits de mer de luxe|2 fruits de mer, 2 poissons","Burger à la viande fraîche|1 blé, 1 laitue, 1 viande, 1 sauce tomate","Plateau d'écrevisse|3 écrevisses, 1 laitue","Menu camping|1 café, 1 pizza aux fruits de mer, 1 tarte aux pommes, 1 poissons et frites"]),
        G("Desserts",["Gâteau au fromage|Niv. 1 · 1 fromage, 1 lait, 1 blé","Tiramisu|1 café, 1 œuf, 1 lait, 1 fromage","Gâteau à la carotte|1 œuf, 1 blé, 2 carottes","Goûter anglais|1 tiramisu, 1 orange"])
      )},
    cultures:{ label:"Cultures", src:null,
      note:"Pas de liste prête pour les cultures. Ajoute chaque nouvelle culture récoltée pour suivre ton jardin.",
      items:[] }
  };
  var ORDER = ["insectes","poissons","oiseaux","cuisine","cultures"];
  var SPECIES = ["insectes","poissons","oiseaux"];
