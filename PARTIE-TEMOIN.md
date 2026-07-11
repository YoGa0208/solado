# SEZAM — partie témoin complète (du premier JOUER au 100 %)

J'ai joué la partie entière sur le vrai moteur (profil vierge, bot branché sur les fonctions réelles du jeu — `tests/bot_completion.cjs`, rejouable). Aucune triche d'état : chaque question a été répondue, chaque série validée par la vraie règle des « 3 séries propres ».

## Ce qu'il faut jouer pour « finir »

| Contenu | Volume |
|---|---|
| Validations de paliers | 90 (15 paliers × 6 niveaux Zen→Rhodium) |
| Séries de paliers | 270 minimum (3 propres par validation) |
| Passages de partition | 34, tous portés à **Maîtrisé** (8 pièces) |
| Lectures de partition | 60 minimum |
| Questions posées | 3 208 |
| Notes lues (réponses) | **10 386** |
| Récolte | 13 108 XP · code B5+ · 8 ambitions ★ · 5 trophées immédiats |

Les étoiles (75) restent volontairement hors d'atteinte rapide : revalidations à J+7, +30, +90, +180, +365. Le 100 % absolu est calendaire : **≥ 612 jours**, quel que soit le talent. C'est l'axe rétention, pas l'axe complétion.

## Mon temps

- **Moteur pur : 2,8 secondes** (10 386 réponses justes, zéro erreur).
- Au **plancher mécanique** de l'app réelle (délais de feedback incompressibles, réponses instantanées, mesuré en navigateur : série Zen 4,5 s, Bronze 8,0 s, passage 2,6 s) : **≈ 45–55 minutes**. C'est la borne physique absolue du jeu.

## Conversion humaine (modèle transparent)

`temps par série = réponses × réflexion + délais d'avance + 8 s de résultat/relance`, réflexion bornée par le chrono du niveau, multipliée par un facteur d'essais (la règle « 3 séries propres consécutives » fait rejouer ; les réparations s'intercalent).

| Niveau | Réflexion/note | Série | Facteur essais | Temps |
|---|---|---|---|---|
| Zen | 2,5 s | ~37 s | ×1,3 | ~36 min |
| Bronze (5 s/note) | 2,2 s | ~59 s | ×1,5 | ~1 h 07 |
| Argent (4 s) | 1,8 s | ~69 s | ×1,7 | ~1 h 28 |
| Vermeil (3 s) | 1,5 s | ~75 s | ×2,0 | ~1 h 52 |
| Or (2 s) | 1,2 s | ~75 s | ×2,5 | ~2 h 21 |
| Rhodium (1 s) | 0,85 s | ~66 s | ×3,2 | ~2 h 38 |
| Bibliothèque (90 lectures + bilans) | 2,5 s | ~59 s | — | ~1 h 30 |
| Accueil, cartes, veille, réglages | | | | ~1 h |

**Total apprenant réaliste : ≈ 12 h 30 (± 2 h) → à 30 min/jour : ≈ 25 jours de jeu, soit 4 à 6 semaines réelles.**
Lecteur déjà aguerri : ≈ 6 h → 12 jours. Moi : 2,8 s.

Autre lecture : 1 seconde de bot ≈ 9 jours de pratique humaine assidue.

## Les ressorts, vécus depuis l'intérieur d'une session de 30 min

**Semaine 1 (Zen).** Densité de récompense excellente : validation de P1 en 6–10 min, carte-cadeau culturelle, badge du jour (3 séries), premier passage de partition qui verdit sur la carte (+15 XP), ambition posée. Un événement gratifiant toutes les 40–90 secondes. Le bilan « Dans ta partition » donne du **sens** à chaque série — c'est le ressort le plus fort du jeu : on ne gagne pas des points, on gagne de la musique.

**Semaines 2–4 (Bronze→Vermeil).** Tension courte bien construite (« 1/3 → 2/3 → validé »), une validation toutes les 10–15 min, promotions de passages intercalées. **Fragilité identifiée : le grind.** Finir = rejouer 6 fois les mêmes 15 paliers ; le chrono change le geste (lecture → réflexe) mais pas le contenu. La bibliothèque est l'antidote naturel — elle doit rester au premier plan.

**Fin de partie (Or/Rhodium).** Le chrono fait échouer : des sessions à zéro validation deviennent possibles. Filets existants : Réparation (victoire latérale garantie), partitions, rafale. **Fragilité identifiée : disette de récompense pour qui échoue au chrono.**

**Marathon.** Aucune barrière calendaire avant les étoiles : un expert peut « finir » en un week-end. Assumé (liberté du joueur) ; la mission du jour, les streaks et les étoiles portent la longévité.

## Réparé immédiatement (trouvé en jouant)

Maîtriser une pièce — l'accomplissement central du jeu — ne donnait **aucun trophée**. Ajouté et testé : **« Première œuvre »** (1 pièce entièrement maîtrisée) et **« Bibliothèque »** (les 8). Suite : 289 tests, 0 échec.

## Recommandations (non implémentées, par priorité)

- **P2 — meilleur temps personnel par palier** aux niveaux chronométrés : une micro-victoire à chaque série, même sans validation (répond à la disette Or/Rhodium).
- **P2 — une pièce surprise débloquée à chaque niveau complété** : du contenu neuf contre le grind (le domaine public est infini).
- **P3 — mission du jour alternée** (un jour paliers, un jour partition) ; célébration visuelle à la promotion Maîtrisé (la fanfare sonore existe déjà).

Les hypothèses de réflexion/erreur sont des estimations honnêtes ; les vrais chiffres viendront des ~20 joueurs (le journal local `events` les capture déjà : série par série, erreurs, abandons, retours).
