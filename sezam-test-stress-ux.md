# SEZAM — Test utilisateur + stress UX + diagnostic produit

Date: 2026-07-04

## Methode

Parcours execute en navigateur Chrome local via Playwright, avec serveur local temporaire sur `http://127.0.0.1:4199/index.html`.

Etat joueur remis a zero pour le scenario nouvelle ouverture.

Verification moteur relancee:

`153` tests reussis / `0` echec.

Artefacts generes:

- `output/playwright/sezam-stress-01-home.png`
- `output/playwright/sezam-stress-02-first-question.png`
- `output/playwright/sezam-stress-03-after-errors.png`
- `output/playwright/sezam-stress-04-result.png`
- `output/playwright/sezam-stress-05-return.png`
- `output/playwright/sezam-stress-06-session10-result.png`
- `output/playwright/sezam-stress-ux-metrics.json`

Lecture des scores:

Charge mentale inversee: `10` signifie effort cognitif tres leger. `0` signifie effort cognitif tres lourd.

## Mesures clefs

| Mesure | Resultat |
|---|---:|
| Bouton principal visible apres ouverture | 274 ms |
| Ouverture vers premiere question | 962 ms |
| Clic `JOUER` vers premiere question | 595 ms |
| Nombre de clics vers premiere question | 1 |
| Preparation au premier lancement | flux direct |
| Retour apres pause vers cockpit | 153 ms |
| Session explicite vers premiere question | 217 ms |
| Nombre de clics session explicite vers premiere question | 1 |

Diagnostic instantane:

SEZAM agit comme un reflexe de jeu a l'ouverture. La friction majeure apparait apres erreurs multiples et dans la coherence Decision Engine vers REPARATION.

## 1. Premiere ouverture — 0 contexte

Observation:

Le cockpit affiche directement `JOUER`, `Flash recommandee`, `P1`, `Zen`, `7 questions`, progression et notes fragiles. Le bouton principal occupe le centre visuel. Le joueur comprend l'action avant de comprendre tout le systeme.

Temps avant comprehension:

274 ms pour voir l'action principale. La comprehension utile arrive sous 1 seconde.

Besoin de lecture:

Lecture minimale. Le mot `JOUER` suffit pour agir. Les blocs secondaires rassurent apres coup.

Hesitation cognitive:

Tres basse. Le regard tombe sur une seule action.

| Critere | Score |
|---|---:|
| Comprehension immediate | 9/10 |
| Fluidite | 9/10 |
| Charge mentale inversee | 8/10 |
| Vitesse de lancement | 10/10 |
| Motivation a rejouer | 8/10 |

## 2. Premier lancement de jeu

Observation:

Le premier clic lance directement une question. Le test mesure `595 ms` entre le clic `JOUER` et la premiere question. La premiere question affiche la portee, la note, le mode `Flash`, le compteur `0/7`, puis les reponses.

Temps entre ouverture et jeu reel:

962 ms.

Fluidite du demarrage:

Tres forte. Le flux affiche directement la premiere question.

Sensation de jeu immediat:

Tres forte. SEZAM atteint la promesse `1 clic -> jeu`.

| Critere | Score |
|---|---:|
| Comprehension immediate | 9/10 |
| Fluidite | 9/10 |
| Charge mentale inversee | 8/10 |
| Vitesse de lancement | 10/10 |
| Motivation a rejouer | 8/10 |

## 3. Erreurs multiples

Observation:

Trois erreurs volontaires declenchent trois corrections structurees. Chaque correction affiche la reponse attendue, un repere musical, une invitation a regarder la position, un bouton de validation, et une option de reecoute.

Reaction du systeme:

Pedagogique et stable. L'erreur devient une capsule d'apprentissage.

Vitesse de correction:

Bonne au premier incident. Plus lourde apres repetition, car le texte prend du volume.

Charge cognitive:

Moyenne. Apres les erreurs, SEZAM introduit aussi une reponse sur portee avec fleches et validation. Cette bascule ajoute un effort mental au moment exact ou le joueur vient deja de rater plusieurs notes.

Transformation en apprentissage:

Reussie au niveau pedagogique. Le systeme explique la note et garde une trace dans le resultat.

| Critere | Score |
|---|---:|
| Comprehension immediate | 8/10 |
| Fluidite | 7/10 |
| Charge mentale inversee | 5/10 |
| Vitesse de lancement | 7/10 |
| Motivation a rejouer | 7/10 |

## 4. Session complete

Observation:

Le flux Flash termine sur `4/7`, precision `57%`, temps moyen `2.3 s`, liste des erreurs et bouton `Encore une serie`.

La session explicite termine sur `4/10`, precision `40%`, niveau `Zen`, liste des erreurs, validation `0/3 series propres`, bouton `Encore une serie`.

Lisibilite de progression:

Correcte. Le score, la precision et la progression apparaissent clairement.

Motivation a rejouer:

Forte. Le bouton `Encore une serie` agit comme une vraie boucle arcade.

Clarite du resultat:

Bonne. Le joueur voit ses erreurs. La phrase de prochaine etape gagne a devenir plus concrete.

Sensation de boucle arcade:

Forte. Le resultat donne une sortie directe vers replay.

| Critere | Score |
|---|---:|
| Comprehension immediate | 7/10 |
| Fluidite | 8/10 |
| Charge mentale inversee | 6/10 |
| Vitesse de lancement | 8/10 |
| Motivation a rejouer | 8/10 |

## 5. Retour apres pause

Observation:

Le rechargement ramene au cockpit en `153 ms`. Le systeme affiche `Flash recommandee : 5 questions`, `P1`, `Zen`, progression `0/3 series propres`, precision globale `57%`, et bouton `JOUER`.

Reconnaissance etat utilisateur:

Bonne. Le cockpit conserve XP, jours, precision, palier et progression.

Pertinence du mode automatique:

Moyenne. Apres plusieurs erreurs recentes, la doctrine produit attend REPARATION. Le cockpit propose encore FLASH. Cet ecart devient le principal signal produit du test.

Reprise immediate:

Tres forte. Le bouton `JOUER` reste dominant et le retour est rapide.

| Critere | Score |
|---|---:|
| Comprehension immediate | 9/10 |
| Fluidite | 9/10 |
| Charge mentale inversee | 8/10 |
| Vitesse de lancement | 10/10 |
| Motivation a rejouer | 8/10 |

## 6. Test de friction cognitive

Mesure:

Ouverture vers premiere action principale visible: `274 ms`.

Ouverture vers premiere question: `962 ms`.

Clic `JOUER` vers premiere question: `595 ms`.

Nombre de clics vers premiere question: `1`.

Diagnostic:

La friction d'entree est quasi instantanee. SEZAM joue deja dans la categorie reflexe de jeu. La friction residuelle se situe apres erreur et dans la decision automatique de retour.

| Critere | Score |
|---|---:|
| Comprehension immediate | 9/10 |
| Fluidite | 10/10 |
| Charge mentale inversee | 9/10 |
| Vitesse de lancement | 10/10 |
| Motivation a rejouer | 8/10 |

## Scoring detaille

| Scenario | Comprehension | Fluidite | Charge mentale inversee | Vitesse | Motivation |
|---|---:|---:|---:|---:|---:|
| Premiere ouverture | 9 | 9 | 8 | 10 | 8 |
| Premier lancement | 9 | 9 | 8 | 10 | 8 |
| Erreurs multiples | 8 | 7 | 5 | 7 | 7 |
| Session complete | 7 | 8 | 6 | 8 | 8 |
| Retour apres pause | 9 | 9 | 8 | 10 | 8 |
| Friction cognitive | 9 | 10 | 9 | 10 | 8 |

| Moyenne | Score |
|---|---:|
| Comprehension immediate | 8.5/10 |
| Fluidite | 8.7/10 |
| Charge mentale inversee | 7.3/10 |
| Vitesse de lancement | 9.2/10 |
| Motivation a rejouer | 7.8/10 |

## Analyse des frictions

### Friction 1 — Decision Engine apres erreurs

Apres trois erreurs, le retour propose FLASH 5. La doctrine produit indique REPARATION. Cet ecart limite la sensation de coach invisible.

Impact:

Le joueur revient vite, avec une exploitation moderee du signal d'erreur.

Amelioration:

Declencher REPARATION quand une session courte contient plusieurs erreurs sur le meme palier ou sur les memes notes.

### Friction 2 — Correction textuelle dense

La correction explique bien. Apres repetition, le bloc demande davantage de lecture.

Impact:

La pedagogie reste forte. La sensation arcade baisse pendant les erreurs multiples.

Amelioration:

Passer la correction repetee en micro-mode visuel: note attendue, repere court, bouton `Reparee`, puis retour au jeu.

### Friction 3 — Mode ecrit apres erreurs

Le mode reponse sur portee apparait dans le flux apres erreurs. Cette variation ajoute une nouvelle regle au moment de fragilite.

Impact:

Le joueur passe de reconnaissance simple a placement sur portee. La charge cognitive monte.

Amelioration:

Garder le mode ecrit pour REPARATION explicite ou pour un palier dedie. Conserver le flux FLASH en reconnaissance pure.

### Friction 4 — Progression encore abstraite

`0/3 series propres` reste lisible mais peu actionnable.

Impact:

Le joueur comprend le score. Le prochain palier merite une phrase d'objectif.

Amelioration:

Afficher `Encore 3 series a 9/10 ou 10/10 pour ouvrir P2`.

## Diagnostic final

### Bloquants produit

Le blocage principal vient de la coherence adaptative:

Apres erreurs multiples, SEZAM doit orienter plus clairement vers REPARATION.

Le deuxieme blocage vient du mode ecrit:

La reponse sur portee augmente la charge mentale quand elle surgit dans un flux FLASH.

### Frictions UX

La correction reste utile, puis devient dense apres repetition.

La progression indique un compteur, puis gagne a exprimer une prochaine action.

La session 10 explicite se trouve dans les options, alors que le cockpit privilegie le mode automatique.

### Points forts

Le premier ecran est excellent.

Le bouton principal est visible, massif et actionnable.

Le lancement atteint `1 clic -> jeu`.

La portee est lisible.

Les reponses sont grandes.

Le feedback est immediat.

Le resultat donne une boucle arcade avec `Encore une serie`.

La sauvegarde, le moteur, les paliers et la sync sont couverts par `153` tests reussis.

## Niveau produit

Classement:

Niveau 4 — systeme adaptatif.

Justification:

SEZAM choisit un mode, lance le jeu immediatement, conserve l'etat joueur, ajuste la longueur du Flash, garde les erreurs et relance naturellement.

Trajectoire niveau 5:

Niveau 5 atteignable quand le retour apres erreurs declenche REPARATION, quand les notes fragiles pilotent la prochaine session, et quand les signaux d'abandon modifient automatiquement les regles UX.

## Critere ultime

Ouverture -> action immediate:

Valide. `962 ms` jusqu'a la premiere question et `1` clic.

Hesitation cognitive:

Tres basse a l'ouverture. Moyenne apres erreurs multiples.

Boucle de jeu naturelle:

Valide. Le resultat appelle directement `Encore une serie`.

Repetition spontanee:

Valide. Le bouton replay est visible, clair et dominant.

## Verdict final

SEZAM est pret pour un test public encadre.

Formule conseillee:

Beta publique limitee, avec observation des sessions erreur et retour apres pause.

Condition avant test public large:

Aligner le Decision Engine sur la regle produit `SI ERREURS -> REPARATION`.

Verdict produit:

SEZAM est deja un reflexe de jeu musical immediat. La derniere frontiere concerne la coherence adaptative apres erreur.

## Priorites d'iteration

### P1 — Critique

1. Declencher REPARATION apres erreurs multiples.
2. Maintenir FLASH en reconnaissance simple.
3. Transformer la correction repetee en micro-reparation visuelle.

### P2 — Important

1. Traduire `0/3 series propres` en prochaine action.
2. Afficher la raison du mode recommande.
3. Mesurer les abandons pendant correction et mode ecrit.

### P3 — Optimisation

1. Ajouter une micro-recompense apres erreur reparee.
2. Afficher la duree estimee du Flash.
3. Comparer replay apres Flash, Session et Reparation.
