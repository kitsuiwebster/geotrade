import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface UserStats {
  totalCards: number;
  totalCardsAvailable: number;
  quizzesCompleted: number;
  quizzesTotal: number;
  exchangesPending: number;
  marketDealsCompleted: number;
  friendsCount: number;
  achievementsTotal: number;
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
  imports: [CommonModule, RouterModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss']
})
export class AccountComponent implements OnInit {
  user = {
    username: 'geoexplorer',
    displayName: 'GeoExplorer',
    email: 'explorer@geotrade.com',
    avatar: 'assets/images/pp_default.jpg',
    country: 'France',
    city: 'Paris'
  };

  stats: UserStats = {
    totalCards: 11,
    totalCardsAvailable: 3127,
    quizzesCompleted: 2,
    quizzesTotal: 15,
    exchangesPending: 3,
    marketDealsCompleted: 7,
    friendsCount: 12,
    achievementsTotal: 25
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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


  get unlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  get lockedAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.unlocked);
  }

  getCollectionPercentage(): number {
    return Math.round((this.stats.totalCards / this.stats.totalCardsAvailable) * 100);
  }

  onAvatarUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      console.log('Avatar file selected:', file.name);
      // Mock file upload - will use API endpoint later
      // POST /api/upload/avatar
    }
  }

  updateAccount(): void {
    console.log('Account updated');
    // Mock account update - will use API endpoint later  
    // PUT /api/auth/account
  }

  isPasswordFormValid(): boolean {
    return this.passwordForm.currentPassword.length > 0 &&
           this.passwordForm.newPassword.length >= 6 &&
           this.passwordForm.newPassword === this.passwordForm.confirmPassword;
  }

  changePassword(): void {
    if (!this.isPasswordFormValid()) {
      return;
    }
    
    console.log('Password change requested');
    // Mock password change - will use API endpoint later
    // PUT /api/auth/password
    
    // Reset form after successful change
    this.passwordForm = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    alert('Password changed successfully!');
  }

  logout(): void {
    console.log('User logged out');
    // Mock logout
  }

  previewProfile(): void {
    const userId = 'demo123'; // Mock current user ID
    window.open(`/user/${userId}`, '_blank');
  }
}