# GeoTrade — Backend Supabase

## Décisions d'architecture

| Sujet | Décision |
|---|---|
| Auth | Supabase Auth natif (`auth.users`) |
| Cartes | Statiques côté Angular, `card_id` string comme référence en base |
| RLS | Activé sur toutes les tables |
| Realtime | Non (à ajouter plus tard si besoin) |
| Avatar | `avatar_card_id` — une carte possédée par le joueur |
| Expirations | Aucune — les échanges et annonces restent ouverts jusqu'à action explicite |
| Limites | Appliquées en base via triggers |
| Profils | Publics |
| Quiz | Tables créées, vides — à remplir plus tard |
| Achievements | Tables créées, vides — à remplir plus tard |

---

## Schéma des tables

### `profiles`
Créé automatiquement à l'inscription via trigger sur `auth.users`.

```sql
id uuid PRIMARY KEY          -- = auth.uid()
username text UNIQUE NOT NULL
display_name text NOT NULL
avatar_card_id text NULL     -- card_id statique (doit être possédée par le user)
country text NOT NULL
city text NULL
preferences jsonb            -- {"allowExchangeRequests": true}
quizzes_completed integer
market_deals_completed integer
created_at timestamptz
updated_at timestamptz       -- mis à jour automatiquement
```

### `user_cards`
Collection de cartes d'un joueur. `card_id` est un identifiant string côté Angular.

```sql
user_id uuid FK → profiles.id
card_id text NOT NULL
obtained_at timestamptz
PRIMARY KEY (user_id, card_id)
```

### `quizzes` _(vide)_
```sql
id uuid PK
title text
description text
difficulty text
category text
questions jsonb
reward_card_id text
created_at timestamptz
```

### `quiz_completions`
```sql
user_id uuid FK → profiles.id
quiz_id uuid FK → quizzes.id
score integer
completed_at timestamptz
PRIMARY KEY (user_id, quiz_id)
```

### `friendships`
`user1_id < user2_id` pour éviter les doublons.

```sql
id uuid PK
user1_id uuid FK → profiles.id
user2_id uuid FK → profiles.id
created_at timestamptz
UNIQUE(user1_id, user2_id)
CHECK (user1_id < user2_id)
```

### `friend_requests`
```sql
id uuid PK
from_user_id uuid FK → profiles.id
to_user_id uuid FK → profiles.id
message text NULL
status text  -- 'pending' | 'accepted' | 'declined'
created_at timestamptz
responded_at timestamptz NULL
UNIQUE(from_user_id, to_user_id)
CHECK (from_user_id != to_user_id)
```

### `exchange_requests`
Échange en 2 étapes : A offre → B propose → A confirme.

```sql
id uuid PK
from_user_id uuid FK → profiles.id
to_user_id uuid FK → profiles.id
offered_card_id text NOT NULL      -- carte offerte par A
proposed_card_id text NULL         -- carte proposée par B en réponse
message text NULL
status text
  -- 'awaiting_response'       : B doit proposer une carte
  -- 'awaiting_confirmation'   : A doit accepter/refuser
  -- 'accepted' | 'declined' | 'cancelled'
created_at timestamptz
updated_at timestamptz
```
**Limite** : max 5 échanges `awaiting_response` par user (trigger).

### `market_offers`
"Je mets cette carte, dites-moi ce que vous proposez."

```sql
id uuid PK
user_id uuid FK → profiles.id
card_offered_id text NOT NULL
description text NOT NULL
status text  -- 'active' | 'completed' | 'cancelled'
created_at timestamptz
```
**Limite** : max 10 offres actives par user (trigger).

### `market_requests`
"Je cherche cette carte, voilà ce que j'offre (1–5 cartes)."

```sql
id uuid PK
user_id uuid FK → profiles.id
card_wanted_id text NOT NULL
cards_offered_ids text[] NOT NULL  -- 1 à 5 card_id
description text NULL
status text  -- 'active' | 'completed' | 'cancelled'
created_at timestamptz
CHECK (array_length(cards_offered_ids, 1) BETWEEN 1 AND 5)
```
**Limite** : max 10 demandes actives par user (trigger).

### `market_proposals`
Propositions sur les annonces du marché.

```sql
id uuid PK
listing_type text  -- 'offer' | 'request'
listing_id uuid
proposer_id uuid FK → profiles.id
proposed_card_ids text[]
message text NULL
status text  -- 'pending' | 'accepted' | 'declined'
created_at timestamptz
```
**Limite** : max 3 proposals par user par annonce (trigger).

### `achievements` _(vide)_
```sql
id uuid PK
title text
description text
icon text
```

### `user_achievements`
```sql
user_id uuid FK → profiles.id
achievement_id uuid FK → achievements.id
unlocked_at timestamptz
PRIMARY KEY (user_id, achievement_id)
```

---

## Triggers

| Trigger | Table | Rôle |
|---|---|---|
| `on_auth_user_created` | `auth.users` | Crée le profil automatiquement à l'inscription |
| `set_profiles_updated_at` | `profiles` | Met à jour `updated_at` |
| `set_exchange_requests_updated_at` | `exchange_requests` | Met à jour `updated_at` |
| `enforce_exchange_limit` | `exchange_requests` | Max 5 échanges en attente par user |
| `enforce_market_offer_limit` | `market_offers` | Max 10 offres actives par user |
| `enforce_market_request_limit` | `market_requests` | Max 10 demandes actives par user |
| `enforce_market_proposal_limit` | `market_proposals` | Max 3 proposals par user par annonce |
| `check_profile_avatar_card` | `profiles` | L'avatar doit être une carte possédée |

---

## RLS Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | public | — | soi-même | — |
| `user_cards` | soi-même | soi-même | — | soi-même |
| `quizzes` | public | — | — | — |
| `quiz_completions` | soi-même | soi-même | — | — |
| `friendships` | participants | participants | — | participants |
| `friend_requests` | participants | from_user | participants | from_user |
| `exchange_requests` | participants | from_user | participants | from_user |
| `market_offers` | public | owner | owner | owner |
| `market_requests` | public | owner | owner | owner |
| `market_proposals` | proposer | proposer | proposer | — |
| `achievements` | public | — | — | — |
| `user_achievements` | soi-même | soi-même | — | — |

---

## Variables d'environnement Angular

```
SUPABASE_URL=https://rtmlaawsaeebdoulrlfj.supabase.co
SUPABASE_ANON_KEY=<publishable key>
```

---

## Phases d'implémentation

1. **Phase 1** — Auth + profils (login, register, account)
2. **Phase 2** — Collection de cartes
3. **Phase 3** — Quiz + récompenses
4. **Phase 4** — Amis + demandes d'amis
5. **Phase 5** — Échanges entre joueurs
6. **Phase 6** — Marché (offres + demandes)
7. **Phase 7** — Achievements
