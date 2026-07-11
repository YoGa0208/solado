# Rapport de test complet — SEZAM

Date: 2026-07-04

## Méthode

Test réalisé comme parcours utilisateur sur les états visuels générés dans `output/playwright/`.

Captures consultées:
- `sezam-cockpit-home.png`
- `sezam-cockpit-play.png`
- `sezam-cdp-03-prep.png`
- `sezam-cdp-05-wrong.png`
- `sezam-cdp-06-result.png`

Vérification moteur relancée avec le Node embarqué Codex:

`153` tests réussis / `0` échec.

Lecture des scores: les scores UX montent avec la qualité perçue. La charge mentale monte avec l'effort demandé.

## Synthèse exécutive

SEZAM fonctionne déjà comme une borne musicale très proche du bon format: une action centrale, une question lisible, des réponses larges, une correction claire, une progression visible, puis un appel direct à rejouer.

Le cockpit d'accueil réussit son objectif principal. Le bouton `JOUER` domine le premier écran, le mode recommandé apparaît avant toute distraction, et l'utilisateur comprend vite que la prochaine action consiste à lancer une courte session.

Le point de friction majeur se situe dans le sas de préparation et dans la compréhension fine de la progression. Le jeu démarre facilement, puis il gagne à raccourcir le trajet entre `JOUER` et la première note. La règle `0/3 séries propres` mérite une traduction immédiate en objectif concret.

## Scénario 1 — Première ouverture

Observation utilisateur:

L'écran d'accueil donne une lecture immédiate: `JOUER` occupe la zone principale, le mode recommandé indique `Flash`, le palier courant apparaît, et la session courte annonce `7 questions`. Les blocs `Progression`, `Mémoire` et `Notes fragiles` rassurent sur l'état du joueur. Le bouton principal présente une hiérarchie très nette.

Temps avant première action estimé: 1 à 2 secondes.

| Critère | Score |
|---|---:|
| Compréhension immédiate | 9/10 |
| Fluidité du jeu | 8/10 |
| Charge mentale | 2/10 |
| Clarté du bouton principal | 10/10 |
| Motivation à continuer | 8/10 |

Diagnostic:

Le premier écran répond vite à la question centrale: que faire maintenant ? L'utilisateur voit une action unique et crédible. Le vocabulaire `Flash`, `Palier`, `Zen` garde une petite part d'apprentissage, mais le bouton principal porte correctement l'action.

## Scénario 2 — Première session de jeu

Observation utilisateur:

Le lancement mène vers une phase de préparation pédagogique, puis vers une question musicale simple. L'écran de jeu affiche une portée large, une note centrale, une barre de progression et des boutons de réponse faciles à toucher. La règle implicite se comprend par la question `Quelle est cette note ?`.

Le rythme devient bon dès la première vraie question. Le sas de préparation apporte un contexte utile, mais il allonge le chemin d'entrée. Le joueur veut probablement toucher `JOUER`, puis lire la note très vite.

| Critère | Score |
|---|---:|
| Compréhension immédiate | 8/10 |
| Fluidité du jeu | 7/10 |
| Charge mentale | 4/10 |
| Clarté du bouton principal | 8/10 |
| Motivation à continuer | 8/10 |

Diagnostic:

La règle du jeu se comprend par l'interface. Le meilleur gain UX consiste à compacter la préparation en une carte courte, puis à placer la première question dans le flux immédiat.

## Scénario 3 — Erreur utilisateur

Observation utilisateur:

Une erreur déclenche un état de correction visible: croix sur la portée, rappel de la réponse attendue, repère musical, bouton `J'ai lu la correction`. Le système transforme l'erreur en apprentissage guidé. Le bouton de validation protège le joueur contre un enchaînement trop rapide.

Après plusieurs erreurs, la quantité de texte et la présence continue des boutons de réponse peuvent augmenter la charge mentale. Un mode `Réparation` plus focalisé pourrait isoler la correction et calmer l'écran.

| Critère | Score |
|---|---:|
| Compréhension immédiate | 8/10 |
| Fluidité du jeu | 7/10 |
| Charge mentale | 5/10 |
| Clarté du bouton principal | 8/10 |
| Motivation à continuer | 7/10 |

Diagnostic:

La réaction du système est saine et pédagogique. La correction fonctionne mieux quand elle devient une micro-mission très courte: revoir la note, confirmer la compréhension, rejouer vite.

## Scénario 4 — Progression

Observation utilisateur:

L'écran de résultat affiche le score `8/10`, la précision, le temps moyen par question, le niveau `Zen`, les corrections, puis la progression de validation `0/3 séries propres`. Le bouton `Encore une série` donne une sortie naturelle vers la boucle suivante.

La motivation à rejouer existe, car l'utilisateur voit ses erreurs et reçoit une action directe. La règle de validation gagne à être explicitée sous forme de prochaine étape: combien de séries propres restent à faire, et quel score compte comme série propre.

| Critère | Score |
|---|---:|
| Compréhension immédiate | 7/10 |
| Fluidité du jeu | 8/10 |
| Charge mentale | 4/10 |
| Clarté du bouton principal | 9/10 |
| Motivation à continuer | 8/10 |

Diagnostic:

La progression est lisible au niveau global. Elle deviendra plus motivante avec une phrase de prochaine étape, par exemple: `Encore 3 séries à 9/10 ou 10/10 pour ouvrir P2`.

## Scénario 5 — Retour utilisateur

Observation utilisateur:

Au retour, le cockpit reconnaît l'état joueur: XP, jours, palier courant, mode recommandé, mémoire, notes fragiles. Le mode `Flash recommandé` propose une reprise courte. La mention `Zone stable` dans les notes fragiles rassure, et le bouton `JOUER` reste central.

La reprise est facile. Le mode proposé automatiquement serait encore plus fort avec une raison courte: `Flash recommandé car tu es sur P1 et ta mémoire est stable`.

| Critère | Score |
|---|---:|
| Compréhension immédiate | 8/10 |
| Fluidité du jeu | 9/10 |
| Charge mentale | 3/10 |
| Clarté du bouton principal | 10/10 |
| Motivation à continuer | 8/10 |

Diagnostic:

SEZAM retrouve bien le joueur et propose une action pertinente. La prochaine amélioration consiste à rendre la recommandation auto plus explicite.

## Scoring global

| Scénario | Compréhension | Fluidité | Charge mentale | Bouton principal | Motivation |
|---|---:|---:|---:|---:|---:|
| Première ouverture | 9 | 8 | 2 | 10 | 8 |
| Première session | 8 | 7 | 4 | 8 | 8 |
| Erreur utilisateur | 8 | 7 | 5 | 8 | 7 |
| Progression | 7 | 8 | 4 | 9 | 8 |
| Retour utilisateur | 8 | 9 | 3 | 10 | 8 |

Moyennes:

| Critère | Moyenne |
|---|---:|
| Compréhension immédiate | 8.0/10 |
| Fluidité du jeu | 7.8/10 |
| Charge mentale | 3.6/10 |
| Clarté du bouton principal | 9.0/10 |
| Motivation à continuer | 7.8/10 |

## 1. Problèmes critiques

### Compréhension

Le vocabulaire `Flash`, `Palier`, `Zen`, `séries propres` arrive très tôt. L'action reste claire grâce au bouton, mais la logique complète demande une seconde lecture.

### Jeu

Le trajet `JOUER` vers première note passe par une préparation assez longue. Une borne arcade gagne avec un démarrage plus direct.

### Progression

`0/3 séries propres` indique une mesure, mais l'utilisateur a besoin d'une phrase d'objectif immédiat: score attendu, nombre de séries restantes, palier ouvert ensuite.

### Erreur

Les erreurs sont bien expliquées. Après plusieurs erreurs, l'écran peut se densifier. Le mode correction mérite un cadrage plus focalisé.

### Retour utilisateur

Le retour fonctionne. La recommandation automatique gagnerait à afficher sa raison en une ligne.

## 2. Problèmes moyens

### Surcharge visuelle

Le cockpit d'accueil est bien hiérarchisé. Les zones éditoriales et rituelles deviennent plus lourdes dans la préparation longue, surtout sur mobile.

### Manque de clarté

Les règles internes de validation restent implicites. La progression utilise de bons indicateurs, puis elle gagnerait à traduire chaque indicateur en prochaine action.

### Friction dans les transitions

Le passage `Accueil -> Préparation -> Question -> Correction -> Résultat` fonctionne. La transition d'entrée gagnerait à être plus courte, et la transition d'erreur gagnerait à devenir une micro-mission de réparation.

## 3. Points forts

### Fluidité du jeu

La portée est grande, la note est lisible, les boutons de réponse sont larges, la barre de progression donne un rythme clair, et le résultat relance directement une série.

### Envie de rejouer

Le bouton `Encore une série` donne une boucle naturelle. Les corrections concrètes transforment les erreurs en matière de progression. Les paliers créent un objectif de maîtrise.

### Éléments déjà optimaux

Le bouton principal d'accueil est excellent. Le feedback d'erreur est utile. Le moteur de progression est robuste avec `153` tests réussis. Le système de sauvegarde et de sync est couvert par les garde-fous moteur.

## 4. Diagnostic produit

SEZAM est-il compréhensible en 2 secondes ?

Oui pour l'action centrale. L'utilisateur comprend vite qu'il doit appuyer sur `JOUER`. La compréhension complète du vocabulaire demande une courte familiarisation.

SEZAM est-il jouable en 1 clic ?

Presque. Le premier clic lance le bon flux. La vraie sensation arcade arrivera quand la première note apparaîtra plus vite après `JOUER`.

SEZAM est-il rejouable naturellement ?

Oui. L'écran résultat, le bouton `Encore une série`, le mode Flash et la mémoire du joueur forment une boucle de retour convaincante.

SEZAM est-il stable dans la progression ?

Oui. Les tests moteur valident progression, SRS, sauvegarde, sync, paliers, clavier, trophées, veille musicale et garde-fous de livraison.

## 5. Liste priorisée d'améliorations

### P1 — Critique

1. Raccourcir le sas de préparation pour afficher la première note plus vite.
2. Ajouter une phrase de prochaine étape sur l'écran résultat: `Encore 3 séries à 9/10 ou 10/10 pour ouvrir P2`.
3. Transformer les erreurs répétées en mode `Réparation` ciblé avec une note, un repère, une confirmation, puis reprise.

### P2 — Important

1. Expliquer la recommandation automatique en une ligne: `Flash recommandé car ta mémoire est stable`.
2. Griser les réponses pendant la correction et donner toute la hiérarchie au bouton de validation.
3. Réduire la préparation mobile à une carte compacte avec note, objectif et action.
4. Placer la culture musicale comme récompense après session ou comme carte secondaire.

### P3 — Optimisation

1. Ajouter une micro-animation sobre sur bonne réponse, erreur réparée et série propre.
2. Mesurer `temps avant première action`, `temps avant première note`, `taux de relance après résultat`.
3. Optimiser le desktop avec trois zones: état joueur, jeu central, mémoire/culture.
4. Ajouter une indication courte de rythme: `7 questions, environ 60 secondes`.

## Verdict

SEZAM valide l'essentiel: il est intuitif, rapide à relancer, pédagogiquement solide et techniquement stable.

La prochaine itération doit concentrer l'expérience sur trois promesses:

1. Entrer et jouer très vite.
2. Comprendre chaque erreur comme une mini-réparation.
3. Voir immédiatement la prochaine marche de progression.

Avec ces ajustements, SEZAM peut se comporter pleinement comme une borne de jeu musicale: claire en accueil, directe en action, gratifiante en progression, naturelle au retour.
