# WhoPaid - Expense Splitting App

WhoPaid is a simple, free expense-splitting app that helps groups of friends, roommates, or travel companions track shared expenses and settle debts.

## Features

- Track who paid for what in shared group expenses
- Calculate balances between group members
- Organize expenses into different groups (trips, apartments, etc.)
- Simple, clean UI with no unnecessary complexity

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- PNPM package manager
- Supabase account

### Environment Setup

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`

### Installation

```bash
pnpm install
```

### Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

The app is configured to deploy on Vercel with PostgreSQL.

1. Push to GitHub
2. Connect Vercel to the GitHub repository
3. Configure Vercel environment variables
4. Deploy

## License

This project is licensed under the MIT License - see the LICENSE file for details.
