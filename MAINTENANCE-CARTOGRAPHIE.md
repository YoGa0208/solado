# SEZAM — cartographie du monolithe et plan d'extraction prudent

Établi par Fable5 (passe 5), base `main` c961ddf8 + passes 1-4. Objectif : permettre à quiconque
(Youcef, Codex, futur contributeur) de modifier `index.html` sans casser les invariants, et donner
au propriétaire de quoi décider — ou refuser — toute extraction future.

## 1. Anatomie du fichier (5 931 lignes)

| Zone | Lignes | Contenu |
|---|---|---|
| `<style>` | 15–388 (373 l.) | thèmes (4), layout mobile-first ≤430 px, media query 350 px, focus-visible, reduced-motion |
| Corps HTML | 389–557 | 7 écrans (`scrHome/scrEx/scrRes/scrStats/scrPieces/scrPiece/scrKbd`) + `#overlay` (dialogue) |
| Script 1 | 558–560 | lib QR inlinée (MIT, minifiée) — ne jamais reformater |
| Script principal | 561–5 931 (~5 370 l.) | **439 fonctions**, 18 sections balisées `/* ===== … ===== */` |

## 2. Sections du script principal (l. de début)

563 SÉCURITÉ (esc, ids, maps sûres) · 571 DONNÉES (constantes, normaliseurs, migrations, IDB) ·
715 Altérations & clavier pur · 817 ÉTAT (DB, joueurs, coffres) · 2110 AUDIO (WebAudio) ·
2181 PORTÉE SVG · 2298 ÉCRANS (navigation, overlay/focus-trap, accueil, profil) ·
2925 SRS Leitner · 3084 Étoiles · 4390 Premier regard · 4514 PARTITION terrain de jeu ·
5275 CLAVIER module · 5424 SYNCHRO Gist · 5735 QR · 5774 LIAISONS (événements globaux)

## 3. Couplages mesurés (pourquoi la prudence)

`DB.` ×408 · `EX.` ×586 · `save(` ×51 · `$("` ×384 · `innerHTML` ×98 (avec `esc(` ×163).
L'état est global et l'affichage est tissé dans la logique : une extraction naïve casse des choses
invisibles. Les 18 plus grosses fonctions (risque maximal en cas de retouche) :
`showSaveQR` 169 l. · `renderStats` 169 · `renderHome` 112 · `ensureStructure` 97 · `finishSerie` 89 ·
`nextQuestion` 89 · `renderPieces` 67 · `pieceMapSVG` 61 · `openMusicProfile` 61 · `renderResPiece` 58 ·
`renderPieceDetail` 57 · `backfillCurriculumFromGame` 49 · `questionTask` 47 · `idbRescue` 45 · `tone` 39.

## 4. Couverture de caractérisation

Le harnais (`tests/engine.test.js`, 620 contrôles + bot) charge le **vrai** script avec stubs DOM et
exporte 266 noms ; 233 des 439 fonctions sont directement exerçables, le reste (206, surtout du rendu)
n'est couvert qu'indirectement (smoke, parcours clavier, flux séries/daily). Toute extraction du rendu
exigerait d'abord des tests de parcours navigateur — outillage dev uniquement, jamais de dépendance runtime.

## 5. Frontières naturelles (si extraction un jour approuvée)

1. **Moteur pur** (déjà testé, sans DOM) : sécurité, normaliseurs, SRS, validation, coach, altérations,
   curriculum, codes de secours. 2. **État & stockage** : DB, registre familial, IDB, migrations, sync,
   QR. 3. **Rendu** : SVG portée/carte, écrans, liaisons. L'ordre d'extraction sûr est 1 → 2 → 3.

## 6. Plan par phases — GO/NO-GO

- **Phase 0 — caractérisation : FAITE** (620 tests, bot 90/90, verrous passes 1-4).
- **Phase 1 — sans décision (risque nul) : ce document + conventions §7.** Règle d'or : toute nouvelle
  fonction pure naît exportée dans le harnais et testée.
- **Phase 2 — données vers `data/*.json` (PIECES_BUILTIN, PALIERS, NOTES)** : NO-GO tant que le jeu
  doit démarrer en `file://` et hors-ligne au premier lancement (fetch impossible/fragile) et que le
  harnais charge un fichier unique. Décision produit requise.
- **Phase 3 — scission en ES modules (`<script src>`)** : change l'architecture publiée — sw.js ASSETS,
  invariant « miroir byte-identique » à redéfinir, `file://` cassé (CORS modules), matrice navigateur à
  rejouer. **Interdite sans accord explicite du propriétaire** (invariant 20).
- **Phase 4 — build/bundler : interdite** sans analyse migration/PWA/hébergement/rollback approuvée (cahier §17).
- **Recommandation Fable5** : rester monofichier tant que (a) < 7 000 lignes, (b) suite verte,
  (c) 1-2 contributeurs. Le coût actuel du monolithe est réel mais maîtrisé par le harnais ; le risque
  d'une scission dépasse aujourd'hui son bénéfice.

## 7. Conventions de survie dans le monolithe

1. Normaliser toute donnée à l'entrée (`normalize*`) ; 2. `esc()` avant tout `innerHTML` contenant de
la donnée ; 3. aucune nouvelle clé persistée sans version + migration + test de schéma futur ;
4. `cp index.html prototype-solfege.html` après chaque édition (byte-identiques) ; 5. `APP_VERSION` et
`CACHE_NAME` bougent ensemble à la livraison ; 6. respecter les sections `=====` ; 7. une passe = un
thème = une branche = des tests rouges avant, verts après ; 8. jamais de token/donnée réelle dans les tests.

Rollback de ce document : `git revert` du commit (aucun code applicatif touché).
