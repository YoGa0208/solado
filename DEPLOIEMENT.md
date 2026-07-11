# SEZAM — mise en ligne pour tes joueurs

L'app est 100 % statique : GitHub Pages l'héberge gratuitement, le workflow est déjà prêt (`.github/workflows/pages.yml` : tests → veille musicale → déploiement, puis rafraîchissement automatique toutes les 6 h).

## Publier (une seule fois, ~5 minutes)

Le dépôt actuel est `YoGa0208/solado` et l'adresse publique est :

`https://yoga0208.github.io/solado/`

Pour une nouvelle installation sur un autre compte :

1. **Créer le dépôt** sur github.com (public pour utiliser facilement GitHub Pages).
2. **Pousser le code** — dans le Terminal :

   ```bash
   cd ~/Documents/music
   git remote add origin https://github.com/TON_COMPTE/NOM_DU_DEPOT.git
   git push -u origin main
   ```

   (GitHub demandera ton identifiant + un *personal access token* comme mot de passe — le même type de token que la synchro Gist, avec la permission `repo`.)
3. **Activer Pages** : sur GitHub → ton dépôt → *Settings* → *Pages* → Source : **GitHub Actions**.
4. Onglet *Actions* : le workflow « Deploy SEZAM to GitHub Pages » se lance seul. Deux minutes plus tard, ton URL est affichée :
   `https://TON_COMPTE.github.io/NOM_DU_DEPOT/`

## Partager aux ~20 joueurs

- Envoie simplement l'URL (ou un QR code de l'URL).
- Chacun ouvre le lien sur son appareil : progression **individuelle et automatique**, aucune inscription, aucun compte.
- Conseille l'ajout à l'écran d'accueil (voir `GUIDE-JOUEURS.md`) : l'app marche ensuite hors-ligne.

## Mettre à jour l'app plus tard

La copie historique `~/Documents/music` n'a pas le même historique que le dépôt GitHub. Après cette première publication, travaille depuis un clone propre :

```bash
git clone https://github.com/YoGa0208/solado.git ~/Documents/solado
cd ~/Documents/solado
git switch -c codex/ma-mise-a-jour
git add index.html prototype-solfege.html sw.js manifest.json tests README.md
git commit -m "Description du changement"
git push -u origin codex/ma-mise-a-jour
```

Ouvre ensuite une demande de fusion vers `main`. Pour les mises à jour suivantes, réutilise ce clone en le synchronisant avec `main` avant de créer une nouvelle branche.

Le site se redéploie seul. Les joueurs reçoivent la nouvelle version au prochain chargement (le cache `sezam-solado-vXX` se renouvelle automatiquement) — **sans jamais perdre leur progression**, qui vit sur leur appareil.

## Règles d'or avant chaque mise à jour

1. `npm test` doit afficher 0 échec.
2. Incrémenter ensemble `APP_VERSION` (index.html) et `sezam-solado-vXX` (sw.js).
3. `cp index.html prototype-solfege.html` (les deux fichiers doivent rester identiques — un test le vérifie).
4. Ne jamais renommer les clés de stockage (`solfegeProto1`, `soladoBackup`, `sezam-progress.json`).
