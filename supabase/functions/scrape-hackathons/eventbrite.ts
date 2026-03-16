// eventbrite.ts
import { fetchWithRetry, parseHTML } from "./utils/utils.ts";

export async function scrapeEventbrite() {
  const events = [];
  let page = 1;
  const maxPages = 3; // limit to avoid overloading

  while (page <= maxPages) {
    const url = `https://www.eventbrite.com/d/online/hackathon/?page=${page}`;
    const html = await (await fetchWithRetry(url)).text();
    const doc = parseHTML(html);
    if (!doc) break;

    // Find all script tags with LD+JSON
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        // Eventbrite often uses ItemList or individual Event objects
        if (data["@type"] === "ItemList" && data.itemListElement) {
          for (const item of data.itemListElement) {
            if (item.item?.["@type"] === "Event") {
              events.push(normalizeEventbriteEvent(item.item));
            }
          }
        } else if (data["@type"] === "Event") {
          events.push(normalizeEventbriteEvent(data));
        }
      } catch {
        continue;
      }
    }

    // Check if next page exists
    const nextLink = doc.querySelector('a[aria-label="Next"]');
    if (!nextLink) break;
    page++;
  }

  return events;
}

function normalizeEventbriteEvent(item: any) {
  return {
    title: item.name,
    platform: "Eventbrite",
    url: item.url,
    avatar: item.image?.url || null,
    start_date: item.startDate || null,
    end_date: item.endDate || null,
    location: item.location?.name || "Online",
  };
}