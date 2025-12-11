import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CardComponent } from '../../components/card/card.component';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { Card } from '../../interfaces/card.interface';
import { allCardsData } from '../../data';

@Component({
  selector: 'app-my-cards',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CardComponent, NavbarComponent],
  templateUrl: './my-cards.component.html',
  styleUrls: ['./my-cards.component.scss']
})
export class MyCardsComponent implements OnInit {
  userCards: Card[] = [];
  displayedCards: Card[] = [];
  
  // Filtres et recherche
  searchTerm = '';
  showFilters = false;
  isRealMode = false;
  
  typeFilters = [
    { label: 'Countries', value: 'Country', checked: true },
    { label: 'Territories', value: 'Territory', checked: true },
    { label: 'Mountains', value: 'Mountain', checked: true },
    { label: 'Cities', value: 'City', checked: true },
    { label: 'Rivers', value: 'River', checked: true },
    { label: 'Islands', value: 'Island', checked: true },
    { label: 'Archipelagos', value: 'Archipelago', checked: true },
    { label: 'Lakes', value: 'Lake', checked: true },
    { label: 'Seas', value: 'Sea', checked: true },
    { label: 'Deserts', value: 'Desert', checked: true },
    { label: 'Oceans', value: 'Ocean', checked: true }
  ];
  
  continentFilters = [
    { label: 'Europe', value: 'Europe', checked: true },
    { label: 'Asia', value: 'Asia', checked: true },
    { label: 'Africa', value: 'Africa', checked: true },
    { label: 'South America', value: 'South America', checked: true },
    { label: 'Global', value: 'Global', checked: true },
    { label: 'All Others', value: 'Others', checked: true }
  ];

  ngOnInit(): void {
    // Vérifier si le Real Mode est déjà actif
    this.isRealMode = document.body.classList.contains('export-mode');
    
    // Sélectionner une carte de chaque type pour la collection de l'utilisateur
    this.userCards = allCardsData.filter(card => 
      card.nom === 'France' ||                                    // Country
      card.nom === 'Puerto Rico' ||                               // Territory
      card.nom === 'Matterhorn' ||                                // Mountain
      card.nom === 'Ljubljana' ||                                 // City
      card.nom === 'Amazon' ||                                    // River
      (card.nom === 'Hokkaido' && card.type === 'Island') ||      // Island
      card.nom === 'Azores' ||                                    // Archipelago
      card.nom === 'Lake Baikal' ||                               // Lake
      card.nom === 'Mediterranean' ||                             // Sea
      card.nom === 'Sahara' ||                                    // Desert
      card.nom === 'Pacific'                                      // Ocean
    );
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
    
    // Recherche par terme
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(card =>
        card.nom.toLowerCase().includes(searchLower) ||
        card.type.toLowerCase().includes(searchLower) ||
        (card.continent && card.continent.toLowerCase().includes(searchLower))
      );
    }
    
    // Filtres par type
    const activeTypes = this.typeFilters.filter(f => f.checked).map(f => f.value);
    if (activeTypes.length > 0 && activeTypes.length < this.typeFilters.length) {
      filtered = filtered.filter(card => activeTypes.includes(card.type));
    }
    
    // Filtres par continent
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
    this.typeFilters.forEach(filter => filter.checked = true);
    this.continentFilters.forEach(filter => filter.checked = true);
    this.applyFilters();
  }
}