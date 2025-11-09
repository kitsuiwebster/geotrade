import { Component, Input, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card } from '../../interfaces/card.interface';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
})
export class CardComponent implements OnInit, OnDestroy {
  @Input() card!: Card;
  @Input() id!: string;
  
  isModalOpen = false;
  imageLoaded = false;
  thumbnailLoaded = false;
  modalImageLoaded = false;
  modalImageFullyDisplayed = false;
  modalImageSrc = '';
  private useFallback = false;
  private observer?: IntersectionObserver;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.imageLoaded) {
            this.imageLoaded = true;
            this.observer?.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0.1
      }
    );

    this.observer.observe(this.elementRef.nativeElement);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && this.isModalOpen) {
      this.closeModal();
    }
  }

  openModal() {
    this.isModalOpen = true;
    this.modalImageLoaded = false;
    this.modalImageFullyDisplayed = false;
    document.body.style.overflow = 'hidden';
    
    const img = new Image();
    img.onload = () => {
      this.modalImageSrc = this.getFullImageUrl();
      this.modalImageLoaded = true;
    };
    img.onerror = () => {
      this.modalImageSrc = this.getFullImageUrl();
      this.modalImageLoaded = true;
    };
    img.src = this.getFullImageUrl();
    
    // Timeout court - si ça prend trop longtemps, on affiche quand même
    setTimeout(() => {
      if (!this.modalImageLoaded) {
        this.modalImageSrc = this.getFullImageUrl();
        this.modalImageLoaded = true;
      }
    }, 1500);
  }

  onModalImageFullyDisplayed() {
    this.modalImageFullyDisplayed = true;
  }

  onThumbnailLoad() {
    this.thumbnailLoaded = true;
  }

  onThumbnailError(event: any) {
    // Si la thumbnail échoue, utiliser l'image originale
    this.useFallback = true;
    event.target.src = this.card.image;
  }

  onModalImageLoad() {
    this.modalImageLoaded = true;
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.style.overflow = 'auto';
  }

  getCardInfo(): string {
    return '';
  }

  getCardInfoLabel(): string {
    if (this.card.height) return 'Height:';
    if (this.card.area && this.card.depth) {
      return 'Area:\nDepth:';
    }
    if (this.card.population && this.card.agglomeration) {
      return 'Population:\nAgglomeration:';
    }
    if (this.card.population && this.card.area) {
      return 'Population:\nArea:';
    }
    if (this.card.population) return 'Population:';
    if (this.card.depth) return 'Depth:';
    if (this.card.length) return 'Length:';
    if (this.card.area) return 'Area:';
    return '';
  }

  getCardInfoValue(): string {
    if (this.card.height) return this.card.height;
    if (this.card.area && this.card.depth) {
      const area = this.formatArea(this.card.area);
      return `${area}\n${this.card.depth}`;
    }
    if (this.card.population && this.card.agglomeration) {
      const pop = this.formatNumber(this.card.population);
      const agglo = this.formatNumber(this.card.agglomeration);
      return `${pop}\n${agglo}`;
    }
    if (this.card.population && this.card.area) {
      const pop = this.formatNumber(this.card.population);
      const area = this.formatArea(this.card.area);
      return `${pop}\n${area}`;
    }
    if (this.card.population) return this.formatNumber(this.card.population);
    if (this.card.depth) return this.card.depth;
    if (this.card.length) return this.formatArea(this.card.length);
    if (this.card.area) return this.formatArea(this.card.area);
    return '';
  }

  private formatNumber(value: string): string {
    // Convertir "12,506,000 M" en "12.5 M"
    if (value.includes(',') && value.includes(' M')) {
      const numStr = value.replace(' M', '').replace(/,/g, '');
      const num = parseFloat(numStr) / 1000000;
      return `${num.toFixed(1)} M`;
    }
    return value;
  }

  private formatArea(value: string): string {
    // Convertir "82,100 km²" en "82.1 km²" ou "643,801 km²" en "643.8 km²"
    if (value.includes('km²') || value.includes('km')) {
      const match = value.match(/^([\d,]+)\s*(km²?)/);
      if (match) {
        const numStr = match[1].replace(/,/g, '');
        const num = parseFloat(numStr);
        const unit = match[2];
        
        if (num >= 1000) {
          return `${(num / 1000).toFixed(1)}k ${unit}`;
        } else {
          return `${num.toFixed(1)} ${unit}`;
        }
      }
    }
    return value;
  }

  getSmallImageUrl(): string {
    // Utiliser les thumbnails WebP pour les cartes de la liste, fallback vers l'originale
    return this.useFallback ? this.card.image : this.generateThumbnailUrl(this.card.image);
  }

  getFullImageUrl(): string {
    // Retourner l'image en taille originale pour le modal
    return this.card.image;
  }

  private generateThumbnailUrl(originalUrl: string): string {
    // Comme il n'y a pas de dossier thumbnails, utiliser directement l'image originale
    // Ceci évite les erreurs de chargement et les images noires
    return originalUrl;
  }

  getFlagUrl(): string | null {
    if (this.card.type === 'Country' || this.card.type === 'City' || this.card.type === 'Territory') {
      // Mapping des noms vers les codes pays pour les drapeaux
      const countryMapping: { [key: string]: string } = {
        // African countries
        'Algeria': 'dz',
        'Angola': 'ao',
        'Benin': 'bj',
        'Botswana': 'bw',
        'Burkina Faso': 'bf',
        'Burundi': 'bi',
        'Cameroon': 'cm',
        'Cape Verde': 'cv',
        'Central African Republic': 'cf',
        'Chad': 'td',
        'Comoros': 'km',
        'Democratic Republic of the Congo': 'cd',
        'Republic of the Congo': 'cg',
        'Congo': 'cg',
        'Ivory Coast': 'ci',
        'Djibouti': 'dj',
        'Egypt': 'eg',
        'Equatorial Guinea': 'gq',
        'Eritrea': 'er',
        'Ethiopia': 'et',
        'Gabon': 'ga',
        'Gambia': 'gm',
        'Ghana': 'gh',
        'Guinea': 'gn',
        'Guinea-Bissau': 'gw',
        'Kenya': 'ke',
        'Lesotho': 'ls',
        'Liberia': 'lr',
        'Libya': 'ly',
        'Madagascar': 'mg',
        'Malawi': 'mw',
        'Mali': 'ml',
        'Mauritania': 'mr',
        'Mauritius': 'mu',
        'Morocco': 'ma',
        'Mozambique': 'mz',
        'Namibia': 'na',
        'Niger': 'ne',
        'Nigeria': 'ng',
        'Rwanda': 'rw',
        'São Tomé and Príncipe': 'st',
        'Senegal': 'sn',
        'Seychelles': 'sc',
        'Sierra Leone': 'sl',
        'Somalia': 'so',
        'South Africa': 'za',
        'South Sudan': 'ss',
        'Sudan': 'sd',
        'Eswatini': 'sz',
        'Tanzania': 'tz',
        'Togo': 'tg',
        'Tunisia': 'tn',
        'Uganda': 'ug',
        'Zambia': 'zm',
        'Zimbabwe': 'zw',
        
        // Asian countries  
        'Afghanistan': 'af',
        'Armenia': 'am',
        'Azerbaijan': 'az',
        'Bahrain': 'bh',
        'Bangladesh': 'bd',
        'Bhutan': 'bt',
        'Brunei': 'bn',
        'Cambodia': 'kh',
        'China': 'cn',
        'North Korea': 'kp',
        'South Korea': 'kr',
        'United Arab Emirates': 'ae',
        'India': 'in',
        'Indonesia': 'id',
        'Iraq': 'iq',
        'Iran': 'ir',
        'Israel': 'il',
        'Japan': 'jp',
        'Jordan': 'jo',
        'Kazakhstan': 'kz',
        'Kyrgyzstan': 'kg',
        'Kuwait': 'kw',
        'Laos': 'la',
        'Lebanon': 'lb',
        'Malaysia': 'my',
        'Maldives': 'mv',
        'Mongolia': 'mn',
        'Myanmar': 'mm',
        'Nepal': 'np',
        'Oman': 'om',
        'Uzbekistan': 'uz',
        'Pakistan': 'pk',
        'Palestine': 'ps',
        'Philippines': 'ph',
        'Qatar': 'qa',
        'Saudi Arabia': 'sa',
        'Singapore': 'sg',
        'Sri Lanka': 'lk',
        'Syria': 'sy',
        'Tajikistan': 'tj',
        'Thailand': 'th',
        'East Timor': 'tl',
        'Turkmenistan': 'tm',
        'Turkey': 'tr',
        'Vietnam': 'vn',
        'Yemen': 'ye',
        
        // European countries
        'France': 'fr',
        'Belgium': 'be',
        'Germany': 'de',
        'Spain': 'es',
        'Italy': 'it',
        'Russia': 'ru',
        'Georgia': 'ge',
        'Albania': 'al',
        'Andorra': 'ad',
        'Austria': 'at',
        'Belarus': 'by',
        'Bosnia and Herzegovina': 'ba',
        'Bulgaria': 'bg',
        'Cyprus': 'cy',
        'Croatia': 'hr',
        'Denmark': 'dk',
        'Estonia': 'ee',
        'Finland': 'fi',
        'Greece': 'gr',
        'Hungary': 'hu',
        'Ireland': 'ie',
        'Iceland': 'is',
        'Latvia': 'lv',
        'Lithuania': 'lt',
        'Luxembourg': 'lu',
        'North Macedonia': 'mk',
        'Malta': 'mt',
        'Moldova': 'md',
        'Montenegro': 'me',
        'Norway': 'no',
        'Netherlands': 'nl',
        'Poland': 'pl',
        'Portugal': 'pt',
        'Czech Republic': 'cz',
        'Romania': 'ro',
        'United Kingdom': 'gb',
        'San Marino': 'sm',
        'Serbia': 'rs',
        'Slovakia': 'sk',
        'Slovenia': 'si',
        'Switzerland': 'ch',
        'Sweden': 'se',
        'Ukraine': 'ua',
        
        // American countries
        'Argentina': 'ar',
        'Antigua and Barbuda': 'ag',
        'Bahamas': 'bs',
        'Barbados': 'bb',
        'Belize': 'bz',
        'Bolivia': 'bo',
        'Brazil': 'br',
        'Canada': 'ca',
        'Chile': 'cl',
        'Colombia': 'co',
        'Costa Rica': 'cr',
        'Cuba': 'cu',
        'Dominica': 'dm',
        'United States': 'us',
        'Ecuador': 'ec',
        'Grenada': 'gd',
        'Guatemala': 'gt',
        'Guyana': 'gy',
        'Haiti': 'ht',
        'Honduras': 'hn',
        'Jamaica': 'jm',
        'Mexico': 'mx',
        'Nicaragua': 'ni',
        'Panama': 'pa',
        'Paraguay': 'py',
        'Peru': 'pe',
        'Dominican Republic': 'do',
        'Saint Kitts and Nevis': 'kn',
        'Saint Vincent and the Grenadines': 'vc',
        'Saint Lucia': 'lc',
        'El Salvador': 'sv',
        'Suriname': 'sr',
        'Trinidad and Tobago': 'tt',
        'Uruguay': 'uy',
        'Venezuela': 've',
        
        // Oceanian countries
        'Australia': 'au',
        'Fiji': 'fj',
        'Kiribati': 'ki',
        'Micronesia': 'fm',
        'Nauru': 'nr',
        'New Zealand': 'nz',
        'Palau': 'pw',
        'Papua New Guinea': 'pg',
        'Samoa': 'ws',
        'Tonga': 'to',
        'Tuvalu': 'tv',
        'Vanuatu': 'vu',
        'Marshall Islands': 'mh',
        'Solomon Islands': 'sb',
        
        // Additional countries
        'Taiwan': 'tw',
        
        // Cities (use country codes)
        'Paris': 'fr',
        'Tokyo': 'jp',
        'Mumbai': 'in',
        'Beijing': 'cn',
        'Cape Town': 'za',
        'Berlin': 'de',
        'London': 'gb',
        'Moscow': 'ru',
        'New York': 'us',
        'Rio de Janeiro': 'br',
        'Sydney': 'au',
        'Lagos': 'ng',
        'Kinshasa': 'cd',
        'Cairo': 'eg',
        'Casablanca': 'ma',
        'Nairobi': 'ke',
        'Johannesburg': 'za',
        'Luanda': 'ao',
        'Addis Ababa': 'et',
        'Abidjan': 'ci',
        'Alexandria': 'eg',
        'Khartoum': 'sd',
        'Dakar': 'sn',
        'Accra': 'gh',
        'Tunis': 'tn',
        'Rabat': 'ma',
        'Algiers': 'dz',
        'Oran': 'dz',
        'Constantine': 'dz',
        'Annaba': 'dz',
        'Batna': 'dz',
        'Blida': 'dz',
        'Setif': 'dz',
        'Djelfa': 'dz',
        'Sidi Bel Abbes': 'dz',
        'Biskra': 'dz',
        'Tebessa': 'dz',
        'Praia': 'cv',
        'Abuja': 'ng',
        'Maseru': 'ls',
        'Lilongwe': 'mw',
        'Harare': 'zw',
        'Lusaka': 'zm',
        'Antananarivo': 'mg',
        'Asmara': 'er',
        'Bamako': 'ml',
        'Bangui': 'cf',
        'Banjul': 'gm',
        'Bissau': 'gw',
        'Brazzaville': 'cg',
        'Conakry': 'gn',
        'Ouagadougou': 'bf',
        'Dodoma': 'tz',
        'Freetown': 'sl',
        'Gaborone': 'bw',
        'Gitega': 'bi',
        'Juba': 'ss',
        'Kampala': 'ug',
        'Kigali': 'rw',
        'Libreville': 'ga',
        'Lome': 'tg',
        'Malabo': 'gq',
        'Maputo': 'mz',
        'Mbabane': 'sz',
        'Mogadishu': 'so',
        'Monrovia': 'lr',
        'Moroni': 'km',
        'N\'Djamena': 'td',
        'Niamey': 'ne',
        'Nouakchott': 'mr',
        'Port Louis': 'mu',
        'Porto-Novo': 'bj',
        'São Tomé': 'st',
        'Tripoli': 'ly',
        'Victoria': 'sc',
        'Windhoek': 'na',
        'Yamoussoukro': 'ci',
        'Yaounde': 'cm',
        
        'Marseille': 'fr',
        'Lyon': 'fr',
        'Toulouse': 'fr',
        'Nice': 'fr',
        'Nantes': 'fr',
        'Montpellier': 'fr',
        'Strasbourg': 'fr',
        'Bordeaux': 'fr',
        'Lille': 'fr',
        'Valleiry': 'fr',
        
        // European capitals and cities
        'Tirana': 'al',
        'Andorra la Vella': 'ad',
        'Vienna': 'at',
        'Minsk': 'by',
        'Brussels': 'be',
        'Sarajevo': 'ba',
        'Sofia': 'bg',
        'Zagreb': 'hr',
        'Nicosia': 'cy',
        'Prague': 'cz',
        'Copenhagen': 'dk',
        'Tallinn': 'ee',
        'Helsinki': 'fi',
        'Tbilisi': 'ge',
        'Athens': 'gr',
        'Budapest': 'hu',
        'Reykjavik': 'is',
        'Dublin': 'ie',
        'Rome': 'it',
        'Pristina': 'xk',
        'Riga': 'lv',
        'Vilnius': 'lt',
        'Skopje': 'mk',
        'Valletta': 'mt',
        'Chisinau': 'md',
        'Podgorica': 'me',
        'Amsterdam': 'nl',
        'Oslo': 'no',
        'Warsaw': 'pl',
        'Lisbon': 'pt',
        'Bucharest': 'ro',
        'Belgrade': 'rs',
        'Bratislava': 'sk',
        'Ljubljana': 'si',
        'Madrid': 'es',
        'Stockholm': 'se',
        'Kiev': 'ua',
        'Kyiv': 'ua',
        'Berne': 'ch',
        'Bern': 'ch',
        
        // Asian capitals and cities
        'Kabul': 'af',
        'Yerevan': 'am',
        'Baku': 'az',
        'Manama': 'bh',
        'Dhaka': 'bd',
        'Thimphu': 'bt',
        'Bandar Seri Begawan': 'bn',
        'Phnom Penh': 'kh',
        'Dushanbe': 'tj',
        'Dili': 'tl',
        'Jakarta': 'id',
        'Tehran': 'ir',
        'Baghdad': 'iq',
        'Jerusalem': 'il',
        'Al-Quds': 'ps',
        'Nur-Sultan': 'kz',
        'Astana': 'kz',
        'Bishkek': 'kg',
        'Vientiane': 'la',
        'Beirut': 'lb',
        'Kuala Lumpur': 'my',
        'Male': 'mv',
        'Ulaanbaatar': 'mn',
        'Naypyidaw': 'mm',
        'Kathmandu': 'np',
        'Pyongyang': 'kp',
        'Muscat': 'om',
        'Islamabad': 'pk',
        'Ramallah': 'ps',
        'Manila': 'ph',
        'Doha': 'qa',
        'Riyadh': 'sa',
        'Seoul': 'kr',
        'Sri Jayawardenepura Kotte': 'lk',
        'Damascus': 'sy',
        'Bangkok': 'th',
        'Ashgabat': 'tm',
        'Abu Dhabi': 'ae',
        'Tashkent': 'uz',
        'Hanoi': 'vn',
        'Sanaa': 'ye',
        'New Delhi': 'in',
        'Delhi': 'in',
        'Achgabat': 'tm',
        'Amman': 'jo',
        'Ankara': 'tr',
        'Douchanbé': 'tj',
        'Hanoï': 'vn',
        'Kuwait City': 'kw',
        
        // Additional Asian cities
        'Osaka': 'jp',
        'Kyoto': 'jp',
        'Sapporo': 'jp',
        'Nagoya': 'jp',
        'Fukuoka': 'jp',
        'Yokohama': 'jp',
        'Kolkata': 'in',
        'Bengaluru': 'in',
        'Chennai': 'in',
        'Hyderabad': 'in',
        'Ahmedabad': 'in',
        'Surat': 'in',
        'Pune': 'in',
        'Jaipur': 'in',
        'Kanpur': 'in',
        'Nagpur': 'in',
        'Bhopal': 'in',
        'Pimpri Chinchwad': 'in',
        'Vadodara': 'in',
        'Patna': 'in',
        'Ludhiana': 'in',
        'Agra': 'in',
        'Karachi': 'pk',
        'Lahore': 'pk',
        'Faisalabad': 'pk',
        'Rawalpindi': 'pk',
        'Gujranwala': 'pk',
        'Multan': 'pk',
        'Chongqing': 'cn',
        'Tianjin': 'cn',
        'Guangzhou': 'cn',
        'Shenzhen': 'cn',
        'Chengdu': 'cn',
        'Nanjing': 'cn',
        'Wuhan': 'cn',
        'Xi\'an': 'cn',
        'Dongguan': 'cn',
        'Hangzhou': 'cn',
        'Foshan': 'cn',
        'Shenyang': 'cn',
        'Suzhou': 'cn',
        'Harbin': 'cn',
        'Qingdao': 'cn',
        'Dalian': 'cn',
        'Jinan': 'cn',
        'Changsha': 'cn',
        'Nanning': 'cn',
        'Kunming': 'cn',
        'Urumqi': 'cn',
        'Wuxi': 'cn',
        'Tangshan': 'cn',
        'Zibo': 'cn',
        'Nanchang': 'cn',
        'Lanzhou': 'cn',
        'Baotou': 'cn',
        'Jilin': 'cn',
        'Luoyang': 'cn',
        'Datong': 'cn',
        'Kowloon': 'cn',
        'Istanbul': 'tr',
        'Izmir': 'tr',
        'Bursa': 'tr',
        'Adana': 'tr',
        'Busan': 'kr',
        'Incheon': 'kr',
        'Daegu': 'kr',
        'Ho Chi Minh City': 'vn',
        'Da Nang': 'vn',
        'Haiphong': 'vn',
        'Chittagong': 'bd',
        'Mashhad': 'ir',
        'Isfahan': 'ir',
        'Tabriz': 'ir',
        'Basrah': 'iq',
        'Irbil': 'iq',
        'Aleppo': 'sy',
        'Yangon': 'mm',
        'Giza': 'eg',
        'Dar es Salaam': 'tz',
        'Almaty': 'kz',
        'Jeddah': 'sa',
        'Mecca': 'sa',
        'Nusantara': 'id',
        'Surabaya': 'id',
        'Bandung': 'id',
        'Medan': 'id',
        'Makassar': 'id',
        'Palembang': 'id',
        'Taipei': 'tw',
        'Kaohsiung': 'tw',
        'Taichung': 'tw',

        // American capitals and cities
        'Buenos Aires': 'ar',
        'La Paz': 'bo',
        'Brasília': 'br',
        'Santiago': 'cl',
        'Bogotá': 'co',
        'Quito': 'ec',
        'Caracas': 've',
        'Lima': 'pe',
        'Montevideo': 'uy',
        'Asunción': 'py',
        'Georgetown': 'gy',
        'Paramaribo': 'sr',
        'Mexico City': 'mx',
        'Ottawa': 'ca',
        'Washington D.C.': 'us',
        'San José': 'cr',
        'Guatemala City': 'gt',
        'Belmopan': 'bz',
        'Tegucigalpa': 'hn',
        'Managua': 'ni',
        'Panama City': 'pa',
        'Havana': 'cu',
        'Kingston': 'jm',
        'Port-au-Prince': 'ht',
        'Santo Domingo': 'do',
        'Nassau': 'bs',
        'Bridgetown': 'bb',
        'Port of Spain': 'tt',
        'Saint George\'s': 'gd',
        'Castries': 'lc',
        'Saint John\'s': 'ag',
        'Roseau': 'dm',
        'San Salvador': 'sv',
        'Basseterre': 'kn',
        'Kingstown': 'vc',
        'Sucre': 'bo',
        
        // Additional American cities
        'Los Angeles': 'us',
        'Chicago': 'us',
        'Houston': 'us',
        'Dallas': 'us',
        'Philadelphia': 'us',
        'Phoenix': 'us',
        'Atlanta': 'us',
        'Miami': 'us',
        'Tampa': 'us',
        'Orlando': 'us',
        'Boston': 'us',
        'Seattle': 'us',
        'San Francisco': 'us',
        'San Diego': 'us',
        'Las Vegas': 'us',
        'Denver': 'us',
        'Detroit': 'us',
        'Charlotte': 'us',
        'Minneapolis': 'us',
        'Indianapolis': 'us',
        'Kansas City': 'us',
        'Jacksonville': 'us',
        'Albuquerque': 'us',
        'Santa Fe': 'us',
        'San Jose': 'us',
        'Toronto': 'ca',
        'Montreal': 'ca',
        'Vancouver': 'ca',
        'Guadalajara': 'mx',
        'Tijuana': 'mx',
        'Puebla': 'mx',
        'Ecatepec': 'mx',
        'León': 'mx',
        'Belo Horizonte': 'br',
        'Salvador': 'br',
        'Fortaleza': 'br',
        'Manaus': 'br',
        'Curitiba': 'br',
        'Recife': 'br',
        'São Paulo': 'br',
        'Porto Alegre': 'br',
        'Medellín': 'co',
        'Cali': 'co',
        'Maracaibo': 've',
        'Barquisimeto': 've',
        'Guayaquil': 'ec',
        'Mendoza': 'ar',
        'Córdoba': 'ar',
        'Santa Cruz': 'bo',
        
        // Oceanian capitals and cities
        'Canberra': 'au',
        'Wellington': 'nz',
        'Suva': 'fj',
        'Port Moresby': 'pg',
        'Apia': 'ws',
        'Nuku\'alofa': 'to',
        'Funafuti': 'tv',
        'Port Vila': 'vu',
        'Port-Vila': 'vu',
        'Honiara': 'sb',
        'Majuro': 'mh',
        'South Tarawa': 'ki',
        'Yaren': 'nr',
        'Ngerulmud': 'pw',
        'Palikir': 'fm',
        
        // Additional Oceanian cities  
        'Brisbane': 'au',
        'Perth': 'au',
        
        // Additional African cities
        'Kano': 'ng',
        'Ibadan': 'ng',
        'Port Harcourt': 'ng',
        'Maiduguri': 'ng',
        'Omdurman': 'sd',
        'Antsirabe': 'mg',
        'Douala': 'cm',
        
        // Additional European cities
        'Zurich': 'ch',
        'Geneva': 'ch',
        'Lausanne': 'ch',
        'Hamburg': 'de',
        'Munich': 'de',
        'Cologne': 'de',
        'Frankfurt': 'de',
        'Stuttgart': 'de',
        'Düsseldorf': 'de',
        'Dortmund': 'de',
        'Essen': 'de',
        'Leipzig': 'de',
        'Milan': 'it',
        'Naples': 'it',
        'Turin': 'it',
        'Palermo': 'it',
        'Genoa': 'it',
        'Bologna': 'it',
        'Florence': 'it',
        'Bari': 'it',
        'Catania': 'it',
        'Barcelona': 'es',
        'Valencia': 'es',
        'Seville': 'es',
        'Zaragoza': 'es',
        'Málaga': 'es',
        'Murcia': 'es',
        'Palma': 'es',
        'Bilbao': 'es',
        'Alicante': 'es',
        
        // Missing US cities
        'Arlington': 'us',
        'Austin': 'us',
        'Baltimore': 'us',
        'Cleveland': 'us',
        'Colorado Springs': 'us',
        'Columbus': 'us',
        'El Paso': 'us',
        'Fort Worth': 'us',
        'Fresno': 'us',
        'Long Beach': 'us',
        'Louisville': 'us',
        'Memphis': 'us',
        'Mesa': 'us',
        'Milwaukee': 'us',
        'Nashville': 'us',
        'New Orleans': 'us',
        'Oakland': 'us',
        'Oklahoma City': 'us',
        'Omaha': 'us',
        'Portland': 'us',
        'Raleigh': 'us',
        'Sacramento': 'us',
        'San Antonio': 'us',
        'Tampa Bay': 'us',
        'Tucson': 'us',
        'Tulsa': 'us',
        'Virginia Beach': 'us',
        'Wichita': 'us',
        // Newly added cities only
        'Cotonou': 'bj',
        'Sfax': 'tn',
        'Sousse': 'tn',
        'Kumasi': 'gh',
        'Kananga': 'cd',
        'Kisangani': 'cd',
        'Butembo': 'cd',
        'Nakuru': 'ke',
        'Eldoret': 'ke',
        'Kisumu': 'ke',
        'Mbeya': 'tz',
        'Quelimane': 'mz',
        'Nampula': 'mz',
        'Beira': 'mz',
        'Bulawayo': 'zw',
        'Lubango': 'ao',
        'Benguela': 'ao',
        'Durban': 'za',
        'East London': 'za',
        'Gqeberha': 'za',
        'Gaza': 'ps',
        'Fez': 'ma',
        'Marrakech': 'ma',
        'Tangier': 'ma'
      };
      
      const countryCode = countryMapping[this.card.nom];
      if (countryCode) {
        // Cas spéciaux pour les drapeaux non-rectangulaires
        if (countryCode === 'ch' || countryCode === 'np') {
          // Utiliser une version rectangulaire alternative
          return `https://flagpedia.net/data/flags/w580/${countryCode}.webp`;
        }
        return `https://flagcdn.com/w40/${countryCode}.png`;
      }
    }
    return null;
  }
}