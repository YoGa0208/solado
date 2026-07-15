# Journal des changements

## v40 — Familles, cycles et 14 classes musicales

### Positionnement lisible

- Le réglage unique Débutant / Intermédiaire / Avancé devient un choix en deux temps : **Famille et cycle**, puis **Année**.
- Cycle 1 · Débutant propose les années 1 à 5, avec une durée habituelle de référence de 3 à 5 ans.
- Cycle 2 · Intermédiaire propose les années 1 à 5, avec une durée habituelle de référence de 3 à 5 ans.
- Cycle 3 · Avancé propose les années 1 à 4, avec une durée habituelle de référence de 2 à 4 ans.
- Les 5 + 5 + 4 possibilités forment **14 classes déclarées**, de C1.1 à C3.4.

### Trois familles de lecture

- Le Cycle 1 est associé au parcours de clé de sol.
- Le Cycle 2 est associé au parcours de clé de fa.
- Le Cycle 3 est associé au nouveau parcours de clé d'ut 3e.
- La documentation ne limite donc plus SEZAM aux seules clés de sol et de fa ; elle distingue la campagne arcade historique sol/fa du parcours d'acquisition d'ut 3e.

### Aucune certification ni progression sautée

- La famille, le cycle et l'année sont un **repère déclaré par le joueur**, pas une validation de conservatoire.
- Changer de classe ne crédite aucune note, aucune série parfaite, aucune étape et aucun cycle.
- Le choix ne contourne jamais le contrat de trois séries de 25 sans erreur et n'efface aucun acquis antérieur.
- Une sauvegarde complète protégée est créée avant tout changement ; en cas d'échec, le profil précédent et sa progression restent actifs.
- Les années proposées représentent les bornes possibles d'un cycle, pas un nombre d'années obligatoire ni un passage automatique au cycle suivant.

### Technique et compatibilité

- Version applicative v40 et cache PWA `sezam-solado-v40`.
- Schémas de stockage local 16, base joueur 15 et sauvegarde cloud 5.
- Le profil conserve désormais `coachLevel` et `coachYear` ; les anciens profils restent lisibles sans niveau ou année inventés.

## v39 — Missions quotidiennes, récompenses et calendrier musical

### Progression pédagogique

- Une série d'acquisition contient exactement 25 questions.
- Trois séries de 25 sans erreur sont nécessaires avant d'ajouter une seule note nouvelle.
- Chaque item commence avec trois notes et comporte au maximum 12 étapes.
- Une erreur bloque uniquement la série en cours ; les séries parfaites déjà acquises restent protégées.
- Les étapes antérieures peuvent être rejouées avec de nouveaux fragments musicaux.

### Mission du jour

- Le joueur indique son humeur — Concentré, Calme, Joueur ou Fatigué — et choisit un repère de 10, 15, 20 ou 30 minutes.
- Le contexte de la mission est figé dès son démarrage et la récompense exige toujours 25 réponses réellement données.
- Une sortie anticipée conserve le travail sans attribuer prématurément le sceau.
- La fin de mission déclenche une célébration visuelle et sonore, +20 XP, un sceau daté et une sauvegarde complète numérotée.
- Chaque dixième mission accomplie devient la Finale des dix jours et débloque son badge.

### Défi des défis

- Sept sceaux distincts, du lundi au dimanche, ouvrent un défi hebdomadaire de 25 questions.
- Une Couronne est gagnée à partir de 20/25 et une Couronne d'or à 25/25.
- La première réussite rapporte +100 XP.
- Un échec conserve les sept sceaux, le meilleur score et le droit de rejouer, y compris après la fin de la semaine.

### Navigation, calendrier et sauvegardes

- Un bouton Accueil reste disponible sur tous les écrans secondaires.
- Les fenêtres conservent en permanence les actions Retour, Accueil et Sauvegarder.
- Le calendrier musical prend en charge cours, répétitions, auditions, concerts, examens et indisponibilités.
- Les rendez-vous peuvent cibler une œuvre intégrée ou personnelle et s'exporter au format `.ics` pour iPhone et iPad.
- Humeur et rendez-vous adaptent l'entraînement localement sans modifier les critères d'acquisition ni envoyer de données à une IA externe.
- Missions, sceaux, badges, Couronnes, rendez-vous et points de restauration sont conservés sans écrasement automatique.

### Technique et compatibilité

- Version applicative v39 et cache PWA `sezam-solado-v39`.
- Schémas de stockage local 15, base joueur 14 et sauvegarde cloud 4.
- Migration non destructive des progressions antérieures et séparation complète des profils joueurs.
- Plus de 34 000 contrôles moteur couvrent désormais les contrats pédagogiques, les récompenses, le calendrier, la navigation et la conservation de la mémoire.
