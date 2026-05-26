require('dotenv').config();

const { fetchRSS, fetchNewsAPI } = require('./src/fetchNews');
const { filterNew, markSeen }    = require('./src/dedupe');
const { summarize }              = require('./src/summarize');
const { sendText }               = require('./src/send');

const DRY_RUN = process.argv.includes('--dry-run');

function prepareForGemini(articles) {
    return articles
        // Sort by recency — newest first
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        // Keep top 40 most recent
        .slice(0, 40)
        // Trim descriptions to save tokens
        .map(a => ({
            title:       a.title,
            url:         a.url,
            source:      a.source,
            publishedAt: a.publishedAt,
            description: a.description?.slice(0, 100) || '',
        }));
}

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

    // 3. Trim to top 40 most recent before sending to Groq
    const trimmed = prepareForGemini(freshArticles);

    // 4. Send to Groq for ranking, collapsing, and summarization
    const digest = await summarize(trimmed, DRY_RUN);

    // 5. Always print digest to console so you can review it
    console.log('\n--- DIGEST PREVIEW ---');
    console.log(digest);
    console.log('----------------------\n');

    // 6. Send the digest via TextBelt (skipped in dry run)
    await sendText(digest, DRY_RUN);

    // 7. Mark the sent articles as seen so they are not repeated
    if (!DRY_RUN) markSeen(freshArticles);

    console.log('Done.');
}

main().then(() => process.exit(0)).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});