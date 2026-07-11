# SEZAM — passation complète du chantier

Document de transmission pour l'ingénieur·e qui reprend le projet. Tout ce qu'il faut savoir pour comprendre, modifier, tester et publier sans rien casser. Lecture complémentaire dans le dépôt : `README.md` (vue courte), `FICHE-COMPLETE-JEU.md` (fonctionnement et durées humaines), `sezam-doctrine-produit.md` (vision), `AUDIT-REPARATIONS.md` (audit des corrections), `PARTIE-TEMOIN.md` (mesures du bot), `DEPLOIEMENT.md` et `GUIDE-JOUEURS.md` (mise en ligne et doc joueurs).

## 1. Le produit en trois phrases

SEZAM est une borne d'arcade musicale adaptative, offline-first, en français, destinée à ~20 joueurs (chacun sur son propre appareil, progression individuelle). Doctrine verrouillée : **1 clic → jeu** (le coach invisible choisit le mode selon la hiérarchie ERREURS→RÉPARATION, PAUSE→FLASH, sinon SESSION), et **la partition est le terrain de jeu** : le joueur conquiert des pièces réelles passage par passage, voit sa carte se colorer, pose des ambitions, et chaque fin de session montre ce qui a été gagné dans la vraie musique. Les retours bêta passent par les tickets GitHub publics du dépôt, sans adresse personnelle embarquée.

## 2. Démarrage en 5 minutes

```bash
cd ~/Documents/music
npm test                              # 466 tests moteur — DOIT afficher 0 échec
python3 -m http.server 4173           # puis ouvrir http://localhost:4173/index.html
node tests/bot_completion.cjs         # joue la partie ENTIÈRE sur le vrai moteur (~3 s)
```

Remote `origin` configuré sur `https://github.com/YoGa0208/solado.git`. Toujours vérifier `git status` avant une livraison et préparer explicitement les fichiers : les archives et le dossier d'import local sont exclus par `.gitignore`.

## 3. Inventaire du dépôt

| Fichier | Rôle |
|---|---|
| `index.html` | TOUTE l'application : HTML + CSS + JS vanilla, zéro framework, zéro build |
| `prototype-solfege.html` | Copie **byte-identique** d'index.html (historique iOS ; un test impose l'égalité stricte) |
| `sw.js` | Service worker : cache `sezam-solado-v27`, HTML réseau-d'abord, assets cache-d'abord |
| `manifest.json` | PWA installable (fond blanc, icônes SEZAM) |
| `tests/engine.test.js` | 466 tests : charge le VRAI script d'index.html dans un bac à sable Node |
| `tests/bot_completion.cjs` | Bot qui finit le jeu à 100 % (QA de profondeur/équilibrage) |
| `FICHE-COMPLETE-JEU.md` | Fiche non technique : niveaux, règles, trois fins et temps humains |
| `data/music-watch.json` | Brèves culturelles servies sur l'accueil (fallback embarqué dans index.html) |
| `scripts/build_music_watch.js` | Générateur de veille depuis flux RSS (France Musique, The Strad…) avec repli hors-ligne |
| `.github/workflows/pages.yml` | CI : npm test → build veille → déploiement GitHub Pages, cron toutes les 6 h |
| `*.md` | Docs produit/audit/passation |

## 4. Anatomie d'index.html

Un seul gros `<script>` "use strict" (précédé d'un script qrcode-generator embarqué pour le transfert QR hors-ligne). Repérez-vous par recherche de fonction, pas par numéro de ligne. Ordre des blocs :

1. **CSS** avec thèmes par variables : `:root` (Classique blanc) + `[data-theme=partition|nocturne|luthier]`. Palette : pétrole `#0f4c5c`, céramique `#7fb8c2`, or `#b8893a`.
2. **Sécurité** : `esc()` — obligatoire sur TOUTE donnée utilisateur/importée avant `innerHTML`.
3. **Dictionnaires** : `NOTES` (23 notes, `p` = position de portée, `midi`, `mn` = repère mnémotechnique), `PALIERS` (15 : P1–P10 puis boss B1–B5), `TIERS` (Zen, Bronze 2 notes/5 s, Argent 3/4 s, Vermeil 4/3 s, Or 5/2 s, Rhodium 6/1 s ; gemmes/étoiles `future:true`), `SEGMENT_STATES` (5 états), `PIECE_AMBITIONS` (4 ambitions), `CARDS`/`CARDS_TIER` (cartes-cadeaux culturelles).
4. **État & normalisation** : `DB` global ; `ensureStructure(db)` est LE point unique de normalisation (migrations historiques + schéma 11 inclus — ne jamais supprimer ces branches). Les normaliseurs assainissent aussi les maps, séries, étoiles, brouillons quotidiens et pièces jointes de tout import.
5. **Stockage 3 filets** : localStorage `solfegeProto1` + `_mirror` + `_checkpoint` synchronisés sur le dernier état validé, IndexedDB `soladoBackup` lu avant sa première écriture, et Gist GitHub optionnel avec détection des divergences.
6. **Moteurs** (voir §5) puis **écrans** : `scrHome` (cockpit), `scrEx` (jeu), `scrRes` (résultat + bilan partition), `scrStats`, `scrPieces` (liste), `scrPiece` (fiche d'une pièce), `scrKbd` (clavier, module isolé `KX`).
7. **SVG** : `staffSVG` (portée de jeu) et `pieceMapSVG` (carte de conquête multi-systèmes, passages teintés par état, halos dorés sur notes travaillées, zones tactiles `data-seg`).
8. **Audio** WebAudio (timbre corde frappée, compresseur maître) — tout est try/catch, fonctionne sans AudioContext.
9. **Liaisons** boutons + boot : `load()` prépare l'état local, `idbRescue()` lit d'abord le secours persistant, puis seulement l'accueil, la veille, la récupération et la synchro démarrent ; les filets `pagehide`/`error`/`unhandledrejection` sauvegardent en dernier recours.

## 5. Les moteurs de jeu

**Coach (`coachDecision`)** — hiérarchie VERROUILLÉE par tests : ≥2 erreurs récentes ou ≥2 notes en réparation → RÉPARATION ; pause longue (>5 j, `LONG_BREAK_MS`) → FLASH ; sinon SESSION. Le bouton JOUER passe par `startCoachPlay(force?)`.

**Séance quotidienne (`dailyPlan` + `buildDailySession`)** — un seul bouton orchestre, dans le temps choisi, 20 % de rappel à froid, 60 % de cible, 10 % de réparation et 10 % de transfert. Chaque tranche persistante de 10 questions Cible admissibles devient une preuve de validation. Une tranche incomplète survit à la fin du chrono ; après validation, le moteur sélectionne le palier suivant, puis P1 du grade supérieur après B5. Le chronomètre se suspend en arrière-plan, n'ouvre plus de question après l'échéance et ne marque la séance terminée qu'après 10 vraies questions musicales. Une fin anticipée conserve un bilan partiel. Le tempo du niveau reste contrôlé pendant la cible. Une fois mission et transfert terminés, `dailyBonusTask` sert des eggs facultatifs au lieu de laisser un temps mort. `solveBonusEgg` attribue de petits XP une fois par jour sans toucher aux preuves, au SRS ou à la maîtrise.

**Progression paliers** — `checkValidation` : 3 séries consécutives avec ≤1 erreur au total, OU 5 séries dans la semaine avec ≤2, avec couverture de toutes les notes. Les questions de réparation/transfert sont exclues des preuves de validation. Un tier n'est débloqué que si le précédent est complet partout (`tierUnlocked`/`tierComplete`). SRS Leitner 5 boîtes (`srsReview`, délais 1/3/7/16/30 j) : seule une réussite réellement due augmente la boîte. Étoiles = revalidation calendaire après Rhodium ; les échéances cumulées sont J+7, J+37, J+127, J+307 et J+672.

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

1. `index.html` strictement égal à `prototype-solfege.html` → `cp index.html prototype-solfege.html` avant tout commit.
2. `APP_VERSION` (index.html) == numéro de `CACHE_NAME` (sw.js). Bump LES DEUX à chaque livraison (actuel : v27 / `sezam-solado-v27`).
3. Clés de stockage intouchables : `solfegeProto1*`, `soladoBackup`, gist `sezam-progress.json` (+ lecture legacy `solado-save.json`). Une progression ne se réinitialise JAMAIS.
4. Toute note d'un passage appartient au palier annoncé par ce passage (garde-fou pédagogique).
5. Bibliothèque : domaine public uniquement, mélodies JUSTES (l'incipit d'Ode main gauche est verrouillé par test — on a déjà eu un mode lydien accidentel).
6. `esc()` sur toute donnée non maîtrisée avant `innerHTML` ; ids passés au SVG filtrés par `cleanId`.
7. Le token de synchro n'apparaît jamais dans exports/QR/Gist/cloudDocument.
8. Hiérarchie du coach intouchable ; un appareil vierge n'écrase jamais une progression distante et deux appareils divergents déclenchent un conflit sans remplacement (`syncDecision`).
9. Pas de dépendance d'exécution, pas de build, offline complet.
10. Ton éditorial : journaliste scientifique, jamais scolaire (des tests interdisent le retour des libellés type « Culture générale », « En bref. », dates SEZAM·04/07).

## 7. Tests — comment ça marche

`tests/engine.test.js` lit index.html, extrait le script principal, l'évalue dans `new Function(document, localStorage, navigator, window)` avec des stubs, et exporte les fonctions RÉELLES via un footer. Zéro logique dupliquée : si l'app casse, les tests cassent. Pour tester une nouvelle fonction : l'ajouter à `exportsList`. Piège : les `setTimeout` du jeu sont réels dans le harnais — pour avancer une série, appeler `E.nextQuestion()` quand `EX.waiting` (voir le groupe « jouer un passage »). Le bot (`tests/bot_completion.cjs`) a son propre loader qui NEUTRALISE les timers — c'est l'outil pour toute question d'équilibrage (il imprime séries/questions/XP/temps par grade).

## 8. PWA & offline

`sw.js` : navigations → réseau d'abord avec repli cache (jamais de vieille version à vie) ; assets → cache d'abord avec refresh en fond ; cross-origin ignoré (l'API GitHub de la synchro ne doit pas être interceptée). Le nettoyage vise uniquement les clés préfixées `sezam-solado-`, jamais les caches d'une autre app du même domaine. Mise à jour : bump `sezam-solado-vXX` → `skipWaiting`+`clients.claim` livrent la nouvelle version au chargement suivant.

## 9. Synchronisation (optionnelle, par joueur)

Trois niveaux : localStorage (immédiat) → IndexedDB (secours) → Gist secret GitHub. Le Gist n'est pas indexé mais reste accessible avec son lien et possède un historique. Le joueur colle un token minimal (scope gist), gardé uniquement dans une variable JavaScript jusqu'au rechargement ; `syncEnsure` retrouve ou crée le Gist. Les pièces jointes et le journal d'événements ne partent pas dans le cloud. Chaque envoi fait GET → comparaison → PATCH ; un distant illisible n'est jamais écrasé et une divergence entre deux appareils bloque le remplacement en demandant d'abord des exports. `looksLikeToken` n'accepte que `ghp_` et `github_pat_`.

## 10. Veille culturelle

L'accueil affiche 4 brèves (`watchHomeItems` remonte toujours une « Histoire de l'art »). Source : `data/music-watch.json`, régénéré en CI par `scripts/build_music_watch.js` (RSS ; en sandbox sans réseau il retombe proprement sur la base seed). Brèves ≤5 phrases, fiche longue au clic, lien source ouvert uniquement si http(s).

## 11. Publication — étape restante

Le workflow Pages est prêt et testé. La livraison passe par une branche et une demande de fusion vers `main`, sans réécrire l'historique distant. Après fusion, vérifier l'onglet Actions puis `https://yoga0208.github.io/solado/`. Détail pas-à-pas dans `DEPLOIEMENT.md`.

## 12. Historique des commits (main)

`b764efb` app initiale → `3abf20c` ton éditorial veille → `0011332` checkpoint anti-régression → `db861d1` cockpit + ModeSelector verrouillé → `6f00014` **partition = terrain de jeu** (carte, ambitions, bilan, bibliothèque, v21) → `c434146` audit complet (12 réparations, dont justesse musicale) → `34c8c72` partie témoin + trophées d'œuvres. Auteur git configuré à la volée (`-c user.name=… -c user.email=…`) — configurez le vôtre.

## 13. Chiffres utiles pour décider (partie témoin, détail dans PARTIE-TEMOIN.md)

Finir la campagne et la bibliothèque = 90 validations + 30 passages Maîtrisés : 330 séries, 3 208 questions et 9 711 réponses dans la partie parfaite de référence. Le plancher mécanique mesuré par le bot est 2 356,48 s, soit 39,27 min ; la maîtrise des passages impose néanmoins au moins 20 h de calendrier. Estimation humaine : route directe 10–14 h pour un intermédiaire ou 22–30 h pour un débutant ; séance quotidienne complète 15–20 h ou 35–45 h. Le prestige absolu demande 75 révisions et arrive au plus tôt 672 jours après le dernier Rhodium. Voir `FICHE-COMPLETE-JEU.md` pour les hypothèses et la conversion en jours de pratique.

## 14. Roadmap proposée (non engagée)

P2 : meilleur temps personnel par palier aux tiers chronométrés ; une pièce surprise débloquée par tier complété ; saisie de mélodie pour les partitions perso via l'UI (aujourd'hui : import JSON seulement). P3 : mission du jour alternée paliers/partition ; célébration visuelle à la promotion Maîtrisé ; deux portées simultanées ; profils multiples par appareil (écarté pour la v1 : chacun son appareil).

## 15. Pièges d'environnement rencontrés (si vous outillez pareil)

Le montage Cowork protège certaines suppressions (`.git/index.lock` : passer par l'autorisation de suppression avant `rm`). La clé de fa est vectorielle : ne jamais la remplacer par le glyphe Unicode 𝄢, dont l'alignement varie selon Firefox, Safari, Chrome et les polices installées. Les deux points doivent encadrer `p=6` via les positions `p=7` et `p=5`. Chaque commande bash de l'environnement est isolée : pas de processus de fond entre deux appels — mesurer au plancher et additionner les temps de réflexion arithmétiquement.

Bonne reprise. La règle d'or tient en une ligne : **si `npm test` est vert, les deux fichiers HTML sont identiques et les versions sont alignées, vous pouvez livrer.**
