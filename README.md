# Carnet Heartopia

Un carnet de suivi pour le jeu Heartopia : routine du jour, passions, paliers de bâtisseur, collections (insectes, poissons, oiseaux, recettes, cultures), journal daté et sauvegarde CSV.

C'est une page statique, sans serveur ni compte. Tout est enregistré dans le navigateur (`localStorage`).

## Utiliser le carnet

**En local** : ouvre `index.html` dans ton navigateur.

**Sur GitHub Pages** :
1. Crée un dépôt et envoie-y les fichiers de ce dossier.
2. Dans le dépôt : Settings, Pages, Build and deployment, Source « Deploy from a branch », branche `main`, dossier `/ (root)`.
3. La page est servie à `https://<ton-pseudo>.github.io/<nom-du-depot>/`.

Les données restent dans le navigateur de l'appareil. Une autre adresse ou un autre appareil repart de zéro : utilise la sauvegarde CSV pour les déplacer.

## Sauvegarde CSV

La section « Sauvegarde CSV » en bas de page propose :
- **Exporter en CSV** : télécharge `carnet-heartopia-AAAA-MM-JJ.csv` (encodage UTF-8 avec BOM, séparateur `;`, ouvrable dans Excel et Google Sheets).
- **Copier le CSV** : copie le contenu dans le presse-papiers.
- **Importer un CSV** (fichier ou texte collé) : l'import **s'ajoute** à ce que tu as déjà, il ne supprime rien. Il accepte `;` ou `,` comme séparateur.

Format, une ligne par information, colonnes `type;cle;valeur;date` :

| type | cle | valeur | date |
|---|---|---|---|
| `reglage` | `dg`, `insectes`, `peche`, `jardinage`, `cuisine`, `oiseaux` | niveau (1 à 99) | |
| `inventaire` | identifiant de la tâche | `1` si faite | |
| `collection` | `insectes`, `poissons`, `oiseaux`, `cuisine`, `cultures` | nom coché | jour où tu l'as coché (`AAAA-MM-JJ`, facultatif) |
| `ajout` | liste concernée | nom ajouté à la main | |
| `routine` | jour (`AAAA-MM-JJ`) | nombre de cases de routine cochées | |
| `alias` | liste concernée | nom d'origine du guide | (5e colonne `alias`) ton nom à toi |
| `cible` | liste concernée | nom de l'entrée étoilée | (5e colonne) ta note |

Les noms qui commencent par `=`, `+`, `-` ou `@` sont préfixés d'une apostrophe à l'export pour éviter qu'un tableur les prenne pour une formule. L'import retire cette apostrophe.

## Où aller maintenant ? et À chasser

- **Où aller** : choisis une heure et/ou une météo, les zones sont classées par nombre d'insectes et d'oiseaux manquants à ton niveau de passion. Les entrées dont le guide ne précise pas l'heure ou la météo sont marquées « à vérifier ».
- **À chasser** : l'étoile ☆ (dans Collections et dans Où aller) ajoute une entrée à tes cibles, avec une note libre. Le bouton « Attrapé » la coche. Dans Collections, « Seulement mes cibles » filtre la liste. Les cibles et notes sont dans l'export CSV (lignes `cible`).

## Renommer une entrée

Les guides traduisent les noms chacun à leur façon et ils ne correspondent pas toujours à ceux de ton jeu. Le bouton ✎ à droite de chaque ligne permet de saisir le nom tel qu'il apparaît dans ton jeu (Entrée pour valider, Échap pour annuler, champ vide pour revenir au nom d'origine). Le nom d'origine reste affiché en petit et la recherche trouve les deux. Les noms choisis sont inclus dans l'export CSV (lignes `alias`).

## Page Profits (que cuisiner, que fabriquer)

`profits.html`, accessible par « Profits → » dans la navigation du carnet. Tu saisis ce que tu as (ex. 5 tomates, 4 blés, 3 œufs) et la page propose la combinaison de plats qui rapporte le plus, avec le nombre de chaque.

- **Gain net** : prix du plat moins ce que rapporteraient les ingrédients revendus tels quels. Les confitures, par exemple, valent à peine plus que les fruits bruts, alors qu'un plat comme le Cheesecake ou le Corn Soup dégage un vrai gain. L'objectif peut aussi être la valeur de vente brute des plats.
- **Qualité des plats** : de 1 à 5 étoiles (multiplicateurs ×1, ×1,5, ×2, ×4, ×8 d'après les guides).
- **Filtres** : seulement les recettes de ton niveau de cuisine et/ou cochées dans Collections (lus dans le carnet, jamais modifiés).
- **Prix de revente** : modifiables ligne par ligne. Préremplis d'après des guides (roonby.com, treyexgaming.com, heartopia.life) : fruits cueillis, champignons, truffe, lait (≈40), fromage (≈80), bois, branches, pierre et minerai. Lait et fromage sont des valeurs approximatives : vérifie en jeu. Un prix laissé vide compte 0 (œuf, beurre, viande, huile, sucres, miel, citron, café, matcha, poissons, crustacés, citrouille, paddy, pâte de haricots : aucun guide ne publie leur prix de revente). Les plats composés (Picnic Set, Candlelight Dinner, Afternoon Tea) demandent des plats déjà cuisinés : ajoute-les à l'inventaire, section « Plats déjà cuisinés ».
- **Meubles** : aucun guide ne donne de prix de revente fiable. Les 6 recettes confirmées sont préremplies, tu saisis leur prix, et tu peux ajouter tes propres meubles (« 5 Bois, 2 Pierre »).
- **J'ai cuisiné** : le bouton « J'ai tout cuisiné » retire du sac tout ce que le plan consomme, et « Fait » sur une ligne ne retire que ce plat. Les plats obtenus sont ajoutés à « Plats déjà cuisinés » (« Annuler » les retire aussi). Si tu as déjà coché au moins une recette dans Collections, les recettes cuisinées y sont cochées aussi (« Annuler » ne les décoche pas). Le plan est recalculé avec ce qu'il reste. « Annuler » remet l'inventaire d'avant (il disparaît si tu modifies une quantité à la main).
- **Ingrédients sans recette** : la citrouille compte comme légume (salade, bagel). Œuf pasteurisé (Onsen Egg, 130 G) et poudre de matcha (Grass Cake, 690 G) ont maintenant une recette. Paddy et pâte de haricots sont dans l'inventaire, mais aucune recette ne les utilise encore. Rose Tea (2 feuilles de thé, 2 roses rouges) et Daisy Tea (2 feuilles de thé, 2 marguerites blanches) sont ajoutés, marqués « ingrédients à vérifier ». Grass Cake, Onsen Egg, Rose Tea et Daisy Tea sont absentes de Collections > Cuisine : ajoute-les à la main pour les cocher.
- Le calcul est glouton avec plusieurs essais (graine fixe, résultat stable). C'est une très bonne suggestion, pas une preuve d'optimum.
- Réglages et inventaire enregistrés dans le navigateur sous la clé `carnet-heartopia-profits-v1` (pas dans l'export CSV).

Fichiers : `profits.html` (page), `profits-data.js` (ingrédients, recettes, prix, à corriger ici), `profits.js` (calcul et affichage), styles à la fin de `style.css`.

Sources des prix : [heartopia.live](https://www.heartopia.live/en/recipes/) (13/07/2026), [heartopia.life](https://heartopia.life/database/recipe-prices/) (28/07/2026), prix d'achat de [heartopia.life](https://heartopia.life/database/ingredients/). Le riz n'existe pas comme ingrédient de recette standard (seulement les zongzi d'événement), il n'est donc pas listé. Les variantes de tartes et de grillades par champignon ont le même prix et sont regroupées.

## Page « Ce qui rapporte le plus »

`rapporte.html`, accessible par « Ce qui rapporte → » dans la navigation. Un tableau des poissons, recettes, cultures, insectes et oiseaux, avec :
- un sélecteur de qualité de 1★ à 5★ (le prix affiché change) ;
- des filtres par catégorie, une recherche et l'option « masquer les événements » ;
- un tri en cliquant sur les titres de colonnes (prix, niveau, nom, or par heure) ;
- le lieu, l'heure et la météo pour les poissons, les ingrédients et le niveau pour les recettes.

Limites : les insectes et les oiseaux n'ont pas de prix de vente publié par les guides (« à vérifier en jeu »). Pour les cultures, l'or par heure = prix d'une récolte divisé par le temps de pousse, et ⚠ signale les temps de pousse qui diffèrent d'un guide à l'autre. Les prix et les ingrédients sont dans `rapporte-data.js` (consultés le 11/10/2026 : heartopia.live, heartopia.life, selphie1999gaming.com).

## Modifier et améliorer

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page |
| `style.css` | Couleurs, polices, mise en page (thème clair et sombre) |
| `data.js` | Listes : routine, passions, paliers, espèces, recettes |
| `app.js` | Logique : état, affichage, journal, CSV, navigation |
| `profits.html`, `profits-data.js`, `profits.js` | Page Profits (voir plus haut) |
| `rapporte.html`, `rapporte-data.js`, `rapporte.js` | Page « Ce qui rapporte le plus » |

- **Corriger un nom ou ajouter une espèce** : édite `data.js`. Chaque entrée s'écrit `"Nom|Détail"`. Un détail qui commence par `Niv. 3` alimente le filtre « à mon niveau de passion ».
- **Les ticks sont rattachés au nom** de l'espèce. Si tu renommes une entrée dans `data.js`, ajoute son ancien nom dans la fonction `migrate()` de `app.js` pour garder les cases déjà cochées.
- **Réinitialiser** : vide les données du site dans le navigateur, ou supprime la clé `carnet-heartopia-v2` du `localStorage`.

## Sources des listes

Les noms sont ceux du jeu **en anglais**. Les listes viennent de guides de la communauté et peuvent être incomplètes ou changer avec les mises à jour. Le carnet en jeu fait foi.

- Insectes (101) : [Heartopia.Life](https://heartopia.life/) pour la liste, [Selphie1999 Gaming](https://selphie1999gaming.com/) pour les lieux, heures et météo
- Poissons (124) : [Heartopia.Life](https://heartopia.life/) pour la liste et les lieux, [KeenGamer](https://www.keengamer.com/) pour la météo et les horaires (heures du serveur, 83 poissons)
- Cultures (13 plantes, 13 fleurs) : [KeenGamer](https://www.keengamer.com/)
- Oiseaux (66, il en existe davantage ; heure et météo de KeenGamer) : [KeenGamer](https://www.keengamer.com/) et autres guides
- Recettes (58) : [KeenGamer](https://www.keengamer.com/) et [Pocket Tactics](https://www.pockettactics.com/)
- Inventaire et paliers : guides [Selphie1999 Gaming](https://selphie1999gaming.com/game-guides/heartopia/heartopia-how-to-expand-your-storage/) et [Space4Games](https://space4games.com/en/games-en/heartopia-inventory-expand-your-backpack/)

Quelques noms de recettes varient d'un guide à l'autre (Latte / Coffee Latte, Cheesecake / Cheese Cake) : renomme avec ✎ si besoin.

Projet de fan, sans lien avec XD Entertainment. Aucune licence n'est définie : ajoute-en une si tu publies le dépôt.
