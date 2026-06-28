export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
}

export type Category = 'All' | 'Philosophy' | 'Science & Tech' | 'Wisdom' | 'Literature & Art' | 'Motivation';
