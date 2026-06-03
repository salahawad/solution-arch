// Vercel Serverless Function: returns the site's total pageviews from Plausible.
//
// Kept server-side so the Plausible API key never reaches the browser. The home
// page fetches /api/views and renders the number in compact K/M notation.
//
// Configure via Vercel project env vars (all optional — if unset, this returns
// 204 and the UI simply hides the counter, so the site never breaks):
//   PLAUSIBLE_SITE_ID    e.g. "solution-arch.vercel.app"
//   PLAUSIBLE_API_KEY    a Plausible Stats API key (secret)
//   PLAUSIBLE_HOST       defaults to "plausible.io" (set for self-hosted)
//   PLAUSIBLE_PERIOD     defaults to "12mo"; use "custom" with PLAUSIBLE_DATE_RANGE
//   PLAUSIBLE_DATE_RANGE e.g. "2024-01-01,2026-06-03" (only when period=custom)
export default async function handler(_req, res) {
  const siteId = process.env.PLAUSIBLE_SITE_ID;
  const apiKey = process.env.PLAUSIBLE_API_KEY;
  const host = process.env.PLAUSIBLE_HOST || "plausible.io";
  const period = process.env.PLAUSIBLE_PERIOD || "12mo";

  // Not configured yet — let the client quietly hide the counter.
  if (!siteId || !apiKey) {
    res.setHeader("Cache-Control", "s-maxage=300");
    return res.status(204).end();
  }

  const params = new URLSearchParams({ site_id: siteId, period, metrics: "pageviews" });
  if (period === "custom" && process.env.PLAUSIBLE_DATE_RANGE) {
    params.set("date", process.env.PLAUSIBLE_DATE_RANGE);
  }
  const url = `https://${host}/api/v1/stats/aggregate?${params}`;

  try {
    const r = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) {
      res.setHeader("Cache-Control", "s-maxage=60");
      return res.status(502).json({ error: "plausible upstream error" });
    }
    const data = await r.json();
    const views = data?.results?.pageviews?.value ?? 0;
    // Cache at the edge for an hour; serve stale for a day while revalidating.
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    return res.status(200).json({ views });
  } catch {
    res.setHeader("Cache-Control", "s-maxage=60");
    return res.status(502).json({ error: "fetch failed" });
  }
}
