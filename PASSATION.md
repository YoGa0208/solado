# SEZAM — passation complète du chantier

Document de transmission pour l'ingénieur·e qui reprend le projet. Tout ce qu'il faut savoir pour comprendre, modifier, tester et publier sans rien casser. Lecture complémentaire dans le dépôt : `README.md` (vue courte), `FICHE-COMPLETE-JEU.md` (fonctionnement et durées humaines), `CURSUS-CYCLES-1-3.md` (cadrage pédagogique C1→C3), `sezam-doctrine-produit.md` (vision), `AUDIT-REPARATIONS.md` (audit des corrections), `PARTIE-TEMOIN.md` (mesures du bot), `DEPLOIEMENT.md` et `GUIDE-JOUEURS.md` (mise en ligne et doc joueurs).

## 1. Le produit en trois phrases

SEZAM est une borne d'arcade musicale adaptative, offline-first, en français, destinée à ~20 joueurs. Plusieurs personnes peuvent partager un appareil tout en gardant des progressions entièrement individuelles. Doctrine verrouillée : **1 clic → jeu** (le coach invisible choisit le mode selon la hiérarchie ERREURS→RÉPARATION, PAUSE→FLASH, sinon SESSION), et **la partition est le terrain de jeu** : le joueur conquiert des pièces réelles passage par passage, voit sa carte se colorer, pose des ambitions, et chaque fin de session montre ce qui a été gagné dans la vraie musique. Les retours bêta passent par les tickets GitHub publics du dépôt, sans adresse personnelle embarquée.

## 2. Démarrage en 5 minutes

```bash
cd ~/Documents/music/sezam-codex
npm test                              # 34 000+ contrôles moteur — DOIT afficher 0 échec
python3 -m http.server 4173           # puis ouvrir http://localhost:4173/index.html
node tests/bot_completion.cjs         # joue la partie ENTIÈRE sur le vrai moteur (~3 s)
```

Remote `origin` configuré sur `https://github.com/YoGa0208/solado.git`. Toujours vérifier `git status` avant une livraison et préparer explicitement les fichiers : les archives et le dossier d'import local sont exclus par `.gitignore`.

## 3. Inventaire du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | TOUTE l'application : HTML + CSS + JS vanilla, zéro framework, zéro build |
| `prototype-solfege.html` | Copie **byte-identique** d'index.html (historique iOS ; un test impose l'égalité stricte) |
| `sw.js` | Service worker : cache `sezam-solado-v39`, HTML réseau-d'abord, assets cache-d'abord |
| `manifest.json` | PWA installable (fond blanc, icônes SEZAM) |
| `tests/engine.test.js` | 34 000+ contrôles : charge le VRAI script d'index.html dans un bac à sable Node |
| `tests/bot_completion.cjs` | Bot qui finit le jeu à 100 % (QA de profondeur/équilibrage) |
| `FICHE-COMPLETE-JEU.md` | Fiche non technique : niveaux, règles, trois fins et temps humains |
| `data/music-watch.json` | Brèves culturelles servies sur l'accueil (fallback embarqué dans index.html) |
| `data/curriculum-v1.json` | Référentiel versionné C1→C3 : domaines, prérequis, preuves et statut de livraison |
| `CURSUS-CYCLES-1-3.md` | Durées officielles, hypothèses d'heures actives et règles d'évolution honnêtes |
| `scripts/build_music_watch.js` | Générateur de veille depuis flux RSS (France Musique, The Strad…) avec repli hors-ligne |
| `.github/workflows/pages.yml` | CI : npm test → build veille → déploiement GitHub Pages, cron toutes les 6 h |
| `*.md` | Docs produit/audit/passation |

## 4. Anatomie d'index.html

Un seul gros `<script>` "use strict" (précédé d'un script qrcode-generator embarqué pour le transfert QR hors-ligne). Repérez-vous par recherche de fonction, pas par numéro de ligne. Ordre des blocs :

1. **CSS** avec thèmes par variables : `:root` (Classique blanc) + `[data-theme=partition|nocturne|luthier]`. Palette : pétrole `#0f4c5c`, céramique `#7fb8c2`, or `#b8893a`.
2. **Sécurité** : `esc()` — obligatoire sur TOUTE donnée utilisateur/importée avant `innerHTML`.
3. **Dictionnaires** : `NOTES` (23 notes, `p` = position de portée, `midi`, `mn` = repère mnémotechnique), `PALIERS` (15 : P1–P10 puis boss B1–B5), `TIERS` (Zen, Bronze 2 notes/5 s, Argent 3/4 s, Vermeil 4/3 s, Or 5/2 s, Rhodium 6/1 s ; gemmes/étoiles `future:true`), `SEGMENT_STATES` (5 états), `PIECE_AMBITIONS` (4 ambitions), `CARDS`/`CARDS_TIER` (cartes-cadeaux culturelles).
4. **État & normalisation** : `ensureStructure(db)` est le point unique de normalisation. La v39 utilise `_sezam.schema = 15`, `DB.v = 14` et ajoute trois racines protégées : `engagement`, `coachContext` et `calendar`. Leurs normaliseurs restent non destructifs : aucun sceau, check-in ou rendez-vous valide n'est tronqué. La migration d'un ancien `dailyProgress` ne s'exécute que si l'engagement v1 est absent.
5. **Stockage 3 filets** : localStorage `solfegeProto1` + `_mirror` + `_checkpoint` forment le cache triple du joueur actif ; IndexedDB `soladoBackup` garde un coffre `save:<playerId>` pour chaque joueur et le registre familial ; le Gist GitHub optionnel est lui aussi isolé par joueur avec détection des divergences.
6. **Moteurs** (voir §5) puis **écrans** : `scrHome` (cockpit), `scrEx` (jeu), `scrRes` (résultat + bilan partition), `scrStats`, `scrPieces` (liste), `scrPiece` (fiche d'une pièce), `scrKbd` (clavier, module isolé `KX`).
7. **SVG** : `staffSVG` (portée de jeu) et `pieceMapSVG` (carte de conquête multi-systèmes, passages teintés par état, halos dorés sur notes travaillées, zones tactiles `data-seg`).
8. **Audio** WebAudio (timbre corde frappée, compresseur maître) — tout est try/catch, fonctionne sans AudioContext.
9. **Liaisons** boutons + boot : `load()` prépare l'état local, `idbRescue()` lit d'abord le secours persistant, puis seulement l'accueil, la veille, la récupération et la synchro démarrent ; les filets `pagehide`/`error`/`unhandledrejection` sauvegardent en dernier recours.

## 5. Les moteurs de jeu

**Coach (`coachDecision`)** — hiérarchie VERROUILLÉE par tests : ≥2 erreurs récentes ou ≥2 notes en réparation → RÉPARATION ; pause longue (>5 j, `LONG_BREAK_MS`) → FLASH ; sinon SESSION. Le bouton JOUER passe par `startCoachPlay(force?)`.

**Parcours d'acquisition** — contrat verrouillé : `COURSE_QUESTION_BUDGET = 25`, `COURSE_SERIES_PER_STEP = 3`, `COURSE_MAX_EXERCISES = 12`. Une étape avance seulement après trois séries parfaites de 25. Une erreur ne valide pas la série et n'efface pas les séries parfaites antérieures. Une seule note nouvelle est ajoutée à la fois. Le vocabulaire public est « item → étape → série » ; ne jamais afficher la propriété interne `cycles` comme « Cycle 9 ».

**Mission quotidienne** — `dailyCoachContext` combine humeur, temps choisi et prochain rendez-vous ; `adaptDailyDecision` peut convertir le parcours en consolidation ou transfert non validant. `freezeTodayMission` fige le contrat avant la première question. Le temps est un repère : il peut proposer l'arrêt, mais le sceau exige 25 questions réelles. `grantDailyMissionReward` refuse toute preuve inférieure à 25, attribue une seule fois +20 XP et, tous les dix jours accomplis, le badge `mission_ten`. Toutes les missions utilisent une question à la fois (`groupN = 1`) pour que 25 signifie bien 25 réponses données.

**Défi hebdomadaire** — `reconcileEngagement` ouvre une semaine après sept dates distinctes du lundi au dimanche. `startWeeklyChallenge` lance 25 questions. `grantWeeklyChallengeResult` gagne la Couronne à partir de 20/25, la Couronne d'or à 25/25 et +100 XP une seule fois. Un échec conserve l'accès, les sept sceaux et le meilleur score ; un défi non joué reste disponible après la semaine.

**Célébration et sauvegarde** — la récompense est persistée avant `showMissionCelebration`. Si `save()` échoue, XP et engagement sont remis à leur état précédent et aucune célébration trompeuse n'est montrée. Toute mission ou victoire hebdomadaire crée ensuite un point complet `daily_complete` ou `weekly_complete`. La Vitrine des missions relit durablement les badges.

**Navigation universelle** — `btnGlobalHome` apparaît sur tout écran autre que l'accueil. `btnOverlayBack`, `btnOverlayHome` et `btnOverlaySave` vivent hors de `cardBox`, donc aucun remplacement de contenu ne peut les supprimer. `universalHome` arrête proprement timers, clavier et scènes transitoires, sauvegarde, puis revient à `scrHome`.

**Humeur et calendrier** — Concentré, Calme, Joueur et Fatigué, avec 10/15/20/30 minutes. Fatigué limite la proposition à 15 minutes et interdit la validation d'une nouveauté ; un rendez-vous proche peut cibler une œuvre, sans jamais introduire de note hors du niveau. Les œuvres intégrées et personnelles sont sélectionnables. Un retrait est réversible, l'export `.ics` n'est qu'une copie, et aucun endpoint d'IA ne reçoit ces données.

Le moteur historique des paliers, le SRS Leitner et les étoiles restent présents pour les modes arcade et les migrations. Ils ne remplacent jamais le contrat d'acquisition 25/25 × 3.

**Partition (le cœur récent)** — `PIECES_BUILTIN` : 8 pièces jouables du domaine public, 30 passages et 71 mesures avec `melody.measures` (tableaux d'ids NOTES, mesure par mesure) + 4 pièces d'écoute (quiz « premier regard » seulement). Chaque passage (`segments[]`) porte `mesFrom/mesTo` (1-based), un `level` (palier), une main, un focus. Règles clés :

- `segmentScript(seg,piece)` = le texte musical exact du passage → jouer un passage = le lire DANS L'ORDRE (chunks de `groupN`, plafonné : `min(4, max(groupN, ceil(len/12)))`).
- Passage **fragile** → la série repasse en réparation pondérée SRS sur les notes du passage (pas de script).
- **5 états** (`segmentStateId`) : jamais joué → À découvrir ; `seen` (joueur) → En travail ; `flagged` (joueur) → Fragile immédiat, prioritaire sur tout ; ≥85 % & ≤1 err → Validé ; ≥95 % sans erreur, 2 tentatives propres séparées d'au moins 20 h → Maîtrisé ; erreurs & best<85 → Fragile.
- `nextSegmentForPiece` trie : flagged > ambition-passage > urgence d'état > ressenti « difficile » > historique.
- **Ambitions** (`pieceGoals`) : lire (tout ≥Validé), passage précis (Maîtrisé sur cible), fluide (zéro fragile), cours (tout travaillé). `ambitionProgress` persiste `doneAt` dès la réussite.
- **Récompenses** : +15 XP promotion Validé, +25 Maîtrisé (+fanfare), trophées « Première œuvre » et « Bibliothèque » (`masteredPiecesCount`).
- **Bilan** : `renderResPiece()` est appelé par `show("scrRes")` pour TOUTE fin de série/rafale — passage joué (état avant→après, carte, ressenti, actions) ou impact des notes sur l'œuvre en cours (`noteOccurrencesInPiece`).
- `DB.activePiece` (œuvre en cours) : défaut automatique via `ensureActivePiece()` (première pièce accessible, `aclair`).

## 6. Invariants — à ne JAMAIS casser (tous testés)

1. `index.html` strictement égal à `prototype-solfege.html` avant tout commit.
2. `APP_VERSION` == `v39` et `CACHE_NAME` == `sezam-solado-v39`.
3. Schémas de livraison : `_sezam.schema = 15`, `DB.v = 14`, `GIST_CLOUD_SCHEMA = 4`.
4. Clés de stockage intouchables : `solfegeProto1*`, `soladoBackup`, `sezam_players_v1`, gists historiques et actuels. Une progression ne se réinitialise JAMAIS.
5. Toute note d'un passage appartient au palier annoncé par ce passage (garde-fou pédagogique).
6. Bibliothèque : domaine public uniquement, mélodies JUSTES (l'incipit d'Ode main gauche est verrouillé par test — on a déjà eu un mode lydien accidentel).
7. `esc()` sur toute donnée non maîtrisée avant `innerHTML` ; ids passés au SVG filtrés par `cleanId`.
8. Le token de synchro n'apparaît jamais dans exports/QR/Gist/cloudDocument.
9. Hiérarchie du coach intouchable ; un appareil vierge n'écrase jamais une progression distante et deux appareils divergents déclenchent un conflit sans remplacement (`syncDecision`).
10. Pas de dépendance d'exécution, pas de build, offline complet.
11. Ton éditorial : journaliste scientifique, jamais scolaire (des tests interdisent le retour des libellés type « Culture générale », « En bref. », dates SEZAM·04/07).
12. Zen→Rhodium décrit l'automatisation de lecture, jamais les cycles officiels. Aucun pourcentage, certification ou fin de Cycle 1 n'est affiché sans preuves multidomaines et validation humaine appropriée.
13. Une récompense quotidienne exige 25 questions ; elle est idempotente et ne constitue jamais une preuve d'acquisition.
14. L'humeur et le calendrier peuvent changer la séance proposée, jamais les critères 25/25 × 3.
15. Aucun rendez-vous, badge ou point de sauvegarde existant n'est supprimé ou écrasé automatiquement.
16. Les contrôles Accueil/Retour/Sauvegarder des fenêtres restent statiques hors de `cardBox`.

## 7. Tests — comment ça marche

`tests/engine.test.js` lit index.html, extrait le script principal, l'évalue dans `new Function(document, localStorage, navigator, window)` avec des stubs, et exporte les fonctions RÉELLES via un footer. Zéro logique dupliquée : si l'app casse, les tests cassent. Pour tester une nouvelle fonction : l'ajouter à `exportsList`. Piège : les `setTimeout` du jeu sont réels dans le harnais — pour avancer une série, appeler `E.nextQuestion()` quand `EX.waiting` (voir le groupe « jouer un passage »). Le bot (`tests/bot_completion.cjs`) a son propre loader qui NEUTRALISE les timers — c'est l'outil pour toute question d'équilibrage (il imprime séries/questions/XP/temps par grade).

## 8. PWA & offline

`sw.js` : navigations → réseau d'abord avec repli cache (jamais de vieille version à vie) ; assets → cache d'abord avec refresh en fond ; cross-origin ignoré (l'API GitHub de la synchro ne doit pas être interceptée). Le nettoyage vise uniquement les clés préfixées `sezam-solado-`, jamais les caches d'une autre app du même domaine. Mise à jour : bump `sezam-solado-vXX` → `skipWaiting`+`clients.claim` livrent la nouvelle version au chargement suivant.

## 9. Synchronisation (optionnelle, par joueur)

Trois niveaux : cache local immédiat → coffre IndexedDB par joueur → Gist secret GitHub par joueur. Le cloud schema 4 inclut `engagement`, `coachContext` et `calendar` ; ces données ne quittent donc l'appareil que si le joueur active explicitement la synchro GitHub. Aucun endpoint d'IA ne reçoit l'humeur ou les rendez-vous. Le Gist n'est pas indexé mais reste accessible avec son lien et possède un historique. Les pièces jointes et le journal d'événements ne partent pas dans le cloud. Toute réponse réseau tardive d'un ancien joueur est ignorée et une divergence entre appareils bloque le remplacement.

## 10. Veille culturelle

L'accueil affiche 4 brèves (`watchHomeItems` remonte toujours une « Histoire de l'art »). Source : `data/music-watch.json`, régénéré en CI par `scripts/build_music_watch.js` (RSS ; en sandbox sans réseau il retombe proprement sur la base seed). Brèves ≤5 phrases, fiche longue au clic, lien source ouvert uniquement si http(s).

## 11. Publication — étape restante

Le workflow Pages est prêt et testé. La livraison passe par une branche et une demande de fusion vers `main`, sans réécrire l'historique distant. Après fusion, vérifier l'onglet Actions puis `https://yoga0208.github.io/solado/`. Détail pas-à-pas dans `DEPLOIEMENT.md`.

## 12. Historique des commits (main)

`b764efb` app initiale → `3abf20c` ton éditorial veille → `0011332` checkpoint anti-régression → `db861d1` cockpit + ModeSelector verrouillé → `6f00014` **partition = terrain de jeu** (carte, ambitions, bilan, bibliothèque, v21) → `c434146` audit complet (12 réparations, dont justesse musicale) → `34c8c72` partie témoin + trophées d'œuvres. Auteur git configuré à la volée (`-c user.name=… -c user.email=…`) — configurez le vôtre.

## 13. Chiffres utiles pour décider (partie témoin, détail dans PARTIE-TEMOIN.md)

La partie témoin historique v29 combinait 90 validations et 30 passages Maîtrisés : 330 séries, 3 208 écrans-question et 9 711 réponses. Son plancher mécanique de 2 356,48 s, soit 39,27 min, ainsi que ses estimations humaines de 10–14 h à 35–45 h sont conservés comme repères comparatifs, pas comme minimums v39. Le contrat v39 impose déjà 270 séries d'acquisition de 25, soit 6 750 réponses avant réparations et bibliothèque ; il doit faire l'objet d'une nouvelle partie témoin complète. La maîtrise des passages impose toujours au moins 20 h de calendrier et le prestige absolu arrive au plus tôt 672 jours après le dernier Rhodium. Voir `FICHE-COMPLETE-JEU.md` pour les hypothèses historiques.

## 14. Roadmap proposée (non engagée)

P2 : meilleur temps personnel par palier aux tiers chronométrés ; une pièce surprise débloquée par tier complété ; saisie de mélodie pour les partitions perso via l'UI (aujourd'hui : import JSON seulement). P3 : mission du jour alternée paliers/partition ; célébration visuelle à la promotion Maîtrisé ; deux portées simultanées. Les profils multiples par appareil sont livrés en v28 et ne doivent plus être retirés.

## 15. Pièges d'environnement rencontrés (si vous outillez pareil)

Le montage Cowork protège certaines suppressions (`.git/index.lock` : passer par l'autorisation de suppression avant `rm`). La clé de fa est vectorielle : ne jamais la remplacer par le glyphe Unicode 𝄢, dont l'alignement varie selon Firefox, Safari, Chrome et les polices installées. Les deux points doivent encadrer `p=6` via les positions `p=7` et `p=5`. Chaque commande bash de l'environnement est isolée : pas de processus de fond entre deux appels — mesurer au plancher et additionner les temps de réflexion arithmétiquement.

Bonne reprise. La règle d'or tient en une ligne : **si `npm test` est vert, les deux fichiers HTML sont identiques et les versions sont alignées, vous pouvez livrer.**
