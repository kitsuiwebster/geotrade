import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: Date;
  cardsCount: number;
  level: number;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string;
  fromAvatar: string;
  message: string;
  sentAt: Date;
}

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent, FooterComponent],
  templateUrl: './friends.component.html',
  styleUrls: ['./friends.component.scss']
})
export class FriendsComponent implements OnInit {
  activeTab: 'friends' | 'requests' | 'find' = 'friends';
  searchTerm = '';
  newFriendUsername = '';

  friends: Friend[] = [];
  incomingRequests: FriendRequest[] = [];
  outgoingRequests: FriendRequest[] = [];
  searchResults: Friend[] = [];

  constructor(private router: Router) {}

  ngOnInit() {}

  get filteredFriends(): Friend[] {
    if (!this.searchTerm) return this.friends;
    const term = this.searchTerm.toLowerCase();
    return this.friends.filter(friend =>
      friend.username.toLowerCase().includes(term) ||
      friend.displayName.toLowerCase().includes(term)
    );
  }

  setActiveTab(tab: 'friends' | 'requests' | 'find') {
    this.activeTab = tab;
  }

  removeFriend(friendId: string) {
    if (confirm('Are you sure you want to remove this friend?')) {
      this.friends = this.friends.filter(f => f.id !== friendId);
    }
  }

  acceptFriendRequest(request: FriendRequest) {
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
  }

  declineFriendRequest(request: FriendRequest) {
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
  }

  cancelOutgoingRequest(request: FriendRequest) {
    this.outgoingRequests = this.outgoingRequests.filter(r => r.id !== request.id);
  }

  searchUsers() {
    this.searchResults = [];
  }

  sendFriendRequest(_user: Friend) {}

  openUserProfile(userId: string) {
    window.open(`/user/${userId}`, '_blank');
  }

  startExchange(friend: Friend) {
    this.router.navigate(['/exchange'], {
      queryParams: {
        friendId: friend.id,
        friendName: friend.displayName
      }
    });
  }
}
