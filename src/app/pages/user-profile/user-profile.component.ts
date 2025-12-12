import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CardComponent } from '../../components/card/card.component';
import { Card } from '../../interfaces/card.interface';
import { allCardsData } from '../../data';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, CardComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  userId: string = '';
  user: any = {};

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.loadUserProfile();
  }

  loadUserProfile() {
    // Mock favorite cards
    const favoriteCards = [
      allCardsData.find(c => c.nom === 'France') || allCardsData[0],
      allCardsData.find(c => c.nom === 'Mount Everest') || allCardsData[1],
      allCardsData.find(c => c.nom === 'Amazon') || allCardsData[2]
    ];

    this.user = {
      id: this.userId,
      username: `user${this.userId}`,
      displayName: `User ${this.userId}`,
      email: `user${this.userId}@geotrade.com`,
      avatar: 'assets/images/pp_default.jpg',
      country: 'Spain',
      city: 'Madrid',
      joinDate: new Date('2024-01-15'),
      coverImage: 'assets/images/default-cover.jpg',
      favoriteCards: favoriteCards,
      stats: {
        totalCards: 89,
        quizzesCompleted: 15,
        exchangesCompleted: 23,
        marketDealsCompleted: 7,
        friendsCount: 34,
        achievementsCount: 8
      },
      achievements: [
        {
          id: 1,
          title: 'First Steps',
          description: 'Complete your first quiz',
          icon: '🎯',
          unlocked: true,
          unlockedAt: new Date('2024-02-01')
        },
        {
          id: 2,
          title: 'Collector',
          description: 'Collect 50 unique cards',
          icon: '🎴',
          unlocked: true,
          unlockedAt: new Date('2024-03-15')
        }
      ]
    };
  }

  addFriend() {
    console.log('Add friend:', this.userId);
  }

  sendMessage() {
    console.log('Send message to:', this.userId);
  }
}