# SEZAM — partie témoin complète

Ce rapport mesure une partie parfaite sur le vrai moteur de SEZAM. Le bot répond juste à chaque question, suit les 15 paliers dans les 6 grades, puis porte tous les passages jouables à Maîtrisé.

La fiche destinée aux joueurs et aux accompagnants est [FICHE-COMPLETE-JEU.md](FICHE-COMPLETE-JEU.md).

## Ce que le bot termine

| Contenu | Volume exact |
|---|---:|
| Grades | 6, de Zen à Rhodium |
| Paliers par grade | 15 : 5 Sol, 5 Fa, 5 Deux clés |
| Validations | 90 |
| Séries de paliers | 270 minimum |
| Pièces jouables | 8 |
| Passages de partition | 30, tous Maîtrisés |
| Lectures de partition | 60 minimum |
| Séries totales | **330** |
| Questions posées | **3 208** |
| Réponses-note | **9 711** |
| Récolte parfaite | 13 108 XP · code B5+ · 8 ambitions · 5 trophées immédiats |

Le nombre de pièces et de passages affiché par le bot est calculé depuis la bibliothèque. Il n'est plus écrit en dur dans le test.

## Temps mécanique

Le moteur termine le calcul en quelques secondes. Dans l'application réelle, les délais de bonne réponse et les transitions représentent exactement **2 356,48 secondes**, soit **39,27 minutes**, dans ce scénario parfait.

Ce nombre est une borne mécanique, pas une promesse humaine :

- les réponses sont instantanées ;
- il n'y a aucune erreur ;
- le temps de lecture, d'hésitation, de correction et de navigation humaine n'est pas reproduit ;
- le bot simule le retour après le délai de consolidation des passages.

## Détail de la campagne

Chaque grade exige 45 séries parfaites : trois preuves pour chacun des 15 paliers.

| Grade | Séries | Questions | Réponses-note |
|---|---:|---:|---:|
| Zen | 45 | 450 | 450 |
| Bronze | 45 | 450 | 855 |
| Argent | 45 | 450 | 1 260 |
| Vermeil | 45 | 450 | 1 665 |
| Or | 45 | 450 | 2 070 |
| Rhodium | 45 | 450 | 2 475 |
| **Total campagne** | **270** | **2 700** | **8 775** |

La première question à froid de chaque série porte sur une note seule. Les neuf autres utilisent la taille de groupe du grade ; cela explique pourquoi le nombre de réponses augmente alors que chaque grade garde 450 écrans-question.

## Détail de la bibliothèque

La bibliothèque jouable contient 8 pièces, 30 passages et 71 mesures encodées. Les passages courts et la pièce complète se recouvrent volontairement.

Pour devenir Maîtrisé, chaque passage demande deux réussites propres séparées d'au moins 20 heures. Le minimum parfait représente :

- 60 lectures ;
- 508 écrans-question ;
- 936 réponses-note.

Le calendrier minimal de la campagne avec bibliothèque est donc d'au moins 20 heures, même pour un lecteur parfait. Dans une pratique normale répartie sur plusieurs jours, ce délai est absorbé naturellement.

## Conversion humaine

Les estimations combinent le volume réel de réponses, les délais de l'interface, une durée de réflexion par note et un facteur de reprises croissant avec la vitesse.

| Route | Profil | Temps actif | 10 min/j | 20 min/j | 30 min/j |
|---|---|---:|---:|---:|---:|
| Sessions de 10 questions | Intermédiaire | 10 à 14 h | 60 à 84 j | 30 à 42 j | 20 à 28 j |
| Sessions de 10 questions | Débutant | 22 à 30 h | 132 à 180 j | 66 à 90 j | 44 à 60 j |
| Séance quotidienne complète | Intermédiaire | 15 à 20 h | 90 à 120 j | 45 à 60 j | 30 à 40 j |
| Séance quotidienne complète | Débutant | 35 à 45 h | 210 à 270 j | 105 à 135 j | 70 à 90 j |

La séance quotidienne complète consacre 40 % du temps au rappel à froid, à la réparation et au transfert. Elle est donc plus longue pour finir la campagne, mais plus riche pour retenir et utiliser les acquis.

## Prestige calendaire

Les 15 paliers possèdent chacun cinq étoiles, soit 75 révisions. Les échéances sont cumulatives :

`7 + 30 + 90 + 180 + 365 = 672 jours`

Le prestige absolu est donc atteignable au plus tôt **672 jours après le dernier Rhodium** : étoile 1 à J+7, étoile 2 à J+37, étoile 3 à J+127, étoile 4 à J+307 et étoile 5 à J+672.

## Lecture produit

Le début du jeu récompense souvent : nouveaux repères, validations, cartes culturelles et premiers passages de pièces. Le milieu répète les mêmes 15 paliers avec des contraintes de groupe et de vitesse plus fortes. La bibliothèque et les missions de transfert donnent du sens à cette répétition.

La séance quotidienne corrigée transforme chaque tranche persistante de 10 questions Cible en preuve de validation et avance automatiquement au palier suivant. Sans cette règle, une séance longue compterait comme une seule preuve et le bouton principal pourrait continuer à rejouer un palier déjà validé.
