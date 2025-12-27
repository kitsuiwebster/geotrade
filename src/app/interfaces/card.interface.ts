export interface Card {
  type: 'Country' | 'City' | 'Territory' | 'Mountain' | 'Lake' | 'Sea' | 'Ocean' | 'River' | 'Desert' | 'Island' | 'Archipelago' | 
        'US State' | 'CA Province' | 'CA Territory' | 'Wilaya' | 'AU State' | 'AU Territory' | 'Region' | 'Prefecture' | 
        'Republic' | 'Krai' | 'Oblast' | 'Federal City' | 'Autonomous Okrug' | 'Autonomous Oblast' | 
        'State' | 'Province' | 'Federal District' | 'Federal Capital Territory' | 'Municipality' | 'Autonomous Region' | 'MX State';
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
  quizCategory?: string[];
}