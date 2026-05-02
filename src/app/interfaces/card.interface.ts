export interface Card {
  type: 'Country' | 'City' | 'Territory' | 'Mountain' | 'Lake' | 'Sea' | 'Ocean' | 'River' | 'Desert' | 'Island' | 'Archipelago' |
        'CA Province' | 'CA Territory' | 'Wilaya' | 'AU Territory' | 'Region' | 'Prefecture' |
        'Republic' | 'Krai' | 'Oblast' | 'Federal City' | 'Autonomous Okrug' | 'Autonomous Oblast' |
        'State' | 'Province' | 'Federal District' | 'Federal Capital Territory' | 'Municipality' | 'Autonomous Region' |
        'County' | 'District';
  image: string;
  nom: string;
  localisation: string;
  continent?: string;
  height?: string;
  area?: string;
  population?: string;
  agglomeration?: string;
  depth?: string;
  length?: string;
  rarity: number;
  quizCategory?: string[];
}