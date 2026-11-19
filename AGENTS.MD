# AGENTS.md — annexe spécifique projet Visionneuse

## Garde-fous techniques (acquis du projet)

- **Assainissement** : toute nouvelle action back qui reçoit du texte appelle
  `assainir.texte` (ou `texteStocke` / `fragChemin`) avant de toucher à Mongo ou
  au disque. Chaque requête HTTP est indépendante : la sécurité se trace à chaque
  action, jamais au fil du parcours applicatif.
- **Nettoyage de fichiers** : le nettoyage vit dans l'action (toutes branches,
  y compris les chemins d'erreur), jamais dans le try métier. Les unlinks sont
  asynchrones et journalisés, pas bloquants.
- **Front/back** : les règles métier vivent côté back (back = source de vérité,
  front = présentation). Déployer back d'abord, front ensuite (le back reste
  tolérant : champs nouveaux ignorés par l'ancien front).
- **Mesurer avant d'optimiser** : aucun chantier de performance sans relevé avant.
- Ne pas « corriger » un choix délibéré documenté sans le signaler explicitement.

## Conventions de nommage

- **Tags** : tri sur `nomFormate` (pas `nom`). Toute écriture ou renommage de tag
  met à jour `nomFormate = formatString(...)` ; `formatString` normalise en NFD +
  retrait des diacritiques U+0300-U+036F, avec remplacement préventif œ→oe et
  æ→ae.
- **Médias** : identifiés par leur champ `name`. Les couvertures sont des
  fichiers partageant le même nom que le média ; pour retirer proprement le nom
  d'un fichier sans son extension, utiliser la fonction dédiée du projet (ne pas
  recoder un découpage manuel sur « le premier point » : les noms peuvent
  contenir des points).
- **Constantes back** : dans `config.js`, en MAJUSCULES avec préfixe par usage
  (`SEUIL_`, `DUREE_`, `CHEMIN_`, `COEF_`). Ne pas recréer de constantes mortes :
  retirer celles qui n'ont plus d'appelant.
- **Imports back** : require destructuré des noms exportés, appels nus
  (sans préfixe de module quand le nom est parlant).
- **CSS** : tous les CSS vivent dans `src/styles/` (minuscules), importés par le
  composant qui les utilise. Règle adjacente : tout nouveau style de bouton doit
  être préfixé (ex. `.contenu .enteteFiltre input[type='button']`) pour dominer
  la passe globale `.contenu input[type='button']` (spécificité 0,2,1).
- **Composants front** : découpage dans `src/components/` (annexes de Galerie
  dans `src/components/galerie/`), composant = présentation pure quand c'est
  possible, l'état reste chez le parent orchestrateur.
- **Commits** : préfixe en minuscules selon la nature (`fix`, `refactor`,
  `feat`...), en français, concis et descriptif.

## Points de vigilance du projet

- Les actionsRedux restent pures : fetch et eff en `createAsyncThunk` lu dans
  l'état, déclenché par un effet ; jamais de promesse testée dans un reducer.
- Toute ref montée/démontée (branches conditionnelles) doit figurer dans les
  dépendances de l'effet qui l'utilise.
- Les colonnes de miniatures sont en float : tout élément après elles a besoin
  de `clear: both` (le flottement a déjà mordu deux fois).
- Ne jamais donner de chemin de fichier frame à sharp : lectures via
  `fs.readFileSync` puis buffer (rétention de handles sous Windows).
- ffmpeg : `-y` systématique, noms de fichiers temporaires uniques, stdio avec
  stdin 'ignore' et écouteur 'error' obligatoire.