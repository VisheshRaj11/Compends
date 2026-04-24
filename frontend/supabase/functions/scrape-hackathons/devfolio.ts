// devfolio.ts
import { fetchWithRetry, parseHTML } from "./utils/utils.ts";

export async function scrapeDevfolio() {
  const events = [];
  const url = "https://devfolio.co/hackathons";

  const html = await (await fetchWithRetry(url)).text();
  const doc = parseHTML(html);
  if (!doc) return [];

  // Devfolio uses a grid of cards
  const cards = doc.querySelectorAll('.hackathon-card');
  for (const card of cards) {
    const titleEl = card.querySelector('h3 a');
    const imgEl = card.querySelector('img');
    const dateEl = card.querySelector('.date');
    const locationEl = card.querySelector('.location');

    events.push({
      title: titleEl?.textContent?.trim() || "",
      platform: "Devfolio",
      url: "https://devfolio.co" + (titleEl?.getAttribute("href") || ""),
      avatar: imgEl?.getAttribute("src") || null,
      start_date: dateEl?.textContent?.trim() || null,
      end_date: null,
      location: locationEl?.textContent?.trim() || "Online",
    });
  }

  return events;
}