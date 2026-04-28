import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { CardComponent } from '../../components/card/card.component';
import { Card } from '../../interfaces/card.interface';

interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  country: string;
  city: string;
  joinDate: Date | null;
  coverImage: string;
  favoriteCards: Card[];
  stats: {
    totalCards: number;
    quizzesCompleted: number;
    exchangesCompleted: number;
    marketDealsCompleted: number;
    friendsCount: number;
    achievementsCount: number;
  };
  achievements: Array<{
    id: number;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt: Date | null;
  }>;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, NavbarComponent, FooterComponent, CardComponent],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {
  userId: string = '';
  user: UserProfile | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.userId = this.route.snapshot.paramMap.get('id') || '';
  }

  addFriend() {}
  sendMessage() {}
}
