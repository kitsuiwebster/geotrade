# Complete API Endpoints List

## Authentication & User Management
- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- PUT `/api/auth/account`
- PUT `/api/auth/preferences`
- PUT `/api/auth/password`

## User Statistics & Achievements
- GET `/api/users/{userId}/stats`
- GET `/api/users/{userId}/achievements`
- POST `/api/users/{userId}/achievements/{achievementId}/unlock`

## Cards & Collections
- GET `/api/cards`
- GET `/api/users/{userId}/cards`
- POST `/api/users/{userId}/cards/{cardId}`
- DELETE `/api/users/{userId}/cards/{cardId}`

## Quiz System
- GET `/api/quizzes`
- GET `/api/quizzes/{quizId}`
- POST `/api/quizzes/{quizId}/start`
- POST `/api/quizzes/{quizId}/submit`
- GET `/api/users/{userId}/quiz-history`

## Exchange/Trading System
- GET `/api/exchanges/incoming`
- GET `/api/exchanges/outgoing`
- GET `/api/exchanges/history`
- POST `/api/exchanges`
- POST `/api/exchanges/{exchangeId}/respond`
- PUT `/api/exchanges/{exchangeId}/confirm`
- PUT `/api/exchanges/{exchangeId}/decline`
- DELETE `/api/exchanges/{exchangeId}`
- POST `/api/exchanges/{exchangeId}/counter`

## Market System
- GET `/api/market/offers`
- GET `/api/market/requests`
- GET `/api/market/my-listings`
- GET `/api/market/my-proposals`
- POST `/api/market/offers`
- POST `/api/market/requests`
- POST `/api/market/offers/{offerId}/propose`
- POST `/api/market/requests/{requestId}/propose`
- PUT `/api/market/proposals/{proposalId}/accept`
- PUT `/api/market/proposals/{proposalId}/decline`
- DELETE `/api/market/offers/{offerId}`
- DELETE `/api/market/requests/{requestId}`
- PUT `/api/market/listings/{listingId}/refresh`

## Friends System
- GET `/api/friends`
- GET `/api/friends/requests`
- POST `/api/friends/request`
- PUT `/api/friends/requests/{requestId}/accept`
- PUT `/api/friends/requests/{requestId}/decline`
- DELETE `/api/friends/requests/{requestId}`
- DELETE `/api/friends/{friendId}`
- GET `/api/friends/{friendId}/profile`

## Search & Discovery
- GET `/api/search/users`
- GET `/api/search/cards`

## File Upload
- POST `/api/upload/avatar`

## Administrative
- GET `/api/admin/cards`
- POST `/api/admin/cards`

---

**Total: 45 HTTP endpoints**