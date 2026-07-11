# SEZAM — entraînement musical

Borne d'arcade musicale adaptative, offline-first, où **la partition est le terrain de jeu**. Le joueur conquiert ses pièces passage par passage; le coach invisible choisit le bon mode (Réparation > Flash > Session); chaque fin de session montre ce qui a été gagné dans la vraie musique.

Chaque joueur peut régler son instrument, son niveau, son parcours, sa date cible, son temps disponible, sa cadence et les domaines à travailler. SEZAM compose alors un plan quotidien stable : 40 % de lacunes, 30 % de révisions, 20 % de nouveauté et 10 % de mini-test, avec un passage de l'œuvre active pour les séances longues. Les exercices de lecture sont vérifiés par l'app ; les missions hors écran sont explicitement indiquées et peuvent être marquées comme faites.

## Architecture

Un seul fichier applicatif: `index.html` (HTML + CSS + JS, zéro dépendance d'exécution). `prototype-solfege.html` en est la copie strictement identique (vérifié par test). PWA installable (`manifest.json`, `sw.js`), veille culturelle statique (`data/music-watch.json`, régénérée par `scripts/build_music_watch.js`).

### Moteurs

- **Decision Engine** (`coachDecision`): hiérarchie verrouillée ERROR→REPAIR, PAUSE→FLASH, PERF→SESSION.
- **Daily Planner** (`dailyPlan`): quatre profils de parcours, budget en minutes, échéance, lacunes/SRS, domaines et œuvre active. Dans cette version, le parcours, l'instrument et le niveau décrivent le profil ; l'adaptation mesurée porte sur le temps, les acquis et les domaines.
- **Partition Engine**: pièces avec mélodies réelles (`PIECES_BUILTIN`), passages ancrés sur les mesures (`mesFrom`/`mesTo`), 5 états (À découvrir, En travail, Fragile, Validé, Maîtrisé), ambitions du joueur, carte de conquête SVG (`pieceMapSVG`).
- **Session scriptée**: jouer un passage = lire ses notes dans l'ordre réel (`segmentScript`); un passage fragile repasse en réparation pondérée SRS.
- **Storage Engine**: localStorage (3 filets: clé, miroir, checkpoint jamais dégradé) + IndexedDB + Gist secret GitHub optionnel. Le token reste en session, les pièces jointes restent locales. Clés historiques intouchables: `solfegeProto1`, `soladoBackup`, `sezam-progress.json`.

## Développement

```bash
npm test            # 330 tests moteur (charge le vrai script d'index.html, zéro duplication)
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

GitHub Pages via `.github/workflows/pages.yml` (tests → veille → déploiement, cron 6 h). Voir `DEPLOIEMENT.md` pour la mise en ligne et `GUIDE-JOUEURS.md` pour le document à envoyer aux joueurs.

Version publique visée : `https://yoga0208.github.io/solado/`. Voir aussi `PERSONNALISATION.md` pour le périmètre pédagogique actuel et les prochaines extensions.

Composant tiers embarqué : voir `THIRD_PARTY_NOTICES.md`. Aucune licence générale du projet n'est accordée à ce stade.
