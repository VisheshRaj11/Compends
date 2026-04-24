// devpost.ts
import { fetchWithRetry, parseHTML } from "./utils/utils.ts";

export async function scrapeDevPost() {
  const events = [];
  let page = 1;
  const baseUrl = "https://devpost.com/hackathons";

  while (true) {
    const url = page === 1 ? baseUrl : `${baseUrl}?page=${page}`;
    const html = await (await fetchWithRetry(url)).text();
    const doc = parseHTML(html);
    if (!doc) break;

    // DevPost lists hackathons in <article> tags with class 'challenge-listing'
    const articles = doc.querySelectorAll('article.challenge-listing');
    if (articles.length === 0) break;

    for (const article of articles) {
      const titleEl = article.querySelector('h2 a');
      const imgEl = article.querySelector('.challenge-listing-img img');
      const dateEl = article.querySelector('.display-font span');

      events.push({
        title: titleEl?.textContent?.trim() || "Untitled",
        platform: "Devpost",
        url: titleEl?.getAttribute("href") || "",
        avatar: imgEl?.getAttribute("src") || null,
        start_date: parseDevpostDate(dateEl?.textContent || ""),
        end_date: null, // DevPost often shows "Open" or single date
        location: "Online", // Most DevPost hackathons are online
      });
    }

    // Check for next page
    const nextLink = doc.querySelector('a[rel="next"]');
    if (!nextLink) break;
    page++;
  }

  return events;
}

function parseDevpostDate(text: string): string | null {
  // Example: "Opens Jan 1, 2025" or "Ends Mar 10"
  // You can implement proper date parsing or store raw text
  return text || null;
}