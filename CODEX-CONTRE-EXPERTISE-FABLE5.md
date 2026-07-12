# Contre-expertise Codex — série Fable5 SEZAM v30

Date : 2026-07-12

Base vérifiée : `c961ddf855eec34aa77db202f5eed047989d2dbd`

Branche locale : `codex/verif-fable5`
Statut : préparée localement, non poussée, non fusionnée, non déployée.

## Verdict

Les 16 commits Fable5 s'appliquent sans conflit sur un clone neuf et corrigent bien les défauts annoncés.
La contre-expertise a toutefois trouvé trois interactions résiduelles, corrigées dans l'arbre de travail :

1. une Découverte limitée visuellement à six notes marquait toute la liste comme introduite ; une note au-delà de la sixième pouvait être interrogée sans présentation ;
2. le compteur multimodal `v`, encore alimenté par le clavier, suffisait à considérer une note comme déjà lue et pouvait contourner la Découverte ou créer un faux rappel à froid ;
3. « Passer aujourd'hui » sur une mission de transfert faisait encore compter le transfert comme atteint.

Les corrections restent sans migration : elles utilisent l'état éphémère de la série et les traces SRS existantes (`last` ou, pour compatibilité historique, `box`). Aucun champ persistant n'est ajouté.

## Recette finale

| Contrôle | Résultat |
|---|---|
| Baseline `c961ddf` | 580 tests, 0 échec |
| Série Fable5 seule | 622 tests, 0 échec |
| Série + corrections Codex + v30 | **630 tests, 0 échec** |
| Bot complet | 90/90 validations, 30/30 passages, 3 208 questions, 9 711 réponses, 0 erreur, XP 13 108 |
| Miroir HTML | `index.html` et `prototype-solfege.html` byte-identiques |
| Syntaxe / espaces | contrôles Node et `git diff --check` propres |
| Version / cache | `v30` / `sezam-solado-v30`, incrémentés ensemble |
| Secrets | aucun motif de secret détecté |
| Données | schéma local 13, cloud 2, catalogue 1 inchangés |

## Recette navigateur réalisée

Le navigateur intégré a été testé aux viewports 375×812, 390×844, 768×1024 et 1024×768 :

- aucun débordement horizontal ni élément visible hors viewport ;
- aucun contrôle visible sous 24 px sur l'accueil ;
- carte de partition accessible au clavier : un arrêt par passage, rôle et nom accessibles, Entrée active le passage ;
- anneau de focus visible, or, 3 px ;
- légende J24 lisible sur mobile ;
- boutons-liens du volet configurés à 40 px minimum ;
- aucune erreur console observée pendant les parcours contrôlés.

Non validés dans cet environnement : zoom navigateur réel à 200 %, VoiceOver/TalkBack, Safari, iOS,
Android, orientation physique, installation PWA, mode hors ligne runtime et caméra QR. Le navigateur
intégré n'expose pas les API Service Worker/CacheStorage et son zoom ne peut pas être forcé par le
contrôle disponible ; ces points doivent rester marqués `NON TESTÉ` avant publication.

## Décisions laissées hors livraison

- C7 : redéfinir la couverture en réussites répétées par note changerait le sens des preuves historiques ;
- C9/Q19 : créer une voie non chronométrée au-delà de Zen est un choix produit ;
- séparer le SRS de lecture et celui de l'exercice écrit/placement nécessite une doctrine explicite ;
- Flash et Rafale restent hors Découverte, leurs pools étant supposés connus ;
- aucune extraction du monolithe sans décision sur `file://`, le hors-ligne et le miroir HTML.

## Publication

Le dépôt est prêt pour une PR unique contenant la série de 16 commits, les corrections Codex et le bump
v30/cache v30. La création de la PR brouillon est bloquée localement par l'absence de GitHub CLI (`gh`).
Conformément au workflow de publication, aucun commit supplémentaire, push, PR, fusion ou déploiement
n'a été effectué après ce constat.
