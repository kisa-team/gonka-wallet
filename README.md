# Gonka Wallet

A modern web wallet for the Gonka blockchain built with Next.js, TypeScript, and Cosmos SDK.

## Features

- 🔐 **Secure Wallet Management** - Create and import wallets using BIP39 seed phrases
- 💸 **Send & Receive** - Transfer GNK tokens with ease
- 📊 **Staking** - Delegate to validators and manage staking operations
- 🗳️ **Governance** - View and vote on blockchain proposals
- 🔗 **WalletConnect** - Connect with dApps using WalletConnect protocol
- 📱 **Telegram Mini App** - Native integration with Telegram
- 📜 **Transaction History** - View your transaction history
- 🌐 **Web Apps** - Access integrated web applications

## Prerequisites

- Node.js 24+
- PostgreSQL database
- npm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Setup database:
```bash
# migrations
npx prisma migrate dev
# or if migrations does not exists
npx prisma db push
```

## Development

Start the development server:
```bash
npm run dev
```

## Building

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Docker

Build and run with Docker Compose:
```bash
./deploy.sh # development version with .env.docker.dev
./deploy.sh prod # production version with .env.docker.prod
./deploy.sh rollback # rollback to previous build
```

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
