# SEZAM — repères du cursus musical, Cycle 1 à Cycle 3

Ce document sépare volontairement trois notions qui ne doivent jamais être confondues : la durée officielle d'un parcours musical, le temps actif passé dans une application et le périmètre réellement évalué par SEZAM.

## Réponse courte

Le parcours complet de musique du **Cycle 1 à la fin du Cycle 3 demande officiellement 8 à 14 années calendaires**, hors éveil et initiation :

| Cycle | Durée habituelle prévue par le SNOP 2026 |
|---|---:|
| Cycle 1 | 3 à 5 ans |
| Cycle 2 | 3 à 5 ans |
| Cycle 3 | 2 à 4 ans |
| **Total** | **8 à 14 ans** |

Un centre de fourchette réaliste est **environ 10 à 11 ans**. Cette durée ne correspond pas à du temps d'écran : elle inclut la maturation, la pratique instrumentale ou vocale, le collectif, les projets, la scène, la culture et les validations pédagogiques.

## Temps numérique complémentaire

Pour SEZAM, la cible produit prudente est de **25 à 40 heures actives par année pédagogique**, en courtes séances qui remplacent une partie du travail répétitif à domicile au lieu de s'y ajouter.

| Cycle | Heures actives numériques estimées | Répartition calendaire |
|---|---:|---:|
| Cycle 1 | 75 à 200 h | 3 à 5 ans |
| Cycle 2 | 75 à 200 h | 3 à 5 ans |
| Cycle 3 | 50 à 160 h | 2 à 4 ans |
| **Total** | **environ 200 à 560 h** | **8 à 14 ans** |

Le cœur de fourchette à utiliser pour planifier le produit est **300 à 450 heures actives** sur le parcours complet. À titre de cadence saine, 15 minutes, 4 jours par semaine et 32 semaines par an représentent 32 heures actives par an.

Ces chiffres sont des hypothèses de conception, pas une durée officielle ni une promesse de réussite. Une compétence productive, collective ou artistique ne peut pas être validée par le seul nombre de minutes passées dans l'application.

## Ce que la version 29 sait réellement faire

SEZAM évalue actuellement :

- l'identification des notes en clés de sol et de fa ;
- leur automatisation progressive, de Zen à Rhodium ;
- les erreurs et confusions, avec réparation ciblée ;
- la stabilité dans le temps par répétition espacée ;
- un premier transfert sur des passages de partitions.

La campagne actuelle reste un **module de lecture de notes** : environ 10 à 14 heures actives pour un lecteur intermédiaire en route directe, ou 22 à 30 heures pour un débutant ; la séance complète avec rappels, réparation et transfert porte l'estimation à environ 15 à 20 heures, ou 35 à 45 heures pour un débutant. Ce n'est pas la durée d'un Cycle 1.

SEZAM guide déjà certaines missions de rythme, d'oreille, de chant, d'écriture, de culture et d'autonomie. Tant qu'elles ne produisent pas de preuve objective adaptée, elles restent marquées **« guidées, non évaluées »**.

## Architecture préparée pour évoluer

Le catalogue versionné [`data/curriculum-v1.json`](data/curriculum-v1.json) devient la source de vérité du futur cursus. Il contient :

- les trois cycles et leurs durées de référence ;
- neuf domaines de compétences stables ;
- les compétences, leurs prérequis et les types de preuve attendus ;
- un statut de livraison explicite : `available_measured`, `guided_unmeasured` ou `planned` ;
- la distinction entre reconnaissance, production, rétention, transfert, autoévaluation et validation par un professeur.

Chaque joueur possède désormais un espace `curriculum` séparé dans sa sauvegarde. À la migration, les preuves déjà présentes dans les paliers, rappels à froid et passages maîtrisés alimentent prudemment les deux compétences de lecture : un joueur avancé ne repart pas avec un cursus vide. Les futurs modules pourront y inscrire leurs preuves sans casser les profils existants, le transfert QR ou la synchronisation. Aucun Cycle 2 ou Cycle 3 n'est affiché comme commencé tant qu'aucun exercice correspondant n'existe.

Le catalogue JSON est chargé par l'application au démarrage et contrôle les identifiants, statuts et preuves admis. La sauvegarde conserve sa version de catalogue pour permettre de vraies migrations ultérieures. Le cloud v29 utilise une enveloppe et un nom de fichier v2 distincts ; l'ancien fichier reste lisible pour la migration, mais une v28 encore ouverte ne peut pas écraser les nouveaux champs.

## Règles pédagogiques pour chaque futur module

Une compétence ne pourra passer à « stable » que si son type le permet et si les preuves prévues sont présentes. En particulier :

1. une simple reconnaissance ne valide pas une compétence de production ;
2. une réussite immédiate ne prouve pas la rétention ;
3. une répétition du même exercice ne prouve pas le transfert ;
4. l'autoévaluation est conservée comme telle, jamais transformée en score objectif ;
5. les compétences collectives, scéniques et de projet gardent une place pour la validation humaine ;
6. les grades Zen à Rhodium restent des degrés d'automatisation de lecture, pas des équivalents de cycles officiels.

## Ordre de développement recommandé

Pour enrichir l'apprentissage sans multiplier le temps de séance :

1. ajouter le rythme et l'oreille à l'intérieur des quatre phases quotidiennes existantes ;
2. mesurer la production, pas seulement le choix multiple ;
3. relier chaque nouvelle preuve à une vraie partition et à un transfert ;
4. introduire un bilan multidomaine sans moyenne trompeuse ;
5. ouvrir progressivement les contenus du Cycle 2, puis du Cycle 3, uniquement quand leurs prérequis et leurs preuves sont testés ;
6. proposer au professeur une validation complémentaire pour les acquis hors écran.

## Sources de cadrage

- Ministère de la Culture, *Schéma national d'orientation pédagogique de l'enseignement public spécialisé de la danse, de la musique et du théâtre*, édition 2026, chapitre musique : <https://www.culture.gouv.fr/content/download/383713/pdf_file/BO%20Hors-s%C3%A9rie%20n%C2%B0%206%20%28janvier%202026%29.pdf?inLanguage=fre-FR&version=1>
- Confédération Musicale de France, ressources pédagogiques de formation musicale : <https://www.cmf-musique.org/ressources-pedagogiques/pedagogie/>

SEZAM est conçu comme un complément numérique autonome et personnalisable. Il ne délivre pas de certification officielle de cycle.
