// Canonical category order — shared by the gallery (groups concepts under headings
// in this order) and the concept page ("More concepts" fills its cross-category picks
// in this order). Tuned for a senior-architect audience: lead with depth and
// failure-mode nuance (Resilience, Data) over entry-level recognition (Caching, Client),
// so an expert scanning the page hits substantial material first instead of "101"
// topics. Keeping it in one place means a newly added category is ordered consistently
// in both surfaces.
export const CATEGORY_ORDER = [
  "Resilience",
  "Data",
  "Observability",
  "AI Systems",
  "Scaling",
  "Coordination",
  "Messaging",
  "Orchestration",
  "Delivery",
  "Networking",
  "Caching",
  "Client",
];
