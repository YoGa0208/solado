# SEZAM — entraînement musical

Borne d'arcade musicale adaptative, offline-first, où **la partition est le terrain de jeu**. Le joueur conquiert ses pièces passage par passage; le coach invisible choisit le bon mode (Réparation > Flash > Session); chaque fin de session montre ce qui a été gagné dans la vraie musique.

Chaque joueur peut régler son instrument, son point de départ déclaré, son intention et sa cadence. La v39 ajoute un rendez-vous quotidien clair : avant de jouer, le joueur indique son humeur — Concentré, Calme, Joueur ou Fatigué — et le temps dont il dispose, parmi 10, 15, 20 ou 30 minutes. Ce temps est un repère, pas un raccourci pédagogique : la mission du jour comporte 25 questions et le sceau quotidien n'est gagné qu'au terme des 25 questions.

Dans le parcours d'acquisition, une étape contient exactement 25 questions. Il faut réussir trois séries de 25 sans erreur avant qu'une nouvelle note soit ajoutée ; un item comporte au maximum 12 étapes. Une erreur nourrit la réparation mais ne fait pas avancer l'étape. Les séries parfaites déjà acquises restent protégées.

Depuis la v28, plusieurs personnes peuvent utiliser le même appareil. Le bouton du joueur sur l'accueil permet de créer puis de changer de profil en un geste. XP, paliers, mémoire espacée, erreurs, calendrier, réglages et partitions restent strictement séparés ; la progression v27 existante devient automatiquement le premier joueur, sans remise à zéro.

La v29 prépare l'évolution vers un cursus musical plus large sans sur-promettre : le module actuel évalue la lecture des notes, qui contribue au Cycle 1 mais ne le valide pas. Un référentiel versionné décrit désormais les Cycles 1 à 3, leurs domaines, prérequis et types de preuve. Les futurs résultats sont isolés par joueur dans les exports, QR et sauvegardes cloud.

La v39 transforme chaque journée de pratique en mission. Une mission quotidienne terminée donne un sceau, +20 XP, une célébration visuelle et sonore, ainsi qu'une sauvegarde complète numérotée. Chaque dixième mission accomplie clôt une série de dix jours. Sept sceaux gagnés du lundi au dimanche ouvrent le **Défi des défis** : 25 questions, une Couronne à partir de 20 bonnes réponses et +100 XP. Un échec ne retire ni les sceaux ni le droit de rejouer le défi.

Chaque écran secondaire offre un accès direct à **Accueil**. Les fenêtres disposent toujours de **Retour**, **Accueil** et **Sauvegarder**. Le calendrier musical inscrit cours, répétitions, auditions, concerts, examens et indisponibilités ; le Coach adapte localement la priorité et le temps proposé sans modifier les critères d'acquisition. Les rendez-vous actifs s'exportent en `.ics` vers Calendrier sur iPhone ou iPad. Aucune humeur ni date n'est envoyée à une IA externe ; elles rejoignent la sauvegarde cloud seulement si le joueur active volontairement la synchro GitHub.

## Taille du parcours

- 6 grades de maîtrise, de Zen à Rhodium ;
- 15 paliers par grade : 5 Sol, 5 Fa et 5 Deux clés ;
- 90 validations pour finir la campagne ;
- 8 pièces jouables, 30 passages et 60 lectures propres pour maîtriser la bibliothèque ;
- partie témoin historique v29 : 330 séries, 3 208 écrans-question, 9 711 réponses et 39,27 min de délais mécaniques — repère comparatif, pas minimum v39 ;
- prestige absolu : 75 révisions d'étoile, atteignable au plus tôt 672 jours après le dernier Rhodium.

Les estimations humaines historiques dépendaient fortement du niveau initial : environ 10–14 h en route directe pour un lecteur intermédiaire, 22–30 h pour un débutant, davantage avec l'ancienne séance quotidienne complète. Elles doivent être remesurées sur des parties v39 ; leurs hypothèses sont détaillées dans [FICHE-COMPLETE-JEU.md](FICHE-COMPLETE-JEU.md).

Cette campagne n'est pas un cursus officiel. Le parcours musical complet du Cycle 1 à la fin du Cycle 3 s'étend normalement sur **8 à 14 ans** ; le complément numérique envisagé représente environ **200 à 560 heures actives** réparties sur ces années. Le cadrage, les sources et la feuille de route sont détaillés dans [CURSUS-CYCLES-1-3.md](CURSUS-CYCLES-1-3.md).

## Architecture

Un seul fichier applicatif: `index.html` (HTML + CSS + JS, zéro dépendance d'exécution). `prototype-solfege.html` en est la copie strictement identique (vérifié par test). PWA installable (`manifest.json`, `sw.js`), veille culturelle statique (`data/music-watch.json`, régénérée par `scripts/build_music_watch.js`) et référentiel pédagogique versionné (`data/curriculum-v1.json`).

### Moteurs

- **Decision Engine** (`coachDecision`): hiérarchie verrouillée ERROR→REPAIR, PAUSE→FLASH, PERF→SESSION, avec file persistante des confusions réellement observées.
- **Mission quotidienne** (`dailyCoachContext`, `dailyDecision`, `dailyPlan`, `buildDailySession`) : contrat de 25 questions, avec temps indicatif, rappel à froid, cible, réparation et transfert. L'humeur et les rendez-vous adaptent la forme de la séance, jamais les règles d'acquisition. Une pratique interrompue est conservée sans sceau ; une mission complète donne un sceau, +20 XP et une sauvegarde protégée.
- **Parcours d'acquisition** (`courseDecision`, `advanceCourseExercise`) : trois séries parfaites de 25 questions par étape, une seule nouveauté ajoutée à la fois et 12 étapes maximum par item. Une erreur bloque la série en cours sans effacer les séries parfaites antérieures.
- **Engagement Engine** (`grantDailyMissionReward`, `reconcileEngagement`, `grantWeeklyChallengeResult`) : récompenses quotidiennes idempotentes, finale tous les dix jours, sept sceaux dans une même semaine pour ouvrir le Défi des défis, puis Couronne à partir de 20/25.
- **Bonus Engine** (`dailyBonusTask`, `awardEasterEgg`): réinvestit la fin de séance avec des secrets non évalués, récompensés une seule fois par jour. La clé de fa normale est vectorielle et stable ; sa version déplacée n'existe que dans l'egg « Œil du copiste ».
- **Memory Engine** (`srsReview`): cinq boîtes espacées à 1, 3, 7, 16 et 30 jours. Une réponse anticipée ou une réparation immédiate consolide sans augmenter artificiellement la stabilité.
- **Partition Engine**: pièces avec mélodies réelles (`PIECES_BUILTIN`), passages ancrés sur les mesures (`mesFrom`/`mesTo`), 5 états (À découvrir, En travail, Fragile, Validé, Maîtrisé), ambitions du joueur, carte de conquête SVG (`pieceMapSVG`).
- **Session scriptée**: jouer un passage = lire ses notes dans l'ordre réel (`segmentScript`); un passage fragile repasse en réparation pondérée SRS.
- **Player & Storage Engine**: registre familial local, cache triple du joueur actif et coffre IndexedDB distinct pour chaque joueur. Le changement est transactionnel : le joueur courant est mis à l'abri avant le chargement du suivant. Imports et annulations restent limités au joueur actif. Chaque joueur possède aussi sa configuration et son fichier Gist ; une réponse réseau tardive de l'ancien joueur est ignorée. Le token reste en session et les pièces jointes restent locales. Les clés historiques `solfegeProto1` et l'ancien coffre `save` restent lus pour migrer la v27.
- **Curriculum foundation** : catalogue JSON Cycles 1→3, neuf domaines, graphe de prérequis et six types de preuve. Les statuts distinguent strictement « disponible et évalué », « guidé non évalué » et « prévu » ; aucun score de cycle officiel n'est inventé.

## Développement

```bash
npm test            # 34 000+ contrôles moteur (charge le vrai script d'index.html, zéro duplication)
npm run serve       # http://localhost:4173
npm run build:watch # régénère la veille musicale (fallback hors-ligne intégré)
```

## Règles de contribution

1. `npm test` doit rester à 0 échec.
2. Toute note d'un passage doit appartenir à son palier (testé).
3. Incrémenter ensemble `APP_VERSION` (index.html) et `sezam-solado-vXX` (sw.js).
4. `cp index.html prototype-solfege.html` avant commit.
5. Jamais toucher aux clés de stockage ni réinitialiser une progression.
6. Bibliothèque: uniquement des mélodies du domaine public, justes (tonalité/mode vérifiés par test).

## Publication

GitHub Pages via `.github/workflows/pages.yml` (tests → veille → déploiement, cron 6 h). Voir `DEPLOIEMENT.md` pour la mise en ligne, `GUIDE-JOUEURS.md` pour le document à envoyer aux joueurs, `FICHE-COMPLETE-JEU.md` pour le fonctionnement intégral du jeu et `CURSUS-CYCLES-1-3.md` pour le développement pédagogique futur.

Version publique visée : `https://yoga0208.github.io/solado/`. Voir aussi `PERSONNALISATION.md` pour le périmètre pédagogique actuel et les prochaines extensions.

Composant tiers embarqué : voir `THIRD_PARTY_NOTICES.md`. Aucune licence générale du projet n'est accordée à ce stade.
