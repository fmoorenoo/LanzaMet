/**
 * Search engines, AI crawlers, link previews and audit tools, by their user
 * agent: Googlebot, Google-InspectionTool, bingbot, GPTBot, ClaudeBot,
 * PerplexityBot, Chrome-Lighthouse… They see the same page as anyone; only
 * suggestions meant for a person (such as reading in another language) are
 * left out. "bot" counts as a whole word ending, so phone models such as
 * "CUBOT" don't.
 */
const CRAWLER = /(?<!cu)bot\b|crawler|spider|slurp|inspectiontool|chrome-lighthouse/i;

export function isCrawler(userAgent: string | undefined): boolean {
  return !!userAgent && CRAWLER.test(userAgent);
}
