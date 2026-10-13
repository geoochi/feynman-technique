export interface CatalogCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  subjects: string[];
  theme: string;
  previewUrl: string;
  version: string;
  estimatedMinutes: number;
  searchText: string;
}
