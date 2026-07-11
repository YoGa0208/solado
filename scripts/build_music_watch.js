"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "data", "music-watch.json");

const SOURCES = [
  { name: "France Musique", feed: "https://www.radiofrance.fr/francemusique/rss", lang: "fr" },
  { name: "The Violin Channel", feed: "https://theviolinchannel.com/feed/", lang: "en" },
  { name: "Early Music America", feed: "https://www.earlymusicamerica.org/feed/", lang: "en" },
  { name: "Classical Music", feed: "https://www.classical-music.com/feed/", lang: "en" },
  { name: "Gramophone", feed: "https://www.gramophone.co.uk/rss", lang: "en" },
  { name: "The Strad", feed: "https://www.thestrad.com/rss", lang: "en" },
  { name: "Bachtrack", feed: "https://bachtrack.com/rss", lang: "en" }
];

const TOPICS = [
  "classique", "classical", "opera", "opéra", "symphony", "symphonie", "concerto", "quartet", "quatuor",
  "bach", "mozart", "beethoven", "chopin", "debussy", "ravel", "stravinsky", "mahler", "brahms",
  "composer", "compositeur", "compositrice", "composition", "solfege", "solfège", "theory", "notation",
  "score", "partition", "instrument", "violin", "violon", "cello", "violoncelle", "piano", "organ",
  "orgue", "luthier", "lutherie", "maker", "stradivari", "guarneri", "bow", "archet", "museum",
  "history", "histoire", "baroque", "romantic", "renaissance", "recording", "album", "premiere"
];

function stripTags(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(block, names) {
  for (const name of names) {
    const re = new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)<\\/" + name + ">", "i");
    const m = block.match(re);
    if (m) return stripTags(m[1]);
  }
  return "";
}

function pickLink(block) {
  const href = block.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i);
  if (href) return stripTags(href[1]);
  return pick(block, ["link", "guid"]);
}

function parseItems(xml, source) {
  const blocks = xml.match(/<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi) || [];
  return blocks.map((block) => {
    const title = pick(block, ["title"]);
    const summary = pick(block, ["description", "summary", "content:encoded", "content"]);
    const url = pickLink(block);
    const date = pick(block, ["pubDate", "updated", "published", "dc:date"]);
    return {
      title,
      summary,
      url,
      source: source.name,
      sourceLang: source.lang,
      publishedAt: date ? new Date(date).toISOString() : new Date().toISOString()
    };
  }).filter((item) => item.title && item.url);
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "SEZAM music watch/1.0" } });
    if (!res.ok) throw new Error(String(res.status));
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function scoreItem(item) {
  const hay = (item.title + " " + item.summary).toLowerCase();
  let score = 0;
  TOPICS.forEach((kw) => { if (hay.includes(kw)) score += 1; });
  if (/strad|luthier|violin|violon|cello|archet|instrument|piano|orgue|organ/.test(hay)) score += 2;
  if (/composer|compositeur|compositrice|bach|mozart|beethoven|chopin|debussy|ravel/.test(hay)) score += 2;
  if (/solfege|solfège|theory|notation|score|partition/.test(hay)) score += 2;
  return score;
}

function classify(item) {
  const hay = (item.title + " " + item.summary).toLowerCase();
  if (/luthier|strad|guarneri|maker|archet|bow/.test(hay)) return ["Artisans", "Lutherie"];
  if (/solfege|solfège|theory|notation|score|partition/.test(hay)) return ["Solfège", "Lecture"];
  if (/instrument|violin|violon|cello|piano|organ|orgue/.test(hay)) return ["Instruments", "Timbre"];
  if (/opera|opéra|museum|history|histoire|baroque|renaissance/.test(hay)) return ["Histoire de l'art", "Culture"];
  if (/composer|compositeur|compositrice|bach|mozart|beethoven|chopin|debussy|ravel|mahler|brahms/.test(hay)) return ["Compositeurs", "Portrait"];
  return ["Nouveautés", "Actualité"];
}

function makeBrief(item, category) {
  const title = item.title.replace(/\s+/g, " ").trim();
  if (category === "Artisans") return "Signal repere: " + title + ". La question interessante est technique: quels materiaux, quels gestes et quels reglages produisent le timbre avant meme l'arrivee de l'interprete?";
  if (category === "Solfège") return "A suivre: " + title + ". Le solfege y apparait comme une technologie de lecture: il encode hauteur, rythme, memoire et coordination collective.";
  if (category === "Instruments") return "La veille remonte " + title + ". Un instrument concentre de la physique, du design, des usages sociaux et une histoire longue des corps qui jouent.";
  if (category === "Histoire de l'art") return "Point d'attention: " + title + ". Le sujet relie musique, images, scenes, institutions et publics sans gommer les contextes.";
  if (category === "Compositeurs") return "Repere aujourd'hui: " + title + ". Un nom de compositeur ouvre souvent un systeme complet: formation, reseaux, commandes, edition, reception.";
  return "Nouveaute a suivre: " + title + ". SEZAM retient l'information lorsqu'elle eclaire une oeuvre, une pratique, un instrument ou une maniere d'ecouter.";
}

function makeReport(item, category, tag) {
  return [
    "La source signale: \"" + item.title + "\". SEZAM retient le sujet pour ce qu'il permet d'observer: production du son, circulation des oeuvres, histoire des formes, notation ou pratiques d'ecoute.",
    "Le bon reflexe consiste a identifier le mecanisme. Est-ce une question de materiau, d'institution, de langage musical, de facture instrumentale, de marche du concert ou de transmission?",
    "Dans ce dossier, le fil principal est " + tag.toLowerCase() + ". On repere les noms propres, les dates, les lieux et les objets techniques, puis on les relie a des faits verifiables plutot qu'a un recit trop commode.",
    "La source originale reste le point d'entree. SEZAM ajoute une synthese courte, contextualisee et non exhaustive, avec une priorite: comprendre ce que l'information change dans notre facon d'ecouter."
  ];
}

function toWatchItem(item, index) {
  const [category, tag] = classify(item);
  return {
    id: "rss-" + String(item.source).toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + index,
    kind: "news",
    category,
    tag,
    source: item.source,
    url: item.url,
    publishedAt: item.publishedAt,
    title: item.title.slice(0, 120),
    brief: makeBrief(item, category),
    report: makeReport(item, category, tag)
  };
}

function readSeed() {
  try {
    const seed = JSON.parse(fs.readFileSync(OUT, "utf8"));
    return Array.isArray(seed.items) ? seed.items : [];
  } catch (e) {
    return [];
  }
}

async function main() {
  const seed = readSeed();
  const seen = new Set(seed.map((item) => item.title));
  const fetched = [];

  for (const source of SOURCES) {
    try {
      const xml = await fetchText(source.feed);
      fetched.push(...parseItems(xml, source));
    } catch (e) {
      console.warn("Source ignored:", source.name, e.message);
    }
  }

  const news = fetched
    .map((item) => ({ item, score: scoreItem(item) }))
    .filter((x) => x.score > 0 && !seen.has(x.item.title))
    .sort((a, b) => b.score - a.score || new Date(b.item.publishedAt) - new Date(a.item.publishedAt))
    .slice(0, 8)
    .map((x, i) => toWatchItem(x.item, i));

  const out = {
    version: 1,
    updatedAt: new Date().toISOString(),
    generatedBy: news.length ? "github-actions-rss" : "seed",
    sources: SOURCES.map((s) => ({ name: s.name, feed: s.feed })),
    items: news.concat(seed).slice(0, 14)
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n");
  console.log("Music watch items:", out.items.length, "news:", news.length);
}

main().catch((err) => {
  console.warn("Music watch fallback:", err.message);
  const seed = {
    version: 1,
    updatedAt: new Date().toISOString(),
    generatedBy: "seed-fallback",
    items: readSeed()
  };
  fs.writeFileSync(OUT, JSON.stringify(seed, null, 2) + "\n");
});
