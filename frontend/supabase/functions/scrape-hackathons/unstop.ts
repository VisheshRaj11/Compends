// unstop.ts
import { fetchWithRetry, parseHTML } from "./utils/utils.ts";

export async function scrapeUnstop() {
  const events = [];
  const url = "https://unstop.com/hackathons";

  const html = await (await fetchWithRetry(url)).text();
  const doc = parseHTML(html);
  if (!doc) return [];

  // Unstop uses a React app, but we can find cards in the HTML
  const cards = doc.querySelectorAll('.competition_card');
  for (const card of cards) {
    const titleEl = card.querySelector('.title a');
    const imgEl = card.querySelector('img');
    const dateEl = card.querySelector('.date_range');
    const locationEl = card.querySelector('.location');

    events.push({
      title: titleEl?.textContent?.trim() || "",
      platform: "Unstop",
      url: "https://unstop.com" + (titleEl?.getAttribute("href") || ""),
      avatar: imgEl?.getAttribute("src") || null,
      start_date: extractDate(dateEl?.textContent || ""),
      end_date: null,
      location: locationEl?.textContent?.trim() || "Online",
    });
  }

  return events;
}

function extractDate(text: string): string | null {
  // Implement date parsing or return raw text
  return text || null;
}