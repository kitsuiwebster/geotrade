export { mountainsData } from './mountains.data';
export { lakesData } from './lakes.data';
export { allCitiesData } from './cities';
export { countriesData } from './countries.data';
export { territoriesData } from './territories.data';
export { seasData } from './seas.data';
export { oceansData } from './oceans.data';
export { riversData } from './rivers.data';
export { desertsData } from './deserts.data';
export { islandsData } from './islands.data';

import { Card } from '../interfaces/card.interface';
import { mountainsData } from './mountains.data';
import { lakesData } from './lakes.data';
import { allCitiesData } from './cities';
import { countriesData } from './countries.data';
import { territoriesData } from './territories.data';
import { seasData } from './seas.data';
import { oceansData } from './oceans.data';
import { riversData } from './rivers.data';
import { desertsData } from './deserts.data';
import { islandsData } from './islands.data';

export const allCardsData: Card[] = [
  ...mountainsData,
  ...lakesData,
  ...allCitiesData,
  ...countriesData,
  ...territoriesData,
  ...seasData,
  ...oceansData,
  ...riversData,
  ...desertsData,
  ...islandsData
];