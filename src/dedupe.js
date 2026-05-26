const fs   = require('fs');
const path = require('path');

const SEEN_PATH     = path.join(__dirname, '../data/seen.json');
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(SEEN_PATH, 'utf8'));
  } catch {
    return [];
  }
}

function saveSeen(seen) {
  fs.writeFileSync(SEEN_PATH, JSON.stringify(seen, null, 2));
}

// Remove articles older than 7 days so the file does not grow forever
function pruneOld(seen) {
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  return seen.filter(entry => entry.seenAt > cutoff);
}

// Returns only articles whose URLs have not been sent before
function filterNew(articles) {
  const seen    = pruneOld(loadSeen());
  const seenSet = new Set(seen.map(e => e.url));
  return articles.filter(a => a.url && !seenSet.has(a.url));
}

// Call this after the digest is built — marks those URLs as seen
function markSeen(articles) {
  const seen    = pruneOld(loadSeen());
  const seenSet = new Set(seen.map(e => e.url));

  const newEntries = articles
    .filter(a => a.url && !seenSet.has(a.url))
    .map(a => ({ url: a.url, seenAt: Date.now() }));

  saveSeen([...seen, ...newEntries]);
}

module.exports = { filterNew, markSeen };
