import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardComponent } from '../../components/card/card.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Card } from '../../interfaces/card.interface';
import { allCardsData } from '../../data';

interface ExchangeRequest {
  id: number;
  fromUser: string;
  toUser: string;
  offeredCards: Card[];
  requestedCards: Card[];
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: Date;
}

@Component({
  selector: 'app-exchange',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, CardComponent, FooterComponent],
  templateUrl: './exchange.component.html',
  styleUrls: ['./exchange.component.scss']
})
export class ExchangeComponent implements OnInit {
  activeTab: 'incoming' | 'outgoing' | 'history' = 'incoming';
  
  // Mock données utilisateur
  myCards: Card[] = [];
  
  // Demandes d'échange
  incomingRequests: ExchangeRequest[] = [];
  outgoingRequests: ExchangeRequest[] = [];
  exchangeHistory: ExchangeRequest[] = [];
  
  // Nouvel échange
  isCreatingExchange = false;
  selectedUser = '';
  selectedOfferedCards: Card[] = [];
  exchangeMessage = '';
  
  // Recherche de cartes
  cardSearchTerm = '';
  showSuggestions = false;
  filteredCards: Card[] = [];
  
  users = ['GeoMaster', 'CardCollector', 'WorldExplorer', 'MapLover'];

  constructor(private route: ActivatedRoute) {
    // Fermer les suggestions quand on clique en dehors
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        this.showSuggestions = false;
      }
    });
  }

  ngOnInit(): void {
    this.loadMockData();
    this.handleQueryParams();
  }

  handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['friendId'] && params['friendName']) {
        // Switch to outgoing tab
        this.setActiveTab('outgoing');
        
        // Start creating a new exchange
        this.startNewExchange();
        
        // Preselect the friend
        this.selectedUser = params['friendName'];
      }
    });
  }

  loadMockData(): void {
    // Cartes de l'utilisateur (collection plus large)
    this.myCards = allCardsData.filter(card => 
      card.nom === 'France' || 
      card.nom === 'Matterhorn' || 
      card.nom === 'Ljubljana' ||
      card.nom === 'Spain' ||
      card.nom === 'Italy' ||
      card.nom === 'Germany' ||
      card.nom === 'Switzerland' ||
      card.nom === 'Austria' ||
      card.nom === 'Mont Blanc' ||
      card.nom === 'Danube' ||
      card.nom === 'Rhine' ||
      card.nom === 'Prague'
    );

    // Demandes reçues
    this.incomingRequests = [
      {
        id: 1,
        fromUser: 'GeoMaster',
        toUser: 'You',
        offeredCards: [allCardsData.find(c => c.nom === 'Spain')!],
        requestedCards: [allCardsData.find(c => c.nom === 'France')!],
        message: 'Hey! Would love to trade my Spain card for your France card. Both are European countries!',
        status: 'pending',
        createdAt: new Date('2024-12-10')
      },
      {
        id: 2,
        fromUser: 'CardCollector',
        toUser: 'You',
        offeredCards: [
          allCardsData.find(c => c.nom === 'Mount Everest')!,
          allCardsData.find(c => c.nom === 'K2')!
        ],
        requestedCards: [allCardsData.find(c => c.nom === 'Matterhorn')!],
        message: 'I have two 8000m+ peaks, would you trade your Matterhorn for both?',
        status: 'pending',
        createdAt: new Date('2024-12-09')
      }
    ];

    // Demandes envoyées
    this.outgoingRequests = [
      {
        id: 3,
        fromUser: 'You',
        toUser: 'WorldExplorer',
        offeredCards: [allCardsData.find(c => c.nom === 'Ljubljana')!],
        requestedCards: [allCardsData.find(c => c.nom === 'Prague')!],
        message: 'Trading Central European capitals!',
        status: 'pending',
        createdAt: new Date('2024-12-08')
      }
    ];

    // Historique
    this.exchangeHistory = [
      {
        id: 4,
        fromUser: 'You',
        toUser: 'MapLover',
        offeredCards: [allCardsData.find(c => c.nom === 'Amazon')!],
        requestedCards: [allCardsData.find(c => c.nom === 'Nile')!],
        message: 'River trade completed!',
        status: 'completed',
        createdAt: new Date('2024-12-05')
      }
    ];
  }

  setActiveTab(tab: 'incoming' | 'outgoing' | 'history'): void {
    this.activeTab = tab;
  }

  startNewExchange(): void {
    this.isCreatingExchange = true;
    this.selectedUser = '';
    this.selectedOfferedCards = [];
    this.exchangeMessage = '';
    this.cardSearchTerm = '';
    this.showSuggestions = false;
    this.filteredCards = [];
  }

  cancelNewExchange(): void {
    this.isCreatingExchange = false;
  }

  onSearchChange(): void {
    if (this.cardSearchTerm.trim().length === 0) {
      this.filteredCards = [];
      this.showSuggestions = false;
      return;
    }

    const searchTerm = this.cardSearchTerm.toLowerCase();
    this.filteredCards = this.myCards.filter(card =>
      card.nom.toLowerCase().includes(searchTerm) ||
      card.type.toLowerCase().includes(searchTerm)
    );
    this.showSuggestions = true;
  }

  selectCard(card: Card): void {
    this.selectedOfferedCards = [card];
    this.cardSearchTerm = card.nom;
    this.showSuggestions = false;
  }

  clearSelection(): void {
    this.selectedOfferedCards = [];
    this.cardSearchTerm = '';
    this.showSuggestions = false;
    this.filteredCards = [];
  }

  sendExchangeRequest(): void {
    if (this.selectedUser && this.selectedOfferedCards.length > 0) {
      const newRequest: ExchangeRequest = {
        id: Date.now(),
        fromUser: 'You',
        toUser: this.selectedUser,
        offeredCards: [...this.selectedOfferedCards],
        requestedCards: [], // L'autre joueur proposera ses cartes
        message: this.exchangeMessage,
        status: 'pending',
        createdAt: new Date()
      };
      
      this.outgoingRequests.unshift(newRequest);
      this.isCreatingExchange = false;
      this.setActiveTab('outgoing');
      alert(`Exchange request sent to ${this.selectedUser}!`);
    }
  }

  acceptRequest(request: ExchangeRequest): void {
    request.status = 'accepted';
    this.exchangeHistory.unshift({...request, status: 'completed'});
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
  }

  declineRequest(request: ExchangeRequest): void {
    request.status = 'declined';
    this.exchangeHistory.unshift({...request});
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
  }

  cancelRequest(request: ExchangeRequest): void {
    this.outgoingRequests = this.outgoingRequests.filter(r => r.id !== request.id);
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'pending': return '#f7931e';
      case 'accepted': return '#00c9a7';
      case 'declined': return '#ff6b35';
      case 'completed': return '#00c9a7';
      default: return '#fff';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'declined': return '❌';
      case 'completed': return '🎉';
      default: return '📋';
    }
  }
}