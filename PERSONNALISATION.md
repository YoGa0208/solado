# SEZAM — autonomie et personnalisation

## Ce que l'application adapte dès maintenant

Sur l'accueil, le Coach invisible permet de déclarer séparément la famille, le cycle et l'année de travail. Le profil « Mon parcours » affiche cette classe et permet de choisir :

- un nom d'usage et un instrument ;
- une affinité musicale et une aspiration ;
- un repère d'exploration libre facultatif, séparé de la classe du Coach et sans validation d'acquis ;
- une intention de lecture : découvrir les notes, reprendre en clé de fa, consolider sol/fa ou explorer librement ; le parcours avancé v40 ajoute la clé d'ut 3e ;
- une date cible, une durée de séance et un nombre de jours par semaine ;
- les missions à guider : lecture, rythme, oreille, chant, écrit/théorie et intégration dans une œuvre.

Le plan du jour respecte le temps choisi comme un plafond souple : le chronomètre global laisse terminer la question en cours, puis n'en démarre pas une nouvelle. Un seul bouton enchaîne 20 % de rappel à froid, 60 % de travail ciblé, 10 % de réparation et 10 % de transfert. Le tempo Bronze à Rhodium reste vérifié pendant la cible. Une mission hors écran choisie dans les domaines du profil peut occuper la phase de transfert ; elle reste annoncée comme autoévaluée. Si le contenu prévu se termine avant le chrono, un atelier bonus propose des observations facultatives plutôt que d'attendre : leurs XP sont séparés des preuves pédagogiques.

Une confusion n'est plus seulement comptée comme une faute. SEZAM mémorise la réponse choisie, impose au moins deux questions intermédiaires, puis repropose la note dans le créneau Réparation avant de vérifier une note proche au Transfert. Cette boucle reste dans le temps prévu. Si l'erreur arrive trop tard, elle reste prioritaire à la séance suivante.

## Les 14 classes musicales déclarées

La v40 présente trois familles : **Cycle 1 · Débutant**, années 1 à 5, associé à la clé de sol ; **Cycle 2 · Intermédiaire**, années 1 à 5, associé à la clé de fa ; **Cycle 3 · Avancé**, années 1 à 4, associé à la clé d'ut 3e. Les durées habituelles de référence sont de 3 à 5 ans, 3 à 5 ans et 2 à 4 ans. L'ensemble forme 14 classes déclarables.

Cette déclaration personnalise la porte d'entrée du Coach, pas l'état des compétences. Elle ne certifie ni l'année ni le cycle, ne saute aucune étape, ne crédite aucune série parfaite et ne supprime aucun résultat. Le changement est précédé d'une sauvegarde protégée ; tous les acquis restent consultables et rejouables.

## Ce que SEZAM vérifie

La lecture de notes en clés de sol, de fa et d'ut 3e, le clavier, les séries, les révisions espacées et les passages encodés sont vérifiés automatiquement. Une note ne progresse dans la mémoire que lors d'un rappel réellement arrivé à échéance. Un palier doit aussi couvrir toutes ses notes, et un passage ne devient « Maîtrisé » qu'après deux réussites propres séparées d'au moins 20 heures. Le rythme, l'oreille, le chant et l'écrit commencent toujours par des missions hors écran honnêtement autoévaluées : l'application ne prétend pas les avoir écoutées ou corrigées. Zen, Bronze, Argent, Vermeil, Or et Rhodium sont des grades d'automatisation de lecture, pas des cycles officiels. De même, l'année déclarée dans le Coach n'est pas une validation.

## Autonomie des données

Plusieurs joueurs peuvent partager le même appareil sans partager leurs scores. Un registre local indique seulement qui joue ; chaque joueur possède un coffre complet distinct pour son profil, son plan, ses secrets, sa mémoire espacée, ses partitions et sa progression. Le bouton du joueur permet de basculer depuis l'accueil. Avant le changement, SEZAM confirme la mise à l'abri du joueur courant ; un exercice en cours bloque le basculement.

Les exports et QR concernent toujours le joueur actif. Si ce joueur active GitHub, sa progression est envoyée dans son propre Gist secret, séparé des autres profils : il n'est pas indexé, mais toute personne possédant son lien peut le lire et son historique conserve les anciennes versions. Les pièces jointes restent locales. Le token GitHub est lui aussi isolé par joueur et n'est gardé qu'en mémoire, jusqu'au rechargement ou à la fermeture. Aucun compte n'est nécessaire pour jouer et l'application reste utilisable hors ligne après la première ouverture en HTTPS.

## Terrain préparé pour les Cycles 1 à 3

Le catalogue `data/curriculum-v1.json` décrit les trois cycles, neuf domaines, les prérequis et les preuves attendues. Chaque compétence est marquée « disponible et évaluée », « guidée non évaluée » ou « prévue ». Chaque joueur possède son propre espace `curriculum` dans les exports, QR et sauvegardes cloud ; les futurs modules pourront l'utiliser sans casser les données actuelles. Le repère v40 `famille + cycle + année` est conservé séparément : il oriente le parcours sol/fa/ut 3e sans écrire de réussite dans ce catalogue.

Les premières extensions mesurées viseront le rythme frappé et l'oreille sans micro obligatoire, à l'intérieur du temps de séance existant. Le développement conservera la distinction entre reconnaissance, production, rétention, transfert, autoévaluation et validation par un professeur. Le cadrage complet et les durées sont dans `CURSUS-CYCLES-1-3.md`.
