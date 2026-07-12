/* SEZAM — bot de complétion : joue la partie ENTIÈRE sur le vrai moteur.
   Parcours : 15 paliers × 6 niveaux (Zen→Rhodium) + bibliothèque (tous passages Maîtrisés) + ambitions.
   Les timers du jeu sont neutralisés (le bot pilote l'avance) ; on comptabilise à part
   le temps mécanique que l'app impose réellement (délais de feedback).
   Lancer : node tests/bot_completion.cjs
*/
"use strict";
const fs = require("fs");
const path = require("path");

/* ---- stubs DOM (repris du harnais de tests) ---- */
function makeEl() {
  const el = {
    _children: [], _html: "", _text: "", style: {}, value: "", disabled: false,
    onclick: null, files: [], _attrs: {},
    classList: { _s: new Set(), add() {}, remove() {}, toggle() { return false; }, contains() { return false; } },
    setAttribute(k, v) { this._attrs[k] = v; }, getAttribute(k) { return this._attrs[k] || null; },
    appendChild(c) { return c; }, removeChild() {}, remove() {}, addEventListener() {}, removeEventListener() {},
    querySelectorAll() { return []; }, querySelector() { return null; },
    getBoundingClientRect() { return { top: 0, left: 0, height: 0, width: 0 }; },
    select() {}, setSelectionRange() {}, click() {}, focus() {}
  };
  Object.defineProperty(el, "innerHTML", { get() { return this._html; }, set(v) { this._html = v; } });
  Object.defineProperty(el, "textContent", { get() { return this._text; }, set(v) { this._text = String(v); } });
  Object.defineProperty(el, "children", { get() { return this._children; } });
  return el;
}
function makeDocument() {
  const byId = {};
  return {
    getElementById(id) { return byId[id] || (byId[id] = makeEl()); },
    createElement() { return makeEl(); }, querySelectorAll() { return []; },
    addEventListener() {}, body: makeEl()
  };
}
function makeLocalStorage() {
  const m = new Map();
  return { getItem(k) { return m.has(k) ? m.get(k) : null; }, setItem(k, v) { m.set(k, String(v)); }, removeItem(k) { m.delete(k); } };
}
const navigatorStub = { vibrate() {}, storage: { persist() { return Promise.resolve(); } },
  serviceWorker: { register() { return Promise.resolve({ catch() {} }); } }, clipboard: { writeText() {} } };
const windowStub = { addEventListener() {}, AudioContext: undefined, webkitAudioContext: undefined, scrollTo() {}, open() {} };

/* ---- chargement du moteur avec timers NEUTRALISÉS (le bot pilote) ---- */
function loadEngine() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const blocks = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  let src = null;
  for (const b of blocks) { if (b.indexOf('"use strict"') >= 0) src = b; }
  src = src.replace(/^<script>/, "").replace(/<\/script>$/, "");
  const exportsList = ["ensureStructure","PALIERS","TIERS","TIER_IDS","NOTES","tierUnlocked","tierComplete","palierPlayable",
    "startCoachPlay","startPieceSegment","nextQuestion","answer","answerPos","pieceById","pieceSegments","segmentStateId",
    "pieceMelody","PIECES_BUILTIN","setPieceGoal","ambitionProgress","trophyDefs","checkValidation","segmentScript","segmentProgress","SEGMENT_MASTERY_GAP_MS",
    "compactSave","currentRecoveryCode","pieceStateCounts","valProgress"];
  const footer = "\n;return {" + exportsList.map(n => n + ":(typeof " + n + "!=='undefined'?" + n + ":undefined)").join(",") +
    ",getDB:function(){return DB;},setDB:function(x){DB=x;},getEX:function(){return EX;},getEl:function(id){return document.getElementById(id);}};";
  const noopTimer = function () { return 0; };
  const fn = new Function("document", "localStorage", "navigator", "window", "setTimeout", "setInterval", "clearTimeout", "clearInterval", src + footer);
  return fn(makeDocument(), makeLocalStorage(), navigatorStub, windowStub, noopTimer, noopTimer, function () {}, function () {});
}

const E = loadEngine();
E.setDB(E.ensureStructure({}));

/* ---- le bot répond juste, comme un joueur parfait ---- */
const stats = { answers: 0, questions: 0, series: 0, pieceRuns: 0, mech: 0, perTier: {}, wrong: 0 };
function playCurrentQuestion() {
  const ex = E.getEX();
  if (ex.qtype === "ecrit") {
    ex.writePos = E.NOTES[ex.seq[0]].p;
    E.answerPos(ex.writePos);
    stats.answers++; stats.mech += 0.38;
  } else {
    const size = ex.seq.length;
    while (!ex.waiting && !ex.done && ex.k < ex.seq.length) {
      E.answer(E.NOTES[ex.seq[ex.k]].n);
      stats.answers++;
    }
    stats.mech += size > 1 ? 0.7 : 0.38; // délai réel d'avance de l'app
  }
  stats.questions++;
}
function playSerieToEnd() {
  let guard = 0;
  while (guard++ < 400) {
    const ex = E.getEX();
    if (!ex || ex.done) break;
    if (ex.pendingDecouverte) { const go = E.getEl("btnDecGo"); if (go && typeof go.onclick === "function") { go.onclick(); continue; } } // découverte : observation à son rythme, aucun délai imposé par l'app
    if (ex.waiting) { E.nextQuestion(); continue; } // en app réelle : avance automatique
    playCurrentQuestion();
  }
  stats.series++; stats.mech += 1.2; // écran de résultat incompressible (rendu + transition)
}

const t0 = Date.now();

/* ---- PHASE 1 : les 15 paliers × 6 niveaux, dans l'ordre du jeu ---- */
E.TIERS.filter(t => !t.future).forEach(tier => {
  const tierStart = { s: stats.series, a: stats.answers };
  if (!E.tierUnlocked(tier.id)) { console.log("BLOQUÉ : " + tier.id + " verrouillé — arrêt"); process.exit(1); }
  E.getDB().mode = tier.id;
  E.PALIERS.forEach(p => {
    if (!E.palierPlayable(p.id, tier.id)) { console.log("BLOQUÉ : " + p.id + " injouable en " + tier.id); process.exit(1); }
    E.getDB().sel = p.id;
    let guard = 0;
    while (!E.getDB().paliers[p.id][tier.id].ok && guard++ < 12) {
      E.startCoachPlay("session");
      playSerieToEnd();
    }
    if (!E.getDB().paliers[p.id][tier.id].ok) { console.log("BLOQUÉ : validation impossible " + p.id + "/" + tier.id); process.exit(1); }
  });
  stats.perTier[tier.id] = { series: stats.series - tierStart.s, answers: stats.answers - tierStart.a };
  console.log("Niveau " + tier.label + " COMPLET — séries jouées : " + (stats.series - tierStart.s) +
    " · réponses : " + (stats.answers - tierStart.a) + " · XP total : " + E.getDB().xp);
});

/* ---- PHASE 2 : la bibliothèque — chaque passage jusqu'à Maîtrisé, ambition « lire » ---- */
E.getDB().mode = "zen"; // lecture posée pour les partitions
const pieceStart = { s: stats.series, a: stats.answers };
E.PIECES_BUILTIN.filter(p => E.pieceMelody(p)).forEach(p => {
  E.setPieceGoal(p.id, "lire");
  E.pieceSegments(p).forEach(seg => {
    let guard = 0;
    while (E.segmentStateId(p.id, seg.id) !== "maitrise" && guard++ < 6) {
      E.startPieceSegment(p.id, seg.id);
      playSerieToEnd();
      stats.pieceRuns++;
      const progress = E.segmentProgress(p.id, seg.id);
      if (progress.cleanAt && progress.cleanAt.length === 1)
        progress.cleanAt[0] = Date.now() - E.SEGMENT_MASTERY_GAP_MS - 1000; // simule le retour du lendemain
    }
    if (E.segmentStateId(p.id, seg.id) !== "maitrise") { console.log("BLOQUÉ : " + p.id + "/" + seg.id + " jamais maîtrisé"); process.exit(1); }
  });
  const amb = E.ambitionProgress(p);
  if (!amb || !amb.done) { console.log("BLOQUÉ : ambition non atteinte sur " + p.id); process.exit(1); }
  console.log("Pièce « " + p.titre + " » : tous passages MAÎTRISÉS · ambition « lire » atteinte ★");
});
const pieceTotals = { series: stats.series - pieceStart.s, answers: stats.answers - pieceStart.a };

const wall = (Date.now() - t0) / 1000;

/* ---- BILAN ---- */
const db = E.getDB();
const trophies = E.trophyDefs().filter(t => t.on).map(t => t.id);
const playablePieces = E.PIECES_BUILTIN.filter(p => E.pieceMelody(p));
const counts = playablePieces.map(p => E.pieceStateCounts(p));
const passageTotal = counts.reduce((n, c) => n + c.total, 0);
const allMaster = counts.every(c => c.maitrise === c.total);
console.log("\n──────── PARTIE TERMINÉE ────────");
console.log("Validations paliers : " + Object.keys(db.paliers).reduce((n, pid) =>
  n + E.TIER_IDS.filter(t => db.paliers[pid][t] && db.paliers[pid][t].ok).length, 0) + " / 90");
console.log("Bibliothèque : " + (allMaster
  ? playablePieces.length + " pièces / " + passageTotal + " passages tous Maîtrisés"
  : "INCOMPLÈTE (" + playablePieces.length + " pièces / " + passageTotal + " passages)"));
console.log("Séries jouées : " + stats.series + " (dont partitions : " + pieceTotals.series + ")");
console.log("Questions : " + stats.questions + " · Réponses données : " + stats.answers + " · Erreurs : " + stats.wrong);
console.log("XP finale : " + db.xp + " · Trophées : " + trophies.length + " (" + trophies.join(", ") + ")");
console.log("Code de secours final : " + E.currentRecoveryCode());
console.log("Temps du bot (calcul pur) : " + wall.toFixed(1) + " s");
console.log("Temps mécanique incompressible en app réelle (délais de feedback + résultats, réponses instantanées) : " +
  (stats.mech / 60).toFixed(1) + " min");
console.log("Détail par niveau : " + JSON.stringify(stats.perTier));
console.log("Partitions : " + pieceTotals.series + " lectures · " + pieceTotals.answers + " notes lues");
