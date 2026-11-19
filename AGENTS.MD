# AGENTS.md — Visionneuse-back

## Doctrine générale

- **Front/back** : les règles métier vivent côté back (back = source de vérité,
  front = présentation). Déployer back d'abord, front ensuite (le back reste
  tolérant : champs nouveaux ignorés par l'ancien front).
- **Mesurer avant d'optimiser** : aucun chantier de performance sans relevé avant.
- Ne pas « corriger » un choix délibéré documenté sans le signaler explicitement.

## Garde-fous techniques (acquis du projet)

- **Assainissement** : toute nouvelle action qui reçoit du texte appelle
  `assainir.texte` (ou `texteStocke` / `fragChemin`) avant de toucher à Mongo ou
  au disque. Chaque requête HTTP est indépendante : la sécurité se trace à chaque
  action, jamais au fil du parcours applicatif.
- **Nettoyage de fichiers** : le nettoyage vit dans l'action (toutes branches,
  y compris les chemins d'erreur), jamais dans le try métier. Les unlinks sont
  asynchrones et journalisés, pas bloquants.
- **Constantes** : dans `data/config.js`, en MAJUSCULES avec préfixe par usage
  (`SEUIL_`, `DUREE_`, `CHEMIN_`, `COEF_`). Ne pas recréer de constantes mortes :
  retirer celles qui n'ont plus d'appelant.
- **Imports** : require destructuré des noms exportés, appels nus (sans préfixe
  de module quand le nom est parlant).
- **Médias** : identifiés par leur champ `name`. Les couvertures sont des
  fichiers partageant le même nom que le média ; pour retirer l'extension,
  utiliser la fonction dédiée (`sansExtension` de `modules/genereNom.js`), ne pas
  recoder un découpage manuel sur « le premier point » : les noms peuvent
  contenir des points.
- **sharp** : jamais de chemin de fichier direct — lecture via
  `fs.readFileSync` puis buffer (rétention de handles sous Windows). Pour
  préserver les animations (gif, webp animé), le drapeau `{animated: true}` se
  pose au DÉCODAGE (deuxième argument de `sharp()`), sans lui seule la première
  frame est décodée.
- **ffmpeg** : `-y` systématique, noms de fichiers temporaires uniques, stdio
  avec stdin 'ignore' et écouteur 'error' obligatoire.
- **Commits** : préfixe en minuscules selon la nature (`fix`, `refactor`,
  `feat`...), en français, concis et descriptif.

## Sources : trois identifiants, une grammaire

- `nom` : nom canonique, immuable, clé de tous les rattachements (médias,
  origines). Le back en est le gardien.
- `nomUsage` : alias d'affichage ; le renommage d'usage est PUREMENT cosmétique
  (il ne touche ni les médias, ni les compteurs, ni le rang de « dernière
  utilisée »). Ne jamais « réparer » cette cosméticité.
- `alias[]` : autres graphies admissibles ; un ajout d'alias peut faire
  choisir la source par défaut (héritage de nom d'usage).
- « Dernière source utilisée » = un usage réel (ajout). La consultation
  (marquer `derniereRecup` via `consulte/`) n'est PAS un usage : elle agit sur
  l'urgence, jamais sur le rang.

## Tags : compteurs exacts, noms normalisés

- `media.tags` stocke des IDS de tags (pas des noms). Un id fantôme fait
  planter `getNomTags` (TypeError) — symptôme diagnostic, pas condition normale.
- Toute pose ou retrait de tag passe par `incrementeTag` / `decrementeTag`
  (actions/tag.js) : le compteur du tag ET celui de sa catégorie bougent
  toujours ensemble, par cette seule voie.
- La suppression d'un média décrémente ses tags au GOULOT :
  `decrementeTagsMedia` dans les trois `supprime` des modules
  (traitementImages/Video/Album), via `findOneAndDelete` (garde double-appel ;
  fichiers d'abord : un échec fichier ne décrémente rien). Tout nouveau chemin
  de suppression DOIT passer par ces goulots — ne jamais rouvrir un chemin
  d'effacement qui oublie de rendre ses points.
- Un id fantôme ne se traite pas dans un handler (continuer sans échouer) :
  sa traque est le travail d'`audit-tags.js` (racine du back ; rapport seul
  par défaut, `--appliquer` pour corriger) — réutilisable après toute
  manipulation manuelle de la base.
- Toute écriture ou renommage de tag met à jour `nomFormate = formatString(...)`
  (NFD + retrait des diacritiques U+0300-U+036F, remplacement préventif
  œ→oe et æ→ae) ; tous les tris alphabétiques se font sur `nomFormate`, jamais
  sur `nom`.

## Protocoles de dialogue front/back

- **Le refus n'est pas une erreur** : toute action destructive à confirmation
  répond 200 avec un diagnostic (ex. DELETE `tags/tag` →
  `{supprime: bool, nombre, res}`) car le front (`fetch_json`) ne rend pas les
  corps d'erreur exploitables. Toute future action à confirmation suit ce
  schéma : la décision humaine se porte sur un 200, pas sur un 4xx.

## Points de vigilance

- Les réponses d'actions qui re-formattent l'état des tags renvoient la liste
  complète catégories + liens (`formateListe()`, réponse
  `{categories, liensParNom}`) — indexés via `rep.res.categories`, pas `rep.res`.
