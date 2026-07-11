# Doctrine produit — SEZAM

Date: 2026-07-04

## Nature reelle du produit

SEZAM est un systeme de jeu musical adaptatif, predictif et auto-evolutif.

La promesse centrale tient en une phrase:

Le joueur ouvre SEZAM, joue immediatement, recoit une correction simple, progresse, puis relance naturellement.

## Architecture fonctionnelle

SEZAM repose sur cinq moteurs.

### 1. Flow Engine

Role:

- transformer chaque ouverture en action immediate;
- declencher FLASH, SESSION ou REPARATION;
- garantir le flux `1 clic -> jeu`;
- supprimer les etapes qui retardent la premiere note.

Sortie attendue:

Le cockpit affiche une seule action principale, deja choisie pour le joueur.

### 2. Decision Engine

Role:

- agir comme coach invisible;
- choisir automatiquement le bon mode de jeu;
- reduire le choix utilisateur avant la session.

Entrees:

- erreurs recentes;
- performance;
- duree de pause;
- progression;
- notes dues;
- historique d'abandon.

Sortie:

- FLASH quand le joueur peut entrer vite;
- SESSION quand le niveau est stable;
- REPARATION quand une note fragile demande un travail cible.

### 3. Prediction Engine

Role:

- anticiper les erreurs avant leur apparition;
- detecter les notes fragiles;
- adapter la frequence d'apparition des notes;
- ajuster la difficulte.

Sortie attendue:

Le joueur ressent que SEZAM propose toujours la bonne note au bon moment.

### 4. Generation Engine

Role:

- creer des exercices uniques en temps reel;
- personnaliser les series de 10;
- varier les questions;
- adapter les choix au niveau reel du joueur.

Sortie attendue:

Chaque session conserve une structure simple et une variation suffisante pour rester vivante.

### 5. Self Improving Engine

Role:

- analyser les performances globales;
- ajuster les regles de difficulte;
- optimiser les transitions UX;
- reduire la friction;
- transformer l'abandon en signal produit.

Sortie attendue:

SEZAM ameliore ses propres regles de flow, de difficulte et de relance.

## Boucle produit fondamentale

```text
OUVERTURE
  -> DECISION AUTOMATIQUE
  -> JEU IMMEDIAT
  -> REPONSE
  -> CORRECTION SIMPLE
  -> PROGRESSION
  -> RECOMPENSE COURTE
  -> REPLAY
```

## Regles produit absolues

### Action

L'utilisateur joue avant de reflechir.

### Cognition

Zero decision avant le jeu.

### Fluidite

Zero ecran intermediaire inutile.

### Repetition

Chaque session peut etre relancee immediatement.

## Cockpit cible

```text
┌──────────────────────┐
│ SEZAM                │
│                      │
│ JOUER                │
│ Serie 10             │
│ Palier 2             │
│                      │
│ Progression          │
│ Notes fragiles       │
│                      │
│ Options              │
│ repliees             │
└──────────────────────┘
```

Principe:

Le cockpit sert une action immediate. Les options, outils, explications, archives, recompenses longues et contenus editoriaux restent secondaires.

## Logique de perception utilisateur

Le joueur doit ressentir:

> Je joue immediatement, meme avant de comprendre toute l'interface.

Ce ressenti devient le critere principal de design.

## Systeme d'adaptation

### Si erreurs recentes

SEZAM propose REPARATION.

Objectif:

- reduire la fragilite;
- isoler une note;
- corriger vite;
- revenir au jeu.

### Si niveau stable

SEZAM propose SESSION.

Objectif:

- consolider un palier;
- valider une serie propre;
- avancer vers le prochain deblocage.

### Si joueur rapide

SEZAM propose FLASH.

Objectif:

- lancer une session courte;
- entretenir le reflexe;
- favoriser le retour quotidien.

## Systeme d'evolution

SEZAM modifie ses propres regles selon quatre familles de signaux.

### Engagement

Signaux:

- retour quotidien;
- relance apres resultat;
- temps avant premiere action;
- temps avant premiere note.

Evolution possible:

- recommander plus souvent FLASH;
- raccourcir la preparation;
- presenter une recompense plus courte.

### Erreurs

Signaux:

- note ratee plusieurs fois;
- erreur apres pause;
- erreur sur note deja validee;
- confusion entre deux notes voisines.

Evolution possible:

- augmenter la frequence de la note fragile;
- declencher REPARATION;
- choisir des distracteurs plus utiles;
- ralentir temporairement la difficulte.

### Progression

Signaux:

- series propres;
- precision;
- vitesse;
- validation de palier;
- stagnation.

Evolution possible:

- pousser SESSION;
- ouvrir le palier suivant;
- proposer une serie plus courte;
- afficher une prochaine marche plus concrete.

### Abandon

Signaux:

- sortie pendant preparation;
- sortie pendant correction;
- sortie apres erreur;
- absence de replay apres resultat.

Evolution possible:

- reduire le texte;
- rapprocher la premiere note;
- simplifier la correction;
- convertir le retour en FLASH.

## Niveau produit actuel

SEZAM est au niveau 4 sur 5:

Systeme predictif et adaptatif avance.

Ce niveau signifie:

- le moteur pedagogique est robuste;
- la sauvegarde et la sync sont solides;
- le cockpit oriente deja vers l'action;
- la prochaine marge majeure concerne la compression cognitive.

## Point critique produit

SEZAM est fonctionnel et intelligent. La prochaine etape consiste a compresser toute la cognition d'entree.

Objectif:

Zero friction percue entre ouverture et action.

## Traduction operationnelle

### P1 — Flow

1. Faire apparaitre la premiere note plus vite apres `JOUER`.
2. Transformer la preparation en micro-carte.
3. Afficher une seule action principale au cockpit.

### P1 — Decision

1. Calculer le mode recommande des l'ouverture.
2. Justifier la recommandation en une ligne courte.
3. Envoyer directement vers FLASH, SESSION ou REPARATION.

### P1 — Progression

1. Traduire `0/3 series propres` en objectif lisible.
2. Afficher la prochaine ouverture de palier.
3. Donner une raison claire de rejouer.

### P2 — Prediction

1. Detecter les notes fragiles avant accumulation d'erreurs.
2. Varier la frequence des notes selon fragilite.
3. Creer des distracteurs proches selon les confusions reelles.

### P2 — Generation

1. Composer chaque serie selon objectif, fragilite et palier.
2. Garder la serie courte et lisible.
3. Maintenir une variation suffisante pour eviter la routine.

### P3 — Self Improving

1. Mesurer les abandons par etape.
2. Mesurer les relances apres resultat.
3. Ajuster les regles de recommandation selon engagement.

## Metriques de validation

### Ouverture

- temps avant premiere action;
- taux de clic sur `JOUER`;
- taux d'ouverture suivie d'une question.

### Jeu

- temps avant premiere note;
- precision;
- temps moyen par question;
- abandon pendant session.

### Erreur

- taux de correction validee;
- taux de reussite apres correction;
- repetition des memes erreurs.

### Progression

- series propres;
- validation de palier;
- relance apres resultat;
- retour le lendemain.

## Synthese strategique

SEZAM doit evoluer vers un reflexe de jeu musical adaptatif instantane.

La phrase directrice:

Le systeme choisit, le joueur joue, la progression explique ensuite.

## Etat final vise

SEZAM devient une borne musicale auto-adaptative:

- immediate a ouvrir;
- evidente a lancer;
- intelligente dans ses choix;
- simple dans ses corrections;
- gratifiante dans sa progression;
- naturelle a rejouer.
