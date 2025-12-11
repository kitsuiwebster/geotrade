import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardComponent } from '../../components/card/card.component';
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
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, CardComponent],
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
  selectedRequestedCards: Card[] = [];
  exchangeMessage = '';
  
  users = ['GeoMaster', 'CardCollector', 'WorldExplorer', 'MapLover'];

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    // Cartes de l'utilisateur (même que My Cards)
    this.myCards = allCardsData.filter(card => 
      card.nom === 'France' || 
      card.nom === 'Matterhorn' || 
      card.nom === 'Ljubljana'
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
    this.selectedRequestedCards = [];
    this.exchangeMessage = '';
  }

  cancelNewExchange(): void {
    this.isCreatingExchange = false;
  }

  toggleOfferedCard(card: Card): void {
    const index = this.selectedOfferedCards.findIndex(c => c.nom === card.nom);
    if (index === -1) {
      this.selectedOfferedCards.push(card);
    } else {
      this.selectedOfferedCards.splice(index, 1);
    }
  }

  isCardOffered(card: Card): boolean {
    return this.selectedOfferedCards.some(c => c.nom === card.nom);
  }

  addRequestedCard(): void {
    // Mock: ajouter une carte random pour la demo
    const availableCards = allCardsData.filter(card => 
      !this.selectedRequestedCards.some(c => c.nom === card.nom)
    );
    if (availableCards.length > 0) {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      this.selectedRequestedCards.push(randomCard);
    }
  }

  removeRequestedCard(card: Card): void {
    const index = this.selectedRequestedCards.findIndex(c => c.nom === card.nom);
    if (index !== -1) {
      this.selectedRequestedCards.splice(index, 1);
    }
  }

  sendExchangeRequest(): void {
    if (this.selectedUser && this.selectedOfferedCards.length > 0 && this.selectedRequestedCards.length > 0) {
      const newRequest: ExchangeRequest = {
        id: Date.now(),
        fromUser: 'You',
        toUser: this.selectedUser,
        offeredCards: [...this.selectedOfferedCards],
        requestedCards: [...this.selectedRequestedCards],
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