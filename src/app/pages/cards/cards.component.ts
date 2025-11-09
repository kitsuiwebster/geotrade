import { Component, OnInit, HostListener, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CardComponent } from '../../components/card/card.component';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { Card } from '../../interfaces/card.interface';
import { allCardsData } from '../../data';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CardComponent],
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss']
})
export class CardsComponent implements OnInit, AfterViewInit {
  allCards: Card[] = [];
  cards: Card[] = [];
  shuffledCards: Card[] = [];
  displayedCards: Card[] = [];
  filterType: string = '';
  isLoading: boolean = false;
  progress: number = 0;
  Math = Math;
  
  showFilters: boolean = false;
  searchTerm: string = '';
  isRealMode: boolean = false;
  
  // Infinite scroll properties
  private cardsPerLoad = 30;
  private currentIndex = 0;
  isLoadingMore = false;
  private containerElement?: HTMLElement;
  
  // Type filters
  typeFilters = [
    { value: 'Country', label: 'Countries', checked: false },
    { value: 'Territory', label: 'Territories', checked: false },
    { value: 'City', label: 'Cities', checked: false },
    { value: 'Mountain', label: 'Mountains', checked: false },
    { value: 'Desert', label: 'Deserts', checked: false },
    { value: 'Ocean', label: 'Oceans', checked: false },
    { value: 'Sea', label: 'Seas', checked: false },
    { value: 'Lake', label: 'Lakes', checked: false },
    { value: 'River', label: 'Rivers', checked: false },
    { value: 'Island', label: 'Islands', checked: false },
    { value: 'Archipelago', label: 'Archipelagos', checked: false }
  ];
  
  // Continent filters
  continentFilters = [
    { value: 'Europe', label: 'Europe', checked: false },
    { value: 'Asia', label: 'Asia', checked: false },
    { value: 'Africa', label: 'Africa', checked: false },
    { value: 'North America', label: 'North America', checked: false },
    { value: 'Central America', label: 'Central America', checked: false },
    { value: 'South America', label: 'South America', checked: false },
    { value: 'Oceania', label: 'Oceania', checked: false },
    { value: 'Antarctica', label: 'Antarctica', checked: false }
  ];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.loadCards();
    // Charger les filtres depuis l'URL, puis appliquer les filtres
    this.activatedRoute.queryParams.subscribe(params => {
      this.loadFiltersFromParams(params);
      this.shuffleAndFilter();
      this.resetAndLoadCards();
    });
  }

  resetAndLoadCards() {
    this.currentIndex = 0;
    this.displayedCards = [];
    this.loadInitialCards();
  }

  ngAfterViewInit() {
    // Attendre que la vue soit initialisée pour trouver le container
    setTimeout(() => {
      this.containerElement = document.querySelector('.all-cards-container') as HTMLElement;
      if (this.containerElement) {
        this.containerElement.addEventListener('scroll', () => this.onContainerScroll());
      }
    }, 100);
  }

  onContainerScroll() {
    if (!this.containerElement) return;
    
    if (this.isLoadingMore || this.currentIndex >= this.shuffledCards.length) return;

    const scrollTop = this.containerElement.scrollTop;
    const scrollHeight = this.containerElement.scrollHeight;
    const clientHeight = this.containerElement.clientHeight;
    const scrollPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;


    if (scrollPercentage >= 80) {
      this.loadMoreCards();
    }
  }

  @HostListener('window:scroll', ['$event'])
  @HostListener('document:scroll', ['$event'])
  onScroll(event?: any) {
    this.checkScrollOnWindow();
  }

  private checkScrollOnElement(element: HTMLElement) {
    if (this.isLoadingMore || this.currentIndex >= this.shuffledCards.length) return;

    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    const scrollPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;


    if (scrollPercentage >= 80) {
      this.loadMoreCards();
    }
  }

  private checkScrollOnWindow() {
    if (this.isLoadingMore || this.currentIndex >= this.shuffledCards.length) return;

    // Essayer différentes méthodes pour détecter le scroll
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    const clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    const scrollPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;


    // Charger plus quand on est à 80% du scroll
    if (scrollPercentage >= 80) {
      this.loadMoreCards();
    }
  }

  private loadInitialCards() {
    this.currentIndex = 0;
    this.displayedCards = [];
    this.loadMoreCards();
  }

  private loadMoreCards() {
    if (this.isLoadingMore || this.currentIndex >= this.shuffledCards.length) return;
    
    this.isLoadingMore = true;
    
    // Simuler un petit délai pour le loading
    setTimeout(() => {
      const nextCards = this.shuffledCards.slice(this.currentIndex, this.currentIndex + this.cardsPerLoad);
      this.displayedCards = [...this.displayedCards, ...nextCards];
      this.currentIndex += this.cardsPerLoad;
      this.isLoadingMore = false;
    }, 300);
  }

  loadCards() {
    this.allCards = allCardsData;
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  toggleDisplayMode() {
    this.isRealMode = !this.isRealMode;
    if (this.isRealMode) {
      document.body.classList.add('export-mode');
    } else {
      document.body.classList.remove('export-mode');
    }
  }

  applyFilters() {
    this.updateUrl();
    this.shuffleAndFilter();
    this.resetAndLoadCards();
  }

  clearAllFilters() {
    this.typeFilters.forEach(filter => filter.checked = false);
    this.continentFilters.forEach(filter => filter.checked = false);
    this.searchTerm = '';
    this.updateUrl();
    this.shuffleAndFilter();
    this.resetAndLoadCards();
  }

  loadFiltersFromParams(params: any) {
    // Réinitialiser les filtres
    this.typeFilters.forEach(filter => filter.checked = false);
    this.continentFilters.forEach(filter => filter.checked = false);
    this.searchTerm = '';
    
    // Charger les types sélectionnés
    if (params['types']) {
      const selectedTypes = params['types'].split(',');
      this.typeFilters.forEach(filter => {
        filter.checked = selectedTypes.includes(filter.value);
      });
    }
    
    // Charger les continents sélectionnés
    if (params['continents']) {
      const selectedContinents = params['continents'].split(',');
      this.continentFilters.forEach(filter => {
        filter.checked = selectedContinents.includes(filter.value);
      });
    }
    
    // Charger le terme de recherche
    if (params['search']) {
      this.searchTerm = params['search'];
    }
  }

  updateUrl() {
    const queryParams: any = {};
    
    // Ajouter les types sélectionnés
    const selectedTypes = this.typeFilters.filter(f => f.checked).map(f => f.value);
    if (selectedTypes.length > 0) {
      queryParams['types'] = selectedTypes.join(',');
    }
    
    // Ajouter les continents sélectionnés
    const selectedContinents = this.continentFilters.filter(f => f.checked).map(f => f.value);
    if (selectedContinents.length > 0) {
      queryParams['continents'] = selectedContinents.join(',');
    }
    
    // Ajouter le terme de recherche
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      queryParams['search'] = this.searchTerm.trim();
    }
    
    // Mettre à jour l'URL sans recharger la page
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams,
      replaceUrl: true
    });
  }

  shuffleAndFilter() {
    let filtered = [...this.allCards];
    
    // Filtre par recherche textuelle
    if (this.searchTerm && this.searchTerm.trim() !== '') {
      const searchTermLower = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter(card => this.matchesSearch(card, searchTermLower));
    }
    
    // Filtre par type
    const selectedTypes = this.typeFilters.filter(f => f.checked).map(f => f.value);
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(card => selectedTypes.includes(card.type));
    }
    
    // Filtre par continent
    const selectedContinents = this.continentFilters.filter(f => f.checked).map(f => f.value);
    if (selectedContinents.length > 0) {
      filtered = filtered.filter(card => {
        // Si la carte a une propriété continent, l'utiliser, sinon vérifier dans localisation
        if (card.continent) {
          return selectedContinents.includes(card.continent);
        } else {
          return selectedContinents.some(continent => 
            card.localisation.includes(continent)
          );
        }
      });
    }
    
    this.shuffledCards = this.shuffleArray(filtered);
    this.loadInitialCards(); // Recharger l'affichage avec les nouvelles cartes filtrées
  }

  private matchesSearch(card: Card, searchTerm: string): boolean {
    // Recherche dans toutes les propriétés textuelles de la carte
    const searchableFields = [
      card.nom,
      card.localisation,
      card.type,
      card.continent,
      card.height,
      card.area,
      card.population,
      card.agglomeration,
      card.depth,
      card.length
    ];
    
    return searchableFields.some(field => 
      field && field.toLowerCase().includes(searchTerm)
    );
  }

  shuffleArray(array: Card[]): Card[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async downloadAllCards() {
    if (this.shuffledCards.length === 0) {
      alert('No cards to download. Please adjust your filters.');
      return;
    }

    this.isLoading = true;
    this.progress = 0;
    const zip = new JSZip();
    const totalCards = this.shuffledCards.length;
    
    // Ajouter la classe export-mode pour les bordures colorées
    document.body.classList.add('export-mode');
    
    // Attendre que les styles soient appliqués
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      for (const [index, card] of this.shuffledCards.entries()) {
        const cardElement = document.getElementById(`card-${card.nom}`);
        if (!cardElement) {
          console.warn(`Card element not found for: ${card.nom}`);
          continue;
        }
        
        // S'assurer que l'image est chargée avant le screenshot
        const imgElement = cardElement.querySelector('img.card-image') as HTMLImageElement;
        if (imgElement && !imgElement.complete) {
          await new Promise((resolve) => {
            imgElement.onload = resolve;
            imgElement.onerror = resolve;
          });
        }
        
        // Attendre que le DOM soit prêt
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        const scale = 1920 / 190; // Échelle pour une haute résolution
        const canvas = await html2canvas(cardElement, {
          scale: scale,
          useCORS: true,
          backgroundColor: null,
          logging: false
        });
        
        const roundedCanvas = this.applyRoundedCorners(canvas, scale);
        const imgData = roundedCanvas.toDataURL("image/png");
        
        // Nettoyer le nom pour éviter les caractères problématiques
        const sanitizedName = card.nom.replace(/[^a-zA-Z0-9\-_]/g, '_');
        zip.file(`${sanitizedName}.png`, imgData.split('base64,')[1], { base64: true });
        
        this.progress = ((index + 1) / totalCards) * 100;
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      
      // Nom du fichier basé sur les filtres actifs
      const activeFilters = [
        ...this.typeFilters.filter(f => f.checked).map(f => f.label),
        ...this.continentFilters.filter(f => f.checked).map(f => f.label)
      ];
      const fileName = activeFilters.length > 0 
        ? `cartes_${activeFilters.join('_').replace(/\s+/g, '_')}.zip`
        : 'toutes_les_cartes.zip';
      
      link.download = fileName;
      link.click();
      
      // Nettoyer l'URL
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error during zip generation:', error);
      alert('Download error. Please try again.');
    } finally {
      // Retirer la classe export-mode
      document.body.classList.remove('export-mode');
      this.isLoading = false;
    }
  }

  private applyRoundedCorners(canvas: HTMLCanvasElement, scale: number): HTMLCanvasElement {
    const width = canvas.width;
    const height = canvas.height;
    const radius = 12 * scale;

    const roundedCanvas = document.createElement('canvas');
    roundedCanvas.width = width;
    roundedCanvas.height = height;
    const roundedCtx = roundedCanvas.getContext('2d');

    if (!roundedCtx) return canvas;

    roundedCtx.beginPath();
    roundedCtx.moveTo(radius, 0);
    roundedCtx.lineTo(width - radius, 0);
    roundedCtx.quadraticCurveTo(width, 0, width, radius);
    roundedCtx.lineTo(width, height - radius);
    roundedCtx.quadraticCurveTo(width, height, width - radius, height);
    roundedCtx.lineTo(radius, height);
    roundedCtx.quadraticCurveTo(0, height, 0, height - radius);
    roundedCtx.lineTo(0, radius);
    roundedCtx.quadraticCurveTo(0, 0, radius, 0);
    roundedCtx.closePath();
    roundedCtx.clip();
    roundedCtx.drawImage(canvas, 0, 0);

    return roundedCanvas;
  }
}