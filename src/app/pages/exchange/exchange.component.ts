import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardComponent } from '../../components/card/card.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Card } from '../../interfaces/card.interface';

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

  myCards: Card[] = [];

  incomingRequests: ExchangeRequest[] = [];
  outgoingRequests: ExchangeRequest[] = [];
  exchangeHistory: ExchangeRequest[] = [];

  isCreatingExchange = false;
  selectedUser = '';
  selectedOfferedCards: Card[] = [];
  exchangeMessage = '';

  cardSearchTerm = '';
  showSuggestions = false;
  filteredCards: Card[] = [];

  users: string[] = [];

  constructor(private route: ActivatedRoute) {
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        this.showSuggestions = false;
      }
    });
  }

  ngOnInit(): void {
    this.handleQueryParams();
  }

  handleQueryParams(): void {
    this.route.queryParams.subscribe(params => {
      if (params['friendId'] && params['friendName']) {
        this.setActiveTab('outgoing');
        this.startNewExchange();
        this.selectedUser = params['friendName'];
      }
    });
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
        requestedCards: [],
        message: this.exchangeMessage,
        status: 'pending',
        createdAt: new Date()
      };

      this.outgoingRequests.unshift(newRequest);
      this.isCreatingExchange = false;
      this.setActiveTab('outgoing');
    }
  }

  acceptRequest(request: ExchangeRequest): void {
    request.status = 'accepted';
    this.exchangeHistory.unshift({ ...request, status: 'completed' });
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
  }

  declineRequest(request: ExchangeRequest): void {
    request.status = 'declined';
    this.exchangeHistory.unshift({ ...request });
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
  }

  cancelRequest(request: ExchangeRequest): void {
    this.outgoingRequests = this.outgoingRequests.filter(r => r.id !== request.id);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#e0b478';
      case 'accepted': return '#a8d97a';
      case 'declined': return '#d66a5a';
      case 'completed': return '#a8d97a';
      default: return '#d4b98a';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'accepted': return '✅';
      case 'declined': return '❌';
      case 'completed': return '🎉';
      default: return '📋';
    }
  }
}
