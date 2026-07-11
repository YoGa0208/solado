# SEZAM — autonomie et personnalisation

## Ce que l'application adapte dès maintenant

Le profil « Mon parcours » permet de choisir :

- un nom d'usage et un instrument ;
- une affinité musicale et une aspiration ;
- un niveau de départ ;
- un parcours : Découverte du Cycle 1, Rattrapage année 2, Préparation au Cycle 2 ou Libre ;
- une date cible, une durée de séance et un nombre de jours par semaine ;
- les domaines à travailler : lecture, rythme, oreille, chant, écrit/théorie et intégration dans une œuvre.

Le plan du jour respecte le temps choisi comme un plafond souple : le chronomètre global laisse terminer la question en cours, puis n'en démarre pas une nouvelle. Un seul bouton enchaîne 20 % de rappel à froid, 60 % de travail ciblé, 10 % de réparation et 10 % de transfert. Le tempo Bronze à Rhodium reste vérifié pendant la cible. Une mission hors écran choisie dans les domaines du profil peut occuper la phase de transfert ; elle reste annoncée comme autoévaluée. Si le contenu prévu se termine avant le chrono, un atelier bonus propose des observations facultatives plutôt que d'attendre : leurs XP sont séparés des preuves pédagogiques.

Une confusion n'est plus seulement comptée comme une faute. SEZAM mémorise la réponse choisie, impose au moins deux questions intermédiaires, puis repropose la note dans le créneau Réparation avant de vérifier une note proche au Transfert. Cette boucle reste dans le temps prévu. Si l'erreur arrive trop tard, elle reste prioritaire à la séance suivante.

## Ce que SEZAM vérifie

La lecture de notes, le clavier, les séries, les révisions espacées et les passages encodés sont vérifiés automatiquement. Une note ne progresse dans la mémoire que lors d'un rappel réellement arrivé à échéance. Un palier doit aussi couvrir toutes ses notes, et un passage ne devient « Maîtrisé » qu'après deux réussites propres séparées d'au moins 20 heures. Le rythme, l'oreille, le chant et l'écrit commencent toujours par des missions hors écran honnêtement autoévaluées : l'application ne prétend pas les avoir écoutées ou corrigées.

## Autonomie des données

Plusieurs joueurs peuvent partager le même appareil sans partager leurs scores. Un registre local indique seulement qui joue ; chaque joueur possède un coffre complet distinct pour son profil, son plan, ses secrets, sa mémoire espacée, ses partitions et sa progression. Le bouton du joueur permet de basculer depuis l'accueil. Avant le changement, SEZAM confirme la mise à l'abri du joueur courant ; un exercice en cours bloque le basculement.

Les exports et QR concernent toujours le joueur actif. Si ce joueur active GitHub, sa progression est envoyée dans son propre Gist secret, séparé des autres profils : il n'est pas indexé, mais toute personne possédant son lien peut le lire et son historique conserve les anciennes versions. Les pièces jointes restent locales. Le token GitHub est lui aussi isolé par joueur et n'est gardé qu'en mémoire, jusqu'au rechargement ou à la fermeture. Aucun compte n'est nécessaire pour jouer et l'application reste utilisable hors ligne après la première ouverture en HTTPS.

## Prochaine étape pédagogique

Le socle prévu pour la suite est une matrice complète de compétences du Cycle 1 : diagnostic initial invisible, maîtrise par domaine, prérequis et validations multi-domaines. Les premières extensions mesurées viseront le rythme frappé et l'oreille sans micro obligatoire, en conservant la distinction entre ce que l'application mesure réellement et ce que l'élève ou le professeur valide.
