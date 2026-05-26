require('dotenv').config();

const { fetchRSS, fetchNewsAPI } = require('./src/fetchNews');
const { filterNew, markSeen }    = require('./src/dedupe');
const { summarize }              = require('./src/summarize');
const { sendText }               = require('./src/send');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  console.log(`Running tech-news-texts${DRY_RUN ? ' (dry run)' : ''}...`);

  // 1. Fetch from all sources in parallel
  const [rssArticles, newsAPIArticles] = await Promise.all([
    fetchRSS(),
    fetchNewsAPI(),
  ]);

  const allArticles = [...rssArticles, ...newsAPIArticles];
  console.log(`Fetched ${allArticles.length} total articles (${rssArticles.length} RSS, ${newsAPIArticles.length} NewsAPI)`);

  // 2. Filter out articles already sent in the last 7 days
  const freshArticles = filterNew(allArticles);
  console.log(`${freshArticles.length} fresh articles after dedup`);

  if (freshArticles.length === 0) {
    console.log('No fresh articles found. Exiting.');
    return;
  }

  // 3. Send to Gemini for ranking, collapsing, and summarization
  const digest = await summarize(freshArticles, DRY_RUN);

  // 4. Send the digest via TextBelt
  await sendText(digest, DRY_RUN);

  // 5. Mark the sent articles as seen so they are not repeated
  if (!DRY_RUN) markSeen(freshArticles);

  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
