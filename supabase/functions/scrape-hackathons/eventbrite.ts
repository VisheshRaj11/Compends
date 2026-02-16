export async function scrapeEventbrite() {
  const res = await fetch(
    "https://www.eventbrite.com/d/online/hackathon/"
  );
  const html = await res.text();

  const matches = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/
  );

  if (!matches) return [];

  const data = JSON.parse(matches[1]);

  return data.itemListElement.map((e: any) => ({
    title: e.item.name,
    platform: "Eventbrite",
    url: e.item.url,
    avatar: e.item.image?.url,
    start_date: e.item.startDate,
    end_date: e.item.endDate,
    location: e.item.location?.name,
  }));
}
