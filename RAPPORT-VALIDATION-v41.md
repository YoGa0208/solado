# SEZAM v41 — validation du 5 septembre 2026

La version corrige les pertes de contexte lors des sorties et renforce le coffre mémoire. Les essais utilisent exclusivement des joueurs fictifs ; aucun coffre réel ni Gist de joueur n'a été modifié.

## Résultats

| Vérification | Résultat |
|---|---|
| Suite moteur sur le véritable code applicatif | 34 993 contrôles réussis, 0 échec |
| Campagne simulée complète | 90/90 validations, 8 pièces et 30 passages maîtrisés |
| Charge de la campagne témoin | 330 séries, 2 560 questions, 6 483 réponses |
| Navigateur WebKit | 44 contrôles réussis, 0 erreur JavaScript ou console |
| Chrome installé, avec profil temporaire | 44 contrôles réussis, 0 erreur JavaScript ou console |
| Formats d'écran | 320, 375, 768 et 1 280 pixels |
| Source et prototype | Fichiers identiques ; version applicative et cache PWA v41 alignés |

## Défauts corrigés et régressions couvertes

- Accueil, Retour et sortie du clavier protègent la scène avant de la fermer. Les formulaires et fichiers non encore ajoutés sont sauvegardés avant navigation.
- La restauration redonne les données sérialisées exactes, la question, le score et la scène. Elle reste jouable, sans recompter une réponse déjà validée. Les horloges compensent la pause.
- Chaque restauration protège d'abord l'état quitté. Les numéros, identités, empreintes, collisions et ajouts concurrents sont contrôlés ; les anciens points ne sont pas remplacés.
- Import complet sur un contexte vierge et import répété sans écrasement. Export réellement supérieur à 16 Mio vérifié en plusieurs parties importables.
- Fichier altéré, contenu HTML hostile, quota dépassé, callback tardif, index ancien et panne IndexedDB : refus ou récupération sans suppression des points.
- Au démarrage, un stockage momentanément indisponible ou des données illisibles ne sont plus remplacés par une partie vierge. Le chargement attend une récupération explicite et suspend les écritures et la synchro.
- Fonctionnement hors ligne vérifié en arrêtant réellement le serveur utilisé par chaque navigateur, puis en rechargeant le jeu et son historique.
- Les sept sceaux hebdomadaires restent visibles sur un écran de 320 pixels.

## Reproduire

```sh
npm test
node tests/bot_completion.cjs
npm run test:browser
SEZAM_QA_BROWSER=chromium npm run test:browser
```

La QA navigateur nécessite une installation existante de Playwright et de WebKit ; elle réutilise Chrome local si Chromium Playwright n'est pas présent. `PLAYWRIGHT_MODULE` permet de désigner le module déjà installé. Rapports, captures et traces vont dans `output/playwright/webkit/` et `output/playwright/chromium/`, hors Git.

## Limites explicites

Il s'agit de simulations et de vrais navigateurs de bureau avec formats mobiles, pas d'un essai sur iPhone ou iPad physique. Les comptes cloud réels, l'écoute sur chaque appareil et toutes les combinaisons matérielles n'ont pas été testés. Ces contrôles ne constituent pas une garantie d'absence de tout défaut.

Le navigateur ou le système peut effacer son stockage. Le coffre local reste donc complété par **Télécharger le coffre complet**, à conserver hors du navigateur. La synchronisation de progression et le QR ne remplacent pas l'export de tout l'historique.
