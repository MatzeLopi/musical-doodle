export interface Category {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface SearchFilters {
  creator?: string;
  title?: string;
  categories_included?: Category[];
  categories_excluded?: Category[];
  tags_included?: Tag[];
  tags_excluded?: Tag[];
  sort_by?: string;
}

export interface Audio {
  id: string;
  title: string;
  creator: string;
  description: string;
  audio_url: string;
  private: boolean;
  category: Category;
  tags: Tag[];
}

export interface Page {
  current_page: number;
  page_size: number;
  items: [];
  has_more: boolean;
}