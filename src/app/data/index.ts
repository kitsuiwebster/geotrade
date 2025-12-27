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
export { archipelagosData } from './archipelagos.data';
export { usaStatesData } from './regions/usa-states.data';
export { canadaProvincesData } from './regions/canada-provinces.data';
export { algeriaWilayasData } from './regions/algeria-wilayas.data';
export { australiaStatesData } from './regions/australia-states.data';
export { italyRegionsData } from './regions/italy-regions.data';
export { japanPrefecturesData } from './regions/japan-prefectures.data';
export { russiaFederalSubjectsData } from './regions/russia-federal-subjects.data';
export { spainRegionsData } from './regions/spain-regions.data';
export { brazilStatesData } from './regions/brazil-states.data';
export { chinaProvincesData } from './regions/china-provinces.data';
export { nigeriaStatesData } from './regions/nigeria-states.data';
export { mexicoStatesData } from './regions/mexico-states.data';
export { newZealandRegionsData } from './regions/new-zealand-regions.data';
export { argentinaProvincesData } from './regions/argentina-provinces.data';

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
import { archipelagosData } from './archipelagos.data';
import { usaStatesData } from './regions/usa-states.data';
import { canadaProvincesData } from './regions/canada-provinces.data';
import { algeriaWilayasData } from './regions/algeria-wilayas.data';
import { australiaStatesData } from './regions/australia-states.data';
import { italyRegionsData } from './regions/italy-regions.data';
import { japanPrefecturesData } from './regions/japan-prefectures.data';
import { russiaFederalSubjectsData } from './regions/russia-federal-subjects.data';
import { spainRegionsData } from './regions/spain-regions.data';
import { brazilStatesData } from './regions/brazil-states.data';
import { chinaProvincesData } from './regions/china-provinces.data';
import { nigeriaStatesData } from './regions/nigeria-states.data';
import { mexicoStatesData } from './regions/mexico-states.data';
import { newZealandRegionsData } from './regions/new-zealand-regions.data';
import { argentinaProvincesData } from './regions/argentina-provinces.data';

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
  ...islandsData,
  ...archipelagosData,
  ...usaStatesData,
  ...canadaProvincesData,
  ...algeriaWilayasData,
  ...australiaStatesData,
  ...italyRegionsData,
  ...japanPrefecturesData,
  ...russiaFederalSubjectsData,
  ...spainRegionsData,
  ...brazilStatesData,
  ...chinaProvincesData,
  ...nigeriaStatesData,
  ...mexicoStatesData,
  ...newZealandRegionsData,
  ...argentinaProvincesData
];