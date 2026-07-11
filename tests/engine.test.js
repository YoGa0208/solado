/* Tests du moteur SEZAM — Node, sans dépendance.
   Principe : on charge le VRAI script de index.html dans un bac à sable avec des stubs DOM,
   puis on teste les fonctions réelles (aucune logique dupliquée → aucun risque de divergence).
   Lancer :  node tests/engine.test.js
*/
"use strict";
const fs = require("fs");
const path = require("path");

/* ---------- stubs DOM minimaux ---------- */
function makeEl() {
  const el = {
    _children: [], _html: "", _text: "", style: {}, value: "", disabled: false,
    onclick: null, onchange: null, files: [], _attrs: {},
    classList: {
      _s: new Set(),
      add() { for (const a of arguments) this._s.add(a); },
      remove() { for (const a of arguments) this._s.delete(a); },
      toggle(c, f) { if (f === undefined) f = !this._s.has(c); f ? this._s.add(c) : this._s.delete(c); return f; },
      contains(c) { return this._s.has(c); }
    },
    setAttribute(k, v) { this._attrs[k] = v; },
    getAttribute(k) { return this._attrs[k] !== undefined ? this._attrs[k] : null; },
    appendChild(c) { this._children.push(c); return c; },
    removeChild(c) { const i = this._children.indexOf(c); if (i >= 0) this._children.splice(i, 1); },
    remove() {}, addEventListener() {}, removeEventListener() {},
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
  const doc = {
    getElementById(id) { return byId[id] || (byId[id] = makeEl()); },
    createElement() { return makeEl(); },
    querySelectorAll() { return []; },
    addEventListener() {}, body: makeEl()
  };
  return doc;
}
function makeLocalStorage() {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); },
    removeItem(k) { m.delete(k); }
  };
}
const navigatorStub = {
  vibrate() {}, storage: { persist() { return Promise.resolve(); } },
  serviceWorker: { register() { return Promise.resolve({ catch() {} }); } },
  clipboard: { writeText() {} }
};
const windowStub = { addEventListener() {}, AudioContext: undefined, webkitAudioContext: undefined };

/* ---------- chargement du vrai script ---------- */
function loadEngine() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const blocks = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  let src = null;
  for (const b of blocks) { if (b.indexOf('"use strict"') >= 0) src = b; }
  if (!src) throw new Error("Script principal introuvable dans index.html");
  src = src.replace(/^<script>/, "").replace(/<\/script>$/, "");
  const exportsList = [
    "esc", "checkValidation", "srs", "srsReview", "isDue", "ensureStructure",
    "importSave", "compactSave", "undoImport", "tierUnlocked", "tierComplete",
    "palierPlayable", "valProgress", "PALIERS", "TIERS", "TIER_IDS", "NOTES",
    "buildKeyboard", "pcOf", "isWhite", "pickKbdTarget", "nameOptions", "withAcc",
    "baseNoteObj", "kbdRangeFor", "freshPalierState", "SRS_DAYS", "normalizePiece", "normalizeAttachment", "normalizeSegment", "MAX_PIECE_ATTACHMENT_BYTES", "MAX_TOTAL_ATTACHMENT_BYTES", "SAFE_ATTACHMENT_TYPES", "pieceFileType",
    "normalizeQuestion", "normalizeDay", "normalizeSegmentState", "markDay", "activeDayKeys", "streak", "todayStr",
    "longestStreak", "weekStats", "practiceTotals", "trophyDefs", "trophiesEarned",
    "writtenLabelOf", "kbdLabelOf", "recoveryCodeInfo", "applyRecoveryCode",
    "trainingFocusText", "stateTimestamp", "stateScore", "shouldAdopt", "backupToDb", "THEME_MODES", "themeModeLabel", "watchHomeItems",
    "PROFILE_INSTRUMENTS", "PROFILE_PATHS", "PROFILE_LEVELS", "PRACTICE_DOMAINS", "normalizeProfile", "normalizeDailyProgress",
    "coachDecision", "repairPool", "fragileNoteIds", "globalPrecision", "sessionCountToday",
    "dailyPlan", "splitPlanMinutes", "targetCadence", "dailyMission", "DAILY_BLOCK_IDS", "runDailyBlock",
    "recentErrorsCount", "longPauseSignal", "timeSinceLastSession", "lastPracticeAt", "LONG_BREAK_MS",
    "pieceSegments", "segmentNotePool", "segmentQuestionCount", "segmentGroupN", "segmentProgress", "segmentProgressLabel",
    "segmentMastery", "recordSegmentResult", "nextSegmentForPiece", "PIECE_SEGMENT_HANDS", "PIECE_SEGMENT_FOCUSES",
    "PIECES_BUILTIN", "SEGMENT_STATES", "PIECE_AMBITIONS", "normalizeMelody", "pieceMelody", "pieceClef", "pieceById",
    "segmentMeasures", "segmentScript", "segmentStateId", "segmentStateDef", "segmentStateRank", "pieceStateCounts",
    "goalDef", "pieceGoal", "setPieceGoal", "ambitionProgress", "activePieceObj", "defaultActivePieceId", "ensureActivePiece",
    "noteOccurrencesInPiece", "measureSegment", "pieceMapSVG", "mapLegendHtml", "markSegmentSeen", "toggleSegmentFlag",
    "setSegmentFeel", "feelLabel", "beginSerie", "answer", "startPieceSegment", "renderResPiece", "nextQuestion",
    "beginClavier", "nextKbd", "kbdTap", "renderKbd",
    "STAFF", "staffSVG", "clefSVG", "noteGlyph", "yOf", "previewNoteHtml",
    "currentRecoveryCode", "mirrorIntro", "tone", "save", "readKey",
    "syncDecision", "syncCfg", "syncSet", "syncClear", "syncEnabled", "syncPush", "syncPull", "parseRemote", "sessionTokenGet",
    "cloudDocument", "cloudSaveContent", "cloudPieces", "looksLikeToken", "persistOnExit", "APP_VERSION"
  ];
  const footer = "\n;return {" + exportsList.map(n => n + ":(typeof " + n + "!=='undefined'?" + n + ":undefined)").join(",") +
    ",getDB:function(){return DB;},setDB:function(x){DB=x;},getKX:function(){return KX;},getEX:function(){return EX;},haltEX:function(){if(EX)EX.done=true;}};";
  const fn = new Function("document", "localStorage", "navigator", "window", "sessionStorage", src + footer);
  return fn(makeDocument(), makeLocalStorage(), navigatorStub, windowStub, makeLocalStorage());
}

/* ---------- mini-runner ---------- */
let pass = 0, fail = 0; const failures = [];
function ok(cond, msg) { if (cond) { pass++; } else { fail++; failures.push(msg); console.log("  ✗ " + msg); } }
function eq(a, b, msg) { ok(JSON.stringify(a) === JSON.stringify(b), msg + " (attendu " + JSON.stringify(b) + ", reçu " + JSON.stringify(a) + ")"); }
function group(name) { console.log("\n• " + name); }

const E = loadEngine();
console.log("Moteur chargé sans exception (smoke test du chargement de l'app). ✓");
pass++;

/* helper : DB fraîche */
function freshDB() { const db = E.ensureStructure({}); E.setDB(db); return db; }

/* 1) Échappement HTML (XSS) */
group("Sécurité — échappement des textes utilisateur");
ok(E.esc('<img src=x onerror=alert(1)>').indexOf("<") === -1, "esc supprime les chevrons '<'");
ok(E.esc('"\'&').indexOf("&amp;") >= 0, "esc encode l'esperluette");
eq(E.esc('a<b>c'), "a&lt;b&gt;c", "esc encode < et >");

/* 2) Validation 29/30 (3 séries propres ou 5 proches) */
group("Validation des paliers (29/30)");
const now = Date.now();
ok(E.checkValidation([{ e: 0, ts: now }, { e: 1, ts: now }, { e: 0, ts: now }]) === true,
  "3 séries consécutives avec ≤1 erreur au total → validé");
ok(E.checkValidation([{ e: 1, ts: now }, { e: 1, ts: now }, { e: 1, ts: now }]) === false,
  "3 séries à 1 erreur chacune (3 au total) → NON validé");
ok(E.checkValidation([{ e: 0, ts: now }, { e: 0, ts: now }, { e: 1, ts: now }, { e: 1, ts: now }, { e: 0, ts: now }]) === true,
  "règle des 5 séries proches (≤2 erreurs sur 5, dans la semaine) → validé");
const old = now - 8 * 864e5;
ok(E.checkValidation([{ e: 1, ts: old }, { e: 1, ts: old }, { e: 0, ts: now }]) === false,
  "séries trop vieilles ne comptent pas pour la règle des 5");

/* 3) SRS Leitner */
group("SRS — répétition espacée (Leitner 5 boîtes)");
freshDB();
ok(E.isDue("sol4") === false, "note jamais vue → pas due");
E.srsReview("sol4", true);
eq(E.srs("sol4").box, 1, "1 bonne réponse → boîte 1");
ok(E.isDue("sol4") === true, "boîte 1 (délai 0 j) → due immédiatement");
E.srsReview("sol4", true);
eq(E.srs("sol4").box, 2, "2 bonnes réponses → boîte 2");
ok(E.isDue("sol4") === false, "boîte 2 (délai 1 j) → plus due aujourd'hui");
E.srsReview("sol4", false);
eq(E.srs("sol4").box, 1, "une erreur → retour boîte 1");
for (let i = 0; i < 9; i++) E.srsReview("la4", true);
eq(E.srs("la4").box, 5, "la boîte plafonne à 5 (ancrage)");

/* 4) Import / Export */
group("Sauvegarde — import / export non destructifs");
freshDB();
const dump = E.compactSave();
ok(typeof dump === "string" && JSON.parse(dump).paliers !== undefined, "compactSave produit un JSON avec paliers");
freshDB();
let msg = E.importSave("P3");
ok(/P3/.test(msg), "import d'un code palier renvoie un message de confirmation");
ok(E.getDB().paliers.P1.zen.ok === true && E.getDB().paliers.P2.zen.ok === true, "code P3 : déverrouille P1 et P2 en Zen");
const before = JSON.stringify(E.getDB());
const bad = E.importSave("###pas du json###");
ok(/invalide/i.test(bad), "import d'un texte invalide → message d'erreur");
ok(JSON.stringify(E.getDB()) === before, "import invalide : l'état n'est PAS modifié (non destructif)");
freshDB(); E.getDB().xp = 123; const snap = E.compactSave();
freshDB();
E.importSave(snap);
eq(E.getDB().xp, 123, "round-trip export → import restaure les XP");
ok(Array.isArray(E.ensureStructure({paliers:{},events:{injecte:true}}).events), "import : journal mal formé remplacé par un tableau sûr");
E.undoImport();
eq(E.getDB().xp, 0, "undoImport restaure l'état précédent l'import");
const malformed = JSON.stringify({ paliers: {}, pieces: [
  null,
  { titre: "<b>XSS</b>", q: [{ q: "Question ?", choix: ["A", "B"], rep: 1 }, { q: "", choix: ["A"], rep: 9 }] },
  { titre: "Cassée", q: [{ q: "Sans choix", choix: "non", rep: 0 }] }
]});
freshDB();
E.importSave(malformed);
eq(E.getDB().pieces.length, 2, "import : les entrées nulles sont retirées, les objets valides conservés");
eq(E.getDB().pieces[0].q.length, 1, "import : seules les questions valides sont conservées");
ok(E.getDB().pieces[0].titre.indexOf("<") >= 0, "normalisation garde le texte brut ; l'échappement se fait au rendu");
const validAttachment = E.normalizeAttachment({ name: "scan.pdf", type: "application/pdf", size: 3, dataUrl: "data:application/pdf;base64,QUJD" });
ok(validAttachment && validAttachment.name === "scan.pdf", "pièce jointe PDF valide conservée");
ok(E.normalizeAttachment({ name: "script.html", type: "text/html", size: 20, dataUrl: "data:text/html;base64,PGgxPk5vPC9oMT4=" }) === null,
  "pièce jointe hors PDF/image rejetée");
ok(E.normalizeAttachment({ name: "actif.svg", type: "image/svg+xml", size: 20, dataUrl: "data:image/svg+xml;base64,PHN2Zy8+" }) === null,
  "pièce jointe SVG active rejetée (protection XSS)");
ok(E.normalizeAttachment({ name: "faux.png", type: "image/png", size: 20, dataUrl: "data:image/svg+xml;base64,PHN2Zy8+" }) === null,
  "MIME annoncé sûr mais contenu SVG rejeté");
eq(E.pieceFileType({ name:"partition.svg", type:"image/svg+xml" }), "", "sélecteur de fichier refuse aussi le SVG");
eq(E.pieceFileType({ name:"partition.webp", type:"image/webp" }), "image/webp", "format image passif autorisé");
freshDB();
E.importSave(JSON.stringify({ paliers: {}, pieces: [
  { titre: "Scan perso", attachment: { name: "scan.png", type: "image/png", size: 4, dataUrl: "data:image/png;base64,QUJDRA==" } }
] }));
ok(E.getDB().pieces[0].attachment && E.getDB().pieces[0].attachment.name === "scan.png",
  "import : pièce jointe image de partition conservée");
const seg = E.normalizeSegment({ title: "Mesures 1-4", bars: "1-4", level: "P3", hand: "droite", focus: "rythme", notes: ["sol4", "bad"] }, 0, { clef: "sol" });
ok(seg && seg.level === "P3" && seg.hand === "droite" && seg.focus === "rythme", "segment de partition : niveau, main et objectif conservés");
eq(seg.notes, ["sol4"], "segment de partition : notes ciblées filtrées sur le dictionnaire");
const segmentedPiece = E.normalizePiece({ titre: "Étude perso", clef: "sol", segments: [
  { title: "Mesures 1-2", level: "P1", focus: "notes" },
  { title: "Mesures 5-8", level: "P4", hand: "ensemble", focus: "coordination" }
] });
eq(segmentedPiece.segments.length, 2, "une partition peut porter plusieurs segments pédagogiques");
eq(E.segmentQuestionCount(segmentedPiece.segments[0]), 5, "segment débutant : micro-série courte");
eq(E.segmentQuestionCount(segmentedPiece.segments[1]), 8, "segment plus avancé : série plus dense");
ok(E.segmentNotePool(segmentedPiece.segments[1], segmentedPiece).every(id => E.NOTES[id].clef === "sol"),
  "segment lié à une partition clé de sol : pool filtré sur la bonne clé");
ok(E.pieceSegments(E.normalizePiece({ titre: "Sans découpe", clef: "fa" })).some(s => s.level === "P6"),
  "partition sans découpe manuelle : segments automatiques adaptés à la clé de fa");
freshDB();
const gamePiece = E.normalizePiece({ id: "piece-jeu", titre: "Partition jeu", clef: "sol", segments: [
  { id: "seg-a", title: "Mesures 1-2", level: "P1", focus: "notes" },
  { id: "seg-b", title: "Mesures 3-4", level: "P2", focus: "coordination" }
] });
eq(E.segmentProgressLabel(gamePiece.id, "seg-a"), "nouveau", "jeu partition : un segment commence avec l'état nouveau");
let stSeg = E.recordSegmentResult({ pieceId: gamePiece.id, segmentId: "seg-a" }, 5, 5, 0);
ok(stSeg.mastery >= 3 && E.segmentProgressLabel(gamePiece.id, "seg-a") === "validé",
  "jeu partition : un passage propre devient validé");
eq(E.nextSegmentForPiece(gamePiece).id, "seg-b", "jeu partition : le prochain segment utile est choisi automatiquement");
stSeg = E.recordSegmentResult({ pieceId: gamePiece.id, segmentId: "seg-b" }, 3, 5, 2);
ok(E.segmentProgressLabel(gamePiece.id, "seg-b") === "à réparer",
  "jeu partition : un passage fragile revient en réparation");
ok(E.compactSave().indexOf('"pieceProgress"') >= 0, "progression de partition incluse dans la sauvegarde compacte");
freshDB();
ok(E.recoveryCodeInfo("P4+").complete === true, "code P4+ reconnu comme palier validé");
let recMsg = E.applyRecoveryCode("P4+");
ok(/P4 validé/.test(recMsg), "applyRecoveryCode confirme P4+");
ok(E.getDB().paliers.P1.zen.ok && E.getDB().paliers.P2.zen.ok && E.getDB().paliers.P3.zen.ok && E.getDB().paliers.P4.zen.ok,
  "P4+ valide P1 à P4 en Zen");
eq(E.getDB().sel, "P5", "P4+ ouvre le palier suivant P5");
ok(E.practiceTotals().series >= 1, "récupération compte une activité aujourd'hui");
freshDB();
E.applyRecoveryCode("P4");
ok(E.getDB().paliers.P3.zen.ok === true && E.getDB().paliers.P4.zen.ok === false,
  "P4 restaure jusqu'au palier 4 sans le valider");
eq(E.getDB().sel, "P4", "P4 sélectionne le palier 4");

/* 5) Calendrier / trophées */
group("Rituel quotidien — calendrier, streaks, trophées");
freshDB();
ok(E.activeDayKeys().length === 0, "DB fraîche : aucun jour actif");
E.markDay("serie", 5);
eq(E.practiceTotals().days, 1, "markDay série coche le jour");
eq(E.practiceTotals().series, 1, "markDay série incrémente les séries");
ok(E.streak() >= 1, "jour coché → streak courant ≥ 1");
E.markDay("clavier", 8);
eq(E.practiceTotals().clavier, 1, "markDay clavier incrémente les sessions clavier");
ok(E.trophyDefs().find(t => t.id === "first").on, "trophée premier jour débloqué");
const d0 = new Date();
for (let i = 1; i <= 10; i++) {
  const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - i);
  E.getDB().days[E.getDB().days && (d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"))] =
    { series: 1, rafales: 0, clavier: 0, revisions: 0, perfect: false, xp: 0, last: 0 };
}
ok(E.longestStreak() >= 10, "10 jours consécutifs sont détectés");
ok(E.trophyDefs().find(t => t.id === "streak10").on, "trophée 10 jours débloqué");

/* 6) Progression des paliers / niveaux */
group("Progression — déverrouillage paliers & niveaux");
freshDB();
ok(E.tierUnlocked("zen") === true, "le niveau Zen est débloqué d'emblée");
ok(E.tierUnlocked("bronze") === false, "Bronze verrouillé tant que Zen n'est pas complété partout");
ok(E.palierPlayable("P1", "zen") === true, "P1 jouable en Zen");
ok(E.palierPlayable("P2", "zen") === false, "P2 verrouillé tant que P1 non validé");
E.getDB().paliers.P1.zen.ok = true;
ok(E.palierPlayable("P2", "zen") === true, "P1 validé → P2 jouable");
E.PALIERS.forEach(p => { E.getDB().paliers[p.id].zen.ok = true; });
ok(E.tierComplete("zen") === true, "tous les paliers Zen validés → niveau Zen complet");
ok(E.tierUnlocked("bronze") === true, "Zen complet → Bronze débloqué");
ok(E.tierUnlocked("diamantbleu") === false, "les gemmes (future) restent verrouillées (mécanique à venir)");
ok(/retrouver chaque note seule/.test(E.trainingFocusText("zen")), "préparation Zen : annonce la recherche note par note");
ok(/groupes de 2 notes/.test(E.trainingFocusText("bronze")), "préparation Bronze : annonce le travail par groupes");
ok(/Mode Libre/.test(E.trainingFocusText("libre")), "préparation Libre : annonce l'écoute et le chant");

/* 7) ModeSelector verrouillé — hiérarchie produit */
group("ModeSelector — hiérarchie REPAIR > FLASH > SESSION");
freshDB();
let dsel = E.coachDecision();
eq(dsel.kind, "session", "DB fraîche : fallback verrouillé → SESSION");
eq(E.timeSinceLastSession(), 0, "DB fraîche : pas assimilée à une pause longue");
ok(E.longPauseSignal() === false, "DB fraîche : longPauseSignal faux");

freshDB();
E.getDB().noteStats.sol4 = { v: 2, e: 2, box: 1, due: Date.now() - 1000, last: Date.now() - 1000 };
dsel = E.coachDecision();
eq(dsel.kind, "repair", "2 erreurs récentes/fragiles → RÉPARATION");
ok(!/flash/i.test(dsel.label), "2 erreurs ne déclenchent pas FLASH");
eq(dsel.pool.indexOf("sol4") >= 0, true, "RÉPARATION cible la note fragile");

freshDB();
const oldDate = new Date(Date.now() - E.LONG_BREAK_MS - 2 * 864e5);
const oldKey = oldDate.getFullYear()+"-"+String(oldDate.getMonth()+1).padStart(2,"0")+"-"+String(oldDate.getDate()).padStart(2,"0");
E.getDB().days[oldKey] = { series: 1, rafales: 0, clavier: 0, revisions: 0, perfect: false, xp: 10, last: Date.now() - E.LONG_BREAK_MS - 1000 };
E.getDB().noteStats.sol4 = { v: 20, e: 0, box: 3, due: Date.now() + 864e5, last: Date.now() - E.LONG_BREAK_MS - 1000 };
E.getDB().noteStats.la4 = { v: 20, e: 0, box: 3, due: Date.now() + 864e5, last: Date.now() - E.LONG_BREAK_MS - 1000 };
dsel = E.coachDecision();
eq(dsel.kind, "flash", "pause longue + précision haute → FLASH prioritaire sur SESSION");

freshDB();
E.getDB().days[oldKey] = { series: 1, rafales: 0, clavier: 0, revisions: 0, perfect: false, xp: 10, last: Date.now() - E.LONG_BREAK_MS - 1000 };
E.getDB().noteStats.sol4 = { v: 2, e: 2, box: 1, due: Date.now() - 1000, last: Date.now() - 1000 };
dsel = E.coachDecision();
eq(dsel.kind, "repair", "erreurs multiples + pause longue → RÉPARATION prioritaire");

freshDB();
E.getDB().noteStats.sol4 = { v: 20, e: 0, box: 3, due: Date.now() + 864e5, last: Date.now() };
E.getDB().noteStats.la4 = { v: 20, e: 1, box: 3, due: Date.now() + 864e5, last: Date.now() };
E.getDB().noteStats.si4 = { v: 20, e: 0, box: 3, due: Date.now() + 864e5, last: Date.now() };
dsel = E.coachDecision();
eq(dsel.kind, "session", "performance élevée sans pause ni erreur multiple → SESSION");

/* 8) Clavier & altérations */
group("Clavier — touches, altérations, exercices");
eq(E.buildKeyboard(60, 72).length, 13, "buildKeyboard(60,72) → 13 touches");
eq(E.buildKeyboard(60, 72).filter(k => k.white).length, 8, "do→do : 8 touches blanches");
ok(E.isWhite(60) === true && E.isWhite(61) === false, "do=blanche, do♯=noire");
const sharp = E.withAcc(E.baseNoteObj("sol4"), "diese");
eq(sharp.midi, 68, "sol♯ : midi +1 (= 68)");
eq(sharp.acc, "♯", "sol♯ : altération ♯");
eq(sharp.p, E.NOTES.sol4.p, "sol♯ garde la position de portée du sol (l'altération ne déplace pas la tête)");
const flat = E.withAcc(E.baseNoteObj("la4"), "bemol");
eq(flat.midi, E.NOTES.la4.midi - 1, "la♭ : midi -1");
// cible naturelle
const tNat = E.pickKbdTarget("sol", false, null);
ok(tNat.acc === null, "sans altérations : cible naturelle");
ok(tNat.midi >= E.kbdRangeFor("sol")[0] && tNat.midi <= E.kbdRangeFor("sol")[1], "cible dans l'ambitus de la clé de sol");
ok(E.NOTES[tNat.id] !== undefined, "cible naturelle adossée à une note du dictionnaire");
// cible altérée forcée (rnd déterministe : index 0 = do4, puis branche dièse)
const queue = [0, 0.1, 0.9]; let qi = 0; const rnd = () => queue[qi++ % queue.length];
const tAcc = E.pickKbdTarget("sol", true, null, rnd);
ok(tAcc.acc === "♯" && tAcc.midi === 61, "rnd forcé → do♯ (midi 61) avec altération ♯");
eq(E.writtenLabelOf(tAcc), "do♯", "writtenLabelOf respecte l'orthographe écrite exacte");
ok(/^do♯/.test(E.kbdLabelOf(tAcc)), "kbdLabelOf affiche l'orthographe exacte avant l'équivalent enharmonique");
// options de noms (touche → note)
const opts = E.nameOptions(61);
eq(opts.length, 4, "nameOptions renvoie 4 propositions");
eq(opts.filter(o => o.correct).length, 1, "exactement une proposition correcte");
ok(opts.find(o => o.correct).pc === E.pcOf(61), "la bonne proposition correspond à la classe de hauteur de la touche");
ok(opts.find(o => o.correct).label.indexOf("do♯") >= 0, "la touche noire affiche les deux orthographes (do♯ / ré♭)");

/* 9) Clavier — parcours DOM réel (smoke : aucune exception, état cohérent) */
group("Clavier — rendu DOM & parcours d'une question");
freshDB();
let threw = null;
try {
  E.beginClavier({ clef: "sol", dir: "read", acc: false });
  let kx = E.getKX();
  ok(kx && kx.cur, "beginClavier (note→touche) prépare une question");
  ok(kx.i === 0 && kx.ok === 0, "compteurs à zéro au départ");
  E.kbdTap(kx.cur.midi); // appuie sur la bonne touche
  kx = E.getKX();
  ok(kx.ok === 1 && kx.i === 1, "bonne touche → +1 juste, +1 question");
  kx.done = true; // stoppe l'avance automatique
  E.beginClavier({ clef: "fa", dir: "name", acc: true }); // l'autre sens, clé de fa, avec altérations
  kx = E.getKX();
  ok(kx && kx.cur, "beginClavier (touche→note, clé de fa, ♯♭) prépare une question");
  kx.done = true;
} catch (e) { threw = e; }
ok(threw === null, "le parcours clavier ne lève aucune exception" + (threw ? " — " + threw.message : ""));

/* 9) Portée — géométrie agrandie, grandes notes, marques lisibles */
group("Portée — géométrie mobile, grandes notes, marques");
freshDB();
ok(E.STAFF.half >= 9 && E.STAFF.H >= 160, "portée agrandie (interligne ≥ 9, hauteur ≥ 160)");
const svgBig = E.staffSVG("sol", [{ p: 2, color: "#000", x: 200, big: 1 }]);
ok(svgBig.indexOf('viewBox="0 0 ' + E.STAFF.W + ' ' + E.STAFF.H + '"') >= 0, "staffSVG utilise la hauteur H du viewBox (plus de 130 codé en dur)");
ok(svgBig.indexOf('rx="13.5"') >= 0, "note seule (big=1) : grande tête de note");
const svgGroup = E.staffSVG("sol", [{ p: 2, color: "#000", x: 200 }]);
ok(svgGroup.indexOf('rx="10"') >= 0, "note de groupe : tête agrandie (rx 10)");
eq((E.noteGlyph(200, 2, "#000", null, 2).match(/<ellipse/g) || []).length, 2, "big=2 (découverte/préparation) : halo doré + tête");
eq((E.noteGlyph(200, 2, "#000", null, 1).match(/<ellipse/g) || []).length, 1, "big=1 (exercice) : tête seule, pas de halo");
const yP10 = E.yOf(10);
const svgMark = E.staffSVG("fa", [{ p: 10, color: "#000", x: 200, big: 1, mark: "bad" }]);
ok(svgMark.indexOf('class="clef clef-fa"') >= 0 && svgMark.indexOf("\u{1D122}") >= 0,
  "clé de fa rendue avec le glyphe musical standard 𝄢");
ok(svgMark.indexOf('data-ref-p="6" data-ref-y="' + E.yOf(6) + '"') >= 0,
  "clé de fa : point d'ancrage calé sur la ligne du fa (p=6)");
ok(svgMark.indexOf('dominant-baseline="central"') >= 0 && svgMark.indexOf('data-upper-y="' + E.yOf(7) + '"') >= 0 &&
   svgMark.indexOf('data-lower-y="' + E.yOf(5) + '"') >= 0,
  "clé de fa : glyphe centré sur la ligne du fa, avec repères d'interlignes de l'armature");
ok(svgMark.indexOf("Apple Symbols") >= 0 && svgMark.indexOf("Bravura") >= 0,
  "clé de fa : pile de polices musicales explicite");
ok(svgMark.indexOf('font-family=""') < 0 && /font-family="'Apple Symbols','Noto Music'/.test(svgMark),
  "clé de fa : attribut font-family SVG syntaxiquement valide");
ok(svgMark.indexOf('y="' + (yP10 + 34) + '"') >= 0, "marque ✕ d'une note haute basculée SOUS la note (plus de coupure en haut)");
ok(E.staffSVG("sol", [{ p: 0, color: "#000", x: 200, big: 1, mark: "good" }]).indexOf("✓") >= 0, "marque ✓ présente (canal lisible sans couleur)");
ok(E.previewNoteHtml("sol4", true).indexOf("hearbtn") >= 0, "préparation : chaque note propose un bouton d'écoute");
ok(E.previewNoteHtml("sol4", false).indexOf("hearbtn") < 0, "previewNoteHtml sans bouton quand withListen=false");

/* 10) Code de secours */
group("Code de secours — visible, cohérent avec Restaurer");
freshDB();
ok(E.currentRecoveryCode() === null, "DB fraîche : pas encore de code");
E.getDB().paliers.P1.zen.ok = true; E.getDB().paliers.P2.zen.ok = true; E.getDB().paliers.P3.zen.ok = true;
eq(E.currentRecoveryCode(), "P3+", "P1..P3 validés en Zen → code P3+");
E.getDB().paliers.P2.zen.ok = false;
eq(E.currentRecoveryCode(), "P1+", "progression non contiguë : le code s'arrête au dernier palier sûr");
freshDB();
E.applyRecoveryCode("P3+");
eq(E.currentRecoveryCode(), "P3+", "round-trip : appliquer le code redonne exactement le même code");

/* 11) Sauvegarde multi-filets */
group("Sauvegarde — écriture réelle, checkpoint jamais dégradé");
freshDB(); E.getDB().xp = 9999; E.markDay("serie", 10); E.save();
eq(E.readKey("solfegeProto1").xp, 9999, "save écrit la clé principale");
eq(E.readKey("solfegeProto1_mirror").xp, 9999, "save écrit le miroir");
eq(E.readKey("solfegeProto1_checkpoint").xp, 9999, "save écrit le checkpoint");
E.setDB(E.ensureStructure({})); E.save();
eq(E.readKey("solfegeProto1").xp, 0, "un état vierge s'écrit normalement en principal");
eq(E.readKey("solfegeProto1_checkpoint").xp, 9999, "le checkpoint garde le MEILLEUR état connu (un vide n'écrase jamais une progression)");
ok(E.shouldAdopt(E.readKey("solfegeProto1_checkpoint"), E.readKey("solfegeProto1")) === true,
  "au chargement, le checkpoint meilleur gagne même si l'état principal est plus récent");
threw = null; try { E.tone(60); } catch (e) { threw = e; }
ok(threw === null, "tone() sans AudioContext (environnement de test) ne lève aucune exception");

/* 12) Miroir musical — intro comportementale */
group("Miroir musical — intro liée au comportement réel");
freshDB();
eq(E.mirrorIntro(), "", "DB fraîche : aucune intro inventée");
const tk = (function (d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })(new Date());
E.getDB().days[tk] = { series: 1, rafales: 0, clavier: 0, revisions: 0, perfect: true, xp: 10, last: 0 };
ok(/faute/.test(E.mirrorIntro()), "défi parfait aujourd'hui → intro « sans faute »");
freshDB();
for (let i = 0; i < 12; i++) {
  const d = new Date(); d.setDate(d.getDate() - i);
  const k = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  E.getDB().days[k] = { series: 1, rafales: 0, clavier: 0, revisions: 0, perfect: false, xp: 0, last: 0 };
}
ok(/continuité/.test(E.mirrorIntro()), "streak ≥ 10 jours → intro continuité");

/* 13) Service worker & synchronisation des fichiers */
group("Service worker & fichiers — garde-fous de livraison");
const swSrc = fs.readFileSync(path.join(__dirname, "..", "sw.js"), "utf8");
const mv = swSrc.match(/sezam-solado-v(\d+)/);
ok(mv && Number(mv[1]) >= 24, "CACHE_NAME dédié à l'app et incrémenté (≥ sezam-solado-v24)");
ok(/navigate/.test(swSrc), "documents servis réseau d'abord (plus de vieille version à vie)");
ok(/new URL\(req\.url\)\.origin !== self\.location\.origin/.test(swSrc), "le SW compare réellement les origines et n'intercepte pas l'API GitHub");
ok(/key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/.test(swSrc), "le SW ne supprime que les anciens caches SEZAM, jamais ceux d'une autre app");
ok(/LEGACY_CACHE_NAMES/.test(swSrc) && /sezam-v12/.test(swSrc), "migration : l'ancien cache public v12 est retiré explicitement");
ok(/skipWaiting/.test(swSrc) && /clients\.claim/.test(swSrc), "activation immédiate du nouveau SW conservée");
ok(/icon-180\.png/.test(swSrc), "icône iOS précachée");
ok(/icon-192\.png/.test(swSrc) && /icon-512\.png/.test(swSrc), "icônes PWA 192/512 précachées");
ok(/data\/music-watch\.json/.test(swSrc), "veille musicale précachée pour le mode hors-ligne");
ok(fs.readFileSync(path.join(__dirname, "..", "prototype-solfege.html"), "utf8") === fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8"),
  "prototype-solfege.html strictement synchronisé avec index.html");

/* 14) Synchro entre appareils (Gist) — parties pures et isolation du jeton */
group("Synchro — timestamp, enveloppe cloud, isolation du jeton");
freshDB();
eq(E.syncDecision(100, 200), "pull", "timestamp distant plus récent → on récupère (pull)");
eq(E.syncDecision(200, 100), "push", "timestamp local plus récent → on envoie (push)");
eq(E.syncDecision(150, 150), "none", "timestamps égaux → rien à faire");
eq(E.syncDecision(0, 0), "none", "deux états vides → rien à faire");
const remoteProgress = E.ensureStructure({ xp: 40, days: { "2026-07-04": { series: 1, xp: 10, last: 1 } }, paliers: {} });
eq(E.syncDecision(E.ensureStructure({}), remoteProgress), "pull", "un appareil vierge n'écrase jamais une progression distante");
ok(E.syncEnabled() === false, "synchro désactivée par défaut");
E.syncSet({ token: "tok_SECRET_123" });
ok(E.syncEnabled() === false, "jeton seul sans gist → pas encore activée");
E.syncSet({ gistId: "abc123" });
ok(E.syncEnabled() === true, "jeton + gist → activée");
eq(E.syncCfg().token, "tok_SECRET_123", "le jeton est disponible pendant la session");
ok(JSON.stringify(E.readKey("sezam_sync")||{}).indexOf("tok_SECRET_123") < 0, "le token n'est jamais persisté dans localStorage");
eq(E.sessionTokenGet(), "tok_SECRET_123", "le token existe seulement dans la mémoire JavaScript courante");
ok(E.compactSave().indexOf("tok_SECRET_123") < 0, "le jeton n'apparaît JAMAIS dans la sauvegarde compacte (QR/gist)");
E.getDB().xp = 7; E.save({ cloud: false });
ok(JSON.stringify(E.readKey("solfegeProto1")).indexOf("tok_SECRET_123") < 0, "le jeton n'apparaît jamais dans l'export complet (DB)");
const cloud = E.cloudDocument();
ok(cloud.progress && cloud.scores && cloud.settings && cloud.timestamp, "cloudDocument produit le fichier unique progress/scores/settings/timestamp");
ok(JSON.stringify(cloud).indexOf("tok_SECRET_123") < 0, "le token n'est jamais dans le document cloud");
E.getDB().pieces=[E.normalizePiece({titre:"Avec scan",attachment:{name:"scan.png",type:"image/png",size:4,dataUrl:"data:image/png;base64,QUJDRA=="}})];
E.getDB().events=[{t:1,type:"test",detail:"local"}];
const safeCloud = E.cloudDocument();
ok(JSON.stringify(safeCloud).indexOf("data:image/png") < 0, "les pièces jointes restent locales et ne partent pas dans le Gist");
eq(safeCloud.history.events, [], "le journal détaillé reste local et n'alourdit pas le Gist");
ok(E.parseRemote({ files: { "sezam-progress.json": { content: JSON.stringify(cloud) } } }).xp === cloud.scores.xp, "parseRemote lit le nouveau fichier gist SEZAM");
ok(E.parseRemote({ files: { "solado-save.json": { content: '{"paliers":{},"xp":5}' } } }).xp === 5, "parseRemote lit encore l'ancien fichier gist en compatibilité");
ok(E.parseRemote({ files: { "sezam-progress.json": { content: "pas du json" } } }) === null, "parseRemote rejette un contenu corrompu sans exception");
ok(E.parseRemote({ files: { "sezam-progress.json": { content: "{}", truncated: true, raw_url:"https://example.invalid/raw" } } }) === null,
  "parseRemote refuse un Gist tronqué au lieu de l'assimiler à un état vide");
ok(E.parseRemote(null) === null, "parseRemote tolère une réponse vide");
E.syncClear();
ok(E.syncEnabled() === false, "désactivation : la config locale est effacée");
threw = null; try { E.syncPush(true); E.syncPull(); } catch (e) { threw = e; }
ok(threw === null, "push/pull désactivés → aucun appel réseau, aucune exception");
ok(E.looksLikeToken("ghp_"+"A".repeat(24)) === true, "code classic ghp_… accepté");
ok(E.looksLikeToken("github_pat_"+"A".repeat(24)) === true, "code fine-grained github_pat_… accepté");
ok(E.looksLikeToken("gho_"+"A".repeat(24)) === false, "jeton OAuth non adapté refusé");
ok(E.looksLikeToken("MonMotDePasse123!") === false, "un mot de passe n'est PAS accepté comme code de synchro");
ok(E.looksLikeToken("personne@example.com") === false, "un email n'est pas accepté non plus");
ok(E.looksLikeToken("ghp_ avec espaces 123456789012345678") === false, "un code avec espaces est rejeté (avant nettoyage)");
const idx = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const av = idx.match(/APP_VERSION="v(\d+)"/);
ok(av && av[1] === (swSrc.match(/sezam-solado-v(\d+)/) || [])[1], "APP_VERSION de l'app = version du cache SW (affichage cohérent pour les retours bêta)");
ok(idx.indexOf("syncPushBlind") < 0 && idx.indexOf("save({touch:false,cloud:false})") >= 0,
  "sortie de page : sauvegarde locale sans push cloud à l'aveugle ni faux timestamp");
ok(idx.indexOf('id="btnFeedback"') >= 0 && idx.indexOf("YoGa0208/solado/issues/new") >= 0 && idx.indexOf("mailto:") < 0,
  "bouton « Donner un retour » présent via GitHub Issues, sans adresse personnelle publiée");
ok(idx.indexOf("scopes=gist") >= 0, "bouton 1 : lien direct vers la page GitHub pré-remplie (case gist déjà cochée)");

/* 15) Profil et plan quotidien personnalisés */
group("Personnalisation — profil, parcours, temps et plan quotidien");
freshDB();
eq(E.getDB().profile.parcours, "libre", "ancien joueur : parcours libre par défaut, sans supposer son niveau");
eq(E.getDB().profile.dailyMinutes, 20, "durée de séance par défaut : 20 minutes");
eq(E.getDB().profile.daysPerWeek, 5, "cadence par défaut : 5 jours par semaine");
eq(E.getDB().profile.domains, E.PRACTICE_DOMAINS.map(d => d.id), "les six domaines sont proposés par défaut");
eq(E.getDB()._sezam.schema, 8, "schéma local v8 pour le profil et le plan quotidien");
const sanitizedProfile = E.normalizeProfile({
  displayName: "  <Youcef>   Test  ", instrument: "inconnu", parcours: "rattrapage_a2",
  niveauDepart: "annee2", targetDate: "2026-02-30", dailyMinutes: 999, daysPerWeek: 0,
  domains: ["lecture", "rythme", "rythme", "pirate"]
});
eq(sanitizedProfile.displayName, "<Youcef> Test", "nom normalisé sans perdre le texte (échappé au rendu)");
eq(sanitizedProfile.instrument, "piano", "instrument inconnu remplacé par une valeur sûre");
eq(sanitizedProfile.parcours, "rattrapage_a2", "parcours guidé valide conservé");
eq(sanitizedProfile.targetDate, "", "date impossible rejetée");
eq(sanitizedProfile.dailyMinutes, 20, "budget hors liste ramené à 20 minutes");
eq(sanitizedProfile.domains, ["lecture", "rythme"], "domaines inconnus et doublons retirés");
freshDB();
let firstDecision = E.coachDecision();
let plan = E.dailyPlan(firstDecision);
eq(plan.blocks.map(b => b.minutes), [8, 6, 4, 2], "plan 20 min : répartition 40/30/20/10 exacte");
eq(plan.blocks.reduce((sum,b) => sum + b.minutes, 0), 20, "le plan respecte exactement le temps choisi");
eq(plan.blocks[0].action, firstDecision.kind, "la première action du plan suit réellement la décision du coach");
E.getDB().profile.dailyMinutes = 10;
plan = E.dailyPlan(E.coachDecision());
eq(plan.blocks.map(b => b.minutes), [6, 4], "plan 10 min : deux blocs essentiels, sans émietter la séance");
E.getDB().profile.dailyMinutes = 30;
E.getDB().profile.domains = ["integration"];
E.getDB().activePiece = "aclair";
plan = E.dailyPlan(E.coachDecision());
ok(plan.blocks.some(b => b.id === "nouveaute" && b.automatic === false && /Intégration/.test(b.title)),
  "profil intégration seule : l'œuvre reste bien dans le plan, même sans domaine Lecture");
eq(plan.blocks.reduce((sum,b) => sum + b.minutes, 0), 30, "plan long : le passage reste inclus dans le budget total");
E.getDB().dailyProgress[E.todayStr()]={nouveaute:"domaine:rythme"};
plan=E.dailyPlan(E.coachDecision());
ok(plan.blocks.find(b => b.id === "nouveaute").done === false,
  "une validation d'un autre domaine n'apparaît pas comme faite après personnalisation");
E.getDB().dailyProgress["2026-07-11"] = { oeuvre:true };
ok(E.compactSave().indexOf('"dailyProgress"') >= 0 && E.compactSave().indexOf('"profile"') >= 0,
  "profil et validations quotidiennes inclus dans la sauvegarde compacte");
const personalizedCloud = E.cloudDocument();
ok(personalizedCloud.progress.dailyProgress && personalizedCloud.settings.profile.parcours === "libre",
  "profil et plan quotidien inclus dans la sauvegarde cloud");

/* 16) Charte SEZAM — rebrand sans casse de données */
group("Charte SEZAM — identité appliquée, données intactes");
ok(idx.indexOf("<title>Sezam — entraînement musical</title>") >= 0, "titre de l'app renommé Sezam");
ok(idx.indexOf("SEZAM · ENTRAÎNEMENT MUSICAL") >= 0, "wordmark SEZAM dans l'en-tête");
ok(idx.indexOf("--bg:#ffffff") >= 0 && idx.indexOf("--or:#b8893a") >= 0 && idx.indexOf("--petrole:#0f4c5c") >= 0 &&
  idx.indexOf("--ceramique:#7fb8c2") >= 0 && idx.indexOf(':root[data-theme="partition"]') >= 0,
  "palette classique : fond blanc par défaut, partition crème en option, bleu pétrole, céramique, or");
ok(E.THEME_MODES.length === 4 &&
  E.THEME_MODES.map(t => t.label).join("|") === "Classique blanc|Partition crème|Nocturne bleu|Atelier du luthier",
  "quatre modes couleur nommés avec le blanc classique par défaut");
ok(idx.indexOf('id="themeModes"') >= 0 && idx.indexOf('id:"classique"') >= 0 && idx.indexOf(':root[data-theme="luthier"]') >= 0,
  "sélecteur de mode couleur présent avec Classique, Nocturne et Atelier du luthier");
freshDB();
eq(E.getDB().themeMode, "classique", "mode couleur par défaut : Classique blanc");
E.getDB().themeMode = "nocturne";
ok(E.compactSave().indexOf('"themeMode":"nocturne"') >= 0, "le mode couleur est inclus dans les sauvegardes/export QR/Gist");
ok(idx.indexOf('"Iowan Old Style","Charter"') >= 0, "typographie serif de la charte (Iowan/Charter) déclarée");
ok(idx.indexOf("#4cc2ff") < 0 && idx.indexOf("#ffd166") < 0, "anciennes couleurs Solado (cyan, jaune) entièrement retirées");
ok(idx.indexOf('LS_KEY="solfegeProto1"') >= 0, "clé de stockage INCHANGÉE (aucune progression perdue au rebrand)");
ok(idx.indexOf('GIST_FILE="sezam-progress.json"') >= 0 && idx.indexOf('GIST_FILE_LEGACY="solado-save.json"') >= 0,
  "gist SEZAM simplifié, ancien fichier encore lisible en compatibilité");
ok(idx.indexOf('IDB_NAME="soladoBackup"') >= 0, "base IndexedDB INCHANGÉE (le filet de secours reste lisible)");
const man = fs.readFileSync(path.join(__dirname, "..", "manifest.json"), "utf8");
ok(/"name":\s*"Sezam"/.test(man) && /#ffffff/.test(man), "manifest renommé Sezam, fond blanc classique");
ok(/"id":\s*"\.\/"/.test(man) && /"scope":\s*"\.\/"/.test(man) && /icon-192\.png/.test(man) && /icon-512\.png/.test(man),
  "manifest installable : identité et périmètre stables, icônes PNG 192/512");
const ic = fs.readFileSync(path.join(__dirname, "..", "icon.svg"), "utf8");
ok(ic.indexOf("polyline") >= 0 && ic.indexOf("#b8893a") >= 0 && ic.indexOf("#1a1612") >= 0,
  "icône = marque SEZAM (delta + filet d'or) sur fond encre");

/* 17) Veille musicale — offline, brèves courtes, rapports */
group("Veille musicale — synthèse et rapports");
const watch = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "music-watch.json"), "utf8"));
ok(Array.isArray(watch.items) && watch.items.length >= 6, "veille musicale disponible en JSON statique");
ok(idx.indexOf('id="watchBox"') >= 0 && idx.indexOf("loadWatchFeed") >= 0, "accueil branché sur la veille musicale");
ok(idx.indexOf("Culture generale & nouveautés") < 0 && idx.indexOf("watchTag") < 0 &&
  idx.indexOf("watchMeta") < 0 && idx.indexOf("En bref.") < 0 && idx.indexOf("watchDate") < 0,
  "la veille n'affiche plus de traces méta type devoir scolaire");
ok(watch.items.every(it => String(it.brief || "").split(/[.!?]+/).filter(Boolean).length <= 5),
  "chaque brève tient en moins de 5 phrases");
ok(watch.items.every(it => Array.isArray(it.report) && it.report.length >= 2),
  "chaque item possède un rapport développé au clic");
ok(["Artisans", "Solfège", "Compositeurs", "Instruments", "Grandes oeuvres", "Histoire de l'art"]
  .every(cat => watch.items.some(it => it.category === cat)),
  "couverture éditoriale : artisans, solfège, compositeurs, instruments, grandes oeuvres, histoire de l'art");
ok(E.watchHomeItems(watch).some(it => it.category === "Histoire de l'art") && idx.indexOf("Brèves d’histoire de l’art") >= 0,
  "l'accueil remonte explicitement une brève Histoire de l'art");
ok(!/culture generale|culture générale|Angle culture generale|objectif/i.test(JSON.stringify(watch)),
  "la veille publiée évite les libellés d'intention et le ton de fiche pédagogique");
const workflow = fs.readFileSync(path.join(__dirname, "..", ".github", "workflows", "pages.yml"), "utf8");
ok(/cron: "17 \*\/6 \* \* \*"/.test(workflow) && /npm run build:watch/.test(workflow),
  "GitHub Actions régénère la veille régulièrement et l'embarque dans Pages");

/* 17) Partition = terrain de jeu — bibliothèque, script, états, ambitions, bilan */
group("Partition — bibliothèque jouable du domaine public");
freshDB();
const melodics = E.PIECES_BUILTIN.filter(p => E.pieceMelody(p));
ok(melodics.length >= 8, "au moins 8 pièces jouables avec mélodie intégrée");
ok(melodics.every(p => p.pd === true), "chaque pièce jouable est du domaine public");
ok(melodics.every(p => E.pieceMelody(p).measures.every(mes => mes.every(id => E.NOTES[id]))),
  "chaque note de chaque mélodie existe dans le dictionnaire");
ok(melodics.every(p => E.pieceSegments(p).every(s => !s.mesFrom || (s.mesFrom >= 1 && s.mesTo <= E.pieceMelody(p).measures.length))),
  "chaque passage pointe vers des mesures réelles de sa pièce");
const levelsUsed = [];
melodics.forEach(p => E.pieceSegments(p).forEach(s => { if (levelsUsed.indexOf(s.level) < 0) levelsUsed.push(s.level); }));
ok(levelsUsed.indexOf("P1") >= 0 && levelsUsed.indexOf("P6") >= 0,
  "répertoire étagé : du P1 (débutant clé de sol) au P6+ (clé de fa)");
ok(E.pieceClef(E.pieceById("aclair")) === "sol" && E.pieceClef(E.pieceById("aclairfa")) === "fa",
  "la clé de chaque pièce est correctement déduite");
eq(E.segmentScript(E.pieceSegments(E.pieceById("aclair"))[0], E.pieceById("aclair")),
  ["sol4","sol4","sol4","la4","si4","la4"],
  "le script d'un passage = le texte musical exact des mesures (Au clair de la lune, mes. 1-2)");
ok(E.segmentNotePool(E.pieceSegments(E.pieceById("aclair"))[0], E.pieceById("aclair")).join(",") === "sol4,la4,si4",
  "le pool d'un passage mélodique = ses notes réelles, dédoublonnées");
const badMel = E.normalizeMelody({ measures: [["sol4", "hack<script>"], ["troll"], "pas un tableau"] });
eq(badMel.measures, [["sol4"]], "normalizeMelody filtre les notes inconnues et les mesures invalides");
ok(E.normalizeMelody({ measures: [] }) === null, "mélodie vide → null (pas de fausse pièce jouable)");

group("Partition — les 5 états d'un passage");
freshDB();
const pAclair = E.pieceById("aclair");
const segIds = E.pieceSegments(pAclair).map(s => s.id);
eq(E.segmentStateId("aclair", segIds[0]), "adecouvrir", "passage jamais joué → À découvrir");
E.markSegmentSeen("aclair", segIds[0]);
eq(E.segmentStateId("aclair", segIds[0]), "entravail", "« vu en cours » (décision du joueur) → En travail");
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[0] }, 5, 5, 0);
eq(E.segmentStateId("aclair", segIds[0]), "valide", "un passage propre (1 fois) → Validé");
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[0] }, 5, 5, 0);
eq(E.segmentStateId("aclair", segIds[0]), "maitrise", "deux passages propres → Maîtrisé");
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[1] }, 3, 5, 2);
eq(E.segmentStateId("aclair", segIds[1]), "fragile", "60 % avec erreurs → Fragile");
E.toggleSegmentFlag("aclair", segIds[2]);
eq(E.segmentStateId("aclair", segIds[2]), "fragile", "« à retravailler » posé par le joueur → Fragile immédiat");
eq(E.nextSegmentForPiece(pAclair).id, segIds[2], "le passage marqué par le joueur passe DEVANT tout le reste");
E.toggleSegmentFlag("aclair", segIds[2]);
eq(E.nextSegmentForPiece(pAclair).id, segIds[1], "sans marque joueur : le fragile est prioritaire");
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[1] }, 5, 5, 0);
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[1] }, 5, 5, 0);
ok(["adecouvrir"].indexOf(E.segmentStateId("aclair", segIds[2])) >= 0 &&
  E.nextSegmentForPiece(pAclair).id === segIds[2], "réparé → le prochain passage utile devient la découverte suivante");
const counts = E.pieceStateCounts(pAclair);
eq(counts.total, segIds.length, "pieceStateCounts couvre tous les passages");
ok(counts.maitrise >= 2, "les passages maîtrisés sont comptés");
E.setSegmentFeel("aclair", segIds[1], 3);
eq(E.segmentProgress("aclair", segIds[1]).feel, 3, "difficulté ressentie mémorisée (pouvoir du joueur)");
ok(E.compactSave().indexOf('"seen"') >= 0 || E.compactSave().indexOf('"pieceProgress"') >= 0,
  "les états de passage voyagent dans la sauvegarde compacte");

group("Partition — ambitions du joueur");
freshDB();
ok(E.pieceGoal("aclair") === null, "aucune ambition par défaut");
E.setPieceGoal("aclair", "lire");
let amb = E.ambitionProgress(E.pieceById("aclair"));
ok(amb && amb.def.id === "lire" && amb.pct === 0 && amb.done === false, "ambition « lire » posée : 0 %, en cours");
E.pieceSegments(E.pieceById("aclair")).forEach(s => {
  E.recordSegmentResult({ pieceId: "aclair", segmentId: s.id }, 5, 5, 0);
  E.recordSegmentResult({ pieceId: "aclair", segmentId: s.id }, 5, 5, 0);
});
amb = E.ambitionProgress(E.pieceById("aclair"));
ok(amb.done === true && amb.pct === 100, "tous les passages conquis → ambition atteinte");
ok(E.pieceGoal("aclair").doneAt > 0, "l'ambition atteinte porte sa date de réussite");
E.setPieceGoal("frere", "passage", "frere_p3");
amb = E.ambitionProgress(E.pieceById("frere"));
ok(amb && /carillon/i.test(amb.txt), "ambition « passage précis » : le passage choisi est nommé");
eq(E.nextSegmentForPiece(E.pieceById("frere")).id, "frere_p3", "l'ambition « passage précis » guide le prochain passage proposé");
E.setPieceGoal("frere", null);
ok(E.pieceGoal("frere") === null, "le joueur peut retirer son ambition");
ok(E.compactSave().indexOf('"pieceGoals"') >= 0 && E.compactSave().indexOf('"activePiece"') >= 0,
  "ambitions et œuvre en cours incluses dans la sauvegarde (QR/fichier/Gist)");

group("Partition — œuvre en cours & impact des sessions");
freshDB();
const act = E.ensureActivePiece();
ok(act && E.pieceMelody(act), "une œuvre en cours jouable est proposée d'office");
eq(act.id, "aclair", "le joueur débutant démarre sur la pièce la plus accessible");
const occ = E.noteOccurrencesInPiece(E.pieceById("aclair"), ["sol4"]);
eq(occ.count, 10, "sol4 apparaît 10 fois dans Au clair de la lune (l'impact est compté juste)");
ok(occ.bySeg.length >= 1 && occ.bySeg[0].count > 0, "l'impact est rattaché aux passages qui en profitent");
eq(E.noteOccurrencesInPiece(E.pieceById("aclair"), ["fa2"]).count, 0, "une note absente de la pièce → impact nul");
const segsR = E.pieceSegments(E.pieceById("aclair")).filter(s => s.mesFrom);
ok(E.measureSegment(segsR, 1).id === "aclair_p1" && E.measureSegment(segsR, 5).id === "aclair_p3",
  "chaque mesure appartient à son passage le plus précis (jamais au fourre-tout « toute la pièce »)");

group("Partition — carte de conquête SVG");
freshDB();
const map = E.pieceMapSVG(E.pieceById("aclair"));
ok(map.indexOf("<svg") === 0 && map.indexOf("viewBox") > 0, "la carte est un SVG valide");
eq((map.match(/data-seg="aclair_p1"/g) || []).length, 2, "chaque mesure du passage 1 est cliquable (2 mesures)");
ok(map.indexOf("\u{1D11E}") >= 0, "clé de sol dessinée sur chaque système");
ok(E.pieceMapSVG(E.pieceById("aclairfa")).indexOf('class="clef clef-fa"') >= 0,
  "clé de fa géométrique dessinée pour la main gauche sur la carte");
E.recordSegmentResult({ pieceId: "aclair", segmentId: "aclair_p1" }, 3, 5, 2);
ok(E.pieceMapSVG(E.pieceById("aclair")).indexOf("#b45f4b") >= 0, "un passage fragile colore sa zone en rouge doux");
ok(E.pieceMapSVG(E.pieceById("aclair"), { trained: ["sol4"] }).indexOf("rgba(216,169,77") >= 0,
  "les notes travaillées en session reçoivent leur halo doré sur la carte");
ok(E.pieceMapSVG(E.pieceById("aclair"), { highlight: "aclair_p1" }).indexOf("stroke-dasharray") >= 0,
  "le passage recommandé est encadré sur la carte");
ok(E.pieceMapSVG({ titre: "sans mélodie" }) === "", "pièce sans mélodie → pas de carte (aucune erreur)");
ok(E.mapLegendHtml().split("<span>").length - 1 === 5, "la légende affiche les 5 états");
ok(E.SEGMENT_STATES.map(s => s.label).join("|") === "À découvrir|En travail|Fragile|Validé|Maîtrisé",
  "les 5 états portent leurs noms définitifs");

group("Partition — jouer un passage = lire la pièce dans l'ordre");
freshDB();
let threwPiece = null;
try {
  E.startPieceSegment("aclair", "aclair_p1");
  let ex = E.getEX();
  ok(ex && ex.sessionMode === "piece" && ex.script && ex.script.length === 6, "le passage lance une série scriptée sur ses 6 notes réelles");
  ok(ex.qtype === "lect", "une série scriptée est toujours en lecture (jamais en écriture)");
  eq(ex.seq, ["sol4"], "première question = première note de la partition (groupe de 1 en Zen)");
  E.answer("sol");
  ex = E.getEX();
  ok(ex.ok === 1 && ex.i === 1, "bonne réponse sur la note du texte : la lecture avance");
  ok(ex.seenIds.indexOf("sol4") >= 0, "les notes lues en session sont mémorisées pour le bilan partition");
  E.haltEX();
  // série complète : toutes les réponses justes → le passage devient Validé et le bilan s'affiche
  E.startPieceSegment("aclair", "aclair_p1");
  ex = E.getEX();
  for (let guard = 0; guard < 60 && !E.getEX().done; guard++) {
    const cur = E.getEX();
    if (cur.waiting) { E.nextQuestion(); continue; } // en jeu réel, l'avance est automatique (380 ms)
    E.answer(E.NOTES[cur.seq[cur.k]].n);
  }
  ok(E.getEX().done === true, "la série scriptée se termine d'elle-même au bout du passage");
  eq(E.segmentStateId("aclair", "aclair_p1"), "valide", "passage lu sans faute → Validé sur la carte");
  ok(E.getEX().seenIds.length >= 3, "toutes les notes du passage ont été vues");
  ok(E.getDB().xp >= E.getEX().n + 15, "promotion vers Validé : bonus de conquête crédité (+15 XP)");
} catch (e) { threwPiece = e; }
ok(threwPiece === null, "le parcours partition ne lève aucune exception" + (threwPiece ? " — " + threwPiece.message : ""));
freshDB();
E.recordSegmentResult({ pieceId: "aclair", segmentId: "aclair_p1" }, 2, 5, 3); // le passage devient fragile
E.startPieceSegment("aclair", "aclair_p1");
ok(E.getEX().script === null || !E.getEX().script, "passage fragile → réparation ciblée pondérée (le script laisse place au SRS)");
ok(E.getEX().pool.join(",") === "sol4,la4,si4", "la réparation reste cantonnée aux notes du passage");
E.haltEX();

group("Partition — cohérence pédagogique et justesse musicale (audit)");
freshDB();
// GARDE-FOU MAJEUR : chaque note d'un passage appartient au palier annoncé par ce passage.
E.PIECES_BUILTIN.filter(p => E.pieceMelody(p)).forEach(p => {
  E.pieceSegments(p).forEach(s => {
    const script = E.segmentScript(s, p);
    if (!script) return;
    const palier = E.PALIERS.find(x => x.id === s.level);
    ok(script.every(id => palier.notes.indexOf(id) >= 0),
      p.id + " / " + s.id + " : toutes les notes du passage sont dans le palier " + s.level);
  });
});
// Justesse : Ode à la joie main gauche est en do majeur (aucun si — pas de mode lydien accidentel)
const odFa = E.pieceMelody(E.pieceById("odejoiefa"));
ok(odFa.measures.every(mes => mes.every(id => ["do3","re3","mi3","fa3","sol3"].indexOf(id) >= 0)),
  "Ode à la joie main gauche : degrés 1-5 de do majeur uniquement (justesse modale)");
eq(odFa.measures[0], ["mi3","mi3","fa3","sol3"], "Ode à la joie main gauche : incipit exact du thème");
// Chaque pièce jouable démarre et finit sur une note stable de sa mélodie (aucune mesure vide)
ok(E.PIECES_BUILTIN.filter(p => E.pieceMelody(p)).every(p => E.pieceMelody(p).measures.every(m => m.length >= 1)),
  "aucune mesure vide dans la bibliothèque");

group("Partition — réparations d'audit verrouillées");
freshDB();
const idxA = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
ok(/sessionMode==="piece"&&EX\.segment&&EX\.segment\.pieceId/.test(idxA),
  "« Encore une série » après un passage enchaîne dans la pièce (pas de session générique)");
ok(idxA.indexOf("bindPieceMap(div") >= 0, "les mini-cartes de la liste des pièces sont cliquables");
ok(/unhandledrejection/.test(idxA) && /window\.addEventListener\("error"/.test(idxA),
  "filet ultime : toute erreur JS déclenche une sauvegarde silencieuse");
ok(/window\.scrollTo\(0,0\)/.test(idxA), "chaque écran s'ouvre en haut de page");
ok(/\^https\?:\\\/\\\//.test(idxA), "la veille n'ouvre jamais d'URL non http(s)");
ok(idxA.indexOf("seenIds:[]") >= 0 && /end:Date\.now\(\)\+RAFALE_S\*1000,script:null,scriptIdx:0,seenIds:\[\]/.test(idxA),
  "la rafale trace aussi les notes vues (bilan partition inclus)");
ok(idxA.indexOf("segPromotion") >= 0, "une promotion de passage (Validé/Maîtrisé) rapporte des XP");
// persistance de l'ambition atteinte
E.setPieceGoal("aclair", "cours");
E.pieceSegments(E.pieceById("aclair")).forEach(s => { E.markSegmentSeen("aclair", s.id); });
const ambDone = E.ambitionProgress(E.pieceById("aclair"));
ok(ambDone.done === true, "ambition « préparer mon cours » atteinte quand tout est vu");
ok(E.readKey("solfegeProto1").pieceGoals.aclair.doneAt > 0,
  "la réussite d'ambition est écrite sur disque immédiatement (survit à un crash)");

group("Partition — trophées de conquête d'œuvres");
freshDB();
ok(E.trophyDefs().find(t => t.id === "premierepiece").on === false, "trophée « Première œuvre » verrouillé au départ");
E.pieceSegments(E.pieceById("aclair")).forEach(s => {
  E.recordSegmentResult({ pieceId: "aclair", segmentId: s.id }, 5, 5, 0);
  E.recordSegmentResult({ pieceId: "aclair", segmentId: s.id }, 5, 5, 0);
});
ok(E.trophyDefs().find(t => t.id === "premierepiece").on === true, "une pièce entièrement maîtrisée débloque « Première œuvre »");
ok(E.trophyDefs().find(t => t.id === "bibliotheque").on === false, "« Bibliothèque » attend les 8 pièces");
E.PIECES_BUILTIN.filter(p => E.pieceMelody(p)).forEach(p => {
  E.pieceSegments(p).forEach(s => {
    E.recordSegmentResult({ pieceId: p.id, segmentId: s.id }, 5, 5, 0);
    E.recordSegmentResult({ pieceId: p.id, segmentId: s.id }, 5, 5, 0);
  });
});
ok(E.trophyDefs().find(t => t.id === "bibliotheque").on === true, "toutes les pièces maîtrisées débloquent « Bibliothèque »");

group("Partition — bilan de fin de session dans l'interface");
const idx2 = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
ok(idx2.indexOf('id="resPiece"') >= 0, "l'écran résultat porte le bloc « Dans ta partition »");
ok(idx2.indexOf('id="scrPiece"') >= 0 && idx2.indexOf('id="pieceDetail"') >= 0, "la fiche de pièce (carte + ambition + passages) existe");
ok(idx2.indexOf("Ton œuvre en cours") >= 0, "le cockpit montre l'œuvre en cours du joueur");
ok(idx2.indexOf("À retravailler") >= 0 && idx2.indexOf("Vu en cours") >= 0,
  "le joueur peut agir : marquer un passage à retravailler ou vu en cours");
ok(idx2.indexOf("data-feel") >= 0, "le joueur déclare son ressenti (facile / juste bien / difficile) après un passage");
ok(idx2.indexOf("Choisir mon ambition") >= 0 || idx2.indexOf("Changer d'ambition") >= 0, "le choix d'ambition est offert dans la fiche de pièce");

/* ---------- bilan ---------- */
console.log("\n──────────────────────────────");
console.log("Réussis : " + pass + "   Échecs : " + fail);
if (fail) { console.log("ÉCHECS :"); failures.forEach(f => console.log("  - " + f)); process.exit(1); }
else { console.log("Tous les tests passent. ✓"); process.exit(0); }
