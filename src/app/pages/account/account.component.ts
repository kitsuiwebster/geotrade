import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';

interface UserStats {
  totalCards: number;
  quizzesCompleted: number;
  winStreak: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  user = {
    username: 'GeoExplorer',
    email: 'explorer@geotrade.com',
    joinDate: new Date('2024-01-15'),
    avatar: '🌍'
  };

  stats: UserStats = {
    totalCards: 3,
    quizzesCompleted: 1,
    winStreak: 1,
    level: 2,
    xp: 250,
    nextLevelXp: 500
  };

  achievements: Achievement[] = [
    {
      id: 1,
      title: 'First Steps',
      description: 'Complete your first quiz',
      icon: '🎯',
      unlocked: true,
      unlockedAt: new Date('2024-01-16')
    },
    {
      id: 2,
      title: 'Card Collector',
      description: 'Collect your first 5 cards',
      icon: '📚',
      unlocked: false
    },
    {
      id: 3,
      title: 'Geography Master',
      description: 'Complete 10 geography quizzes',
      icon: '🗺️',
      unlocked: false
    },
    {
      id: 4,
      title: 'Explorer',
      description: 'Reach level 5',
      icon: '🧭',
      unlocked: false
    }
  ];

  ngOnInit(): void {
    // Simulation initialization
  }

  get xpProgress(): number {
    return (this.stats.xp / this.stats.nextLevelXp) * 100;
  }

  get unlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  get lockedAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.unlocked);
  }

  updateProfile(): void {
    console.log('Profile updated');
    // Mock profile update
  }

  logout(): void {
    console.log('User logged out');
    // Mock logout
  }
}