import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { CardComponent } from '../../components/card/card.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { Card } from '../../interfaces/card.interface';
import { allCardsData } from '../../data';

interface MarketOffer {
  id: number;
  seller: string;
  sellerId: string;
  cardOffered: Card;
  cardsWanted: Card[];
  description: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

interface MarketRequest {
  id: number;
  buyer: string;
  buyerId: string;
  cardWanted: Card;
  cardsOffered: Card[];
  description: string;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-market',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, CardComponent, FooterComponent],
  templateUrl: './market.component.html',
  styleUrls: ['./market.component.scss']
})
export class MarketComponent implements OnInit {
  activeTab: 'offers' | 'requests' | 'mylistings' = 'offers';

  myCards: Card[] = [];
  marketOffers: MarketOffer[] = [];
  marketRequests: MarketRequest[] = [];
  myOffers: MarketOffer[] = [];
  myRequests: MarketRequest[] = [];

  isCreatingOffer = false;
  isCreatingRequest = false;

  selectedOfferCard: Card | null = null;
  offerWantedCards: Card[] = [];
  offerDescription = '';

  selectedRequestCard: Card | null = null;
  requestOfferedCards: Card[] = [];
  requestDescription = '';

  searchTerm = '';
  selectedType = 'All';
  selectedContinent = 'All';

  cardTypes = ['All', 'Country', 'Mountain', 'River', 'Lake', 'City', 'Sea', 'Ocean', 'Desert', 'Island'];
  continents = ['All', 'Europe', 'Asia', 'North America', 'South America', 'Africa', 'Oceania'];

  ngOnInit(): void {}

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
        sellerId: 'currentUser',
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
        buyerId: 'currentUser',
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

  proposeToOffer(_offer: MarketOffer, _wantedCard: Card): void {}

  acceptRequest(request: MarketRequest, _offeredCard: Card): void {
    if (this.myCards.some(card => card.nom === request.cardWanted.nom)) {
      request.status = 'completed';
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

  openUserProfile(userId: string): void {
    window.open(`/user/${userId}`, '_blank');
  }
}
