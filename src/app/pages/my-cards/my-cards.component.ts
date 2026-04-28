import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../components/card/card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Card } from '../../interfaces/card.interface';
import { allCardsData } from '../../data';
import { SupabaseService } from '../../services/supabase.service';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

@Component({
  selector: 'app-my-cards',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, NavbarComponent, FooterComponent],
  templateUrl: './my-cards.component.html',
  styleUrls: ['./my-cards.component.scss']
})
export class MyCardsComponent implements OnInit {
  constructor(private supabaseService: SupabaseService) {}
  userCards: Card[] = [];
  displayedCards: Card[] = [];
  
  // Filters and search
  searchTerm = '';
  showFilters = false;
  isRealMode = false;
  isLoading = false;
  progress = 0;
  Math = Math;
  
  typeFilters = [
    { value: 'Country', label: 'Countries', checked: false },
    { value: 'Territory', label: 'Territories', checked: false },
    { value: 'Mountain', label: 'Mountains', checked: false },
    { value: 'City', label: 'Cities', checked: false },
    { value: 'River', label: 'Rivers', checked: false },
    { value: 'Island', label: 'Islands', checked: false },
    { value: 'Archipelago', label: 'Archipelagos', checked: false },
    { value: 'Lake', label: 'Lakes', checked: false },
    { value: 'Sea', label: 'Seas', checked: false },
    { value: 'Desert', label: 'Deserts', checked: false },
    { value: 'Ocean', label: 'Oceans', checked: false }
  ];
  
  continentFilters = [
    { value: 'Europe', label: 'Europe', checked: false },
    { value: 'Asia', label: 'Asia', checked: false },
    { value: 'Africa', label: 'Africa', checked: false },
    { value: 'South America', label: 'South America', checked: false },
    { value: 'Global', label: 'Global', checked: false },
    { value: 'Others', label: 'All Others', checked: false }
  ];

  async ngOnInit() {
    this.isRealMode = document.body.classList.contains('export-mode');

    const cardIds = await this.supabaseService.getUserCardIds(
      this.supabaseService.currentUser?.id ?? ''
    );
    this.userCards = cardIds.length > 0
      ? allCardsData.filter(card => cardIds.includes(card.nom))
      : [];

    this.applyFilters();
  }
  
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  toggleDisplayMode(): void {
    this.isRealMode = !this.isRealMode;
    if (this.isRealMode) {
      document.body.classList.add('export-mode');
    } else {
      document.body.classList.remove('export-mode');
    }
  }
  
  applyFilters(): void {
    let filtered = this.userCards;
    
    // Search by term
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(card =>
        card.nom.toLowerCase().includes(searchLower) ||
        card.type.toLowerCase().includes(searchLower) ||
        (card.continent && card.continent.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by type
    const activeTypes = this.typeFilters.filter(f => f.checked).map(f => f.value);
    if (activeTypes.length > 0 && activeTypes.length < this.typeFilters.length) {
      filtered = filtered.filter(card => activeTypes.includes(card.type));
    }
    
    // Filter by continent
    const activeContinents = this.continentFilters.filter(f => f.checked).map(f => f.value);
    if (activeContinents.length > 0 && activeContinents.length < this.continentFilters.length) {
      filtered = filtered.filter(card => {
        if (!card.continent) return activeContinents.includes('Others');
        return activeContinents.includes(card.continent) || activeContinents.includes('Others');
      });
    }
    
    this.displayedCards = filtered;
  }
  
  clearAllFilters(): void {
    this.searchTerm = '';
    this.typeFilters.forEach(filter => filter.checked = false);
    this.continentFilters.forEach(filter => filter.checked = false);
    this.applyFilters();
  }

  async downloadAllCards() {
    if (this.displayedCards.length === 0) {
      alert('No cards to download. Please adjust your filters.');
      return;
    }

    this.isLoading = true;
    this.progress = 0;
    const zip = new JSZip();
    const totalCards = this.displayedCards.length;
    
    // Add export-mode class for colored borders
    document.body.classList.add('export-mode');
    
    // Wait for styles to be applied
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      for (const [index, card] of this.displayedCards.entries()) {
        const cardElement = document.getElementById(`card-${card.nom}`);
        if (!cardElement) {
          console.warn(`Card element not found for: ${card.nom}`);
          continue;
        }
        
        // Ensure image is loaded before screenshot
        const imgElement = cardElement.querySelector('img.card-image') as HTMLImageElement;
        if (imgElement && !imgElement.complete) {
          await new Promise((resolve) => {
            imgElement.onload = resolve;
            imgElement.onerror = resolve;
          });
        }

        const scale = 2;
        const canvas = await html2canvas(cardElement, {
          scale: scale,
          backgroundColor: null,
          useCORS: true,
          allowTaint: true,
          logging: false
        });

        const roundedCanvas = this.applyRoundedCorners(canvas, scale);
        const imgData = roundedCanvas.toDataURL("image/png");
        
        // Clean name to avoid problematic characters
        const sanitizedName = card.nom.replace(/[^a-zA-Z0-9\-_]/g, '_');
        zip.file(`${sanitizedName}.png`, imgData.split('base64,')[1], { base64: true });
        
        this.progress = ((index + 1) / totalCards) * 100;
      }
      
      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      
      // File name for my collection
      link.download = 'my_collection.zip';
      link.click();
      
      // Clean up URL
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error during zip generation:', error);
      alert('Download error. Please try again.');
    } finally {
      // Remove export-mode class
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