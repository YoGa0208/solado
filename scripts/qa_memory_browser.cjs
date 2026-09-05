/* Real browser smoke QA. Uses the installed Playwright API; no test-runner dependency.
   SEZAM_QA_URL=http://127.0.0.1:4173 node scripts/qa_memory_browser.cjs
   Optional: SEZAM_QA_BROWSER=webkit|chromium, SEZAM_QA_OWN_SERVER=1,
             PLAYWRIGHT_MODULE=/absolute/path/to/playwright
   All state belongs to fresh temporary browser contexts. */
"use strict";
const fs = require("fs");
const path = require("path");
const assert = require("assert/strict");
const http = require("http");
function loadPlaywright() {
  const candidates = ["playwright", process.env.PLAYWRIGHT_MODULE,
    path.join(require("os").homedir(), ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright")].filter(Boolean);
  const errors = [];
  for (const candidate of candidates) {
    try {
      const loaded = require(candidate);
      if (!loaded.webkit || !loaded.chromium) throw new Error("The module does not expose the browser engines");
      return loaded;
    } catch (error) { errors.push(candidate + ": " + error.message); }
  }
  throw new Error("Playwright introuvable. Définir PLAYWRIGHT_MODULE vers une installation existante.\n" + errors.join("\n"));
}
const playwright = loadPlaywright();
const browserName = process.env.SEZAM_QA_BROWSER || "webkit";
assert(["webkit", "chromium"].includes(browserName), "SEZAM_QA_BROWSER doit être webkit ou chromium");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "output/playwright", browserName);
let baseURL = process.env.SEZAM_QA_URL || "http://127.0.0.1:4173";
fs.mkdirSync(out, { recursive: true });
const report = { startedAt: new Date().toISOString(), browser: browserName, baseURL, checks: [], consoleErrors: [], pageErrors: [], requestsFailed: [], dialogs: [] };
let browser, context, page, importedContext, isolatedServer;
async function startIsolatedServer() {
  const types = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png" };
  isolatedServer = http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname); } catch (_) { res.writeHead(400).end(); return; }
    const filename = path.resolve(root, "." + (pathname.endsWith("/") ? pathname + "index.html" : pathname));
    if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(filename, (error, data) => { if (error) { res.writeHead(404).end(); return; } res.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream", "Cache-Control": "no-cache" }); res.end(data); });
  });
  await new Promise(resolve => isolatedServer.listen(0, "127.0.0.1", resolve));
  baseURL = "http://127.0.0.1:" + isolatedServer.address().port;
  report.baseURL = baseURL;
}
async function stopIsolatedServer() {
  if (!isolatedServer) return;
  const server = isolatedServer; isolatedServer = null;
  const closed = new Promise(resolve => server.close(resolve));
  if (server.closeAllConnections) server.closeAllConnections();
  await closed;
}
function check(name, condition, detail) {
  report.checks.push({ name, ok: !!condition, detail });
  process.stdout.write(`${condition ? "OK" : "FAIL"} ${name}${detail ? " — " + JSON.stringify(detail) : ""}\n`);
}
function observe(p, label) {
  p.on("pageerror", error => report.pageErrors.push({ label, message: error.message }));
  p.on("console", message => { if (message.type() === "error") report.consoleErrors.push({ label, message: message.text() }); });
  p.on("requestfailed", request => report.requestsFailed.push({ label, url: request.url(), error: request.failure()?.errorText }));
  p.on("dialog", async dialog => { report.dialogs.push({ label, type: dialog.type(), message: dialog.message() }); await dialog.accept(); });
}
async function snapshot(p, name, screenshot = true) {
  fs.writeFileSync(path.join(out, name + ".aria.txt"), await p.locator("body").ariaSnapshot());
  if (screenshot) await p.screenshot({ path: path.join(out, name + ".png"), fullPage: true });
}
async function ready(p) {
  await p.goto(baseURL, { waitUntil: "domcontentloaded" });
  await p.locator("#btnPlayNow").waitFor({ state: "visible" });
  await p.waitForFunction(() => typeof DB !== "undefined" && !!DB && !playerOperationBusy && !memoryRestoreBusy && !memoryProtectedActionBusy);
  if (await p.locator("#overlay.on").count()) await p.locator("#btnOverlayBack").click();
}
async function idle(p) {
  await p.waitForFunction(() => !memorySnapshotWriting && memorySnapshotQueue.length === 0 && !memoryRestoreBusy && !memoryProtectedActionBusy && !playerOperationBusy);
}
async function points(p) { return p.evaluate(() => new Promise(resolve => memorySnapshotList(resolve))); }
async function envelope(p, meta) { return p.evaluate(meta => new Promise(resolve => loadMemoryEnvelope(meta, raw => resolve(JSON.parse(raw)))), meta); }
async function addedEnvelopes(p, before) {
  const added = (await points(p)).filter(meta => !before.some(old => old.id === meta.id));
  const result = [];
  for (const meta of added) result.push({ meta, env: await envelope(p, meta) });
  return result;
}
async function gameState(p) {
  return p.evaluate(() => ({ raw: JSON.stringify(DB), screen: activeMemoryScreen(), ex: EX && { qid: EX.qid, promptCount: EX.promptCount, seq: EX.seq, k: EX.k, ok: EX.ok, i: EX.i, waiting: EX.waiting, done: EX.done }, staff: document.getElementById("staffbox").innerHTML }));
}
async function startGame(p) {
  await p.locator("#btnPlayNow").click();
  await p.locator("#scrEx.active").waitFor();
  if (await p.locator("#btnDecGo").isVisible()) await p.locator("#btnDecGo").click();
  await p.waitForFunction(() => EX && EX.promptCount > 0 && !EX.waiting && !EX.pendingDecouverte && !EX.done);
}
async function answerOne(p) {
  const question = await p.evaluate(() => ({ qid: EX.qid, name: NOTES[EX.seq[EX.k]].n, type: EX.qtype }));
  assert.equal(question.type, "lect", "The scripted Coach must use note-reading targets");
  await p.locator("#answers").getByRole("button", { name: question.name, exact: true }).click();
  await p.waitForFunction(qid => EX && (EX.qid > qid || EX.done), question.qid);
}
async function home(p) {
  const control = await p.locator("#scrEx.active").count() ? "#btnExerciseHome" : "#btnGlobalHome";
  await p.locator(control).click();
  await p.locator("#scrHome.active").waitFor();
  await idle(p);
}
async function verifyLayout(p, name) {
  const metrics = await p.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return { viewport: window.innerWidth, width, scrollWidth: document.documentElement.scrollWidth,
      overflow: Array.from(document.querySelectorAll("body *")).filter(el => {
        const r = el.getBoundingClientRect(), css = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && css.display !== "none" && css.visibility !== "hidden" && (r.right > width + 1 || r.left < -1);
      }).slice(0, 15).map(el => ({ tag: el.tagName, id: el.id, className: typeof el.className === "string" ? el.className : "svg" })) };
  });
  check(name + " sans débordement horizontal", metrics.scrollWidth <= metrics.width + 1, metrics);
  const seals = await p.locator(".journey .weekSeal").evaluateAll(elements => elements.map(el => {
    const r = el.getBoundingClientRect(), outer = el.closest(".journey").getBoundingClientRect();
    return { text: el.textContent, width: r.width, right: r.right, inside: r.left >= outer.left && r.right <= outer.right };
  }));
  check(name + " affiche les sept sceaux entiers", seals.length === 7 && seals.every(seal => seal.inside && seal.width > 0), seals);
  await snapshot(p, name);
}

(async () => {
  if (process.env.SEZAM_QA_OWN_SERVER === "1") await startIsolatedServer();
  const launchOptions = { headless: true };
  if (browserName === "chromium" && !fs.existsSync(playwright.chromium.executablePath()) && fs.existsSync("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")) {
    launchOptions.channel = "chrome";
    report.runtime = "Google Chrome installé — contexte de test vierge";
  } else report.runtime = "Navigateur Playwright installé";
  browser = await playwright[browserName].launch(launchOptions);
  context = await browser.newContext({ viewport: { width: 375, height: 900 }, isMobile: true, hasTouch: true, acceptDownloads: true, serviceWorkers: "allow", locale: "fr-FR" });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  page = await context.newPage(); observe(page, "source");
  await ready(page); await snapshot(page, "01-home-initial");
  const cycleOptions = await page.locator("#coachLevelSelect option").allTextContents();
  check("Trois cycles identifiés dans le Coach", cycleOptions.length === 3 && cycleOptions.every((s, i) => s.includes("Cycle " + (i + 1))), cycleOptions);
  for (const [level, years] of [["debutant", 5], ["intermediaire", 5], ["avance", 4]]) {
    await page.locator("#coachLevelSelect").selectOption(level);
    check("Années disponibles " + level, await page.locator("#coachYearSelect option").count() === years + 1);
    check("Année obligatoire " + level, await page.locator("#btnCoachSave").isDisabled());
  }
  await page.locator("#coachLevelSelect").selectOption("debutant");
  await page.locator("#coachYearSelect").selectOption("1");
  await page.locator("#btnCoachSave").click(); await idle(page);
  check("Classe C1.1 enregistrée par le formulaire", await page.evaluate(() => DB.profile.coachLevel === "debutant" && DB.profile.coachYear === 1));
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await verifyLayout(page, "02-home-" + width);
  }
  await page.setViewportSize({ width: 375, height: 900 });
  await startGame(page);
  for (let i = 0; i < 3; i++) await answerOne(page);
  await snapshot(page, "03-question-before-save");
  const beforeSave = await gameState(page), priorRows = await points(page);
  await page.locator("#btnQuickSave").click(); await idle(page);
  const afterRows = await points(page), saved = afterRows.find(m => !priorRows.some(old => old.id === m.id));
  check("Bouton Sauvegarder ajoute un point en pleine question", !!saved && afterRows.length === priorRows.length + 1);
  assert(saved, "No manual point was created");
  const savedEnvelope = await envelope(page, saved);
  check("Le point contient les octets exacts de l’état au clic", savedEnvelope.stateRaw === beforeSave.raw);
  check("Confirmation durable visible avec nom du point", (await page.locator("#memoryNoticeText").innerText()).includes(saved.name));
  for (let i = 0; i < 2; i++) await answerOne(page);
  const beforeHome = await gameState(page), homeRowsBefore = await points(page);
  await home(page);
  const homeRowsAfter = await points(page), addedOnHome = homeRowsAfter.filter(m => !homeRowsBefore.some(old => old.id === m.id));
  let homeProtected = false;
  for (const meta of addedOnHome) {
    const env = await envelope(page, meta), rt = JSON.parse(env.runtimeRaw);
    if (env.stateRaw === beforeHome.raw && rt.EX && rt.EX.qid === beforeHome.ex.qid && rt.EX.done === false) homeProtected = true;
    if (env.stateRaw === beforeHome.raw && rt.ex && rt.ex.qid === beforeHome.ex.qid && rt.ex.done === false) homeProtected = true;
  }
  check("Accueil protège la question quittée dans un nouveau point", homeProtected, { added: addedOnHome.length });
  await page.locator("#btnMemoryVault").click();
  await page.locator("#scrStats.active").waitFor();
  await page.locator(`[data-memory-restore="${saved.id}"]`).waitFor();
  await snapshot(page, "04-vault-list");
  await page.locator(`[data-memory-restore="${saved.id}"]`).click(); await idle(page);
  const restored = await gameState(page);
  check("Restaurer rouvre la même question et son score", restored.screen === "scrEx" && JSON.stringify(restored.ex) === JSON.stringify(beforeSave.ex), { expected: beforeSave.ex, actual: restored.ex });
  check("DB restaurée identique au bit près", restored.raw === savedEnvelope.stateRaw);
  const storedRaw = await page.evaluate(() => ({ primary: localStorage.getItem(LS_KEY), mirror: localStorage.getItem(LS_MIRROR), checkpoint: localStorage.getItem(LS_CHECKPOINT) }));
  check("Trois copies locales restaurées à l’identique", Object.values(storedRaw).every(raw => raw === savedEnvelope.stateRaw));
  check("Portée exacte restaurée", restored.staff === beforeSave.staff);
  check("Confirmation explicite de restauration", /Tu es revenu au Niveau .*Rien n’a été perdu/.test(await page.locator("#memoryNoticeText").innerText()));
  await snapshot(page, "05-restored-question");
  await answerOne(page);
  check("La question restaurée reste jouable", (await gameState(page)).ex.qid > restored.ex.qid);
  await home(page); await page.locator("#btnMemoryVault").click(); await idle(page);
  await page.locator("#memoryCommand").fill("liste mes sauvegardes");
  await page.locator("#memoryCommandForm").getByRole("button").click();
  await page.waitForFunction(() => /sauvegardes? disponibles?/.test(document.getElementById("memoryMsg").textContent));
  check("Commande liste mes sauvegardes fonctionne", true);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#btnDownloadMemoryVault").click();
  const download = await downloadPromise, downloadPath = path.join(out, "export.sezam-memory.json");
  await download.saveAs(downloadPath); await idle(page);
  const exported = JSON.parse(fs.readFileSync(downloadPath, "utf8")), payload = JSON.parse(exported.payloadRaw);
  check("Export télécharge le coffre intégral", payload.snapshots.length === (await points(page)).length, { count: payload.snapshots.length, bytes: fs.statSync(downloadPath).size });
  check("Le point manuel original reste intact après restauration", payload.snapshots.some(item => JSON.parse(item.envelopeRaw).stateRaw === savedEnvelope.stateRaw));

  importedContext = await browser.newContext({ viewport: { width: 375, height: 900 }, isMobile: true, hasTouch: true, acceptDownloads: true, serviceWorkers: "allow", locale: "fr-FR" });
  const importedPage = await importedContext.newPage(); observe(importedPage, "import");
  await ready(importedPage); await importedPage.locator("#btnMemoryVault").click();
  await snapshot(importedPage, "06-fresh-device");
  const chooserPromise = importedPage.waitForEvent("filechooser");
  await importedPage.locator("#btnImportMemoryVault").click();
  await (await chooserPromise).setFiles(downloadPath);
  await importedPage.waitForFunction(id => ACTIVE_PLAYER_ID === id && !memoryProtectedActionBusy && !playerOperationBusy, payload.player.id, { timeout: 30000 });
  await idle(importedPage);
  const importedRows = await points(importedPage), originMap = new Map();
  for (const meta of importedRows) originMap.set(meta.originId || meta.id, await envelope(importedPage, meta));
  check("Import sur appareil vierge retrouve le bon joueur", await importedPage.evaluate(id => ACTIVE_PLAYER_ID === id && DB._sezam.playerId === id, payload.player.id));
  check("Import ajoute tous les points du coffre", importedRows.length === payload.snapshots.length, { expected: payload.snapshots.length, actual: importedRows.length });
  check("Chaque état et scène importés restent exacts", payload.snapshots.every(item => {
    const from = JSON.parse(item.envelopeRaw), to = originMap.get(item.originId);
    return to && to.stateRaw === from.stateRaw && to.runtimeRaw === from.runtimeRaw;
  }));
  await snapshot(importedPage, "07-imported-vault");

  // Real controls that historically bypassed the universal navigation protection.
  await home(importedPage);
  await importedPage.locator("#btnPlayerSwitch").click();
  await importedPage.locator("[data-player-edit]").first().click();
  await importedPage.locator("#editPlayerName").fill("Brouillon mémoire QA");
  const beforeEditorBack = await points(importedPage);
  await importedPage.locator("#editPlayerBack").click(); await idle(importedPage);
  await importedPage.locator("[data-player-edit]").first().waitFor({ state: "visible" });
  const editorBackPoints = await addedEnvelopes(importedPage, beforeEditorBack);
  check("Retour éditeur conserve le nom encore non enregistré", editorBackPoints.some(item => {
    const runtime = JSON.parse(item.env.runtimeRaw);
    return runtime.overlayOn && runtime.overlayType === "player_edit" && runtime.overlayControls.some(control => control.id === "editPlayerName" && control.value === "Brouillon mémoire QA");
  }));
  await importedPage.locator("#btnOverlayBack").click(); await idle(importedPage);
  if (!await importedPage.locator("#homeOptions").evaluate(el => el.open)) await importedPage.locator("#homeOptions > summary").click();
  await importedPage.locator("#btnClavier").click();
  await importedPage.locator("#kGo").click();
  const keyboardTarget = await importedPage.evaluate(() => KX.cur.midi);
  await importedPage.locator(`#kKbd [data-midi="${keyboardTarget}"]`).click();
  await importedPage.waitForFunction(() => KX && KX.i === 1 && !KX.waiting);
  const beforeKeyboardQuit = await points(importedPage), keyboardRaw = await importedPage.evaluate(() => JSON.stringify(DB));
  await importedPage.locator("#kQuit").click();
  await importedPage.locator("#scrHome.active").waitFor(); await idle(importedPage);
  const keyboardQuitPoints = await addedEnvelopes(importedPage, beforeKeyboardQuit);
  check("Quitter le clavier protège la séance partielle", keyboardQuitPoints.some(item => {
    const runtime = JSON.parse(item.env.runtimeRaw);
    return item.env.stateRaw === keyboardRaw && runtime.kx && runtime.kx.i === 1 && runtime.kx.ok === 1 && !runtime.kx.done;
  }));
  if (!await importedPage.locator("#homeOptions").evaluate(el => el.open)) await importedPage.locator("#homeOptions > summary").click();
  await importedPage.locator("#btnPieces").click();
  await importedPage.locator('[data-act="detail"][data-id="aclair"]').click();
  await importedPage.locator("#pdLook").click();
  await snapshot(importedPage, "08-first-look");
  const correctChoice = await importedPage.evaluate(() => PR.piece.q[PR.i].rep);
  await importedPage.locator("#prChoices button").nth(correctChoice).click();
  const firstLookBefore = await points(importedPage);
  await importedPage.locator("#btnOverlayBack").click(); await idle(importedPage);
  const firstLookPoints = await addedEnvelopes(importedPage, firstLookBefore);
  const firstLookPoint = firstLookPoints.find(item => {
    const runtime = JSON.parse(item.env.runtimeRaw);
    return runtime.overlayOn && runtime.overlayType === "first_look_answer" && runtime.pr && runtime.pr.i === 0 && runtime.pr.ok === 1;
  });
  check("Retour Premier regard conserve la réponse et la scène", !!firstLookPoint);
  if (firstLookPoint) {
    await importedPage.locator("#btnMemoryVault").click(); await idle(importedPage);
    await importedPage.locator(`[data-memory-restore="${firstLookPoint.meta.id}"]`).click(); await idle(importedPage);
    await importedPage.locator("#prNext").click();
    check("Premier regard restauré reprend sans recompter la réponse", await importedPage.evaluate(() => PR.i === 1 && PR.ok === 1));
  }
  if (await importedPage.locator("#overlay.on").count()) await importedPage.locator("#btnOverlayHome").click();
  else await home(importedPage);
  await importedPage.locator("#scrHome.active").waitFor(); await idle(importedPage);
  if (!await importedPage.locator("#homeOptions").evaluate(el => el.open)) await importedPage.locator("#homeOptions > summary").click();
  await importedPage.locator("#btnPieces").click();
  const fixtureBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6mS8AAAAASUVORK5CYII=";
  await importedPage.locator("#pcTitle").fill("Partition brouillon QA");
  await importedPage.locator("#pcFile").setInputFiles({ name: "partition-qa.png", mimeType: "image/png", buffer: Buffer.from(fixtureBase64, "base64") });
  const beforeFileExit = await points(importedPage);
  await importedPage.locator("#btnMemoryVault").click();
  await importedPage.locator("#scrStats.active").waitFor(); await idle(importedPage);
  const fileExitPoints = await addedEnvelopes(importedPage, beforeFileExit);
  const fileExitPoint = fileExitPoints.find(item => {
    const runtime = JSON.parse(item.env.runtimeRaw);
    return runtime.screen === "scrPieces" && runtime.fileDraft && runtime.fileDraft.attachment.dataUrl === "data:image/png;base64," + fixtureBase64 && runtime.scene.pcTitle.value === "Partition brouillon QA";
  });
  check("Ouvrir Coffre protège le fichier sélectionné et le titre", !!fileExitPoint);
  if (fileExitPoint) {
    await importedPage.locator(`[data-memory-restore="${fileExitPoint.meta.id}"]`).click(); await idle(importedPage);
    check("Restauration du brouillon avec son fichier exact", await importedPage.evaluate(data => activeMemoryScreen() === "scrPieces" && document.getElementById("pcTitle").value === "Partition brouillon QA" && memoryFileDraft.attachment.dataUrl === data, "data:image/png;base64," + fixtureBase64));
    await importedPage.locator("#btnAddPiece").click();
    check("Le brouillon restauré peut réellement devenir une partition", await importedPage.evaluate(data => DB.pieces.some(piece => piece.titre === "Partition brouillon QA" && piece.attachment && piece.attachment.dataUrl === data), "data:image/png;base64," + fixtureBase64));
  }

  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!navigator.serviceWorker.controller && typeof DB !== "undefined");
  const offlineBefore = await points(page);
  if (isolatedServer) {
    await stopIsolatedServer();
    let originUnavailable = false;
    try { await fetch(baseURL, { signal: AbortSignal.timeout(2000) }); } catch (_) { originUnavailable = true; }
    check("Origine réellement injoignable pour le test hors ligne", originUnavailable);
  } else await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#btnPlayNow").waitFor({ state: "visible" });
  check("Rechargement hors ligne servi par le cache", await page.evaluate(() => !!navigator.serviceWorker.controller));
  check("Historique accessible hors ligne après rechargement", (await points(page)).length === offlineBefore.length);
  await snapshot(page, "09-offline-reload");
  await context.setOffline(false);
  check("Aucune exception JavaScript de l’application", report.pageErrors.length === 0, report.pageErrors);
  check("Aucune erreur console en ligne", report.consoleErrors.filter(item => !/offline|Internet connection|network connection|load failed|Failed to fetch|Load failed|Could not connect to the server/i.test(item.message)).length === 0, report.consoleErrors);
})().catch(async error => {
  check("Exécution complète du scénario navigateur", false, { message: error.message, stack: error.stack });
  if (page) { try { await snapshot(page, "99-failure"); } catch (_) {} }
}).finally(async () => {
  if (context) { try { await context.tracing.stop({ path: path.join(out, "trace-memory-" + browserName + ".zip") }); } catch (_) {} }
  if (importedContext) await importedContext.close().catch(() => {});
  if (context) await context.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  await stopIsolatedServer().catch(() => {});
  report.finishedAt = new Date().toISOString();
  report.passed = report.checks.filter(row => row.ok).length;
  report.failed = report.checks.filter(row => !row.ok).length;
  fs.writeFileSync(path.join(out, "memory-" + browserName + "-report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`\n${browserName} QA: ${report.passed} réussis, ${report.failed} échecs. Artifacts: ${out}\n`);
  process.exitCode = report.failed ? 1 : 0;
});
