# SEZAM — audit complet & réparations (v21, juillet 2026)

Passe systématique sur quatre axes : logique moteur, justesse musicale, sécurité/données, UI/UX. Chaque point trouvé est réparé et verrouillé par un test. Suite finale : **285 tests moteur, 0 échec** + **31 vérifications navigateur, 0 échec, zéro erreur console**.

## Failles et erreurs réparées

### Critique — justesse musicale

**1. « Ode à la joie — main gauche » était fausse.** Écrite en fa majeur avec un si bécarre : le thème sonnait en mode lydien (quarte augmentée), faux pour toute oreille qui connaît l'hymne. Réécrite en do majeur pour clé de fa (mi3-ré3-do3), niveau P9, questions corrigées. Un test verrouille désormais l'incipit exact et l'absence de note étrangère au mode.

**2. Aucun garde-fou de cohérence pédagogique.** Rien n'empêchait un passage d'annoncer un palier et de contenir des notes d'un autre. Nouveau test structurel : chaque note de chaque passage de la bibliothèque appartient au palier annoncé (30 assertions, toutes pièces).

### Logique de jeu

**3. « Encore une série » après un passage cassait la boucle partition.** Le bouton relançait une session générique au lieu de rester dans la pièce. Il enchaîne maintenant sur le passage le plus utile de la même œuvre.

**4. Aucune récompense de conquête.** Passer un passage à Validé/Maîtrisé ne rapportait rien — incohérent pour une borne d'arcade. Désormais : +15 XP (Validé), +25 XP (Maîtrisé), fanfare sonore à la maîtrise.

**5. La Rafale ignorait la partition.** Elle ne traçait pas les notes vues ; son écran de fin n'affichait aucun impact. Corrigé : la rafale alimente le bilan « Dans ta partition » comme les autres sessions.

**6. Ambition atteinte non persistée.** La date de réussite n'était écrite qu'à la sauvegarde suivante — un rechargement immédiat faisait re-célébrer (ou perdre) la réussite. Écriture disque immédiate et silencieuse (sans bruit de synchro), testée.

### Sécurité & données

**7. La veille pouvait ouvrir une URL de schéma arbitraire.** `window.open(item.url)` acceptait n'importe quoi venant du JSON de veille. Verrouillé : http(s) uniquement.

**8. Aucune sauvegarde sur erreur JS imprévue.** Un crash inattendu pouvait coûter la session en cours. Filet ultime ajouté : `error` et `unhandledrejection` déclenchent une sauvegarde silencieuse.

Vérifié sain (aucune action requise) : tous les `innerHTML` avec données utilisateur/importées passent par `esc()` ; les ids de passage sont filtrés (`cleanId`) avant d'entrer dans le SVG ; le token de synchro reste absent des exports/QR/Gist/cloud (testé) ; le journal d'événements est capé à 500 ; `stateScore` compte le progrès partition (le checkpoint ne peut pas écraser une progression faite uniquement sur les pièces) ; import/restauration passent par `ensureStructure` (ambitions et œuvre en cours normalisées).

### UI / UX

**9. Mini-cartes mortes.** Sur la liste des pièces, les mini-cartes affichaient des passages cliquables (curseur main) qui ne faisaient rien. Elles ouvrent maintenant la fiche de la pièce.

**10. Bouton « Œuvre en cours » incohérent.** Sur la pièce déjà active, il « désactivait » puis réactivait la même pièce — un toggle dans le vide. Il n'agit plus que pour activer une autre œuvre.

**11. Écrans ouverts en milieu de page.** Après une fiche longue, l'écran suivant héritait du scroll. Chaque écran démarre maintenant en haut.

**12. README absent du dépôt.** Ajouté : architecture, moteurs, règles de contribution, commandes.

## Limites connues (assumées, documentées)

- Les partitions perso ajoutées par les joueurs n'ont pas de mélodie jouable via l'interface (photo/PDF + segments à notes ciblées) ; la mélodie note à note passe par l'import JSON. Évolution possible en V2.
- Une pièce = une clé (pas encore de système à deux portées simultanées).
- Un appareil = un joueur (choix retenu pour les ~20 joueurs : chacun son appareil, sync Gist en option).
- Les glyphes de clé (𝄞/𝄢) dépendent des polices système — rendu garanti sur iOS/Android/desktop récents, identique au reste de l'app.

## Preuves

- `npm test` : 285 réussis / 0 échec (dont groupes « cohérence pédagogique », « réparations d'audit verrouillées »).
- `node output/playwright/sezam_partition_check.cjs` : 31/31, parcours mobile complet, zéro erreur console, persistance après rechargement vérifiée.
- `index.html` = `prototype-solfege.html` (test d'égalité stricte).
