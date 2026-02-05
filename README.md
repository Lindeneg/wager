# Wager

A simple wager tracking app for keeping track of friendly bets between friends.

Originally written in [Go](https://github.com/Lindeneg/wager/tree/legacy) but migrated to Next.js to leverage the React component ecosystem.

## What It Does

Track wagers across game sessions with friends:

- **Sessions**: A gambling night with selected participants
- **Game Sessions**: Playing a specific game (Poker, Blackjack, etc.)
- **Rounds**: Individual hands with wagers and winners

The app automatically calculates who owes whom and provides statistics like:
- Head-to-head records between players
- Best/worst games for each player
- Balance evolution over time

## Tech Stack

- **Next.js 16** (App Router) - React framework
- **Prisma 7** - Database ORM
- **SQLite** - Database (simple, file-based, no setup needed)
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Recharts** - Charts and visualizations
- **Vitest** - Testing

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your JWT_SECRET and INVITE_CODE

# Push database schema
npx prisma db push

# Run development server
npm run dev
```

## Core Decisions

### SQLite
Chose SQLite for simplicity. No database server to manage, just a file. Works well for a small group of friends tracking bets.

### Result Map Structure
Debts are stored as a JSON map showing who owes whom:
```json
{ "user1": { "user2": 100 }, "user2": { "user1": 0 } }
```
This makes it easy to calculate net balances and simplify mutual debts.

### JWT Auth with httpOnly Cookies
Simple auth without external dependencies. Tokens stored in httpOnly cookies for security.

### App Router
Using Next.js App Router for server components where possible, reducing client-side JavaScript.

## Future Improvements

### Database Schema Redesign
The current schema was migrated directly from the Go version. It works, but could be improved:
- Denormalize frequently-accessed stats into dedicated tables
- Better indexing for common queries
- Consider a more normalized debt tracking structure

### Rounding Issues
Currently, wagers are split using integer division which loses remainders. For example, with 3 players and a 99 wager, each loser pays `99 / 2 = 49`, so the winner only receives 98 instead of 99. The missing amounts accumulate over time. The fix is to use floats instead of integers, so each loser would owe 49.5, adding up to the correct total of 99.

### Caching
Currently using a simple in-memory cache with TTL. Future plans:
- Redis for distributed caching (if scaling beyond single instance)
- More granular cache invalidation
- Cache warming strategies

### Logging & Observability
Current logging is basic `console.error`. Would like to add:
- Structured logging (JSON format)
- Request tracing
- Error tracking integration (Sentry or similar)
- Performance monitoring

### Features
Ideas for future features:
- Game-specific statistics and leaderboards
- Session history with detailed breakdowns
- Export data (CSV, PDF reports)
- Mobile-friendly PWA
- Push notifications for session invites
- Support for different wager calculation modes

## Testing

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# E2E API tests only
npm run test:e2e
```

## License

MIT
