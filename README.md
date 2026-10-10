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

Les noms qui commencent par `=`, `+`, `-` ou `@` sont préfixés d'une apostrophe à l'export pour éviter qu'un tableur les prenne pour une formule. L'import retire cette apostrophe.

## Modifier et améliorer

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page |
| `style.css` | Couleurs, polices, mise en page (thème clair et sombre) |
| `data.js` | Listes : routine, passions, paliers, espèces, recettes |
| `app.js` | Logique : état, affichage, journal, CSV, navigation |

- **Corriger un nom ou ajouter une espèce** : édite `data.js`. Chaque entrée s'écrit `"Nom|Détail"`. Un détail qui commence par `Niv. 3` alimente le filtre « à mon niveau de passion ».
- **Les ticks sont rattachés au nom** de l'espèce. Si tu renommes une entrée dans `data.js`, ajoute son ancien nom dans la fonction `migrate()` de `app.js` pour garder les cases déjà cochées.
- **Réinitialiser** : vide les données du site dans le navigateur, ou supprime la clé `carnet-heartopia-v2` du `localStorage`.

## Sources des listes

Les listes viennent de guides de la communauté et peuvent être incomplètes ou changer avec les mises à jour du jeu. Le carnet en jeu fait foi.

- Insectes : [PlayNews](https://www.playnews.gg/guides/attrapage-d-insectes-heartopia-guide-detaille-et-liste-complete) (noms français), [Heartopia.Life](https://heartopia.life/database/insects/) (noms anglais)
- Poissons : [KeenGamer](https://www.keengamer.com/fr/articles/international/guides-fr-2/heartopia-guide-peche-comment-pecher-et-emplacements-des-poissons/)
- Oiseaux : [KeenGamer](https://www.keengamer.com/fr/articles/international/guides-fr-2/heartopia-guide-complet-de-la-passion-observation-des-oiseaux-tous-les-emplacements-des-oiseaux/), [Booster Breakerz](https://booster-breakerz.fr/observation-des-oiseaux-heartopia-ou-trouver-les-77-especes)
- Recettes : [mobi.gg](https://mobi.gg/fr/astuces/recettes-heartopia/)
- Inventaire et paliers : guides [Selphie1999 Gaming](https://selphie1999gaming.com/game-guides/heartopia/heartopia-how-to-expand-your-storage/) et [Space4Games](https://space4games.com/en/games-en/heartopia-inventory-expand-your-backpack/)

Projet de fan, sans lien avec XD Entertainment. Aucune licence n'est définie : ajoute-en une si tu publies le dépôt.
