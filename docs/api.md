# GeoTrade API Specification

## Overview

GeoTrade is a geographical card trading game requiring comprehensive backend APIs to replace current mock data and enable real multiplayer functionality. This specification outlines all required endpoints for Supabase backend integration.

## Authentication & User Management

### POST `/api/auth/register`
Create new user account
```typescript
Request: {
  username: string;                  // Unique identifier (cannot be changed later)
  displayName: string;               // Display name (can be changed)
  email: string;
  password: string;
  country: string;                   // User's country (required)
  city?: string;                     // User's city (optional)
  avatar?: string;
}
Response: {
  user: User;
  session: Session;
}
```

### POST `/api/auth/login`
Authenticate user
```typescript
Request: {
  email: string;
  password: string;
}
Response: {
  user: User;
  session: Session;
}
```

### POST `/api/auth/logout`
End user session
```typescript
Response: { success: boolean }
```

### GET `/api/auth/me`
Get current user account
```typescript
Response: {
  // Basic Info
  id: string;
  username: string;                   // Unique identifier (unchangeable)
  displayName: string;                // Display name (changeable)
  email: string;
  avatar?: string;                    // Image URL (defaults to pp_default.jpg)
  country: string;                    // User's country (required)
  city?: string;                      // User's city (optional)
  
  // Game Statistics  
  totalCards: number;                // Cards in collection
  totalCardsAvailable: number;       // Total cards in game (for completion %)
  quizzesCompleted: number;
  quizzesTotal: number;              // Total quizzes available
  
  // Trading Statistics
  exchangesPending: number;          // Waiting for response
  marketDealsCompleted: number;      // Market transactions
  
  // Social & Activity
  friendsCount?: number;             // If friends system exists
  
  // Preferences
  preferences: {
    allowExchangeRequests: boolean;  // Accept exchange requests
  };
  
  // Achievements & Badges
  achievementsTotal: number;
  badges: string[];                  // Special badges earned
}
```

### PUT `/api/auth/account`
Update user account information
```typescript
Request: {
  // Basic Info (editable)
  displayName?: string;              // Display name (changeable)
  avatar?: string;                   // Uploaded image URL
  country?: string;                  // User's country (required)
  city?: string;                     // User's city (optional)
  // Note: username cannot be changed after registration
  
  // Preferences (editable)
  preferences?: {
    allowExchangeRequests?: boolean; // Accept exchange requests  
  };
}
Response: { 
  success: boolean;
  user: UserAccount;
}
```

### PUT `/api/auth/preferences`
Update user preferences only
```typescript
Request: {
  allowExchangeRequests?: boolean;
}
Response: { success: boolean }
```

### PUT `/api/auth/password`
Change user password
```typescript
Request: {
  currentPassword: string;
  newPassword: string;
}
Response: { success: boolean }
```

## User Statistics & Achievements

### GET `/api/users/{userId}/stats`
Get user statistics
```typescript
Response: {
  totalCards: number;
  quizzesCompleted: number;
  winStreak: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}
```

### GET `/api/users/{userId}/achievements`
Get user achievements
```typescript
Response: {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}[]
```

### POST `/api/users/{userId}/achievements/{achievementId}/unlock`
Unlock achievement
```typescript
Response: { success: boolean; xpGained: number }
```

## Cards & Collections

### GET `/api/cards`
Get all cards with filtering
```typescript
Query Parameters:
- type?: string[] (Country, Mountain, River, etc.)
- continent?: string[] (Europe, Asia, Africa, etc.)
- search?: string (text search)
- limit?: number
- offset?: number

Response: {
  cards: Card[];
  total: number;
}

Card: {
  id: string;
  type: string;
  nom: string;
  localisation?: string;
  continent?: string;
  image: string;
  population?: string;
  area?: string;
  quizCategory: string[];
}
```

### GET `/api/users/{userId}/cards`
Get user's card collection
```typescript
Response: Card[]
```

### POST `/api/users/{userId}/cards/{cardId}`
Add card to user collection
```typescript
Response: { success: boolean }
```

### DELETE `/api/users/{userId}/cards/{cardId}`
Remove card from collection
```typescript
Response: { success: boolean }
```

## Quiz System

### GET `/api/quizzes`
Get available quizzes
```typescript
Query Parameters:
- category?: string (Geography, Nature, Culture)
- difficulty?: string (Easy, Medium, Hard)
- completed?: boolean

Response: {
  id: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: string;
  questionsCount: number;
  completed: boolean;
  reward: string;
}[]
```

### GET `/api/quizzes/{quizId}`
Get quiz details and questions
```typescript
Response: {
  id: number;
  title: string;
  questions: {
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  timeLimit: number;
}
```

### POST `/api/quizzes/{quizId}/start`
Start quiz session
```typescript
Response: {
  sessionId: string;
  questions: QuizQuestion[];
  timeLimit: number;
}
```

### POST `/api/quizzes/{quizId}/submit`
Submit quiz answers
```typescript
Request: {
  sessionId: string;
  answers: { questionId: number; answer: number }[];
}
Response: {
  score: number;
  totalQuestions: number;
  xpGained: number;
  cardReward?: Card;
  completed: boolean;
}
```

## Exchange/Trading System

### GET `/api/exchanges/incoming`
Get incoming exchange requests for current user
```typescript
Response: {
  id: string;
  fromUser: string;
  fromUserName: string;
  offeredCard: Card;                  // Single card they're offering
  proposedCard?: Card;                // Card I proposed in response (if any)
  message?: string;
  createdAt: Date;
  expiresAt: Date;                    // Auto-expire after 7 days
  status: 'awaiting_response' | 'awaiting_confirmation';
  // awaiting_response: I need to propose a card
  // awaiting_confirmation: They need to accept/decline my proposed card
}[]
```

### GET `/api/exchanges/outgoing`
Get sent exchange requests from current user
```typescript
Response: {
  id: string;
  toUser: string;
  toUserName: string;
  offeredCard: Card;                  // Card I offered
  proposedCard?: Card;                // Card they proposed (if any)
  message?: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'awaiting_response' | 'awaiting_confirmation' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  // awaiting_response: Waiting for them to propose a card
  // awaiting_confirmation: Waiting for me to accept/decline their proposed card
}[]
```

### GET `/api/exchanges/history`
Get completed/declined exchange history (last 30 days)
```typescript
Response: {
  id: string;
  otherUser: string;                  // The other participant
  otherUserName: string;
  offeredCards: Card[];
  requestedCards: Card[];
  message: string;
  createdAt: Date;
  completedAt: Date;
  status: 'accepted' | 'declined' | 'expired';
  direction: 'sent' | 'received';     // Was I the sender or receiver?
}[]
```

### POST `/api/exchanges`
Create direct exchange request with friend
```typescript
Request: {
  toUser: string;                    // Friend's user ID
  offeredCard: string;               // Single card I'm offering (must own)
  message?: string;                  // Optional message to friend
}
Response: { 
  exchangeId: string;
  expiresAt: Date;                   // 7 days from now
}

// Validation:
// - User cannot send exchange to themselves
// - User must own the offered card
// - Cannot send duplicate request to same user with same card
// - Maximum 5 pending outgoing requests per user

// Process:
// 1. Create exchange with status 'awaiting_response'
// 2. Friend will see the offer and can propose their card
// 3. Original sender then accepts/declines the proposed card
```

### POST `/api/exchanges/{exchangeId}/respond`
Respond to exchange request by proposing a card
```typescript
Request: {
  proposedCard: string;              // Card I'm offering in exchange (must own)
  message?: string;                  // Optional message
}
Response: { 
  success: boolean;
  newStatus: 'awaiting_confirmation';
}

// Process:
// 1. Verify I own the proposed card
// 2. Update exchange with my proposed card
// 3. Change status to 'awaiting_confirmation'
// 4. Notify original sender that I responded
```

### PUT `/api/exchanges/{exchangeId}/confirm`
Confirm the proposed card (complete the exchange)
```typescript
Response: { 
  success: boolean;
  cardReceived: Card;                // Card I received
  cardGiven: Card;                   // Card I gave
}

// Process:
// 1. Verify both users still own their respective cards
// 2. Transfer cards atomically
// 3. Update both user collections
// 4. Send notification to both users
// 5. Mark exchange as completed
```

### PUT `/api/exchanges/{exchangeId}/decline`
Decline the exchange (either initial offer or proposed response)
```typescript
Response: { success: boolean }

// Process:
// 1. Mark exchange as declined
// 2. Send notification to other party
// 3. Remove from active exchanges
```

### DELETE `/api/exchanges/{exchangeId}`
Cancel own exchange request (only if pending)
```typescript
Response: { success: boolean }

// Process:
// 1. Verify user is the sender
// 2. Verify status is still pending
// 3. Mark as cancelled
// 4. Send notification to receiver
```

### POST `/api/exchanges/{exchangeId}/counter`
Make counter-offer on received exchange request
```typescript
Request: {
  offeredCards: string[];            // New cards I offer
  requestedCards: string[];          // New cards I want
  message: string;
}
Response: { 
  newExchangeId: string;
  expiresAt: Date;
}

// Process:
// 1. Decline original exchange
// 2. Create new exchange in reverse direction
// 3. Original sender gets notification of counter-offer
```

## Market System

### GET `/api/market/offers`
Get public market offers (cards for sale/trade)
```typescript
Query Parameters:
- search?: string                    // Search in card names or description
- type?: string                      // Filter by card type
- continent?: string                 // Filter by continent
- seller?: string                    // Filter by seller username
- excludeOwn?: boolean               // Exclude current user's offers (default: true)
- limit?: number                     // Default: 20, Max: 100
- offset?: number                    // For pagination

Response: {
  offers: {
    id: string;
    seller: string;
    sellerName: string;
    cardOffered: Card;
    description: string;             // What seller is looking for (free text)
    createdAt: Date;
    expiresAt: Date;                 // Auto-expire after 30 days
    status: 'active';                // Only active offers shown
    proposalCount: number;           // Number of proposals received
  }[];
  total: number;                     // Total matching offers for pagination
}
```

### GET `/api/market/requests`
Get public market requests (cards wanted/buying)
```typescript
Query Parameters: (same as offers)

Response: {
  requests: {
    id: string;
    buyer: string;
    buyerName: string;
    cardWanted: Card;
    cardsOffered: Card[];            // 1-5 specific cards offered in exchange
    description?: string;            // Optional additional context
    createdAt: Date;
    expiresAt: Date;
    status: 'active';
    proposalCount: number;
  }[];
  total: number;
}
```

### GET `/api/market/my-listings`
Get current user's market listings (both offers and requests)
```typescript
Response: {
  offers: {
    id: string;
    cardOffered: Card;
    cardsWanted: Card[];
    description: string;
    createdAt: Date;
    expiresAt: Date;
    status: 'active' | 'completed' | 'expired' | 'cancelled';
    proposalCount: number;
    lastProposalAt?: Date;
  }[];
  requests: {
    id: string;
    cardWanted: Card;
    cardsOffered: Card[];
    description: string;
    createdAt: Date;
    expiresAt: Date;
    status: 'active' | 'completed' | 'expired' | 'cancelled';
    proposalCount: number;
    lastProposalAt?: Date;
  }[];
}
```

### GET `/api/market/my-proposals`
Get proposals user has made on market listings
```typescript
Response: {
  id: string;
  listingType: 'offer' | 'request';
  listingId: string;
  sellerName: string;                // Owner of the listing
  targetCard: Card;                  // Card they offered/wanted
  myProposedCards: Card[];           // Cards I proposed
  message: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  respondedAt?: Date;
}[]
```

### POST `/api/market/offers`
Create market offer (I'm selling X card, open to any proposals)
```typescript
Request: {
  cardOffered: string;               // Must own this card
  description: string;               // What I'm looking for (e.g., "Looking for any mountain cards" or "Any fair trade welcome")
}
Response: { 
  offerId: string;
  expiresAt: Date;                   // 30 days from now
}

// Validation:
// - Must own the offered card
// - Cannot offer same card if already listed
// - Maximum 10 active offers per user
// - Description must be appropriate (profanity filter)
// - Description explains what type of cards/trades the seller wants
```

### POST `/api/market/requests`
Create market request (I want X card, offering 1-5 specific cards)
```typescript
Request: {
  cardWanted: string;                // Card I want to acquire
  cardsOffered: string[];            // 1-5 specific cards I'm willing to trade
  description?: string;              // Optional additional context
}
Response: { 
  requestId: string;
  expiresAt: Date;
}

// Validation:
// - Cannot request card I already own
// - Must own all offered cards
// - cardsOffered must contain 1-5 cards (not empty, not more than 5)
// - Cannot request same card if already listed
// - Maximum 10 active requests per user
```

### POST `/api/market/offers/{offerId}/propose`
Propose trade for market offer
```typescript
Request: {
  proposedCards: string[];           // Cards I'm offering for their card
  message: string;                   // Optional message
}
Response: { 
  proposalId: string;
  expiresAt: Date;                   // Proposal expires in 7 days
}

// Process:
// 1. Verify I own all proposed cards
// 2. Check if proposal matches seller's wanted cards (if specified)
// 3. Create proposal record
// 4. Notify seller of new proposal
// 5. Maximum 3 proposals per user per listing
```

### POST `/api/market/requests/{requestId}/propose`
Propose trade for market request
```typescript
Request: {
  offeredCard: string;               // The card they want (must own it)
  message: string;
}
Response: { proposalId: string }

// Process: Similar to offer proposals
```

### PUT `/api/market/proposals/{proposalId}/accept`
Accept a proposal on my listing
```typescript
Response: { 
  success: boolean;
  exchangeId: string;                // Creates automatic exchange
  cardsReceived: Card[];
  cardsGiven: Card[];
}

// Process:
// 1. Verify I own the listing
// 2. Verify cards still owned by both parties
// 3. Execute trade atomically
// 4. Mark listing as completed
// 5. Cancel all other proposals on this listing
// 6. Notify all participants
```

### PUT `/api/market/proposals/{proposalId}/decline`
Decline a proposal on my listing
```typescript
Response: { success: boolean }

// Process:
// 1. Mark proposal as declined
// 2. Notify proposer
// 3. Listing remains active for other proposals
```

### DELETE `/api/market/offers/{offerId}`
### DELETE `/api/market/requests/{requestId}`
Cancel own market listing
```typescript
Response: { success: boolean }

// Process:
// 1. Verify ownership
// 2. Mark as cancelled
// 3. Decline all pending proposals
// 4. Notify all proposers
// 5. Can only cancel if no accepted proposals
```

### PUT `/api/market/listings/{listingId}/refresh`
Refresh listing expiration (extend for another 30 days)
```typescript
Response: { 
  success: boolean;
  newExpiresAt: Date;
}

// Limits:
// - Can only refresh once per week
// - Maximum 3 refreshes per listing
// - Must be active listing
```

## Friends System

### GET `/api/friends`
Get user's friends list
```typescript
Response: {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'offline';
  lastSeen?: Date;
  cardsCount: number;
  level: number;
  xp: number;
}[]
```

### GET `/api/friends/requests`
Get incoming and outgoing friend requests
```typescript
Response: {
  incoming: {
    id: string;
    fromUserId: string;
    fromUsername: string;
    fromDisplayName: string;
    fromAvatar: string;
    message: string;
    sentAt: Date;
  }[];
  outgoing: {
    id: string;
    toUserId: string;
    toUsername: string;
    toDisplayName: string;
    message: string;
    sentAt: Date;
    status: 'pending' | 'accepted' | 'declined';
  }[];
}
```

### POST `/api/friends/request`
Send friend request
```typescript
Request: {
  toUserId: string;
  message?: string;
}
Response: { 
  requestId: string;
  success: boolean;
}

// Validation:
// - Cannot send request to self
// - Cannot send duplicate request
// - Maximum 10 pending outgoing requests
// - Users must not already be friends
```

### PUT `/api/friends/requests/{requestId}/accept`
Accept friend request
```typescript
Response: { 
  success: boolean;
  newFriend: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    level: number;
    cardsCount: number;
  };
}

// Process:
// 1. Add both users to each other's friends list
// 2. Delete the friend request
// 3. Update friends_count for both users
// 4. Send notification to requester
```

### PUT `/api/friends/requests/{requestId}/decline`
Decline friend request
```typescript
Response: { success: boolean }

// Process:
// 1. Delete the friend request
// 2. Send notification to requester
```

### DELETE `/api/friends/requests/{requestId}`
Cancel outgoing friend request
```typescript
Response: { success: boolean }

// Process:
// 1. Verify user owns the request
// 2. Delete the request
// 3. Send notification to recipient
```

### DELETE `/api/friends/{friendId}`
Remove friend
```typescript
Response: { success: boolean }

// Process:
// 1. Remove friendship from both users
// 2. Update friends_count for both users
// 3. Send notification to removed friend
```

### GET `/api/friends/{friendId}/profile`
Get friend's profile (extended info for friends)
```typescript
Response: {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  xp: number;
  status: 'online' | 'offline';
  lastSeen?: Date;
  stats: {
    totalCards: number;
    quizzesCompleted: number;
    exchangesCompleted: number;
    marketDeals: number;
    achievements: number;
  };
  recentAchievements: Achievement[]; // Last 5 achievements
  commonCards: number; // Cards in common with current user
  canTrade: boolean; // Based on privacy settings
}
```

## Search & Discovery

### GET `/api/search/users`
Search for users
```typescript
Query Parameters:
- q: string (search term)
- limit?: number
- excludeFriends?: boolean (default: false)

Response: {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  level: number;
  cardsCount: number;
  isFriend: boolean;
  hasPendingRequest: boolean; // Either direction
}[]
```

### GET `/api/search/cards`
Advanced card search
```typescript
Query Parameters:
- q: string (search term)
- type?: string
- continent?: string

Response: Card[]
```


## File Upload

### POST `/api/upload/avatar`
Upload user avatar
```typescript
Request: FormData with image file
Response: { avatarUrl: string }
```

## Database Schema (Supabase)

### Required Tables

```sql
-- Users (Simplified Profile)
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Authentication
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,       -- Unique identifier (unchangeable)
  display_name text NOT NULL,          -- Display name (changeable, not unique)
  password_hash text NOT NULL,
  
  -- Basic Profile
  avatar text DEFAULT 'assets/images/pp_default.jpg', -- Image URL
  country text NOT NULL,               -- User's country (required)
  city text,                           -- User's city (optional)
  created_at timestamp DEFAULT now(),
  
  -- Game Statistics
  quizzes_completed integer DEFAULT 0,
  market_deals_completed integer DEFAULT 0,
  
  -- Social
  friends_count integer DEFAULT 0,
  
  -- Preferences (JSON)
  preferences jsonb DEFAULT '{
    "allowExchangeRequests": true
  }'::jsonb,
  
  -- Calculated Fields (updated via triggers/functions)
  total_cards integer DEFAULT 0,        -- Cards owned count
  
  -- Metadata
  updated_at timestamp DEFAULT now()
);

-- Cards
CREATE TABLE cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  nom text NOT NULL,
  localisation text,
  continent text,
  image text NOT NULL,
  metadata jsonb, -- population, area, etc.
  quiz_categories text[]
);

-- User Collections
CREATE TABLE user_cards (
  user_id uuid REFERENCES users(id),
  card_id uuid REFERENCES cards(id),
  obtained_at timestamp DEFAULT now(),
  PRIMARY KEY (user_id, card_id)
);

-- Quizzes
CREATE TABLE quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  difficulty text NOT NULL,
  category text NOT NULL,
  questions jsonb NOT NULL,
  reward_card_id uuid REFERENCES cards(id),
  questions_count integer
);

-- Quiz Completions
CREATE TABLE quiz_completions (
  user_id uuid REFERENCES users(id),
  quiz_id uuid REFERENCES quizzes(id),
  score integer,
  completed_at timestamp DEFAULT now(),
  PRIMARY KEY (user_id, quiz_id)
);

-- Exchange Requests
CREATE TABLE exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id),
  to_user_id uuid REFERENCES users(id),
  offered_cards uuid[],
  requested_cards uuid[],
  message text,
  status text DEFAULT 'pending',
  created_at timestamp DEFAULT now()
);

-- Market Offers
CREATE TABLE market_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  card_offered uuid REFERENCES cards(id),
  cards_wanted uuid[],
  description text,
  created_at timestamp DEFAULT now()
);

-- Market Requests
CREATE TABLE market_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  card_wanted uuid REFERENCES cards(id),
  cards_offered uuid[],
  description text,
  created_at timestamp DEFAULT now()
);

-- Achievements
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL
);

-- User Achievements
CREATE TABLE user_achievements (
  user_id uuid REFERENCES users(id),
  achievement_id uuid REFERENCES achievements(id),
  unlocked_at timestamp DEFAULT now(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Friendships
CREATE TABLE friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid REFERENCES users(id),
  user2_id uuid REFERENCES users(id),
  created_at timestamp DEFAULT now(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

-- Friend Requests
CREATE TABLE friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid REFERENCES users(id),
  to_user_id uuid REFERENCES users(id),
  message text,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at timestamp DEFAULT now(),
  responded_at timestamp,
  UNIQUE(from_user_id, to_user_id),
  CHECK (from_user_id != to_user_id)
);

-- User Sessions (for online status)
CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  last_activity timestamp DEFAULT now(),
  ip_address inet,
  user_agent text,
  created_at timestamp DEFAULT now()
);
```

## Implementation Priority

1. **Phase 1**: Authentication & user profiles
2. **Phase 2**: Card collection management  
3. **Phase 3**: Quiz system with card rewards
4. **Phase 4**: Friends & social system
5. **Phase 5**: Exchange/trading system
6. **Phase 6**: Market system
7. **Phase 7**: Advanced features & achievements

## Required Environment Variables

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Notes

- All card data (3000+ cards) should be migrated from TypeScript files to Supabase
- Implement proper error handling and loading states
- Add rate limiting for API endpoints
- Consider caching strategies for card data
- Add proper validation and sanitization for all inputs