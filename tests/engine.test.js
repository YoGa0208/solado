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
function makeLocalStorage(seed) {
  const m = new Map(), failures = new Map();
  if (seed && typeof seed === "object") Object.keys(seed).forEach(k => m.set(k, String(seed[k])));
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) {
      if (failures.has(k)) {
        const left = failures.get(k) - 1;
        if (left <= 0) { failures.delete(k); throw new Error("quota simulé pour " + k); }
        failures.set(k, left);
      }
      m.set(k, String(v));
    },
    removeItem(k) { m.delete(k); },
    failAfter(k, calls) { failures.set(k, Math.max(1, Number(calls) || 1)); },
    dump() { return Object.fromEntries(m.entries()); }
  };
}
function makeFakeIndexedDB(seed) {
  const store = seed instanceof Map ? seed : new Map(Object.entries(seed || {}));
  const db = {
    createObjectStore() {},
    transaction() {
      const tx = { oncomplete: null, onerror: null, onabort: null };
      tx.objectStore = function() {
        return {
          put(value, key) { store.set(key, value); if (tx.oncomplete) tx.oncomplete(); },
          get(key) {
            const rq = { result: store.has(key) ? store.get(key) : undefined };
            Object.defineProperty(rq, "onsuccess", { set(fn) { fn(); } });
            Object.defineProperty(rq, "onerror", { set() {} });
            return rq;
          },
          delete(key) { store.delete(key); }
        };
      };
      return tx;
    }
  };
  const indexedDB = {
    open() {
      const rq = { result: db };
      Object.defineProperty(rq, "onupgradeneeded", { set(fn) { fn(); } });
      Object.defineProperty(rq, "onsuccess", { set(fn) { fn(); } });
      Object.defineProperty(rq, "onerror", { set() {} });
      return rq;
    }
  };
  return { indexedDB, store };
}
const navigatorStub = {
  vibrate() {}, storage: { persist() { return Promise.resolve(); } },
  serviceWorker: { register() { return Promise.resolve({ catch() {} }); } },
  clipboard: { writeText() {} }
};
const windowStub = { addEventListener() {}, AudioContext: undefined, webkitAudioContext: undefined };

/* ---------- chargement du vrai script ---------- */
function loadEngine(runtime) {
  runtime = runtime || {};
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const blocks = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
  let src = null;
  for (const b of blocks) { if (b.indexOf('"use strict"') >= 0) src = b; }
  if (!src) throw new Error("Script principal introuvable dans index.html");
  src = src.replace(/^<script>/, "").replace(/<\/script>$/, "");
  const exportsList = [
    "esc", "checkValidation", "seriesCover", "recentCoveredIds", "validationMissingIds", "srs", "srsReview", "isDue", "coldRecallId", "ensureStructure", "cleanId", "isSafeId", "safeMap", "hasOwn",
    "importSave", "compactSave", "undoImport", "tierUnlocked", "tierComplete",
    "palierPlayable", "playableInMode", "visiblePaliers", "valProgress", "PALIERS", "TIERS", "TIER_IDS", "NOTES",
    "buildKeyboard", "pcOf", "isWhite", "pickKbdTarget", "nameOptions", "withAcc",
    "baseNoteObj", "kbdRangeFor", "freshPalierState", "SRS_DAYS", "normalizePiece", "normalizeAttachment", "normalizeSegment", "MAX_PIECE_ATTACHMENT_BYTES", "MAX_TOTAL_ATTACHMENT_BYTES", "SAFE_ATTACHMENT_TYPES", "pieceFileType",
    "normalizeQuestion", "normalizeDay", "normalizeSegmentState", "normalizeNoteStat", "normalizeConfusions", "normalizeRepairItem", "normalizeRepairQueue", "normalizeEasterEggs", "normalizeSeriesRecord", "normalizeTierProgress", "normalizeStar", "normalizeSeen", "normalizeKbdStats", "markDay", "activeDayKeys", "streak", "todayStr",
    "longestStreak", "weekStats", "practiceTotals", "trophyDefs", "shownTrophyDefs", "trophiesEarned", "BONUS_EGG_DEFS", "awardEasterEgg",
    "writtenLabelOf", "kbdLabelOf", "recoveryCodeInfo", "applyRecoveryCode",
    "trainingFocusText", "stateTimestamp", "stateScore", "shouldAdopt", "backupToDb", "THEME_MODES", "themeModeLabel", "watchHomeItems",
    "PROFILE_INSTRUMENTS", "PROFILE_PATHS", "PROFILE_LEVELS", "PRACTICE_DOMAINS", "normalizeProfile", "normalizeDailyProgress", "normalizeValidationDrafts", "validationDraftKey",
    "CURRICULUM_CATALOG_VERSION", "CURRICULUM_SCOPE", "CURRICULUM_EVIDENCE_TYPES", "CURRICULUM_PROGRESS_STATUSES", "normalizeCurriculumProof", "normalizeCurriculumState", "validCurriculumCatalog", "curriculumCompetency", "curriculumStatusFromProofs", "setCurriculumCatalog", "backfillCurriculumFromGame", "curriculumScopeHtml",
    "profileStartPalier", "applyProfileStartPlacement", "profileStartText", "coachPalier", "coachDecision", "repairPool", "fragileNoteIds", "globalPrecision", "sessionCountToday",
    "dailyPlan", "splitPlanMinutes", "targetCadence", "dailyMission", "dailyFocusDomain", "DAILY_BLOCK_IDS", "runDailyBlock",
    "buildDailySession", "dailyPhaseAt", "dailyPhasePool", "dailyPhaseLabel", "dailyTransferReadyForBonus", "dailyBonusTask", "startDailySession", "dailyDraftRecords", "storeDailyDraft", "nextCampaignTarget", "configureDailyCampaignTarget", "advanceDailyCampaignTarget", "recordDailyTargetEvidence", "dailyActiveElapsed", "pauseDailySession", "resumeDailySession", "dailyScoredCount", "dailySessionQualified",
    "pendingRepairIds", "responseKey", "confusedNoteId", "recordConfusion", "scheduleRepair", "dueRepairForSession", "repairBlockedIds", "ordinaryQuestionPool", "nearTransferId", "advanceRepair",
    "validationRecordFromQuestions", "questionTask", "completeMission", "solveBonusEgg", "startRevision", "representativeNoteSample", "starReviewSample", "starReviewCoverage", "starReviewRepairsClear", "startStarReview", "timeUp", "updateDailyClock", "clearQTimers", "clearDailyTimer",
    "recentErrorsCount", "longPauseSignal", "timeSinceLastSession", "lastPracticeAt", "LONG_BREAK_MS",
    "pieceSegments", "segmentNotePool", "segmentQuestionCount", "segmentGroupN", "segmentProgress", "segmentProgressLabel",
    "segmentMastery", "recordSegmentResult", "SEGMENT_MASTERY_GAP_MS", "nextSegmentForPiece", "PIECE_SEGMENT_HANDS", "PIECE_SEGMENT_FOCUSES",
    "PIECES_BUILTIN", "SEGMENT_STATES", "PIECE_AMBITIONS", "normalizeMelody", "pieceMelody", "pieceClef", "pieceById",
    "segmentMeasures", "segmentScript", "segmentStateId", "segmentStateDef", "segmentStateRank", "pieceStateCounts",
    "goalDef", "pieceGoal", "setPieceGoal", "ambitionProgress", "activePieceObj", "defaultActivePieceId", "ensureActivePiece",
    "noteOccurrencesInPiece", "measureSegment", "pieceMapSVG", "mapLegendHtml", "markSegmentSeen", "toggleSegmentFlag",
    "setSegmentFeel", "feelLabel", "beginSerie", "answer", "answerPos", "startPieceSegment", "renderResPiece", "nextQuestion",
    "beginClavier", "nextKbd", "kbdTap", "renderKbd", "recordKbdAnswer",
    "STAFF", "staffSVG", "bonusStaffSVG", "clefSVG", "noteGlyph", "yOf", "previewNoteHtml",
    "currentRecoveryCode", "mirrorIntro", "tone", "save", "readKey", "bestLocalState", "recognizableStoredState", "utf8ByteLength", "decodedBase64Bytes", "MAX_IMPORT_TEXT_BYTES",
    "normalizePlayerRegistry", "normalizePlayerName", "activePlayerMeta", "playerMetaById", "createPlayer", "switchPlayer", "renamePlayer", "deletePlayer", "playerInitial", "openPlayerSwitcher", "MAX_LOCAL_PLAYERS", "PLAYER_REGISTRY_KEY", "PLAYER_FALLBACK_PREFIX",
    "syncDecision", "syncCfg", "syncSet", "syncClear", "syncEnabled", "syncPush", "syncPull", "parseRemote", "sessionTokenGet", "playerGistFile", "legacyPlayerGistFile", "GIST_CLOUD_SCHEMA", "syncStorageKey", "remoteFileName",
    "cloudDocument", "cloudSaveContent", "cloudPieces", "looksLikeToken", "persistOnExit", "APP_VERSION"
  ];
  const footer = "\n;return {" + exportsList.map(n => n + ":(typeof " + n + "!=='undefined'?" + n + ":undefined)").join(",") +
    ",getDB:function(){return DB;},setDB:function(x){DB=x;},getPlayerRegistry:function(){return JSON.parse(JSON.stringify(PLAYER_REGISTRY));},getActivePlayerId:function(){return ACTIVE_PLAYER_ID;},isIdbReady:function(){return idbReady;},getKX:function(){return KX;},getEX:function(){return EX;},getEl:function(id){return document.getElementById(id);},haltEX:function(){if(EX)EX.done=true;}};";
  const fn = new Function("document", "localStorage", "navigator", "window", "sessionStorage", "indexedDB", src + footer);
  const local = runtime.localStorage || makeLocalStorage();
  const session = runtime.sessionStorage || makeLocalStorage();
  const engine = fn(runtime.document || makeDocument(), local, runtime.navigator || navigatorStub, runtime.window || windowStub, session, runtime.indexedDB);
  engine.localStorage = local;
  return engine;
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
function masterSegment(pieceId, segmentId, base) {
  base = base || (Date.now() - E.SEGMENT_MASTERY_GAP_MS - 1000);
  E.recordSegmentResult({ pieceId, segmentId }, 5, 5, 0, base);
  E.recordSegmentResult({ pieceId, segmentId }, 5, 5, 0, base + E.SEGMENT_MASTERY_GAP_MS);
}
function answerCurrentCorrect() {
  const ex = E.getEX();
  if (ex.qtype === "ecrit") {
    ex.writePos = E.NOTES[ex.seq[0]].p;
    E.answerPos(ex.writePos);
  } else {
    while (!ex.waiting && !ex.done && ex.k < ex.seq.length) E.answer(E.NOTES[ex.seq[ex.k]].n);
  }
}

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
ok(E.checkValidation([
  {e:0,ts:now,ids:["sol4"]},{e:0,ts:now,ids:["la4"]},{e:0,ts:now,ids:["sol4","la4"]}
],["sol4","la4","si4"],now) === false,
  "trois séries propres sans couverture de SI ne valident pas le palier");
ok(E.checkValidation([
  {e:0,ts:now,ids:["sol4"]},{e:0,ts:now,ids:["la4"]},{e:0,ts:now,ids:["si4"]}
],["sol4","la4","si4"],now) === true,
  "trois séries propres couvrant toutes les notes valident le palier");

/* 3) SRS Leitner */
group("SRS — répétition espacée (Leitner 5 boîtes)");
freshDB();
const t0 = 1800000000000;
ok(E.isDue("sol4") === false, "note jamais vue → pas due");
E.srsReview("sol4", true, t0);
eq(E.srs("sol4").box, 1, "1 bonne réponse → boîte 1");
ok(E.isDue("sol4", t0) === false, "première réussite → rappel demain, pas immédiatement");
for (let i = 0; i < 9; i++) E.srsReview("sol4", true, t0 + i + 1);
eq(E.srs("sol4").box, 1, "dix réussites immédiates restent en boîte 1");
ok(E.isDue("sol4", t0 + 864e5) === true, "boîte 1 due à J+1");
E.srsReview("sol4", true, t0 + 864e5);
eq(E.srs("sol4").box, 2, "réussite à l'échéance → boîte 2");
ok(E.isDue("sol4", t0 + 864e5) === false, "boîte 2 reprogrammée dans le futur");
E.srsReview("sol4", false, t0 + 864e5 + 1000);
eq(E.srs("sol4").box, 1, "une erreur → retour boîte 1");
E.srsReview("sol4", true, t0 + 864e5 + 2000, false);
eq(E.srs("sol4").box, 1, "une réparation immédiate ne fait pas monter la boîte");
ok(E.srs("sol4").due > t0 + 864e5 + 2000, "une réparation réussie repousse l'échéance et ne peut pas faire remonter la boîte juste après");
E.srsReview("si4", true, t0, false);
eq(E.srs("si4").box, 0, "un transfert sur une note neuve n'invente pas une acquisition SRS");
E.getDB().noteStats.la4 = E.normalizeNoteStat({v:20,e:0,box:5,due:t0});
E.srsReview("la4", true, t0);
eq(E.srs("la4").box, 5, "la boîte 5 reste au maximum");
eq(E.srs("la4").due, t0 + 30 * 864e5, "une boîte 5 due est rafraîchie à J+30");

group("Réparation active — confusion, délai et transfert");
freshDB();
E.getDB().questionClock = 1;
E.recordConfusion("sol4", {kind:"name", value:"la"});
eq(E.getDB().noteStats.sol4.confusions["name:la"], 1, "la réponse erronée LA à SOL est mémorisée");
let repair = E.scheduleRepair("sol4", {kind:"name", value:"la"}, {pool:["sol4","la4","si4"], qtype:"lect", palierId:"P1"});
eq(repair.confusedId, "la4", "la note choisie à tort devient le contraste ciblé");
eq(repair.dueQuestion, 4, "le re-test est prévu après deux autres questions");
E.getDB().questionClock = 2;
ok(E.dueRepairForSession() === null, "la réparation ne revient pas après une seule question");
E.getDB().questionClock = 3;
eq(E.dueRepairForSession().sourceId, "sol4", "la quatrième question est le re-test de SOL");
ok(E.repairBlockedIds().indexOf("sol4")>=0&&E.repairBlockedIds().indexOf("la4")>=0,
  "même arrivée à échéance, une confusion reste exclue des questions ordinaires");
E.getDB().questionClock = 4;
E.advanceRepair(repair, true, ["sol4","la4","si4"]);
repair = E.getDB().repairQueue[0];
eq(repair.stage, "transfer", "un re-test réussi programme un transfert");
eq(repair.probeId, "la4", "le transfert vérifie la discrimination avec LA");
eq(repair.dueQuestion, 6, "une question sépare le re-test du transfert");
E.getDB().questionClock = 6;
E.advanceRepair(repair, true, ["sol4","la4","si4"]);
eq(E.getDB().repairQueue.length, 0, "un transfert réussi referme la réparation");
ok(E.getDB().noteStats.sol4.needsRepair === false, "la note réparée sort de la file fragile");
const malformedRepairs = E.normalizeRepairQueue([{sourceId:"pirate"},{sourceId:"sol4",stage:"hack",wrongKind:"hack",dueQuestion:-4}]);
eq(malformedRepairs.length, 1, "les réparations importées sont filtrées et normalisées");
freshDB();
E.scheduleRepair("sol4",{kind:"name",value:"la"},{pool:["sol4","la4","si4"],qtype:"lect",palierId:"P1"});
E.scheduleRepair("si4",{kind:"name",value:"sol"},{pool:["sol4","la4","si4"],qtype:"lect",palierId:"P1"});
E.beginSerie({sessionMode:"session",n:3,palier:E.PALIERS[0],pool:["sol4","la4","si4"],mode:"zen",groupN:1,cold:false});
eq(E.getEX().currentTask.role,"spacing","si tout le vocabulaire attend une réparation, le moteur insère un intervalle actif au lieu d'une note étrangère");
eq(E.getEX().seq,[],"l'intervalle actif ne peut ni gonfler la couverture ni répéter trop tôt une confusion");
E.haltEX();
freshDB();
E.beginSerie({sessionMode:"session",n:6,palier:E.PALIERS[0],pool:["sol4","la4","si4"],mode:"zen",groupN:1,cold:false});
let active = E.getEX(); active.qtype="lect"; active.seq=["sol4"]; active.k=0; active.currentTask={role:"baseline",phase:"cible"}; active.currentQuestionTested=[];
E.answer("la");
eq(E.getDB().repairQueue[0].dueQuestion, 4, "une erreur au premier slot programme bien le slot 4");
E.nextQuestion(); active=E.getEX();
ok(active.seq.indexOf("sol4")<0, "la note fautive ne peut pas réapparaître dès la question 2");
answerCurrentCorrect();
E.nextQuestion(); active=E.getEX();
ok(active.seq.indexOf("sol4")<0, "la note fautive reste bloquée à la question 3");
answerCurrentCorrect();
E.nextQuestion(); active=E.getEX();
eq(active.currentTask.role, "retest", "après deux questions intercalées, le moteur impose le re-test");
eq(active.seq, ["sol4"], "le re-test reprend exactement la note fautive");
answerCurrentCorrect();
E.nextQuestion(); answerCurrentCorrect();
E.nextQuestion(); active=E.getEX();
eq(active.currentTask.role, "transfer", "le dernier slot devient le transfert contrasté");
eq(active.seq, ["la4"], "le transfert cible la note initialement confondue");
answerCurrentCorrect(); E.nextQuestion();
eq(E.getEX().hist.length, 6, "réparation et transfert remplacent des questions : la série reste à six slots");
eq(E.getEX().n, 6, "la boucle active ne rallonge jamais le nombre prévu de questions");
eq(E.getDB().repairQueue.length, 0, "la réparation réelle est refermée après le transfert");
freshDB();
E.beginSerie({sessionMode:"piece",n:1,palier:E.PALIERS[0],pool:["sol4","la4"],mode:"bronze",groupN:2,cold:false,
  segment:{pieceId:"aclair",segmentId:"aclair_p1",segmentTitle:"Phrase 1"}});
let partialGroup=E.getEX();
partialGroup.qtype="lect"; partialGroup.seq=["sol4","la4"]; partialGroup.k=0;
partialGroup.currentTask={role:"transfer",phase:"transfert"}; partialGroup.currentQuestionTested=[];
E.answer("la");
eq(partialGroup.currentQuestionTested,["sol4"],"l’erreur au début du groupe ne teste réellement que sa première note");
eq(partialGroup.seenIds,["sol4"],"le bilan partition n’attribue plus la fin jamais lue du groupe");
E.haltEX();
freshDB();
const reviewNow=Date.now();
E.getDB().noteStats.sol4=E.normalizeNoteStat({v:4,e:0,box:1,due:reviewNow-1000});
E.startRevision();
E.getEX().qtype="lect"; E.getEX().seq=["sol4"]; E.getEX().k=0;
E.answer("la");
const xpBeforeSpacing=E.getDB().xp;
E.nextQuestion();
eq(E.getEX().currentTask.role,"spacing","une révision à une note insère le premier intervalle après l'erreur");
E.completeMission(true); E.clearQTimers();
eq(E.getEX().i,1,"un intervalle ne compte jamais comme réponse musicale dans le score de révision");
eq(E.getDB().xp,xpBeforeSpacing,"un intervalle ne donne aucun XP artificiel");
E.nextQuestion();
eq(E.getEX().currentTask.role,"spacing","deux activités séparent réellement l'erreur de son re-test");
E.completeMission(true); E.clearQTimers(); E.nextQuestion();
eq(E.getEX().currentTask.role,"retest","la révision sert ensuite le vrai re-test sans progression SRS");
E.haltEX();
const noInflation=E.validationRecordFromQuestions([
  {phase:"cible",role:"baseline",ok:true,ids:["sol4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["la4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["si4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["sol4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["la4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["si4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["sol4"]},
  {phase:"reparation",role:"retest",ok:true,ids:["la4"]},
  {phase:"transfert",role:"transfer",ok:true,ids:["si4"]}
],8,null,false);
eq(noInflation,null,"les réparations ne complètent jamais artificiellement une série de validation");
const honestRecord=E.validationRecordFromQuestions([
  {phase:"cible",role:"cold",ok:true,ids:["sol4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["la4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["si4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["sol4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["la4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["si4"]},
  {phase:"cible",role:"baseline",ok:true,ids:["sol4"]},
  {phase:"cible",role:"baseline",ok:false,ids:["la4"]},
  {phase:"reparation",role:"retest",ok:true,ids:["la4"]}
],8,{id:"sol4",ok:true},false);
eq(honestRecord.e,1,"la validation normalise uniquement les huit questions cibles honnêtes");
eq(honestRecord.ids.sort(),["la4","si4","sol4"],"la couverture de validation exclut les sondes de réparation");
freshDB();
E.getDB().questionClock = 12;
E.scheduleRepair("si4", {kind:"name",value:"sol"}, {pool:["sol4","la4","si4"],qtype:"lect",palierId:"P1"});
const repairRoundTrip = E.ensureStructure(JSON.parse(E.compactSave()));
eq(repairRoundTrip.repairQueue[0].sourceId, "si4", "la réparation tardive survit à l'export et à l'import");
ok(E.cloudDocument().progress.repairQueue[0].sourceId === "si4", "la file de réparation voyage aussi dans la sauvegarde cloud");

group("Révision d’étoile — couverture et stabilité honnêtes");
freshDB();
const bossSample=E.starReviewSample(E.PALIERS.find(p => p.id === "B5"));
eq(bossSample.length,10,"un grand palier produit un échantillon représentatif plafonné à dix notes");
ok(bossSample.some(id => E.NOTES[id].clef === "sol") && bossSample.some(id => E.NOTES[id].clef === "fa"),
  "l’échantillon du boss couvre réellement les deux clés");
ok(E.starReviewCoverage(["sol4","la4"],[{ids:["sol4"]}]) === false,
  "une note prévue mais jamais testée interdit l’étoile");
ok(E.starReviewCoverage(["sol4","la4"],[{ids:["sol4"]},{ids:["la4"]}]) === true,
  "la couverture ne compte que les identifiants réellement testés");
E.scheduleRepair("fa3",{kind:"timeout",value:""},{pool:["fa3","sol3","la3"],qtype:"lect",palierId:"P6"});
ok(E.starReviewRepairsClear(E.starReviewSample(E.PALIERS[0]))===true,
  "une réparation sans rapport avec le palier ne bloque pas inutilement sa révision d’étoile");
E.getDB().repairQueue=[];
E.startStarReview("P1");
for(let guard=0;guard<80&&!E.getEX().done;guard++){
  if(E.getEX().waiting) E.nextQuestion(); else answerCurrentCorrect();
}
ok(E.getEX().done === true, "la révision d’étoile propre se termine en dix questions");
ok(E.starReviewCoverage(E.getEX().starSample,E.getEX().questionRecords),
  "le moteur sert toutes les notes de l’échantillon avant les répétitions");
eq(E.getDB().paliers.P1.star.level,1,"couverture complète sans réparation → étoile accordée");
freshDB();
E.startStarReview("P1");
for(let guard=0;guard<80;guard++){
  const ex=E.getEX();
  if(ex.i>=9&&!ex.waiting) break;
  if(ex.waiting) E.nextQuestion(); else answerCurrentCorrect();
}
const starLast=E.getEX(), starTarget=starLast.seq[starLast.k];
if(starLast.qtype==="ecrit") E.answerPos(E.NOTES[starTarget].p===11?10:E.NOTES[starTarget].p+1);
else E.answer(E.NOTES[starTarget].n==="do"?"ré":"do");
E.nextQuestion();
ok(E.starReviewCoverage(E.getEX().starSample,E.getEX().questionRecords),
  "le scénario d’erreur tardive avait pourtant couvert tout l’échantillon");
ok(E.getDB().repairQueue.length>0,"l’erreur tardive ouvre une réparation explicite");
eq(E.getDB().paliers.P1.star.level,0,"une réparation ouverte interdit l’étoile malgré la couverture complète");

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
eq(E.decodedBase64Bytes("data:application/pdf;base64,QUJDRA=="), 4, "taille binaire réelle calculée depuis le base64");
ok(E.normalizeAttachment({ name: "taille-fausse.pdf", type: "application/pdf", size: 1, dataUrl: "data:application/pdf;base64,QUJDRA==" }) === null,
  "pièce jointe dont la taille déclarée ment sur le base64 rejetée");
ok(E.normalizeAttachment({ name: "bombe.pdf", type: "application/pdf", size: 1, dataUrl: "data:application/pdf;base64," + "A".repeat(700000) }) === null,
  "un gros base64 ne contourne pas la limite avec size=1");
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
const safeId = E.cleanId("__proto__", "u");
ok(E.isSafeId(safeId) && safeId !== "__proto__", "id dangereux __proto__ remplacé par un id sûr");
const poisoned = E.ensureStructure(JSON.parse('{"paliers":{},"pieces":[{"id":"__proto__","titre":"Piège"}],"pieceProgress":{"__proto__":{"pollutedSegment":{"attempts":9}}},"pieceGoals":{"constructor":{"id":"lire"}}}'));
ok(Object.getPrototypeOf(poisoned.pieceProgress) === null && Object.keys(poisoned.pieceProgress).length === 0,
  "maps importées sans prototype et clés dangereuses éliminées");
E.setDB(poisoned);
E.segmentProgress("__proto__", "pollutedSegment");
ok(!E.hasOwn(poisoned.pieceProgress, "pollutedSegment") && poisoned.pieceProgress.pollutedSegment === undefined,
  "segmentProgress ne peut plus polluer Object.prototype");
const dirtyState = E.ensureStructure({
  xp:"pas-un-nombre", seen:"P1", paliers:{P1:{zen:"cassé",bronze:{series:"cassées",ok:"true"},star:"cassée",bestRafale:"12"}},
  kbdStats:{total:"10",ok:"99",byPc:{0:{v:"3",e:"9"}}}
});
eq(dirtyState.xp, 0, "XP importés toujours ramenés à un entier sûr");
ok(Object.getPrototypeOf(dirtyState.seen) === null && Object.keys(dirtyState.seen).length === 0,
  "seen mal formé devient une map sûre vide");
ok(Array.isArray(dirtyState.paliers.P1.zen.series) && dirtyState.paliers.P1.zen.ok === false && dirtyState.paliers.P1.star.level === 0,
  "états tier/series/star mal formés reconstruits canoniquement");
eq(dirtyState.kbdStats.ok, 10, "réussites clavier bornées par le total");
eq(dirtyState.kbdStats.byPc[0], {v:3,e:3}, "statistiques clavier par touche normalisées et bornées");
freshDB(); E.getDB().xp=77; const beforeBadShape=JSON.stringify(E.getDB());
const badShapeMsg=E.importSave(JSON.stringify({paliers:[],xp:999999}));
ok(/invalide/i.test(badShapeMsg) && JSON.stringify(E.getDB())===beforeBadShape,
  "import structurellement invalide rejeté transactionnellement sans remplacer DB");
const oversizedImport=" ".repeat(E.MAX_IMPORT_TEXT_BYTES+1);
const beforeOversized=JSON.stringify(E.getDB());
ok(/volumineuse/i.test(E.importSave(oversizedImport)) && JSON.stringify(E.getDB())===beforeOversized,
  "import texte au-delà de 4 Mo rejeté avant JSON.parse sans modifier DB");
eq(E.utf8ByteLength("é🎵"), 6, "limite d'import mesurée en octets UTF-8");
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
const personalLookPiece=E.normalizePiece({id:"regard-perso",titre:"Regard perso",clef:"sol",q:[]});
E.getDB().pieces.push(personalLookPiece);
const personalLook=E.pieceSegments(personalLookPiece)[0];
E.startPieceSegment(personalLookPiece.id,personalLook.id);
ok(E.segmentProgress(personalLookPiece.id,personalLook.id).seen === false,
  "ouvrir le premier regard ne le crédite pas avant la confirmation du joueur");
E.getEl("prSelfDone").onclick();
ok(E.segmentProgress(personalLookPiece.id,personalLook.id).seen === true,
  "« C’est fait » marque réellement le premier regard personnel comme vu");
freshDB();
const gamePiece = E.normalizePiece({ id: "piece-jeu", titre: "Partition jeu", clef: "sol", segments: [
  { id: "seg-a", title: "Mesures 1-2", level: "P1", focus: "notes" },
  { id: "seg-b", title: "Mesures 3-4", level: "P2", focus: "coordination" }
] });
eq(E.segmentProgressLabel(gamePiece.id, "seg-a"), "nouveau", "jeu partition : un segment commence avec l'état nouveau");
const segT0 = 1800000000000;
let stSeg = E.recordSegmentResult({ pieceId: gamePiece.id, segmentId: "seg-a" }, 5, 5, 0, segT0);
ok(E.segmentProgressLabel(gamePiece.id, "seg-a") === "validé",
  "jeu partition : un premier passage propre devient validé, pas maîtrisé immédiatement");
stSeg = E.recordSegmentResult({ pieceId: gamePiece.id, segmentId: "seg-a" }, 5, 5, 0, segT0 + 5*60000);
eq(E.segmentProgressLabel(gamePiece.id, "seg-a"), "validé", "deux réussites rapprochées ne simulent pas la rétention");
stSeg = E.recordSegmentResult({ pieceId: gamePiece.id, segmentId: "seg-a" }, 5, 5, 0, segT0 + E.SEGMENT_MASTERY_GAP_MS);
eq(E.segmentProgressLabel(gamePiece.id, "seg-a"), "maîtrisé dans le temps", "une réussite espacée confirme la maîtrise");
eq(E.nextSegmentForPiece(gamePiece).id, "seg-b", "jeu partition : le prochain segment utile est choisi automatiquement");
stSeg = E.recordSegmentResult({ pieceId: gamePiece.id, segmentId: "seg-b" }, 3, 5, 2);
ok(E.segmentProgressLabel(gamePiece.id, "seg-b") === "à réparer",
  "jeu partition : un passage fragile revient en réparation");
E.recordSegmentResult({ pieceId: gamePiece.id, segmentId: "seg-a" }, 2, 5, 3, segT0 + E.SEGMENT_MASTERY_GAP_MS + 1000);
eq(E.segmentProgressLabel(gamePiece.id, "seg-a"), "à réparer", "un résultat récent faible rend un ancien passage maîtrisé à nouveau fragile");
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
E.getDB().sel = "P1";
let nextCoach = E.coachDecision("session");
eq(nextCoach.palier.id, "P2", "le coach avance automatiquement vers le prochain palier jouable non validé");
E.PALIERS.forEach(p => { E.getDB().paliers[p.id].zen.ok = true; });
ok(E.tierComplete("zen") === true, "tous les paliers Zen validés → niveau Zen complet");
ok(E.tierUnlocked("bronze") === true, "Zen complet → Bronze débloqué");
ok(E.tierUnlocked("diamantbleu") === false, "les gemmes (future) restent verrouillées (mécanique à venir)");
ok(/retrouver chaque note seule/.test(E.trainingFocusText("zen")), "préparation Zen : annonce la recherche note par note");
ok(/groupes de 2 notes/.test(E.trainingFocusText("bronze")), "préparation Bronze : annonce le travail par groupes");
ok(/Mode Libre/.test(E.trainingFocusText("libre")), "préparation Libre : annonce l'écoute et le chant");
freshDB();
E.getDB().mode = "libre";
eq(E.coachDecision("session").mode, "libre", "le coach conserve réellement le mode Libre choisi par le joueur");
eq(E.visiblePaliers().length, E.PALIERS.length, "Libre rend les quinze paliers visibles sans brume");
ok(E.PALIERS.every(p => E.playableInMode(p.id,"libre")), "Libre permet d'explorer chaque palier sans valider artificiellement Zen");
eq(E.profileStartPalier("annee1"), "P3", "niveau année 1 → point de départ P3");
eq(E.profileStartPalier("annee2"), "P6", "niveau année 2 → point de départ P6");
eq(E.profileStartPalier("fin_c1"), "B1", "fin de Cycle 1 → point de départ B1");
E.applyProfileStartPlacement("annee2");
eq([E.getDB().mode,E.getDB().sel], ["libre","P6"], "le placement de niveau ouvre Libre sur le palier cohérent");
ok(/Aucun acquis n’est validé automatiquement/.test(E.profileStartText("annee2","P6")),
  "le placement explique qu'il explore sans fabriquer de validation");
ok(E.getDB().paliers.P1.zen.ok === false, "un niveau déclaré ne valide aucun palier à la place du joueur");

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

/* 9bis) Intégrité des preuves — le clavier ne touche jamais au calendrier SRS de lecture (grille H18) */
group("Clavier — modalité séparée : aucun effet sur le SRS de lecture (H18)");
freshDB();
const kbdNow = Date.now();
E.getDB().noteStats.sol4 = E.normalizeNoteStat({ v: 8, e: 0, box: 3, due: kbdNow - 1000 });
E.recordKbdAnswer(true, { midi: E.NOTES.sol4.midi, id: "sol4" });
let kbdStat = E.getDB().noteStats.sol4;
eq(kbdStat.box, 3, "une réussite clavier n'avance pas la boîte SRS d'une note due en lecture");
ok((kbdStat.due || 0) <= kbdNow, "une réussite clavier ne repousse pas l'échéance de lecture");
ok(E.isDue("sol4", kbdNow), "la note reste due en lecture après un succès clavier");
eq(kbdStat.v, 9, "le compteur d'expositions reste nourri (signal de priorité, pas une preuve)");
E.recordKbdAnswer(false, { midi: E.NOTES.sol4.midi, id: "sol4" });
kbdStat = E.getDB().noteStats.sol4;
eq(kbdStat.box, 3, "un échec clavier ne rétrograde pas une boîte de lecture gagnée à l'échéance");
eq(kbdStat.e, 1, "l'échec clavier reste compté comme signal de fragilité");
E.getDB().noteStats.la4 = E.normalizeNoteStat({});
E.recordKbdAnswer(true, { midi: E.NOTES.la4.midi, id: "la4" });
eq(E.getDB().noteStats.la4.box, 0, "un succès clavier n'initialise pas le calendrier de lecture d'une note jamais lue");

/* 9ter) Verrou H17 — une révision due correcte n'attribue l'XP qu'une seule fois */
group("Révision due — attribution unique de l'XP (verrou H17)");
freshDB();
E.getDB().noteStats.sol4 = E.normalizeNoteStat({ v: 5, e: 0, box: 2, due: Date.now() - 1000 });
E.getDB().noteStats.la4 = E.normalizeNoteStat({ v: 5, e: 0, box: 2, due: Date.now() - 1000 });
const xpBefore = E.getDB().xp;
E.startRevision();
for (let i = 0; i < 10 && E.getEX() && !E.getEX().done; i++) { answerCurrentCorrect(); E.nextQuestion(); }
ok(E.getEX() && E.getEX().done === true, "la révision du jour se termine après dix réponses");
eq(E.getDB().xp - xpBefore, 10, "dix réponses justes en révision due = exactement 10 XP (aucune double attribution)");

/* 9) Portée — géométrie agrandie, grandes notes, marques lisibles */
group("Portée — géométrie mobile, grandes notes, marques");
freshDB();
ok(E.STAFF.half >= 9 && E.STAFF.H >= 160, "portée agrandie (interligne ≥ 9, hauteur ≥ 160)");
const svgBig = E.staffSVG("sol", [{ p: 2, color: "#000", x: 200, big: 1 }]);
ok(svgBig.indexOf('viewBox="0 0 ' + E.STAFF.W + ' ' + E.STAFF.H + '"') >= 0, "staffSVG utilise la hauteur H du viewBox (plus de 130 codé en dur)");
ok(svgBig.indexOf('role="img"')>=0&&svgBig.indexOf('aria-label="Portée en clé de sol. Une note à identifier sur la deuxième ligne.')>=0,
  "la portée expose au lecteur d’écran la clé et la position spatiale sans révéler le nom de la note");
ok(svgBig.indexOf('rx="13.5"') >= 0, "note seule (big=1) : grande tête de note");
const svgGroup = E.staffSVG("sol", [{ p: 2, color: "#000", x: 200 }]);
ok(svgGroup.indexOf('rx="10"') >= 0, "note de groupe : tête agrandie (rx 10)");
eq((E.noteGlyph(200, 2, "#000", null, 2).match(/<ellipse/g) || []).length, 2, "big=2 (découverte/préparation) : halo doré + tête");
eq((E.noteGlyph(200, 2, "#000", null, 1).match(/<ellipse/g) || []).length, 1, "big=1 (exercice) : tête seule, pas de halo");
const yP10 = E.yOf(10);
const svgMark = E.staffSVG("fa", [{ p: 10, color: "#000", x: 200, big: 1, mark: "bad" }]);
ok(svgMark.indexOf('class="clef clef-fa"') >= 0 && svgMark.indexOf('class="clef-fa-curve"') >= 0,
  "clé de fa rendue par un tracé vectoriel stable entre navigateurs");
ok(svgMark.indexOf('data-ref-p="6" data-ref-y="' + E.yOf(6) + '"') >= 0,
  "clé de fa : point d'ancrage calé sur la ligne du fa (p=6)");
ok(svgMark.indexOf('data-upper-y="' + E.yOf(7) + '"') >= 0 && svgMark.indexOf('data-lower-y="' + E.yOf(5) + '"') >= 0 &&
   svgMark.indexOf('data-dot-p="7"') >= 0 && svgMark.indexOf('data-dot-p="5"') >= 0,
  "clé de fa : les deux points encadrent exactement la quatrième ligne");
ok(svgMark.indexOf('<text class="clef clef-fa"') < 0 && svgMark.indexOf('dominant-baseline') < 0,
  "clé de fa indépendante des métriques de police qui provoquaient le décalage Firefox");
const bonusClefWrong=E.bonusStaffSVG("clef-fa",false), bonusClefFixed=E.bonusStaffSVG("clef-fa",true);
ok(bonusClefWrong.indexOf('data-shift="-18"')>=0&&bonusClefWrong.indexOf('id="bonusTarget"')>=0,
  "egg du copiste : une clé volontairement déplacée reste interactive seulement dans l'atelier bonus");
ok(bonusClefFixed.indexOf('data-shift="0"')>=0&&bonusClefFixed.indexOf('id="bonusTarget"')<0,
  "egg du copiste : la clé se replace sur la bonne ligne après découverte");
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
group("Sauvegarde — principal prioritaire, checkpoint de secours");
freshDB(); E.getDB().xp = 9999; E.markDay("serie", 10); E.save();
eq(E.readKey("solfegeProto1").xp, 9999, "save écrit la clé principale");
eq(E.readKey("solfegeProto1_mirror").xp, 9999, "save écrit le miroir");
eq(E.readKey("solfegeProto1_checkpoint").xp, 9999, "save écrit le checkpoint");
E.setDB(E.ensureStructure({})); E.save();
eq(E.readKey("solfegeProto1").xp, 0, "un état vierge s'écrit normalement en principal");
eq(E.readKey("solfegeProto1_checkpoint").xp, 0, "le checkpoint suit le dernier état validé, y compris une remise à zéro volontaire");
eq(E.bestLocalState().xp, 0, "au chargement, un principal valide gagne ; le checkpoint n'est qu'un secours");
freshDB();
E.getDB().pieces=[E.normalizePiece({id:"piece-a-supprimer",titre:"À supprimer",attachment:{name:"scan.pdf",type:"application/pdf",size:3,dataUrl:"data:application/pdf;base64,QUJD"}})];
E.save({cloud:false});
E.getDB().pieces=[]; E.save({cloud:false});
eq(E.bestLocalState().pieces.length, 0, "une suppression volontaire de partition n'est pas ressuscitée par un checkpoint plus riche");
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
const appSource = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const mv = swSrc.match(/sezam-solado-v(\d+)/);
ok(mv && Number(mv[1]) >= 28, "CACHE_NAME dédié à l'app et incrémenté (≥ sezam-solado-v28)");
ok(/navigate/.test(swSrc), "documents servis réseau d'abord (plus de vieille version à vie)");
ok(/new URL\(req\.url\)\.origin !== self\.location\.origin/.test(swSrc), "le SW compare réellement les origines et n'intercepte pas l'API GitHub");
ok(/key\.startsWith\(CACHE_PREFIX\) && key !== CACHE_NAME/.test(swSrc), "le SW ne supprime que les anciens caches SEZAM, jamais ceux d'une autre app");
ok(/LEGACY_CACHE_NAMES/.test(swSrc) && /sezam-v12/.test(swSrc), "migration : l'ancien cache public v12 est retiré explicitement");
ok(/skipWaiting/.test(swSrc) && /clients\.claim/.test(swSrc), "activation immédiate du nouveau SW conservée");
ok(/icon-180\.png/.test(swSrc), "icône iOS précachée");
ok(/icon-192\.png/.test(swSrc) && /icon-512\.png/.test(swSrc), "icônes PWA 192/512 précachées");
ok(/data\/music-watch\.json/.test(swSrc), "veille musicale précachée pour le mode hors-ligne");
ok(/data\/curriculum-v1\.json/.test(swSrc), "référentiel des cycles précaché pour le mode hors-ligne");
const curriculumCatalog = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data", "curriculum-v1.json"), "utf8"));
eq(curriculumCatalog.schemaVersion, 1, "catalogue de cursus versionné");
ok(E.setCurriculumCatalog(curriculumCatalog) === true, "l'application charge le fichier de cursus comme source de vérité runtime");
eq(curriculumCatalog.cycles.map(c => c.id), ["c1", "c2", "c3"], "les trois cycles sont décrits sans les confondre avec les grades du jeu");
eq(curriculumCatalog.cycles.reduce((n,c) => n + c.officialDurationYears.min, 0), 8, "durée officielle minimale C1→C3 : 8 ans");
eq(curriculumCatalog.cycles.reduce((n,c) => n + c.officialDurationYears.max, 0), 14, "durée officielle maximale C1→C3 : 14 ans");
const curriculumIds = curriculumCatalog.competencies.map(c => c.id);
eq(new Set(curriculumIds).size, curriculumIds.length, "chaque compétence du cursus possède un identifiant unique");
ok(curriculumCatalog.competencies.every(c => curriculumCatalog.cycles.some(x => x.id === c.cycleId) && curriculumCatalog.domains.some(x => x.id === c.domainId)),
  "toute compétence référence un cycle et un domaine connus");
ok(curriculumCatalog.competencies.every(c => c.prerequisites.every(id => curriculumIds.indexOf(id) >= 0)),
  "tous les prérequis du cursus existent dans le catalogue");
const curriculumDeliveryIds = curriculumCatalog.deliveryStatuses.map(s => s.id);
ok(curriculumCatalog.competencies.every(c => curriculumDeliveryIds.indexOf(c.deliveryStatus) >= 0),
  "toute compétence possède un statut de livraison explicite");
ok(curriculumCatalog.competencies.every(c => c.evidence.length && c.evidence.every(type => curriculumCatalog.evidenceTypes.indexOf(type) >= 0)),
  "toute compétence annonce au moins un type de preuve connu");
const curriculumCycleRank = {c1:1,c2:2,c3:3}, curriculumById = Object.fromEntries(curriculumCatalog.competencies.map(c => [c.id,c]));
ok(curriculumCatalog.competencies.every(c => c.prerequisites.every(id => curriculumCycleRank[curriculumById[id].cycleId] <= curriculumCycleRank[c.cycleId])),
  "aucun prérequis ne dépend d'un cycle ultérieur");
let curriculumCycleFree=true,visiting=new Set(),visited=new Set();
function visitCurriculum(id){if(visiting.has(id)){curriculumCycleFree=false;return;}if(visited.has(id))return;visiting.add(id);curriculumById[id].prerequisites.forEach(visitCurriculum);visiting.delete(id);visited.add(id);}
curriculumIds.forEach(visitCurriculum);
ok(curriculumCycleFree, "le graphe des prérequis ne contient aucun cycle interne");
eq(E.CURRICULUM_SCOPE.currentCompetencies.slice().sort(), curriculumCatalog.competencies.filter(c => c.deliveryStatus === "available_measured").map(c => c.id).sort(),
  "le périmètre mesuré embarqué correspond exactement au catalogue publié");
ok(appSource.indexOf("loadCurriculumCatalog()") >= 0 && appSource.indexOf("window.fetch(CURRICULUM_SCOPE.catalog") >= 0,
  "l'application charge réellement le catalogue JSON au démarrage");
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
const richerLocal=E.ensureStructure({xp:1000}), poorerRemote=E.ensureStructure({xp:1});
richerLocal._sezam.updatedAt=100; poorerRemote._sezam.updatedAt=200;
eq(E.syncDecision(richerLocal,poorerRemote),"conflict","un timestamp distant plus récent ne peut plus effacer une progression locale nettement plus riche");
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
E.getDB().noteStats.sol4=E.normalizeNoteStat({v:3,e:0,coldV:1,coldE:0,last:40,lastCold:44});
const cloud = E.cloudDocument();
ok(cloud.progress && cloud.scores && cloud.settings && cloud.timestamp, "cloudDocument produit le fichier unique progress/scores/settings/timestamp");
eq(cloud.schema, E.GIST_CLOUD_SCHEMA, "l'enveloppe cloud est versionnée pour protéger les nouveaux champs");
ok(cloud.progress.curriculum && cloud.progress.curriculum.catalogVersion === E.CURRICULUM_CATALOG_VERSION, "le suivi de cursus voyage dans la sauvegarde cloud");
eq(cloud.progress.curriculum.progress["c1-reading-landmarks"].proofs.recognition.attempts,3,"une nouvelle activité alimente immédiatement l'export cloud, sans ouvrir les stats ni recharger");
ok(JSON.stringify(cloud).indexOf("tok_SECRET_123") < 0, "le token n'est jamais dans le document cloud");
E.getDB().pieces=[E.normalizePiece({titre:"Avec scan",attachment:{name:"scan.png",type:"image/png",size:4,dataUrl:"data:image/png;base64,QUJDRA=="}})];
E.getDB().events=[{t:1,type:"test",detail:"local"}];
const safeCloud = E.cloudDocument();
ok(JSON.stringify(safeCloud).indexOf("data:image/png") < 0, "les pièces jointes restent locales et ne partent pas dans le Gist");
eq(safeCloud.history.events, [], "le journal détaillé reste local et n'alourdit pas le Gist");
ok(E.parseRemote({ files: { "sezam-progress.json": { content: JSON.stringify(cloud) } } }).xp === cloud.scores.xp, "parseRemote lit le nouveau fichier gist SEZAM");
const v2File=E.playerGistFile(E.getActivePlayerId()),v1File=E.legacyPlayerGistFile(E.getActivePlayerId());
ok(v2File !== v1File && v2File.indexOf("sezam-progress-v2-") === 0, "le fichier cloud v2 est séparé du fichier v28 pour empêcher un ancien onglet d'effacer le cursus");
const oldCloud=JSON.parse(JSON.stringify(cloud));oldCloud.schema=1;delete oldCloud.progress.curriculum;
const legacySpecific={files:{}};legacySpecific.files[v1File]={content:JSON.stringify(oldCloud)};
ok(E.parseRemote(legacySpecific) !== null, "v29 sait encore migrer le fichier cloud propre à un joueur v28");
const bothCloud={files:{}};bothCloud.files[v1File]={content:JSON.stringify(oldCloud)};bothCloud.files[v2File]={content:JSON.stringify(cloud)};
eq(E.remoteFileName(bothCloud),v2File,"quand les deux formats coexistent, v29 choisit toujours le fichier protégé v2");
const newerOld=JSON.parse(JSON.stringify(oldCloud));newerOld.timestamp=cloud.timestamp+1000;newerOld.scores.xp=77;
const racedCloud={files:{}};racedCloud.files[v1File]={content:JSON.stringify(newerOld)};racedCloud.files[v2File]={content:JSON.stringify(cloud)};
eq(E.remoteFileName(racedCloud),v1File,"une progression v28 plus récente n'est pas silencieusement ignorée après la création du fichier v2");
const racedMerged=E.parseRemote(racedCloud);
eq(racedMerged.xp,77,"la progression de jeu v28 plus récente est récupérée");
ok(racedMerged.curriculum&&racedMerged.curriculum.progress["c1-reading-landmarks"],"le cursus v2 est conservé pendant la récupération du jeu v28 plus récent");
const futureCloud=JSON.parse(JSON.stringify(cloud));futureCloud.schema=E.GIST_CLOUD_SCHEMA+1;
const futureFiles={files:{}};futureFiles.files[v2File]={content:JSON.stringify(futureCloud)};
ok(E.parseRemote(futureFiles)===null,"une enveloppe cloud future est refusée plutôt que dégradée par une ancienne app");
ok(E.parseRemote({ files: { "solado-save.json": { content: '{"paliers":{},"xp":5}' } } }).xp === 5, "parseRemote lit encore l'ancien fichier gist en compatibilité");
ok(E.parseRemote({ files: { "sezam-progress.json": { content: "pas du json" } } }) === null, "parseRemote rejette un contenu corrompu sans exception");
ok(E.parseRemote({ files: { "sezam-progress.json": { content: "{}", truncated: true, raw_url:"https://example.invalid/raw" } } }) === null,
  "parseRemote refuse un Gist tronqué au lieu de l'assimiler à un état vide");
ok(E.parseRemote(null) === null, "parseRemote tolère une réponse vide");
E.getDB().noteStats.sol4=E.normalizeNoteStat({v:12,e:0,coldV:2,coldE:0,last:40,lastCold:44});
E.getDB().paliers.B5.rhodium.ok=true;
E.getDB().curriculum.progress["c1-reading-landmarks"]={status:"stable",moduleId:"reading_engine_v1",updatedAt:44,selfRating:0,proofs:{recognition:{attempts:12,successes:12,lastAt:40},retention:{attempts:2,successes:2,lastAt:44}}};
const curriculumCompact=JSON.parse(E.compactSave());
eq(curriculumCompact.curriculum.progress["c1-reading-landmarks"].status,"learning","le transfert QR conserve une preuve de cursus non vide sans exagérer sa stabilité");
const curriculumRoundTrip=E.ensureStructure(E.backupToDb(E.cloudDocument()));
eq(curriculumRoundTrip.curriculum.progress["c1-reading-landmarks"].proofs.retention.successes,2,"un aller-retour cloud conserve les preuves de rétention");
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
eq(E.getDB()._sezam.schema, 13, "schéma local v13 pour le cursus versionné et les profils isolés");
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
const unsafeCurriculum = E.normalizeCurriculumState(JSON.parse('{"catalogVersion":1,"progress":{"c1-reading-landmarks":{"status":"stable","moduleId":"lecture_1","updatedAt":42,"selfRating":9,"proofs":{"recognition":{"attempts":12,"successes":20,"lastAt":40},"pirate":{"attempts":999}}},"constructor":{"status":"stable"},"id avec espaces":{"status":"stable"}}}'));
eq(unsafeCurriculum.catalogVersion, 1, "la version courante du catalogue est conservée");
eq(Object.keys(unsafeCurriculum.progress), ["c1-reading-landmarks"], "identifiants dangereux ou invalides retirés du suivi de cursus");
eq(unsafeCurriculum.progress["c1-reading-landmarks"].selfRating, 4, "autoévaluation bornée sans devenir une validation");
eq(Object.keys(unsafeCurriculum.progress["c1-reading-landmarks"].proofs), ["recognition"], "seuls les types de preuve documentés sont conservés");
eq(unsafeCurriculum.progress["c1-reading-landmarks"].proofs.recognition.successes, 12, "les réussites de preuve ne peuvent pas dépasser les tentatives");
const badCurriculumStatus=E.normalizeCurriculumState({progress:{competence:{status:"certifie",proofs:{}}}});
ok(!badCurriculumStatus.progress.competence, "une compétence absente du catalogue publié est retirée");
const plannedFake=E.normalizeCurriculumState({catalogVersion:1,progress:{"c2-reading-polyphonic":{status:"stable",proofs:{}}}});
eq(plannedFake.progress["c2-reading-polyphonic"].status, "not_started", "une compétence prévue ne peut pas s'auto-déclarer stable sans preuve ni module livré");
const weakStable=E.normalizeCurriculumState({catalogVersion:1,progress:{"c1-reading-landmarks":{status:"stable",proofs:{recognition:{attempts:10,successes:10}}}}});
eq(weakStable.progress["c1-reading-landmarks"].status, "learning", "la reconnaissance seule ne devient jamais une stabilité sans preuve de rétention");
const futureLocal=E.ensureStructure({paliers:{},curriculum:{catalogVersion:2,progress:{"c4-future-safe":{status:"stable",moduleId:"future_module",proofs:{new_future_proof:{attempts:1,payload:{x:9}}}}}}});
eq(Object.keys(futureLocal.curriculum.progress).length,0,"une ancienne app n'interprète pas les preuves d'un futur catalogue");
ok(futureLocal.curriculum.futureOpaque.indexOf("new_future_proof")>=0&&futureLocal.curriculum.futureOpaque.indexOf('"x":9')>=0,"les champs inconnus d'un futur catalogue sont conservés de façon opaque et intacte");
ok(E.curriculumScopeHtml().indexOf("Aucune validation disponible dans cette version") >= 0 && E.curriculumScopeHtml().indexOf("ne remplace ni le professeur") >= 0,
  "l'interface expose clairement le périmètre non certifiant des Cycles 1 à 3");

const oldV28=E.ensureStructure({});
delete oldV28.curriculum;
Object.keys(E.NOTES).forEach((id,i)=>{oldV28.noteStats[id]=E.normalizeNoteStat({v:30,e:1,coldV:2,coldE:0,last:100+i,lastCold:90+i});});
E.PALIERS.forEach(p=>{oldV28.paliers[p.id].rhodium.ok=true;});
oldV28.pieceProgress.aclair={aclair_p1:E.normalizeSegmentState({attempts:2,ok:10,errs:0,last:200,lastPrec:100,mastery:3,cleanAt:[1,200]})};
const migratedCurriculum=E.ensureStructure(oldV28).curriculum;
eq(migratedCurriculum.progress["c1-reading-landmarks"].status, "stable", "migration v28→v29 : les preuves de lecture existantes alimentent le cursus");
eq(migratedCurriculum.progress["c1-reading-continuity"].status, "stable", "migration v28→v29 : les passages déjà maîtrisés ne deviennent pas un cursus vide");
const incompleteV28=E.ensureStructure({paliers:{}});delete incompleteV28.curriculum;
incompleteV28.noteStats.sol4=E.normalizeNoteStat({v:30,e:0,coldV:2,coldE:0,last:100,lastCold:90});incompleteV28.paliers.B5.rhodium.ok=true;
eq(E.ensureStructure(incompleteV28).curriculum.progress["c1-reading-landmarks"].status,"learning","B5 et une seule note retenue ne suffisent jamais à déclarer les deux clés stables");
freshDB();
let firstDecision = E.coachDecision();
let plan = E.dailyPlan(firstDecision);
eq(plan.blocks.map(b => b.minutes), [4, 12, 2, 2], "plan 20 min : répartition rappel 20 %, cible 60 %, réparation 10 %, transfert 10 %");
eq(plan.blocks.reduce((sum,b) => sum + b.minutes, 0), 20, "le plan respecte exactement le temps choisi");
eq(plan.blocks.map(b => b.id), ["rappel","cible","reparation","transfert"], "le plan visible suit exactement l'ordre réel sans multiplier les boutons");
E.getDB().profile.dailyMinutes = 10;
plan = E.dailyPlan(E.coachDecision());
eq(plan.blocks.map(b => b.minutes), [2, 6, 1, 1], "plan 10 min : les quatre fonctions restent dans le même budget");
E.getDB().profile.dailyMinutes = 30;
E.getDB().profile.domains = ["integration"];
E.getDB().activePiece = "aclair";
plan = E.dailyPlan(E.coachDecision());
ok(plan.blocks.some(b => b.id === "transfert" && /Intégration/.test(b.title)),
  "profil intégration seule : l'œuvre reste dans la séance unique");
eq(plan.blocks.reduce((sum,b) => sum + b.minutes, 0), 30, "plan long : le passage reste inclus dans le budget total");
E.getDB().dailyProgress[E.todayStr()]={session:"v25:autre"};
plan=E.dailyPlan(E.coachDecision());
ok(plan.blocks.every(b => b.done === false), "une ancienne signature de séance n'apparaît pas comme faite après personnalisation");
E.getDB().dailyProgress[E.todayStr()]={session:plan.signature};
ok(E.dailyPlan(E.coachDecision()).blocks.every(b => b.done === true), "la séance unique terminée valide les quatre blocs ensemble");
E.getDB().dailyProgress["2026-07-11"] = { oeuvre:true };
ok(E.compactSave().indexOf('"dailyProgress"') >= 0 && E.compactSave().indexOf('"profile"') >= 0,
  "profil et validations quotidiennes inclus dans la sauvegarde compacte");
const personalizedCloud = E.cloudDocument();
ok(personalizedCloud.progress.dailyProgress && personalizedCloud.settings.profile.parcours === "libre",
  "profil et plan quotidien inclus dans la sauvegarde cloud");
freshDB();
E.getDB().profile.dailyMinutes = 20;
const dailyStart = 1800000000000;
const dailyBuilt = E.buildDailySession(E.coachDecision(), dailyStart);
eq(dailyBuilt.blocks.map(b => Math.round((b.endAt-b.startAt)/60000)), [4,12,2,2],
  "orchestrateur 20 min : rappel 20 %, cible 60 %, réparation 10 %, transfert 10 %");
eq(dailyBuilt.endAt-dailyBuilt.startAt, 20*60000, "le chronomètre global possède une échéance exacte");
eq(E.dailyPhaseAt(dailyBuilt,dailyStart).id, "rappel", "la séance commence par un rappel à froid");
eq(E.dailyPhaseAt(dailyBuilt,dailyStart+4*60000).id, "cible", "la cible démarre exactement à la borne des 20 %");
eq(E.dailyPhaseAt(dailyBuilt,dailyStart+16*60000).id, "reparation", "la réparation prend le relais à 80 %");
eq(E.dailyPhaseAt(dailyBuilt,dailyStart+18*60000).id, "transfert", "le transfert clôt les 10 % restants");
eq(E.dailyPhaseAt(dailyBuilt,dailyBuilt.endAt), null, "aucune nouvelle question ne démarre après l'échéance");
E.getDB().noteStats.sol4 = E.normalizeNoteStat({v:3,e:0,box:2,due:dailyStart-1000});
const dailyWithDue = E.buildDailySession(E.coachDecision(), dailyStart);
ok(dailyWithDue.dueSnapshot.indexOf("sol4") >= 0 && dailyWithDue.coldPool[0] === "sol4",
  "les notes réellement dues sont photographiées au démarrage et prioritaires à froid");
freshDB();
const pendingStart=Date.now();
E.getDB().noteStats.sol4=E.normalizeNoteStat({v:3,e:1,box:1,due:pendingStart-1000});
E.scheduleRepair("sol4",{kind:"name",value:"la"},{pool:["sol4","la4","si4"],qtype:"lect",palierId:"P1"});
const pendingDaily=E.buildDailySession(E.coachDecision(),pendingStart);
ok(pendingDaily.dueSnapshot.indexOf("sol4")<0,"une note encore en réparation ne se déguise jamais en rappel SRS dû");
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[0],pool:E.PALIERS[0].notes,mode:"zen",groupN:1,openEnded:true,daily:pendingDaily,cold:true});
ok(E.getEX().currentTask.role==="cold"&&E.getEX().seq.indexOf("sol4")<0&&E.getEX().seq.indexOf("la4")<0,
  "le test à froid exclut la note fautive et la confusion tant que leur réparation n'est pas refermée");
E.clearQTimers(); E.clearDailyTimer(); E.haltEX();
freshDB();
const timedStart=Date.now(), timedDaily=E.buildDailySession(E.coachDecision(),timedStart);
timedDaily.blocks[0].endAt=timedStart-1;
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[0],pool:E.PALIERS[0].notes,mode:"bronze",groupN:2,openEnded:true,daily:timedDaily,cold:false});
eq(E.getEX().limit,10000,"la séance quotidienne conserve le tempo Bronze pendant la cible");
eq(E.getEX().currentTask.phase,"cible","le test du tempo porte bien sur la phase cible");
ok(/Tempo Bronze/.test(E.getEl("feedback").innerHTML),"le joueur voit le tempo de niveau avant de pouvoir être déclaré trop tard");
const timedQid=E.getEX().qid;
E.timeUp(timedQid);
eq(E.getEX().hist,[false],"le délai Bronze déclenche réellement la correction de la question cible");
timedDaily.endAt=Date.now()-1;
E.updateDailyClock();
eq(E.getEl("btnQuit").textContent,"Terminer maintenant","à l'échéance, le bouton annonce clairement la fin");
E.getEl("btnQuit").onclick();
ok(E.getEX().done===true&&!(E.getDB().dailyProgress[E.todayStr()]||{}).session,
  "une seule réponse produit un bilan partiel sans déclarer mensongèrement la séance terminée");
E.clearQTimers(); E.clearDailyTimer();
freshDB();
const proofStart=Date.now(), proofDaily=E.buildDailySession(E.coachDecision(),proofStart);
proofDaily.blocks[0].endAt=proofStart-1;
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[0],pool:E.PALIERS[0].notes,mode:"zen",groupN:1,openEnded:true,daily:proofDaily,cold:false});
for(let i=0;i<30;i++) E.recordDailyTargetEvidence({phase:"cible",role:"baseline",ok:true,ids:[E.PALIERS[0].notes[i%3]]});
ok(E.getDB().paliers.P1.zen.ok===true&&E.getEX().palier.id==="P2"&&E.getDB().sel==="P2",
  "trois tranches quotidiennes propres valident P1 et avancent automatiquement vers P2");
eq(E.getEX().daily.proofs.length,3,"chaque tranche de 10 questions Cible devient une preuve distincte");
eq(E.getEX().daily.promotions.map(x=>x.pid),["P1"],"le bilan conserve les promotions gagnées pendant la même séance");
E.clearQTimers(); E.clearDailyTimer(); E.haltEX();
freshDB();
E.getDB().mode="zen"; E.getDB().sel="B5";
E.PALIERS.slice(0,-1).forEach(p=>{E.getDB().paliers[p.id].zen.ok=true;});
const allB5=E.PALIERS[E.PALIERS.length-1].notes.slice(), oldProof={ts:Date.now(),e:0,ids:allB5};
E.getDB().paliers.B5.zen.series=[oldProof,Object.assign({},oldProof,{ts:Date.now()+1})];
const tierStart=Date.now(), tierDaily=E.buildDailySession(E.coachDecision(),tierStart);
tierDaily.blocks[0].endAt=tierStart-1;
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[E.PALIERS.length-1],pool:allB5,mode:"zen",groupN:1,openEnded:true,daily:tierDaily,cold:false});
for(let i=0;i<10;i++) E.recordDailyTargetEvidence({phase:"cible",role:"baseline",ok:true,ids:[allB5[i%allB5.length]]});
ok(E.getDB().paliers.B5.zen.ok===true&&E.getEX().mode==="bronze"&&E.getEX().palier.id==="P1",
  "après B5, la même séance poursuit automatiquement sur P1 du grade suivant");
E.clearQTimers(); E.clearDailyTimer(); E.haltEX();
freshDB();
const draftStart=Date.now(), draftDaily=E.buildDailySession(E.coachDecision(),draftStart);
draftDaily.blocks[0].endAt=draftStart-1;
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[0],pool:E.PALIERS[0].notes,mode:"zen",groupN:1,openEnded:true,daily:draftDaily,cold:false});
for(let i=0;i<7;i++) E.recordDailyTargetEvidence({phase:"cible",role:"baseline",ok:true,ids:[E.PALIERS[0].notes[i%3]]});
eq(E.getDB().validationDrafts["zen:P1"].length,7,"une tranche incomplète est sauvegardée au lieu d'être perdue au chrono");
ok(E.compactSave().indexOf('"validationDrafts"')>=0&&E.cloudDocument().progress.validationDrafts["zen:P1"].length===7,
  "les preuves partielles suivent les sauvegardes compacte et cloud");
const oldEnd=draftDaily.endAt, pauseAt=Date.now();
ok(E.pauseDailySession(pauseAt)===true&&E.resumeDailySession(pauseAt+5000)===true,
  "une séance quotidienne peut être suspendue puis reprise après un passage en arrière-plan");
eq(draftDaily.endAt,oldEnd+5000,"le temps passé en arrière-plan ne consomme pas le chrono pédagogique");
ok(E.dailyActiveElapsed(draftDaily,pauseAt+5000)<1000,"le temps actif exclut la pause en arrière-plan");
E.clearQTimers(); E.clearDailyTimer(); E.haltEX();
freshDB();
const completeStart=Date.now(), completeDaily=E.buildDailySession(E.coachDecision(),completeStart);
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[0],pool:E.PALIERS[0].notes,mode:"zen",groupN:1,openEnded:true,daily:completeDaily,cold:false});
E.getEX().questionRecords=Array.from({length:10},(_,i)=>({phase:"cible",role:"baseline",ok:true,ids:[E.PALIERS[0].notes[i%3]]}));
E.getEX().hist=Array(10).fill(true); E.getEX().ok=10; E.getEX().i=10; E.getEX().stopRequested=true;
E.getEl("btnQuit").onclick();
ok(E.getDB().dailyProgress[E.todayStr()].session===true,
  "dix vraies questions suffisent à marquer honnêtement la séance quotidienne terminée");
E.clearQTimers(); E.clearDailyTimer();
freshDB();
["sol4","la4","si4"].forEach((id,i)=>{
  const item=E.scheduleRepair(id,{kind:"timeout",value:""},{pool:["sol4","la4","si4"],qtype:"lect",palierId:"P1"});
  item.dueQuestion=1;
});
const blockedStart=Date.now(), blockedDaily=E.buildDailySession(E.coachDecision(),blockedStart);
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[0],pool:E.PALIERS[0].notes,mode:"zen",groupN:1,openEnded:true,daily:blockedDaily,cold:false});
ok(E.getEX().currentTask.role!=="spacing"&&E.getEX().seq.length===1,
  "un vocabulaire entièrement en réparation due reste jouable au lieu de produire des intervalles passifs en boucle");
E.clearQTimers(); E.clearDailyTimer(); E.haltEX();
freshDB();
const bonusStart=Date.now(), bonusDaily=E.buildDailySession(E.coachDecision(),bonusStart);
bonusDaily.blocks.slice(0,3).forEach(b => { b.endAt=bonusStart-1; });
bonusDaily.blocks[3].endAt=bonusStart+60000; bonusDaily.endAt=bonusStart+60000;
bonusDaily.focusDomain="lecture"; bonusDaily.transferScript=[]; bonusDaily.transferReads=3;
ok(E.dailyTransferReadyForBonus(bonusDaily)===true,"après le transfert prévu, le temps restant bascule vers l'atelier bonus");
E.beginSerie({sessionMode:"daily",palier:E.PALIERS[0],pool:E.PALIERS[0].notes,mode:"zen",groupN:1,openEnded:true,daily:bonusDaily,cold:false});
eq(E.getEX().qtype,"bonus","la fin de séance propose immédiatement une activité bonus au lieu d'un temps mort");
ok(/Atelier bonus/.test(E.getEl("exMode").textContent),"le chronomètre nomme clairement le temps bonus au lieu de laisser croire que la séance attend");
eq(E.getEX().currentTask.bonusKind,"clef-fa","le premier mystère permet de remettre la clé de fa");
const bonusI=E.getEX().i, bonusHist=E.getEX().hist.length, bonusXp=E.getDB().xp;
E.solveBonusEgg();
eq(E.getDB().xp,bonusXp+3,"remettre spontanément la clé de fa rapporte le petit bonus prévu");
ok(E.getEX().currentTask.bonusSolved===true&&E.getEX().daily.bonusFound===1,"la découverte est visible dans le bilan de séance");
eq([E.getEX().i,E.getEX().hist.length],[bonusI,bonusHist],"un egg ne compte jamais comme réponse ni comme preuve pédagogique");
ok(E.awardEasterEgg("clef-fa").awarded===false&&E.getDB().xp===bonusXp+3,"un même egg ne peut être récolté qu'une fois par jour");
ok(E.compactSave().indexOf('"easterEggs"')>=0&&E.cloudDocument().progress.easterEggs.total===1,
  "les secrets gagnés suivent les sauvegardes locale, QR et cloud");
E.nextQuestion();
eq(E.getEX().currentTask.bonusKind,"ligne-or","les mystères tournent pour investir le temps restant sans répétition vide");
E.clearQTimers(); E.clearDailyTimer(); E.haltEX();
freshDB();
E.getDB().easterEggs=E.normalizeEasterEggs({byId:{"clef-fa":2},total:2});
ok(E.shownTrophyDefs().every(t => t.id!=="copiste"),"le trophée secret reste invisible avant d'être mérité");
E.getDB().easterEggs=E.normalizeEasterEggs({byId:{"clef-fa":3},total:3});
ok(E.shownTrophyDefs().some(t => t.id==="copiste"&&t.on),"trois clés remises révèlent le trophée secret Œil du copiste");
ok(idx.indexOf('data-plan-action') < 0 && idx.indexOf('$("btnPlayNow").onclick=startDailySession') >= 0,
  "un seul bouton principal lance toute la séance chronométrée");

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
const stateBase = Date.now() - E.SEGMENT_MASTERY_GAP_MS - 1000;
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[0] }, 5, 5, 0, stateBase);
eq(E.segmentStateId("aclair", segIds[0]), "valide", "un passage propre (1 fois) → Validé");
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[0] }, 5, 5, 0, stateBase + E.SEGMENT_MASTERY_GAP_MS);
eq(E.segmentStateId("aclair", segIds[0]), "maitrise", "deux passages propres espacés → Maîtrisé");
E.recordSegmentResult({ pieceId: "aclair", segmentId: segIds[1] }, 3, 5, 2);
eq(E.segmentStateId("aclair", segIds[1]), "fragile", "60 % avec erreurs → Fragile");
E.toggleSegmentFlag("aclair", segIds[2]);
eq(E.segmentStateId("aclair", segIds[2]), "fragile", "« à retravailler » posé par le joueur → Fragile immédiat");
eq(E.nextSegmentForPiece(pAclair).id, segIds[2], "le passage marqué par le joueur passe DEVANT tout le reste");
E.toggleSegmentFlag("aclair", segIds[2]);
eq(E.nextSegmentForPiece(pAclair).id, segIds[1], "sans marque joueur : le fragile est prioritaire");
masterSegment("aclair", segIds[1]);
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
E.setPieceGoal("aclair", "fluide");
E.pieceSegments(E.pieceById("aclair")).forEach(s => E.markSegmentSeen("aclair",s.id));
let fluidAmb=E.ambitionProgress(E.pieceById("aclair"));
ok(fluidAmb.done === false && fluidAmb.pct === 0,
  "« Jouer sans blocage » ne peut pas être gagné en cochant seulement « vu en cours »");
E.pieceSegments(E.pieceById("aclair")).forEach(s => {
  E.recordSegmentResult({pieceId:"aclair",segmentId:s.id},5,5,0);
});
fluidAmb=E.ambitionProgress(E.pieceById("aclair"));
ok(fluidAmb.done === true,"une vraie tentative propre sur chaque passage valide « Jouer sans blocage »");
freshDB();
E.setPieceGoal("aclair", "lire");
let amb = E.ambitionProgress(E.pieceById("aclair"));
ok(amb && amb.def.id === "lire" && amb.pct === 0 && amb.done === false, "ambition « lire » posée : 0 %, en cours");
E.pieceSegments(E.pieceById("aclair")).forEach(s => {
  masterSegment("aclair", s.id);
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
E.getDB().questionClock=3;
E.scheduleRepair("fa2",{kind:"name",value:"do"},{pool:["fa2","sol2","la2"],qtype:"lect",palierId:"P6"});
E.getDB().questionClock=5;
E.startPieceSegment("aclair", "aclair_p1");
ok(E.getEX().script === null || !E.getEX().script, "passage fragile → réparation ciblée pondérée (le script laisse place au SRS)");
ok(E.getEX().pool.join(",") === "sol4,la4,si4", "la réparation reste cantonnée aux notes du passage");
eq(E.getEX().currentTask.role,"transfer","un passage est traité comme transfert musical, jamais comme réparation globale");
ok(E.getEX().seq.every(id => E.getEX().pool.indexOf(id)>=0),"toutes les questions d'un passage restent dans son propre vocabulaire");
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
ok(/left\/\(RAFALE_S\*1000\)\*100/.test(idxA),
  "la barre de Rafale part de 100 % et non de 10 000 %");
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
  masterSegment("aclair", s.id);
});
ok(E.trophyDefs().find(t => t.id === "premierepiece").on === true, "une pièce entièrement maîtrisée débloque « Première œuvre »");
E.recordSegmentResult({pieceId:"aclair",segmentId:"aclair_p1"},1,5,4,Date.now()+E.SEGMENT_MASTERY_GAP_MS);
ok(E.segmentStateId("aclair","aclair_p1")==="fragile", "un nouvel essai faible rend bien le passage fragile pour le coach");
ok(E.trophyDefs().find(t => t.id === "premierepiece").on === true, "un trophée conquis n'est jamais retiré après un essai faible");
ok(E.trophyDefs().find(t => t.id === "bibliotheque").on === false, "« Bibliothèque » attend les 8 pièces");
E.PIECES_BUILTIN.filter(p => E.pieceMelody(p)).forEach(p => {
  E.pieceSegments(p).forEach(s => {
    masterSegment(p.id, s.id);
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

group("Multi-joueurs — migration, isolation et changement rapide");
freshDB();
ok(E.isIdbReady() === true, "le coffre des joueurs est prêt avant d'autoriser un changement");
let family = E.getPlayerRegistry();
eq(family.players.length, 1, "une installation existante devient exactement un premier joueur");
eq(family.activeId, E.getActivePlayerId(), "le registre pointe vers le joueur réellement chargé");
const parentId = E.getActivePlayerId();
let renamed = null;
E.renamePlayer(parentId, "Dexter", (yes, msg) => { renamed = { yes, msg }; });
ok(renamed && renamed.yes === true, "le joueur v27 peut être nommé sans toucher à sa progression");
E.getDB().xp = 432; E.getDB().sel = "P10"; E.getDB().themeMode = "nocturne";
E.PALIERS.slice(0, 9).forEach(p => { E.getDB().paliers[p.id].zen.ok = true; });
  E.getDB().noteStats.sol2 = E.normalizeNoteStat({ v: 20, e: 3, box: 3, due: 123 });
  E.getDB().pieces = [E.normalizePiece({ id: "persoA", titre: "Partition de Dexter" })];
  E.getDB().curriculum.progress["c1-ear-memory"] = E.normalizeCurriculumState({progress:{"c1-ear-memory":{status:"learning",moduleId:"mission_oreille",selfRating:3,proofs:{self_assessment:{attempts:1,successes:1,lastAt:123}}}}}).progress["c1-ear-memory"];
  E.save({ cloud: false });
let created = null;
E.createPlayer("Alice", (yes, msg) => { created = { yes, msg }; });
ok(created && created.yes === true, "un deuxième joueur est créé avec un coffre séparé");
const aliceId = E.getActivePlayerId();
ok(aliceId !== parentId, "le nom n'est jamais utilisé comme identifiant de stockage");
eq(E.getDB().xp, 0, "un nouveau joueur commence à 0 XP");
eq(E.getDB().sel, "P1", "un nouveau joueur commence à P1");
eq(Object.keys(E.getDB().noteStats).length, 0, "les fragilités du parent ne fuient pas chez le nouveau joueur");
eq(E.getDB().pieces.length, 0, "les partitions personnelles restent propres à chaque joueur");
eq(Object.keys(E.getDB().curriculum.progress).length, 0, "les futures preuves de cursus restent propres à chaque joueur");
E.getDB().xp = 99; E.getDB().sel = "P3"; E.getDB().themeMode = "partition"; E.save({ cloud: false });
E.syncSet({ token: "tok_ALICE", gistId: "gist-alice" });
eq(E.syncCfg().gistId, "gist-alice", "Alice possède sa propre configuration cloud");
E.beginSerie({ sessionMode: "session", n: 1, palier: E.PALIERS[0], pool: ["sol4"], mode: "zen", groupN: 1, cold: false });
let blockedSwitch = null;
ok(E.switchPlayer(parentId, (yes, msg) => { blockedSwitch = { yes, msg }; }) === false, "un exercice en cours bloque immédiatement le changement de joueur");
ok(blockedSwitch && blockedSwitch.yes === false && blockedSwitch.msg.indexOf("exercice") >= 0, "le joueur comprend pourquoi le changement est reporté");
E.haltEX();
let switched = null;
E.switchPlayer(parentId, (yes, msg) => { switched = { yes, msg }; });
ok(switched && switched.yes === true, "un toucher suffit à revenir au premier joueur");
eq(E.getDB().xp, 432, "le retour restaure exactement les XP du parent");
eq(E.getDB().sel, "P10", "le retour restaure exactement son palier");
eq(E.getDB().themeMode, "nocturne", "le thème est personnel");
eq(E.getDB().noteStats.sol2.box, 3, "la mémoire espacée est personnelle");
eq(E.getDB().pieces[0].titre, "Partition de Dexter", "les partitions du parent sont retrouvées");
eq(E.getDB().curriculum.progress["c1-ear-memory"].selfRating, 3, "le suivi de cursus du parent est restauré sans mélange");
ok(E.syncCfg().gistId !== "gist-alice" && E.sessionTokenGet() !== "tok_ALICE", "token et Gist d'Alice ne sont jamais réutilisés pour Dexter");
E.syncSet({ token: "tok_DEXTER", gistId: "gist-dexter" });
ok(E.syncStorageKey(parentId) !== E.syncStorageKey(aliceId), "les configurations cloud utilisent des clés différentes");
ok(E.playerGistFile(parentId) !== E.playerGistFile(aliceId), "chaque joueur utilise un fichier Gist distinct");
E.switchPlayer(aliceId, () => {});
eq(E.getDB().xp, 99, "Alice retrouve ses propres XP après l'aller-retour");
eq(E.syncCfg().gistId, "gist-alice", "Alice retrouve son propre Gist");
eq(E.sessionTokenGet(), "tok_ALICE", "Alice retrouve seulement son token de session");
const aliceUserId = E.getDB()._sezam.userId, aliceGistFile = E.playerGistFile(aliceId), aliceName = E.activePlayerMeta().name;
const aliceReplacement = E.ensureStructure({ xp: 5, sel: "P1", profile: { displayName: "Import Alice" }, paliers: {} });
ok(E.importSave(JSON.stringify(aliceReplacement)).indexOf("Sauvegarde chargée") >= 0, "un import vise uniquement le joueur actif");
eq(E.getDB().xp, 5, "l'import remplace temporairement la progression d'Alice");
eq(E.getDB()._sezam.userId, aliceUserId, "un import ne vole jamais l'identité cloud d'un autre joueur");
eq(E.playerGistFile(aliceId), aliceGistFile, "le fichier Gist d'Alice reste stable après import");
eq(E.activePlayerMeta().name, aliceName, "le nom du joueur actif n'est pas remplacé par le nom du fichier importé");
ok(E.undoImport().indexOf("restauré") >= 0, "l'annulation d'import reste disponible pour Alice");
eq(E.getDB().xp, 99, "annuler l'import rend exactement ses XP à Alice");
let renameAlice = null;
E.renamePlayer(aliceId, "Maman", (yes, msg) => { renameAlice = { yes, msg }; });
ok(renameAlice && renameAlice.yes === true && E.activePlayerMeta().name === "Maman", "renommer un joueur conserve son identité et ses scores");
eq(E.getDB().xp, 99, "le renommage ne remet jamais la progression à zéro");
ok(E.deletePlayer(aliceId) === false, "le joueur actif ne peut pas être supprimé par erreur");
E.switchPlayer(parentId, () => {});
ok(E.deletePlayer(aliceId) === true, "un joueur inactif peut être supprimé après confirmation de l'interface");
eq(E.getPlayerRegistry().players.length, 1, "la suppression ne touche pas au joueur restant");
ok(E.deletePlayer(parentId) === false, "le dernier joueur n'est jamais supprimable");
E.createPlayer("Test quota", () => {}); const quotaPlayerId = E.getActivePlayerId(); E.getDB().xp = 7; E.save({ cloud: false });
E.switchPlayer(parentId, () => {});
E.localStorage.failAfter(E.PLAYER_REGISTRY_KEY, 2);
let failedRegistrySwitch = null;
E.switchPlayer(quotaPlayerId, (yes, msg) => { failedRegistrySwitch = { yes, msg }; });
ok(failedRegistrySwitch && failedRegistrySwitch.yes === false, "un switch n'est jamais annoncé réussi si l'actif ne peut pas être persisté");
eq(E.getActivePlayerId(), parentId, "un échec d'écriture du registre garde l'ancien joueur en mémoire");
const quotaReload = loadEngine({ localStorage: E.localStorage });
eq(quotaReload.getActivePlayerId(), parentId, "après cet échec, un rechargement garde aussi l'ancien joueur");
quotaReload.localStorage.failAfter(quotaReload.PLAYER_REGISTRY_KEY, 1);
ok(quotaReload.deletePlayer(quotaPlayerId) === false, "une suppression est annulée si le registre ne peut pas être enregistré");
eq(quotaReload.getPlayerRegistry().players.length, 2, "le joueur reste inscrit après l'échec transactionnel de suppression");
ok(!!quotaReload.readKey(quotaReload.PLAYER_FALLBACK_PREFIX + quotaPlayerId), "son coffre local n'est pas effacé avant la réussite du registre");

const legacy = E.ensureStructure({ xp: 777, sel: "P10", profile: { displayName: "Ancien P10" }, paliers: {} });
E.PALIERS.slice(0, 9).forEach(p => { legacy.paliers[p.id].zen.ok = true; });
delete legacy._sezam.playerId;
const sharedStore = makeLocalStorage({ solfegeProto1: JSON.stringify(legacy) });
const M = loadEngine({ localStorage: sharedStore });
eq(M.getPlayerRegistry().players.length, 1, "migration v27 : aucun doublon de joueur n'est créé");
eq(M.getDB().xp, 777, "migration v27 : les XP sont intacts");
eq(M.getDB().sel, "P10", "migration v27 : le palier P10 est intact");
eq(M.activePlayerMeta().name, "Ancien P10", "migration v27 : le nom existant devient le premier joueur");
ok(!!M.readKey(M.PLAYER_REGISTRY_KEY), "migration v27 : le registre familial est persisté");
const migratedId = M.getActivePlayerId();
M.createPlayer("Fils", () => {}); M.getDB().xp = 12; M.getDB().sel = "P2"; M.save({ cloud: false });
const childId = M.getActivePlayerId();
const MReload = loadEngine({ localStorage: sharedStore });
eq(MReload.getActivePlayerId(), childId, "le joueur actif survit à un rechargement complet");
eq(MReload.getDB().xp, 12, "le score du fils survit au rechargement");
MReload.switchPlayer(migratedId, () => {});
eq(MReload.getDB().xp, 777, "le profil v27 migré reste récupérable après plusieurs changements");
eq(MReload.getDB().sel, "P10", "aucun changement de joueur ne dégrade le palier migré");
ok(MReload.switchPlayer("__proto__", () => {}) === false, "un identifiant dangereux est refusé sans toucher au joueur actif");
eq(MReload.getActivePlayerId(), migratedId, "un switch invalide laisse le joueur courant intact");
MReload.switchPlayer(childId, () => {});
ok(MReload.deletePlayer(migratedId) === true, "le profil historique peut être supprimé seulement après avoir choisi un autre joueur");
eq(MReload.remoteFileName({ files: { "sezam-progress.json": { content: "{}" } } }), "", "un nouveau joueur ne peut jamais adopter l'ancien Gist générique après cette suppression");
MReload.openPlayerSwitcher();
ok(MReload.getEl("cardBox").innerHTML.indexOf("Qui joue ?") >= 0, "l'interface expose un sélecteur unique « Qui joue ? »");
ok(idx2.indexOf('id="btnPlayerSwitch"') >= 0 && idx2.indexOf('aria-haspopup="dialog"') >= 0,
  "le bouton de changement est visible sur l'accueil et annoncé comme dialogue");
ok(idx2.indexOf("playerId===ACTIVE_PLAYER_ID&&epoch===PLAYER_EPOCH") >= 0,
  "une réponse cloud tardive est ignorée après un changement de joueur");
const wrongCloud = E.cloudDocument(); wrongCloud.userId = "user_etranger";
const wrongSpecific = {}; wrongSpecific[E.playerGistFile(E.getActivePlayerId())] = { content: JSON.stringify(wrongCloud) };
ok(E.parseRemote({ files: wrongSpecific }) === null, "un document cloud portant l'identité d'un autre joueur est refusé");

group("Multi-joueurs — coffres IndexedDB et restauration familiale");
const fakeIdb = makeFakeIndexedDB(), familyLocal = makeLocalStorage();
const I1 = loadEngine({ localStorage: familyLocal, indexedDB: fakeIdb.indexedDB });
const iParent = I1.getActivePlayerId();
I1.renamePlayer(iParent, "Parent IDB", () => {}); I1.getDB().xp = 111; I1.getDB().sel = "P4";
I1.PALIERS.slice(0, 3).forEach(p => { I1.getDB().paliers[p.id].zen.ok = true; }); I1.save({ cloud: false });
I1.createPlayer("Enfant IDB", () => {}); const iChild = I1.getActivePlayerId(); I1.getDB().xp = 22; I1.getDB().sel = "P2"; I1.save({ cloud: false });
ok(fakeIdb.store.has("players"), "IndexedDB conserve aussi le registre familial");
ok(fakeIdb.store.has("save:" + iParent) && fakeIdb.store.has("save:" + iChild), "IndexedDB possède un coffre distinct pour chaque joueur");
const purgedLocal = makeLocalStorage();
const I2 = loadEngine({ localStorage: purgedLocal, indexedDB: fakeIdb.indexedDB });
eq(I2.getActivePlayerId(), iChild, "après purge locale, IndexedDB restaure le dernier joueur actif");
eq(I2.getDB().xp, 22, "après purge locale, le score de l'enfant est restauré");
I2.switchPlayer(iParent, () => {});
eq(I2.getDB().xp, 111, "après restauration familiale, le parent retrouve son propre coffre");
eq(I2.getDB().sel, "P4", "le palier du parent est restauré depuis IndexedDB");
ok(I2.deletePlayer(iChild) === true, "supprimer un joueur inactif retire son entrée de façon contrôlée");
ok(!fakeIdb.store.has("save:" + iChild), "le coffre IndexedDB supprimé ne peut pas ressusciter");
const I3 = loadEngine({ localStorage: makeLocalStorage(), indexedDB: fakeIdb.indexedDB });
eq(I3.getPlayerRegistry().players.length, 1, "un rechargement après suppression ne recrée pas le joueur effacé");
eq(I3.getDB().xp, 111, "le joueur restant demeure intact après suppression et restauration");

/* ---------- bilan ---------- */
console.log("\n──────────────────────────────");
console.log("Réussis : " + pass + "   Échecs : " + fail);
if (fail) { console.log("ÉCHECS :"); failures.forEach(f => console.log("  - " + f)); process.exit(1); }
else { console.log("Tous les tests passent. ✓"); process.exit(0); }
