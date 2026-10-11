/* Données de la page Profits (profits.html).
   Cuisine : prix de vente d'un plat 1 étoile, tirés de heartopia.live (mis à jour le 13/07/2026)
   et heartopia.life (28/07/2026).
   Prix de revente des fruits cueillis, champignons, bois et minerais : roonby.com et treyexgaming.com (janvier 2026).
   Shiitake et cèpe à 16 : confirmés par le coût de 64 G des Grilled Shiitake et Grilled Penny Bun (heartopia.live).
   Lait et fromage : valeurs approximatives de heartopia.life (« ~40 », « ~80 »). Les étoiles supérieures multiplient ce prix (voir MULT).
   Ces chiffres viennent de guides de la communauté : vérifie-les en jeu, ils changent avec les mises à jour.

   Un ingrédient : {id, fr, en, cat, p, buy, g}
     p   = prix de revente brute (null = inconnu, compté 0 dans le calcul)
     buy = prix d'achat chez le marchand, à titre d'info
     g   = groupes auxquels il appartient (« n'importe quel fruit », etc.)
   Une recette : {id, n, c, l, t, rp, need}
     c = nom de l'entrée correspondante dans Collections > Cuisine du carnet
     l = niveau de cuisine, t = prix de vente 1 étoile, rp = prix d'achat de la recette
     need = ingrédients : [id, quantité] ou ["g:fruit", quantité] pour un groupe ("g:fruit|veg" = fruit ou légume)
     out = identifiant du plat quand il sert d'ingrédient à une autre recette
     v = 1 si la liste d'ingrédients n'est pas confirmée */

var PD = {};

PD.MULT = [1, 1.5, 2, 4, 8];

PD.CATS = {
  cuisine: [
    {k:"cultures", t:"Cultures du jardin"},
    {k:"fruits",   t:"Fruits cueillis"},
    {k:"champi",   t:"Champignons"},
    {k:"ferme",    t:"Produits de la ferme et de l'épicerie"},
    {k:"mer",      t:"Poissons et crustacés"},
    {k:"sucres",   t:"Sucres, café, thé et divers"},
    {k:"plats",    t:"Plats déjà cuisinés (pour les plats composés)"}
  ],
  meubles: [
    {k:"bois",   t:"Bois et branches"},
    {k:"pierre", t:"Pierre et minerai"},
    {k:"autres", t:"Autres matériaux (ajoutés par toi)"}
  ]
};

PD.GROUPS = {
  cuisine: {
    fruit: "n'importe quel fruit",
    veg: "n'importe quel légume",
    mush: "n'importe quel champignon",
    drink: "n'importe quelle boisson"
  }
};

PD.ING = {
  cuisine: [
    /* Cultures : prix de revente du carnet (Collections > Cultures) */
    {id:"tomato",    fr:"Tomate",         en:"Tomato",     cat:"cultures", p:30,  buy:10,  g:["fruit","veg"]},
    {id:"potato",    fr:"Pomme de terre", en:"Potato",     cat:"cultures", p:90,  buy:30,  g:["veg"]},
    {id:"wheat",     fr:"Blé",            en:"Wheat",      cat:"cultures", p:285, buy:95},
    {id:"lettuce",   fr:"Laitue",         en:"Lettuce",    cat:"cultures", p:435, buy:145, g:["veg"]},
    {id:"pineapple", fr:"Ananas",         en:"Pineapple",  cat:"cultures", p:52,  buy:15,  g:["fruit"]},
    {id:"carrot",    fr:"Carotte",        en:"Carrot",     cat:"cultures", p:155, buy:50,  g:["veg"]},
    {id:"strawberry",fr:"Fraise",         en:"Strawberry", cat:"cultures", p:375, buy:125, g:["fruit"]},
    {id:"corn",      fr:"Maïs",           en:"Corn",       cat:"cultures", p:510, buy:170, g:["veg"]},
    {id:"grape",     fr:"Raisin",         en:"Grape",      cat:"cultures", p:480, buy:160, g:["fruit"]},
    {id:"eggplant",  fr:"Aubergine",      en:"Eggplant",   cat:"cultures", p:405, buy:135, g:["veg"]},
    {id:"tea",       fr:"Feuilles de thé",en:"Tea Leaves", cat:"cultures", p:75,  buy:250},
    {id:"cocoa",     fr:"Cacao",          en:"Cocoa",      cat:"cultures", p:330, buy:110},
    {id:"avocado",   fr:"Avocat",         en:"Avocado",    cat:"cultures", p:540, buy:180},
    /* Ajoutés à la demande : prix inconnus (à saisir dans la page), recettes pas encore dans les données. */
    {id:"pumpkin",   fr:"Citrouille",     en:"Pumpkin",    cat:"cultures", p:null, g:["veg"]},
    {id:"weed",     fr:"Herbe (mauvaise herbe)", en:"Weed", cat:"cultures", p:null},
    {id:"red_rose", fr:"Rose rouge",     en:"Red Rose",   cat:"cultures", p:765},
    {id:"white_daisy", fr:"Marguerite blanche", en:"White Daisy", cat:"cultures", p:null},
    {id:"paddy",     fr:"Paddy (riz non décortiqué)", en:"Paddy", cat:"cultures", p:null},
    /* Fruits cueillis dans la nature */
    {id:"apple",     fr:"Pomme",          en:"Apple",      cat:"fruits", p:28, g:["fruit"]},
    {id:"blueberry", fr:"Myrtille",       en:"Blueberry",  cat:"fruits", p:16, g:["fruit"]},
    {id:"mandarin",  fr:"Mandarine",      en:"Mandarin",   cat:"fruits", p:28, g:["fruit"]},
    {id:"raspberry", fr:"Framboise",      en:"Raspberry",  cat:"fruits", p:26, g:["fruit"]},
    /* Champignons */
    {id:"oyster",    fr:"Pleurote",             en:"Oyster Mushroom", cat:"champi", p:16, g:["mush"]},
    {id:"shiitake",  fr:"Shiitake",             en:"Shiitake",        cat:"champi", p:16, g:["mush"]},
    {id:"button",    fr:"Champignon de Paris",  en:"Button Mushroom", cat:"champi", p:16, g:["mush"]},
    {id:"pennybun",  fr:"Cèpe",                 en:"Penny Bun",       cat:"champi", p:16, g:["mush"]},
    {id:"truffle",   fr:"Truffe noire",         en:"Black Truffle",   cat:"champi", p:99},
    /* Ferme et épicerie (prix d'achat de heartopia.life) */
    {id:"egg",       fr:"Œuf",            en:"Egg",         cat:"ferme", p:null, buy:100},
    {id:"milk",      fr:"Lait",           en:"Milk",        cat:"ferme", p:40, buy:50},
    {id:"cheese",    fr:"Fromage",        en:"Cheese",      cat:"ferme", p:80, buy:100},
    {id:"butter",    fr:"Beurre",         en:"Butter",      cat:"ferme", p:null, buy:150},
    {id:"meat",      fr:"Viande",         en:"Meat",        cat:"ferme", p:null, buy:200},
    {id:"oil",       fr:"Huile de cuisson", en:"Cooking Oil", cat:"ferme", p:null, buy:100},
    {id:"past_egg",  fr:"Œuf pasteurisé", en:"Pasteurized Egg", cat:"ferme", p:null, buy:100},
    {id:"bean_paste",fr:"Pâte de haricots", en:"Bean Paste",  cat:"ferme", p:null},
    /* Mer */
    {id:"fish",      fr:"Poisson (n'importe lequel)",     en:"Any fish",      cat:"mer", p:null},
    {id:"shellfish", fr:"Crustacé ou coquillage (n'importe lequel)", en:"Shellfish / King Crab", cat:"mer", p:null},
    {id:"goldcrab",  fr:"Crabe royal doré", en:"Golden King Crab", cat:"mer", p:null},
    /* Sucres, café, thé */
    {id:"coffee",    fr:"Grains de café", en:"Coffee Beans", cat:"sucres", p:null, buy:50},
    {id:"sugar",     fr:"Sucre",          en:"Sugar",        cat:"sucres", p:null},
    {id:"red_sugar",    fr:"Sucre rouge",  en:"Red Sugar",    cat:"sucres", p:null, buy:200},
    {id:"orange_sugar", fr:"Sucre orange", en:"Orange Sugar", cat:"sucres", p:null, buy:200},
    {id:"yellow_sugar", fr:"Sucre jaune",  en:"Yellow Sugar", cat:"sucres", p:null, buy:200},
    {id:"green_sugar",  fr:"Sucre vert",   en:"Green Sugar",  cat:"sucres", p:null, buy:200},
    {id:"blue_sugar",   fr:"Sucre bleu",   en:"Blue Sugar",   cat:"sucres", p:null, buy:150},
    {id:"indigo_sugar", fr:"Sucre indigo", en:"Indigo Sugar", cat:"sucres", p:null, buy:150},
    {id:"violet_sugar", fr:"Sucre violet", en:"Violet Sugar", cat:"sucres", p:null, buy:150},
    {id:"honey",     fr:"Miel",           en:"Honey",        cat:"sucres", p:null},
    {id:"matcha",    fr:"Poudre de matcha", en:"Matcha Powder", cat:"sucres", p:null, buy:250},
    {id:"lemon",     fr:"Citron",         en:"Lemon",        cat:"sucres", p:null},
    /* Plats déjà cuisinés. Leur prix par défaut est celui de la recette (calculé dans profits.js). */
    {id:"d_tomato_sauce", fr:"Sauce tomate",     en:"Tomato Sauce",     cat:"plats", dish:"tomato_sauce"},
    {id:"d_salad",        fr:"House Salad",      en:"House Salad",      cat:"plats", dish:"house_salad"},
    {id:"d_bagel",        fr:"Smoked Fish Bagel",en:"Smoked Fish Bagel",cat:"plats", dish:"smoked_fish_bagel"},
    {id:"d_risotto",      fr:"Seafood Risotto",  en:"Seafood Risotto",  cat:"plats", dish:"seafood_risotto"},
    {id:"d_tiramisu",     fr:"Tiramisu",         en:"Tiramisu",         cat:"plats", dish:"tiramisu"},
    {id:"d_pizza",        fr:"Seafood Pizza",    en:"Seafood Pizza",    cat:"plats", dish:"seafood_pizza"},
    {id:"d_applepie",     fr:"Apple Pie",        en:"Apple Pie",        cat:"plats", dish:"apple_pie"},
    {id:"d_fishchips",    fr:"Fish and Chips",   en:"Fish and Chips",   cat:"plats", dish:"fish_and_chips"},
    {id:"d_coffee",       fr:"Coffee (boisson)", en:"Coffee",           cat:"plats", dish:"coffee", g:["drink"]},
    {id:"d_latte",        fr:"Latte (boisson)",  en:"Latte",            cat:"plats", dish:"latte", g:["drink"]},
    {id:"d_milkshake",    fr:"Milkshake",        en:"Milkshake",        cat:"plats", dish:"milkshake", g:["drink"]},
    {id:"d_blacktea",     fr:"Mellow Black Tea", en:"Mellow Black Tea", cat:"plats", dish:"mellow_black_tea", g:["drink"]},
    {id:"d_greentea",     fr:"Refreshing Green Tea", en:"Refreshing Green Tea", cat:"plats", dish:"refreshing_green_tea", g:["drink"]}
  ],
  /* Meubles : matériaux des 6 recettes « bulles » confirmées par TheGamer et Sportskeeda.
     Aucun prix de revente fiable n'est publié : à saisir toi-même dans la page. */
  meubles: [
    {id:"timber",  fr:"Bois",            en:"Timber",         cat:"bois",   p:6},
    {id:"qtimber", fr:"Bois de qualité", en:"Quality Timber", cat:"bois",   p:12},
    {id:"rtimber", fr:"Bois rare",       en:"Rare Timber",    cat:"bois",   p:50},
    {id:"branch",  fr:"Branche",         en:"Branch",         cat:"bois",   p:5},
    {id:"stone",   fr:"Pierre",          en:"Stone",          cat:"pierre", p:8},
    {id:"ore",     fr:"Minerai",         en:"Ore",            cat:"pierre", p:14}
  ]
};

/* Recettes de cuisine. t = prix de vente 1 étoile. */
PD.REC = {
  cuisine: [
    /* Confitures et sauces */
    {id:"mixed_jam",      n:"Mixed Jam",       c:"Mixed Jam",       l:1, t:160,  rp:0, need:[["g:fruit",4]]},
    {id:"raspberry_jam",  n:"Raspberry Jam",   c:"Raspberry Jam",   l:1, t:250,  rp:0, need:[["raspberry",4]]},
    {id:"apple_jam",      n:"Apple Jam",       c:"Apple Jam",       l:1, t:270,  rp:0, need:[["apple",4]]},
    {id:"blueberry_jam",  n:"Blueberry Jam",   c:"Blueberry Jam",   l:1, t:170,  rp:0, need:[["blueberry",4]]},
    {id:"strawberry_jam", n:"Strawberry Jam",  c:"Strawberry Jam",  l:1, t:1580, rp:0, need:[["strawberry",4]]},
    {id:"mandarin_jam",   n:"Mandarin Jam",    c:"Mandarin Jam",    l:1, t:270,  rp:0, need:[["mandarin",4]]},
    {id:"grape_jam",      n:"Grape Jam",       c:"Grape Jam",       l:1, t:2020, rp:0, need:[["grape",4]]},
    {id:"pineapple_jam",  n:"Pineapple Jam",   c:"Pineapple Jam",   l:1, t:280,  rp:0, need:[["pineapple",4]]},
    {id:"tomato_sauce",   n:"Tomato Sauce",    c:"Tomato Sauce",    l:1, t:180,  rp:0, need:[["tomato",4]], out:"d_tomato_sauce"},
    {id:"chocolate_sauce",n:"Chocolate Sauce", c:"Chocolate Sauce", l:1, t:1400, rp:0, need:[["cocoa",4]]},
    /* Tartes et champignons */
    {id:"mushroom_pie",   n:"Mushroom Pie (et variantes par champignon)", c:"Mushroom Pie", l:1, t:500, rp:0, need:[["g:mush",2],["wheat",1],["egg",1]]},
    {id:"truffle_pie",    n:"Black Truffle Pie", c:"Black Truffle Pie", l:1, t:830, rp:0, need:[["truffle",2],["wheat",1],["egg",1]]},
    {id:"grilled_mushrooms", n:"Grilled Mushrooms (et variantes)", c:"Grilled Mushrooms", l:1, t:180, rp:0, need:[["g:mush",4]]},
    /* Boissons et gâteaux */
    {id:"coffee",         n:"Coffee",          c:"Coffee",          l:2, t:290,  rp:0, need:[["coffee",4]], out:"d_coffee"},
    {id:"latte",          n:"Latte",           c:"Latte",           l:2, t:300,  rp:0, need:[["coffee",2],["milk",2]], out:"d_latte"},
    {id:"milkshake",      n:"Milkshake",       c:"Milkshake",       l:11, t:1300, rp:6400, need:[["grape",2],["milk",2]], out:"d_milkshake"},
    /* Ajoutées d'après heartopia.life (juillet 2026). Absentes de Collections > Cuisine : ajoute-les à la main si tu les as. */
    {id:"grass_cake",     n:"Grass Cake",      c:"Grass Cake", l:1, t:690, rp:0, need:[["wheat",1],["weed",1],["matcha",1],["milk",1]]},
    {id:"onsen_egg",     n:"Onsen Egg (événement Winter Frost, cuit aux bains de la montagne Onsen)", c:"Onsen Egg", l:1, t:130, rp:0, need:[["past_egg",1]]},
    {id:"rose_tea",       n:"Rose Tea",        c:"Rose Tea",  l:12, t:1930, rp:0, need:[["tea",2],["red_rose",2]], v:1},
    {id:"daisy_tea",      n:"Daisy Tea",       c:"Daisy Tea", l:12, t:600,  rp:0, need:[["tea",2],["white_daisy",2]], v:1},
    {id:"orig_roll",      n:"Original Roll Cake", c:"Original Roll Cake", l:1, t:550, rp:0, rt:"50 étoiles de vœu chez Doris", need:[["egg",1],["milk",1],["sugar",2]]},
    {id:"red_roll",       n:"Red Roll Cake",    c:"Red Roll Cake",    l:1, t:670, rp:0, need:[["egg",1],["milk",1],["red_sugar",2]]},
    {id:"orange_roll",    n:"Orange Roll Cake", c:"Orange Roll Cake", l:1, t:670, rp:0, need:[["egg",1],["milk",1],["orange_sugar",2]]},
    {id:"yellow_roll",    n:"Yellow Roll Cake", c:"Yellow Roll Cake", l:1, t:670, rp:0, need:[["egg",1],["milk",1],["yellow_sugar",2]]},
    {id:"green_roll",     n:"Green Roll Cake",  c:"Green Roll Cake",  l:1, t:670, rp:0, need:[["egg",1],["milk",1],["green_sugar",2]]},
    {id:"violet_roll",    n:"Violet Roll Cake", c:"Violet Roll Cake", l:1, t:570, rp:0, need:[["egg",1],["milk",1],["violet_sugar",2]]},
    {id:"blue_roll",      n:"Blue Roll Cake",   c:"Blue Roll Cake",   l:1, t:570, rp:0, need:[["egg",1],["milk",1],["blue_sugar",2]]},
    {id:"indigo_roll",    n:"Indigo Roll Cake", c:"Indigo Roll Cake", l:1, t:570, rp:0, need:[["egg",1],["milk",1],["indigo_sugar",2]]},
    /* Plats et desserts */
    {id:"house_salad",    n:"House Salad",     c:"House Salad",     l:1, t:90,   rp:200,  need:[["g:veg",2]], out:"d_salad"},
    {id:"fish_and_chips", n:"Fish and Chips",  c:"Fish and Chips",  l:1, t:310,  rp:200,  need:[["fish",2],["potato",2]], out:"d_fishchips"},
    {id:"cheesecake",     n:"Cheesecake",      c:"Cheesecake",      l:1, t:480,  rp:200,  need:[["cheese",1],["milk",1],["wheat",1]]},
    {id:"smoked_fish_bagel", n:"Smoked Fish Bagel", c:"Smoked Fish Bagel", l:2, t:520, rp:200, need:[["fish",1],["cheese",1],["g:veg",1],["wheat",1]], out:"d_bagel"},
    {id:"seafood_risotto",n:"Seafood Risotto", c:"Seafood Risotto", l:3, t:490,  rp:800,  need:[["shellfish",2],["wheat",1],["tomato",1]], out:"d_risotto"},
    {id:"ratatouille",    n:"Rustic Ratatouille", c:"Rustic Ratatouille", l:3, t:640, rp:800, need:[["tomato",1],["potato",1],["lettuce",1]]},
    {id:"truffle_pasta",  n:"Black Truffle Cream Pasta", c:"Black Truffle Cream Pasta", l:3, t:900, rp:800, need:[["truffle",1],["wheat",2],["milk",1]]},
    {id:"seafood_pizza",  n:"Seafood Pizza (sauce tomate déjà cuisinée)", c:"Seafood Pizza", l:4, t:780, rp:800, need:[["cheese",1],["d_tomato_sauce",1],["wheat",1],["fish",1]], out:"d_pizza"},
    {id:"seafood_pizza_t",n:"Seafood Pizza (avec 4 tomates)", c:"Seafood Pizza", l:4, t:780, rp:800, need:[["cheese",1],["tomato",4],["wheat",1],["fish",1]], out:"d_pizza"},
    {id:"meat_pasta",     n:"Meat Sauce Pasta",c:"Meat Sauce Pasta",l:4, t:670,  rp:800,  need:[["meat",1],["tomato",1],["wheat",1],["cheese",1]]},
    {id:"carrot_cake",    n:"Carrot Cake",     c:"Carrot Cake",     l:5, t:840,  rp:1600, need:[["carrot",2],["egg",1],["wheat",1]]},
    {id:"apple_pie",      n:"Apple Pie",       c:"Apple Pie",       l:5, t:730,  rp:1600, need:[["apple",1],["wheat",1],["egg",1],["butter",1]], out:"d_applepie"},
    {id:"corn_soup",      n:"Corn Soup",       c:"Corn Soup",       l:5, t:1340, rp:1600, need:[["corn",2],["milk",1],["butter",1]]},
    {id:"tiramisu",       n:"Tiramisu",        c:"Tiramisu",        l:6, t:530,  rp:1600, need:[["coffee",1],["milk",1],["egg",1],["cheese",1]], out:"d_tiramisu"},
    {id:"seafood_platter",n:"Deluxe Seafood Platter", c:"Deluxe Seafood Platter", l:6, t:410, rp:1600, need:[["fish",2],["shellfish",2]]},
    {id:"afternoon_tea",  n:"Afternoon Tea",   c:"Afternoon Tea",   l:7, t:710,  rp:3200, need:[["d_tiramisu",1],["g:fruit|veg",1]]},
    {id:"picnic_set",     n:"Picnic Set",      c:"Picnic Set",      l:7, t:2260, rp:3200, need:[["g:drink",1],["d_pizza",1],["d_applepie",1],["d_fishchips",1]]},
    {id:"crayfish_sashimi",n:"Crayfish Sashimi", c:"Crayfish Sashimi", l:8, t:850, rp:3200, need:[["shellfish",3],["lettuce",1]]},
    {id:"meat_burger",    n:"Meat Burger (sauce tomate déjà cuisinée)", c:"Meat Burger", l:8, t:1350, rp:3200, need:[["wheat",1],["lettuce",1],["meat",1],["d_tomato_sauce",1]]},
    {id:"meat_burger_t",  n:"Meat Burger (avec 4 tomates)", c:"Meat Burger", l:8, t:1350, rp:3200, need:[["wheat",1],["lettuce",1],["meat",1],["tomato",4]]},
    {id:"candlelight",    n:"Candlelight Dinner", c:"Candlelight Dinner", l:9, t:1760, rp:6400, need:[["d_salad",1],["d_bagel",1],["d_risotto",1],["d_tiramisu",1]]},
    {id:"baked_eggplant", n:"Baked Eggplant with Meat (sauce tomate déjà cuisinée)", c:"Baked Eggplant with Meat", l:9, t:1230, rp:6400, need:[["eggplant",1],["meat",1],["oil",1],["d_tomato_sauce",1]]},
    {id:"baked_eggplant_t",n:"Baked Eggplant with Meat (avec 4 tomates)", c:"Baked Eggplant with Meat", l:9, t:1230, rp:6400, need:[["eggplant",1],["meat",1],["oil",1],["tomato",4]]},
    {id:"king_crab",      n:"Steamed King Crab", c:"Steamed King Crab", l:10, t:1990, rp:6400, need:[["shellfish",3],["butter",1]]},
    {id:"golden_crab",    n:"Steamed Golden King Crab", c:"Steamed King Crab", l:10, t:2980, rp:6400, need:[["goldcrab",3],["butter",1]]},
    {id:"black_tea",      n:"Mellow Black Tea",c:"Mellow Black Tea",l:11, t:840,  rp:6400, need:[["tea",3],["sugar",1]], out:"d_blacktea", v:1},
    {id:"green_tea",      n:"Refreshing Green Tea", c:"Refreshing Green Tea", l:12, t:500, rp:6400, need:[["tea",2],["honey",1],["lemon",1]], out:"d_greentea", v:1},
    {id:"avocado_cup",    n:"Shrimp Avocado Cup", c:"Shrimp Avocado Cup", l:13, t:1560, rp:6400, need:[["avocado",2]], v:1},
    {id:"stuffed_crab",   n:"Cheese Shrimp Stuffed Crab", c:"Cheese Shrimp Stuffed Crab", l:13, t:1440, rp:6400, need:[["shellfish",2]], v:1}
  ],
  /* Meubles : recettes des bulles. Le prix de vente (t) est à saisir. */
  meubles: [
    {id:"oceanic_cutlery",  n:"Oceanic Cutlery Storage", t:null, need:[["timber",5],["stone",2],["qtimber",11]]},
    {id:"oceanic_corner",   n:"Oceanic Corner Storage",  t:null, need:[["timber",3],["qtimber",15]]},
    {id:"oceanic_tableware",n:"Oceanic Tableware",       t:null, need:[["stone",5],["ore",11]]},
    {id:"joinery_rack",     n:"Joinery Seasoning Rack",  t:null, need:[["timber",4],["stone",4],["qtimber",3]]},
    {id:"kitchen_rack",     n:"Kitchen Rack",            t:null, need:[["timber",4],["stone",4],["ore",3]]},
    {id:"wood_fiber_mat",   n:"Simple Wood Fiber Mat",   t:null, need:[["timber",8],["branch",8]]}
  ]
};
