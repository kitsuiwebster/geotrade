import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  ngOnInit() {
    this.loadMockData();
  }

  loadMockData() {
    this.friends = [
      {
        id: 'user123',
        username: 'geomaster',
        displayName: 'GeoMaster',
        avatar: 'assets/images/pp_default.jpg',
        status: 'online',
        cardsCount: 245,
        level: 18
      },
      {
        id: 'user456',
        username: 'cardcollector',
        displayName: 'Card Collector',
        avatar: 'assets/images/pp_default.jpg',
        status: 'offline',
        lastSeen: new Date('2024-12-11T10:30:00'),
        cardsCount: 189,
        level: 15
      },
      {
        id: 'user789',
        username: 'worldexplorer',
        displayName: 'World Explorer',
        avatar: 'assets/images/pp_default.jpg',
        status: 'online',
        cardsCount: 156,
        level: 12
      }
    ];

    this.incomingRequests = [
      {
        id: 'req1',
        fromUserId: 'user404',
        fromUsername: 'newtrader',
        fromDisplayName: 'New Trader',
        fromAvatar: 'src/assets/images/pp_default.jpg',
        message: 'Hi! I saw your collection and would love to be friends and trade cards!',
        sentAt: new Date('2024-12-11T14:20:00')
      },
      {
        id: 'req2',
        fromUserId: 'user505',
        fromUsername: 'maplover',
        fromDisplayName: 'Map Lover',
        fromAvatar: 'src/assets/images/pp_default.jpg',
        message: 'Looking for fellow geography enthusiasts to connect with!',
        sentAt: new Date('2024-12-10T16:45:00')
      }
    ];

    this.outgoingRequests = [
      {
        id: 'req3',
        fromUserId: 'currentUser',
        fromUsername: 'you',
        fromDisplayName: 'Peak Hunter',
        fromAvatar: 'src/assets/images/pp_default.jpg',
        message: 'Would love to be trading partners!',
        sentAt: new Date('2024-12-09T12:15:00')
      }
    ];
  }

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
    const newFriend: Friend = {
      id: request.fromUserId,
      username: request.fromUsername,
      displayName: request.fromDisplayName,
      avatar: request.fromAvatar,
      status: 'offline',
      cardsCount: Math.floor(Math.random() * 200) + 50,
      level: Math.floor(Math.random() * 15) + 5
    };

    this.friends.push(newFriend);
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
    
    alert(`${request.fromDisplayName} is now your friend!`);
  }

  declineFriendRequest(request: FriendRequest) {
    this.incomingRequests = this.incomingRequests.filter(r => r.id !== request.id);
  }

  cancelOutgoingRequest(request: FriendRequest) {
    this.outgoingRequests = this.outgoingRequests.filter(r => r.id !== request.id);
  }

  searchUsers() {
    if (this.newFriendUsername.length < 3) {
      this.searchResults = [];
      return;
    }

    // Mock search results
    this.searchResults = [
      {
        id: 'search1',
        username: this.newFriendUsername + '123',
        displayName: 'Search Result 1',
        avatar: 'assets/images/pp_default.jpg',
        status: 'offline' as 'offline',
        cardsCount: 78,
        level: 8
      },
      {
        id: 'search2',
        username: this.newFriendUsername + '_trader',
        displayName: 'Search Result 2',
        avatar: 'assets/images/pp_default.jpg',
        status: 'online' as 'online',
        cardsCount: 134,
        level: 11
      }
    ].filter(user => 
      !this.friends.some(f => f.id === user.id) &&
      !this.outgoingRequests.some(r => r.fromDisplayName === user.displayName)
    );
  }

  sendFriendRequest(user: Friend) {
    const newRequest: FriendRequest = {
      id: 'req_' + Date.now(),
      fromUserId: 'currentUser',
      fromUsername: 'you',
      fromDisplayName: user.displayName,
      fromAvatar: 'src/assets/images/pp_default.jpg',
      message: 'Hi! Would love to connect and trade cards!',
      sentAt: new Date()
    };

    this.outgoingRequests.push(newRequest);
    this.searchResults = this.searchResults.filter(u => u.id !== user.id);
    
    alert(`Friend request sent to ${user.displayName}!`);
  }

  openUserProfile(userId: string) {
    window.open(`/user/${userId}`, '_blank');
  }

  startDirectMessage(friend: Friend) {
    alert(`Direct messaging with ${friend.displayName} - Feature coming soon!`);
  }
}