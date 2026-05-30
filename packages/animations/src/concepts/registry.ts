import data from './registry.json';

/**
 * Single source of truth for the concept library (data lives in registry.json so the
 * Node build script and the Astro site can both read it). Adding a concept = a scene +
 * a project file + an entry in registry.json.
 */
export interface ConceptMeta {
  slug: string;
  /** [white part, accent part] for the split-color title */
  title: [string, string];
  category: 'Scaling' | 'Messaging' | 'Caching' | 'Data' | 'Resilience' | 'Networking';
  summary: string;
  question: string;
}

export const concepts: ConceptMeta[] = data as ConceptMeta[];
export const conceptSlugs = concepts.map(c => c.slug);
