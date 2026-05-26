const Parser = require('rss-parser');

// 5 second timeout per feed — slow/dead feeds get skipped, not waited on
const parser = new Parser({ timeout: 5000 });

// Whitelisted RSS feeds only — no unknown sources ever enter the pipeline
const RSS_FEEDS = [
  { url: 'https://techcrunch.com/feed/',                             source: 'techcrunch.com' },
  { url: 'https://www.theverge.com/rss/index.xml',                  source: 'theverge.com' },
  { url: 'https://www.wired.com/feed/rss',                          source: 'wired.com' },
  { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', source: 'arstechnica.com' },
  { url: 'https://www.technologyreview.com/feed/',                  source: 'technologyreview.mit.edu' },
  { url: 'https://venturebeat.com/feed/',                           source: 'venturebeat.com' },
  { url: 'http://arxiv.org/rss/cs.AI',                              source: 'arxiv.org' },
  { url: 'https://openai.com/blog/rss.xml',                         source: 'openai.com' },
];

// Whitelisted domains for NewsAPI — nothing outside this list
const NEWSAPI_DOMAINS = [
  'techcrunch.com',
  'theverge.com',
  'wired.com',
  'arstechnica.com',
  'technologyreview.mit.edu',
  'venturebeat.com',
  'reuters.com',
].join(',');

// Topic-aligned queries matching our priority order
const NEWSAPI_QUERIES = [
  'artificial intelligence OR large language model OR LLM OR GPT OR Gemini OR AI model',
  'Anthropic OR Claude AI OR OpenAI',
  'technology startup OR developer tools OR open source AI OR tech funding',
  'AWS OR Google Cloud OR Azure OR cloud computing',
];

// Normalize an article into a consistent shape regardless of source
function normalize(raw) {
  return {
    title:       (raw.title || '').trim(),
    url:         (raw.url || raw.link || '').trim(),
    source:      (raw.source || '').trim(),
    publishedAt: raw.publishedAt || raw.pubDate || new Date().toISOString(),
    description: (raw.description || raw.contentSnippet || raw.summary || '').trim(),
  };
}

// Wraps a promise with a timeout so hung feeds fail fast
function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]).catch(err => {
    console.error(`RSS fetch failed [${label}]: ${err.message}`);
    return null;
  });
}

async function fetchRSS() {
  const results = await Promise.all(
      RSS_FEEDS.map(feed =>
          withTimeout(parser.parseURL(feed.url), 5000, feed.source)
              .then(parsed => {
                if (!parsed) return [];
                return parsed.items.slice(0, 15).map(item => normalize({
                  title:       item.title,
                  url:         item.link,
                  source:      feed.source,
                  publishedAt: item.pubDate,
                  description: item.contentSnippet || item.summary || '',
                }));
              })
      )
  );

  return results.flat();
}

async function fetchNewsAPI() {
  const articles = [];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

  for (const query of NEWSAPI_QUERIES) {
    try {
      const params = new URLSearchParams({
        q:        query,
        domains:  NEWSAPI_DOMAINS,
        from:     yesterday,
        sortBy:   'relevancy',
        pageSize: '15',
        apiKey:   process.env.NEWSAPI_KEY,
      });

      const res  = await fetch(`https://newsapi.org/v2/everything?${params}`);
      const data = await res.json();

      if (data.status !== 'ok') {
        console.error(`NewsAPI error for query "${query}": ${data.message}`);
        continue;
      }

      for (const a of data.articles || []) {
        if (!a.title || a.title === '[Removed]') continue;
        articles.push(normalize({
          title:       a.title,
          url:         a.url,
          source:      new URL(a.url).hostname.replace('www.', ''),
          publishedAt: a.publishedAt,
          description: a.description || '',
        }));
      }
    } catch (err) {
      console.error(`NewsAPI fetch failed for query "${query}": ${err.message}`);
    }
  }

  return articles;
}

module.exports = { fetchRSS, fetchNewsAPI };