import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardComponent } from '../../components/card/card.component';
import { Card } from '../../interfaces/card.interface';
import { allCardsData } from '../../data';

interface MarketOffer {
  id: number;
  seller: string;
  cardOffered: Card;
  cardsWanted: Card[];
  description: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

interface MarketRequest {
  id: number;
  buyer: string;
  cardWanted: Card;
  cardsOffered: Card[];
  description: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

interface TradeProposal {
  requestId: number;
  proposer: string;
  offeredCard: Card;
  message: string;
  createdAt: Date;
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, CardComponent],
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss']
})
export class MarketComponent implements OnInit {
  activeTab: 'offers' | 'requests' | 'mylistings' = 'offers';
  
  // Mock data
  myCards: Card[] = [];
  marketOffers: MarketOffer[] = [];
  marketRequests: MarketRequest[] = [];
  myOffers: MarketOffer[] = [];
  myRequests: MarketRequest[] = [];
  tradeProposals: TradeProposal[] = [];
  
  // Formulaires
  isCreatingOffer = false;
  isCreatingRequest = false;
  
  // Formulaire d'offre
  selectedOfferCard: Card | null = null;
  offerWantedCards: Card[] = [];
  offerDescription = '';
  
  // Formulaire de demande
  selectedRequestCard: Card | null = null;
  requestOfferedCards: Card[] = [];
  requestDescription = '';
  
  // Filtres
  searchTerm = '';
  selectedType = 'All';
  selectedContinent = 'All';
  
  cardTypes = ['All', 'Country', 'Mountain', 'River', 'Lake', 'City', 'Sea', 'Ocean', 'Desert', 'Island'];
  continents = ['All', 'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];

  ngOnInit(): void {
    this.loadMockData();
  }

  loadMockData(): void {
    // Cartes de l'utilisateur
    this.myCards = allCardsData.filter(card => 
      card.nom === 'France' || 
      card.nom === 'Matterhorn' || 
      card.nom === 'Ljubljana'
    );

    // Offres du marché
    this.marketOffers = [
      {
        id: 1,
        seller: 'GeoMaster',
        cardOffered: allCardsData.find(c => c.nom === 'Spain')!,
        cardsWanted: [
          allCardsData.find(c => c.nom === 'Portugal')!,
          allCardsData.find(c => c.nom === 'Italy')!
        ],
        description: 'Trading my Spain card for neighboring countries. Open to negotiations!',
        createdAt: new Date('2024-12-10'),
        status: 'active'
      },
      {
        id: 2,
        seller: 'CardCollector',
        cardOffered: allCardsData.find(c => c.nom === 'Mount Everest')!,
        cardsWanted: [
          allCardsData.find(c => c.nom === 'K2')!,
          allCardsData.find(c => c.nom === 'Kangchenjunga')!,
          allCardsData.find(c => c.nom === 'Lhotse')!
        ],
        description: 'Looking to trade my Everest for other 8000m+ peaks. Building a collection!',
        createdAt: new Date('2024-12-09'),
        status: 'active'
      },
      {
        id: 3,
        seller: 'WorldExplorer',
        cardOffered: allCardsData.find(c => c.nom === 'Amazon')!,
        cardsWanted: [
          allCardsData.find(c => c.nom === 'Nile')!,
          allCardsData.find(c => c.nom === 'Yangtze')!
        ],
        description: 'Amazon river for other major world rivers',
        createdAt: new Date('2024-12-08'),
        status: 'active'
      }
    ];

    // Demandes du marché
    this.marketRequests = [
      {
        id: 1,
        buyer: 'MapLover',
        cardWanted: allCardsData.find(c => c.nom === 'France')!,
        cardsOffered: [
          allCardsData.find(c => c.nom === 'Germany')!,
          allCardsData.find(c => c.nom === 'Belgium')!,
          allCardsData.find(c => c.nom === 'Switzerland')!
        ],
        description: 'Need France to complete my Western Europe collection! Offering neighbors.',
        createdAt: new Date('2024-12-11'),
        status: 'active'
      },
      {
        id: 2,
        buyer: 'PeakHunter',
        cardWanted: allCardsData.find(c => c.nom === 'Matterhorn')!,
        cardsOffered: [
          allCardsData.find(c => c.nom === 'Mont Blanc')!,
          allCardsData.find(c => c.nom === 'Dufourspitze')!
        ],
        description: 'Looking for the iconic Matterhorn! Have Alpine peaks to trade.',
        createdAt: new Date('2024-12-10'),
        status: 'active'
      },
      {
        id: 3,
        buyer: 'CityCollector',
        cardWanted: allCardsData.find(c => c.nom === 'Ljubljana')!,
        cardsOffered: [
          allCardsData.find(c => c.nom === 'Prague')!,
          allCardsData.find(c => c.nom === 'Vienna')!,
          allCardsData.find(c => c.nom === 'Budapest')!
        ],
        description: 'Need Ljubljana for my Central European capitals set!',
        createdAt: new Date('2024-12-09'),
        status: 'active'
      }
    ];

    // Mes offres/demandes (vides pour l'instant)
    this.myOffers = [];
    this.myRequests = [];
  }

  setActiveTab(tab: 'offers' | 'requests' | 'mylistings'): void {
    this.activeTab = tab;
  }

  get filteredOffers(): MarketOffer[] {
    return this.marketOffers.filter(offer => {
      const matchesSearch = !this.searchTerm || 
        offer.cardOffered.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        offer.cardsWanted.some(card => card.nom.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesType = this.selectedType === 'All' || 
        offer.cardOffered.type === this.selectedType ||
        offer.cardsWanted.some(card => card.type === this.selectedType);
      
      const matchesContinent = this.selectedContinent === 'All' || 
        offer.cardOffered.continent === this.selectedContinent ||
        offer.cardsWanted.some(card => card.continent === this.selectedContinent);
      
      return matchesSearch && matchesType && matchesContinent;
    });
  }

  get filteredRequests(): MarketRequest[] {
    return this.marketRequests.filter(request => {
      const matchesSearch = !this.searchTerm || 
        request.cardWanted.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        request.cardsOffered.some(card => card.nom.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      const matchesType = this.selectedType === 'All' || 
        request.cardWanted.type === this.selectedType ||
        request.cardsOffered.some(card => card.type === this.selectedType);
      
      const matchesContinent = this.selectedContinent === 'All' || 
        request.cardWanted.continent === this.selectedContinent ||
        request.cardsOffered.some(card => card.continent === this.selectedContinent);
      
      return matchesSearch && matchesType && matchesContinent;
    });
  }

  // Gestion des offres
  startNewOffer(): void {
    this.isCreatingOffer = true;
    this.selectedOfferCard = null;
    this.offerWantedCards = [];
    this.offerDescription = '';
  }

  cancelNewOffer(): void {
    this.isCreatingOffer = false;
  }

  selectOfferCard(card: Card): void {
    this.selectedOfferCard = card;
  }

  addWantedCard(): void {
    // Mock: ajouter une carte random
    const availableCards = allCardsData.filter(card => 
      !this.offerWantedCards.some(c => c.nom === card.nom) &&
      card.nom !== this.selectedOfferCard?.nom
    );
    if (availableCards.length > 0) {
      const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
      this.offerWantedCards.push(randomCard);
    }
  }

  removeWantedCard(card: Card): void {
    this.offerWantedCards = this.offerWantedCards.filter(c => c.nom !== card.nom);
  }

  createOffer(): void {
    if (this.selectedOfferCard && this.offerWantedCards.length > 0) {
      const newOffer: MarketOffer = {
        id: Date.now(),
        seller: 'You',
        cardOffered: this.selectedOfferCard,
        cardsWanted: [...this.offerWantedCards],
        description: this.offerDescription,
        createdAt: new Date(),
        status: 'active'
      };
      
      this.myOffers.unshift(newOffer);
      this.isCreatingOffer = false;
      this.setActiveTab('mylistings');
    }
  }

  // Gestion des demandes
  startNewRequest(): void {
    this.isCreatingRequest = true;
    this.selectedRequestCard = null;
    this.requestOfferedCards = [];
    this.requestDescription = '';
  }

  cancelNewRequest(): void {
    this.isCreatingRequest = false;
  }

  selectRequestCard(): void {
    // Mock: sélectionner une carte random
    const randomCard = allCardsData[Math.floor(Math.random() * allCardsData.length)];
    this.selectedRequestCard = randomCard;
  }

  addOfferedCard(card: Card): void {
    if (!this.requestOfferedCards.some(c => c.nom === card.nom)) {
      this.requestOfferedCards.push(card);
    }
  }

  removeOfferedCard(card: Card): void {
    this.requestOfferedCards = this.requestOfferedCards.filter(c => c.nom !== card.nom);
  }

  createRequest(): void {
    if (this.selectedRequestCard && this.requestOfferedCards.length > 0) {
      const newRequest: MarketRequest = {
        id: Date.now(),
        buyer: 'You',
        cardWanted: this.selectedRequestCard,
        cardsOffered: [...this.requestOfferedCards],
        description: this.requestDescription,
        createdAt: new Date(),
        status: 'active'
      };
      
      this.myRequests.unshift(newRequest);
      this.isCreatingRequest = false;
      this.setActiveTab('mylistings');
    }
  }

  // Actions du marché
  proposeToOffer(offer: MarketOffer, wantedCard: Card): void {
    console.log('Proposing', wantedCard.nom, 'for', offer.cardOffered.nom);
    // Mock trade proposal
    alert(`Trade proposal sent! You offered ${wantedCard.nom} for ${offer.cardOffered.nom}`);
  }

  acceptRequest(request: MarketRequest, offeredCard: Card): void {
    console.log('Accepting request:', request.cardWanted.nom, 'for', offeredCard.nom);
    // Mock auto-trade
    if (this.myCards.some(card => card.nom === request.cardWanted.nom)) {
      alert(`Trade completed! You gave ${request.cardWanted.nom} and received ${offeredCard.nom}`);
      request.status = 'completed';
    } else {
      alert('You don\'t have this card in your collection!');
    }
  }

  cancelListing(id: number, type: 'offer' | 'request'): void {
    if (type === 'offer') {
      this.myOffers = this.myOffers.filter(o => o.id !== id);
    } else {
      this.myRequests = this.myRequests.filter(r => r.id !== id);
    }
  }

  canProposeCard(offer: MarketOffer, card: Card): boolean {
    return offer.cardsWanted.some(wanted => wanted.nom === card.nom);
  }

  hasCardForRequest(request: MarketRequest): boolean {
    return this.myCards.some(card => card.nom === request.cardWanted.nom);
  }

  isCardInOfferedCards(card: Card): boolean {
    return this.requestOfferedCards.some(c => c.nom === card.nom);
  }

  hasCard(card: Card): boolean {
    return this.myCards.some(c => c.nom === card.nom);
  }
}