const fs = require('fs');

// Read the card component file
const cardComponentPath = 'src/app/components/card/card.component.ts';
const content = fs.readFileSync(cardComponentPath, 'utf-8');

// Extract the flag mapping section (around lines 217-652)
const mappingMatch = content.match(/const countryMapping: \{ \[key: string\]: string \} = \{([\s\S]*?)\};/);

if (!mappingMatch) {
  console.log('Could not find country mapping in card.component.ts');
  process.exit(1);
}

const mappingContent = mappingMatch[1];

// Extract city mappings using regex
const cityMatches = mappingContent.match(/'([^']+)':\s*'[a-z]{2}',/g);

if (!cityMatches) {
  console.log('Could not extract city mappings');
  process.exit(1);
}

const mappedCities = cityMatches
  .map(match => {
    const cityMatch = match.match(/'([^']+)':/);
    return cityMatch ? cityMatch[1] : null;
  })
  .filter(city => city !== null)
  .sort();

console.log('Cities found in flag mapping:', mappedCities.length);

// Filter out country names - keep only what look like cities
// We'll identify cities by checking if they contain common city indicators
const cityNames = mappedCities.filter(name => {
  // Skip obvious country names (but this is a rough filter)
  const isLikelyCountry = [
    'France', 'Germany', 'Spain', 'Italy', 'Russia', 'China', 'India', 'Brazil',
    'United States', 'United Kingdom', 'Algeria', 'Morocco', 'Egypt', 'Nigeria',
    'South Africa', 'Kenya', 'Japan', 'Thailand', 'Vietnam', 'Indonesia',
    'Australia', 'Canada', 'Mexico', 'Argentina', 'Chile', 'Colombia',
    'Turkey', 'Iran', 'Iraq', 'Saudi Arabia', 'Israel', 'Jordan',
    'Afghanistan', 'Pakistan', 'Bangladesh', 'Myanmar', 'Nepal', 'Sri Lanka',
    'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Croatia',
    'Serbia', 'Bosnia and Herzegovina', 'Albania', 'Greece', 'Portugal',
    'Belgium', 'Netherlands', 'Denmark', 'Sweden', 'Norway', 'Finland',
    'Estonia', 'Latvia', 'Lithuania', 'Belarus', 'Ukraine', 'Moldova',
    'Georgia', 'Armenia', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan',
    'Kyrgyzstan', 'Tajikistan', 'Turkmenistan', 'Mongolia', 'North Korea',
    'South Korea', 'Philippines', 'Malaysia', 'Singapore', 'Brunei',
    'East Timor', 'Papua New Guinea', 'New Zealand', 'Fiji', 'Samoa',
    'Tonga', 'Vanuatu', 'Solomon Islands', 'Kiribati', 'Tuvalu', 'Nauru',
    'Palau', 'Marshall Islands', 'Micronesia', 'Peru', 'Ecuador', 'Bolivia',
    'Paraguay', 'Uruguay', 'Venezuela', 'Guyana', 'Suriname', 'Guatemala',
    'Belize', 'Honduras', 'El Salvador', 'Nicaragua', 'Costa Rica', 'Panama',
    'Cuba', 'Jamaica', 'Haiti', 'Dominican Republic', 'Trinidad and Tobago',
    'Barbados', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Grenada', 'Dominica', 'Antigua and Barbuda', 'Saint Kitts and Nevis',
    'Bahamas', 'Libya', 'Tunisia', 'Sudan', 'South Sudan', 'Ethiopia',
    'Eritrea', 'Somalia', 'Djibouti', 'Uganda', 'Rwanda', 'Burundi',
    'Tanzania', 'Malawi', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia',
    'Angola', 'Democratic Republic of the Congo', 'Republic of the Congo',
    'Congo', 'Central African Republic', 'Chad', 'Niger', 'Mali',
    'Burkina Faso', 'Ghana', 'Ivory Coast', 'Liberia', 'Sierra Leone',
    'Guinea', 'Guinea-Bissau', 'Senegal', 'Gambia', 'Mauritania',
    'Cape Verde', 'Sao Tome and Principe', 'Equatorial Guinea', 'Gabon',
    'Cameroon', 'Benin', 'Togo', 'Comoros', 'Seychelles', 'Mauritius',
    'Madagascar', 'Mozambique', 'Lesotho', 'Eswatini', 'Kuwait', 'Qatar',
    'Bahrain', 'United Arab Emirates', 'Oman', 'Yemen', 'Lebanon', 'Syria',
    'Cyprus', 'Maldives', 'Bhutan', 'Laos', 'Cambodia'
  ];
  
  return !isLikelyCountry.includes(name);
});

console.log('Cities (filtered from countries):', cityNames.length);

// Save to file
fs.writeFileSync('mapped_cities.json', JSON.stringify(cityNames, null, 2));

console.log('First 20 mapped cities:');
cityNames.slice(0, 20).forEach(city => {
  console.log(city);
});

console.log('\nMapped cities saved to mapped_cities.json');