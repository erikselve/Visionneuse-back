# AGENTS.md — Visionneuse-back

Ce fichier encode la façon de travailler d'Erik : socle commun à tous ses
projets, suivi des spécificités du back Visionneuse. Le but n'est pas que
l'agent aille vite, mais qu'Erik garde en permanence la compréhension et la
maîtrise de son projet. Chaque session doit laisser le projet dans un état
compris, testé et committable.

## Localisation des dépôts

- Back (ce dépôt) : `E:\ProjetsDDExt\node\Visionneuse`
- Front (Visionneuse) : `C:\Erik\Projets\Projets\React\gestion_images`
- Espace de travail VS Code réunissant les deux : `C:\Erik\Projets\Projets\Agent Visionneuse.code-workspace`

## Mode de réponse (socle commun)

- Choisir le mode selon la nature de la tâche, pas toujours le mode rapide.
  - Mode rapide : fonctionnalités simples, UI, corrections au diagnostic clair.
  - Mode réfléchi (obligatoire) : nouvelle formule de calcul, manipulation de
    dates/durées, toute action qui touche au disque ou à la base avec des
    entrées utilisateur, décisions d'architecture (identifiants, invariants,
    place d'une règle front/back).
- Quand le mode réfléchi est adopté par défaut, l'indiquer par une ligne
  d'en-tête au début de la réponse.
- Raison d'être : la majorité des bugs historiques venaient de raisonnements
  longs menés en mode rapide.

## Protocole de travail (socle commun, toute demande)

Chaque demande suit quatre phases. Aucune n'est sautée, même en mode rapide
(seules l'amplitude des explications et la profondeur du plan changent).

1. **Analyse** : relire le code réel concerné, reformuler la demande en une
   phrase pour vérifier la compréhension, identifier les points de travail
   et les contraintes. Si la demande est ambiguë ou incomplète, poser la
   question AVANT de proposer quoi que ce soit, plutôt que de choisir en
   silence.
2. **Proposition** : présenter la solution adoptée — ce qui va être modifié,
   dans quels fichiers, pourquoi cette solution (et, quand c'est tranchant,
   l'alternative écartée en une ligne et la raison). Pas de fichier modifié à
   cette étape : l'objectif est qu'Erik ait conscience des modifications
   prévues et puisse réagir.
3. **Validation** : attendre un accord explicite (ex. « vas-y », « validé »).
   Une remarque ou une correction relance la phase 2 : re-proposer, ne pas
   appliquer en même temps qu'on répond à l'objection. En cas de doute sur
   l'accord, demander au lieu d'interpréter.
4. **Application puis restitution** : appliquer le validé, un point de travail
   à la fois (si plusieurs points indépendants, les traiter un par un, sauf
   lien réel entre eux — pas de gros diff groupé). Diff par fichier, expliqué :
   indiquer le numéro de la première ligne concernée (repris dans le fichier
   réel relu au moment de l'application, pas une version antérieure ; pour du
   code entièrement nouveau, la ligne d'insertion). Insérer les tests au
   moment du déroulé où ils ont du sens, pas tous regroupés à la fin si un
   état intermédiaire mérite d'être vérifié avant l'étape suivante. Terminer
   par un résumé des changements et pourquoi, puis proposer un intitulé de
   commit utilisable tel quel : préfixe en minuscules selon la nature
   (`fix`, `refactor`, `feat`...), en français, concis et descriptif.

Un seul accord vaut pour la solution proposée, pas pour des extensions que
l'agent s'accorde à lui-même en cours de route : tout ajout découvert en
appliquant est signalé et revalidé, pas glissé dans le diff.

## Ce que l'agent ne fait jamais (socle commun)

- Modifier des fichiers sans un diff proposé à la relecture.
- Enchaîner plusieurs points de travail dans une même réponse sans accord.
- Exécuter une commande destructive (suppression, migration de base, git push)
  sans la montrer et obtenir l'accord.
- Regrouper des décisions d'architecture au fil d'une tâche : les isoler.

## Doctrine générale (projet)

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
- **Une réponse de mutation devient la vérité d'affichage** : le front
  consomme ces réponses par remplacement (`chargeSources`), sans fusion —
  peu importe ce que la mutation elle-même a touché, la réponse porte TOUT
  ce que l'affichage montre (notes calculées, partFavoris, évaluation,
  urgence : `formatAllSources()` complet, jamais appauvri). Le poison ne
  vit pas dans la mutation mais dans la réponse : une liste amputée des
  notes calculées fait afficher la note manuelle brute (un 0, qui se rend
  comme une étoile pleine). Si le scan coûte un jour, l'optimisation juste
  est de le cibler ou de fusionner côté front — jamais de rendre la
  réponse malhonnête pour l'économiser.

## Points de vigilance

- Les réponses d'actions qui re-formattent l'état des tags renvoient la liste
  complète catégories + liens (`formateListe()`, réponse
  `{categories, liensParNom}`) — indexés via `rep.res.categories`, pas `rep.res`.