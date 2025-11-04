const fs = require('fs');
const path = require('path');

// Get all data files
const dataDir = 'src/app/data/cities';
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.data.ts') && f !== 'index.ts');

console.log('Found ' + files.length + ' data files');

let allCities = [];
let localizations = new Set();

files.forEach(file => {
  const filePath = path.join(dataDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Extract city data using regex
  const cityMatches = content.match(/{\s*type:\s*["']City["'],[\s\S]*?}/g);
  
  if (cityMatches) {
    cityMatches.forEach(cityBlock => {
      const nomMatch = cityBlock.match(/nom:\s*["']([^"']+)["']/);
      const locMatch = cityBlock.match(/localisation:\s*["']([^"']+)["']/);
      
      if (nomMatch && locMatch) {
        const cityName = nomMatch[1];
        const localization = locMatch[1];
        allCities.push({ name: cityName, country: localization });
        localizations.add(localization);
      }
    });
  }
});

console.log('\nTotal cities found:', allCities.length);
console.log('Total unique countries/localizations:', localizations.size);

// Sort cities alphabetically
allCities.sort((a, b) => a.name.localeCompare(b.name));

// Save to JSON for easier processing
const output = JSON.stringify({ cities: allCities, countries: Array.from(localizations).sort() }, null, 2);
fs.writeFileSync('cities_data.json', output);

console.log('\nData saved to cities_data.json');
console.log('\nFirst 20 cities:');
allCities.slice(0, 20).forEach(city => {
  console.log(`${city.name} -> ${city.country}`);
});