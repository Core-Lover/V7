# EthicX - Multi-Chain Blockchain Tools

## Overview

EthicX is a comprehensive blockchain tooling platform that combines an internal mining/rewards system with professional multi-chain blockchain operations. The application features a React + TypeScript frontend with a Node.js backend, supporting both Solana and EVM-compatible chains (Ethereum, BSC). Users can create accounts, mine virtual EIX tokens, manage upgrades, transfer tokens, and perform various blockchain operations including token creation, minting, burning, and multi-send functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework**: React 18 with TypeScript for type safety
- **Build Tool**: Vite 5 for fast development and optimized production builds
- **Routing**: React Router DOM for client-side navigation
- **State Management**: React Query (TanStack Query) for server state and React Context API for global application state
- **UI Components**: Radix UI primitives for accessibility with Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod for schema validation
- **Animations**: Framer Motion for smooth UI transitions
- **3D Graphics**: Three.js for mining visualization

**Design Decisions:**
- Component-based architecture with clear separation between features, pages, and reusable UI components
- Path aliases configured (`@/`, `@shared/`) for cleaner imports
- **OptimAI-inspired aesthetic**: Electric cyan (#00d4ff) and purple (#8b5cf6) gradients, glassmorphism effects, neon borders, animated particles
- Dark theme professional trading interface inspired by OptimAI.network with futuristic DePIN styling
- Responsive design with mobile-first approach
- Performance optimizations including lazy loading, memoization, and code splitting
- Animated gradient text, floating glow orbs, and particle effects for visual depth

### Backend Architecture

**Technology Stack:**
- **Runtime**: Node.js with Express 5 for REST API
- **Database**: PostgreSQL (Neon-backed) for production-ready database
- **Authentication**: Custom JWT-based authentication with CryptoJS for hashing
- **Build Tool**: tsx for TypeScript execution in Node.js

**Design Decisions:**
- PostgreSQL database for scalability and reliability
- Custom authentication system using access keys instead of traditional passwords
- Session management via localStorage on client side
- Referral system built into user creation flow
- Mining session system with time-based rewards and upgrade tiers

**API Structure:**
- `/api/auth/*` - Authentication endpoints (signup, login)
- `/api/user/:userId` - User profile and data retrieval
- `/api/mining/*` - Mining session management and rewards
- `/api/wallet/*` - EIX token transfers and transaction history
- `/api/verification/*` - Ethereum wallet verification
- Proxy configuration for `/api` routes pointing to port 3001

### Database Schema

**Users Table:**
- Stores user credentials (hashed PIN and access key)
- Wallet addresses generated on signup
- Balance tracking for EIX tokens
- Upgrade level (0-3) for mining tier system
- Referral tracking with referral codes
- Ethereum wallet verification status

**Mining Sessions Table:**
- Active/inactive session tracking
- Time-based mining with configurable rates and durations
- Reward calculation and claiming system
- Linked to user accounts via foreign key

**Wallet Transactions Table:**
- Transaction history for EIX token transfers
- Supports different transaction types (transfer, mining reward, upgrade purchase)
- Bidirectional tracking (from/to users)

### Multi-Chain Blockchain Operations (Lab Feature)

**Solana Integration:**
- Solana Web3.js for blockchain interactions
- Metaplex Foundation libraries for token metadata (NFT standards)
- Metaplex UMI for IPFS uploads via Irys
- Support for mainnet and testnet networks
- Operations: Token creation, minting, burning, freeze authority, authority management, multi-send

**EVM Integration:**
- Ethers.js v6 for Ethereum and BSC interactions
- Support for Ethereum mainnet/testnet (Sepolia) and BSC mainnet/testnet
- Smart contract deployment for ERC-20 tokens with extensions
- Operations: Token creation, minting, burning, pausing, approvals, multi-send

**Wallet Connection:**
- Browser-based wallet detection (Phantom for Solana, MetaMask/injected for EVM)
- Network switching and chain management
- Transaction signing and confirmation tracking

### Authentication System

**Design Philosophy:**
- Access key-based authentication instead of traditional username/password
- Each user receives a unique access key (format: `EIX-[64-char-hex]`) on signup
- 4-digit PIN for initial account creation (hashed with SHA256)
- Access key must be stored by user (shown once on creation)

**Security Measures:**
- SHA256 hashing for PINs and access keys
- Access keys stored hashed in database
- No password recovery mechanism (user must save access key)
- Session persistence across page reloads

### Mining & Upgrade System

**Mining Tiers:**
- Level 0: 0.1 EIX/hour for 3 hours (Default)
- Level 1: 0.5 EIX/hour for 6 hours (Bronze - costs 0.5 EIX)
- Level 2: 1.5 EIX/hour for 12 hours (Silver - costs 1.0 EIX)
- Level 3: 3.0 EIX/hour for 24 hours (Gold - costs 2.0 EIX)

**Mining Mechanics:**
- One active session per user at a time
- Timer-based rewards calculated on completion
- Manual claim required to receive rewards
- Upgrade purchases deducted from user balance
- Session tracking with start/end timestamps

### Wallet System

**EIX Token Management:**
- Internal virtual currency (EIX)
- Balance tracking per user account
- Generated wallet addresses (0x format for compatibility display)
- Transfer functionality between users via wallet addresses or username
- Transaction history with descriptions

## Project Structure

```
/
├── src/                    # Frontend source code
│   ├── assets/            # Static assets (logos, images)
│   ├── components/        # Reusable UI components
│   │   └── ui/           # Radix-based UI primitives
│   ├── contexts/          # React contexts (Auth, Upgrade)
│   ├── features/          # Feature modules
│   │   └── lab/          # Blockchain operations
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities and shared libraries
│   └── pages/             # Page components
├── server/                 # Backend API
│   ├── index.ts           # Express server entry
│   ├── db.ts              # Database initialization
│   ├── auth.ts            # Authentication logic
│   ├── mining.ts          # Mining system logic
│   └── wallet.ts          # Wallet operations
├── shared/                 # Shared schemas and types
├── public/                 # Public static assets
│   └── logos/             # Blockchain logos
├── data/                   # SQLite database storage
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Development

### Running the Application

**Frontend (port 5000):**
```bash
npm run dev
```

**Backend API (port 3001):**
```bash
npm run server
```

### Building for Production

```bash
npm run build
```

## Environment Variables

**Optional:**
- `VITE_PINATA_JWT` - Pinata API key for IPFS uploads (for token logo storage)

## Recent Changes

- 2024-12-01: Landing Page Redesigned to Premium Level - Minimalist Edition (Complete)
  - Complete professional redesign inspired by Allora.network's premium aesthetic
  - **Color Palette**: Electric cyan (#00d4ff), purple (#8b5cf6), dark backgrounds with subtle gradients
  - **Navigation**: Fixed premium nav with logo and "Launch App" CTA button
  - **Hero Section**: Powerful headline "The Collective Intelligence Layer for Community Earning" - Clean, no CTA button
  - **Features Section**: Two professional cards (For Miners + For Developers) with individual CTAs
  - **Final CTA Section**: Minimalist call-to-action "Ready to Join the EthicX Community?" with single button
  - **Footer**: Links to Privacy, Terms, and Whitepaper
  - **Visual Effects**: Floating particle system, glow orbs, smooth Framer Motion animations
  - **Removed Sections**: "Trusted By", "Network in Numbers" stats, "Use Cases", Teams card
  - **Removed Elements**: Learn More button, Start Building button, descriptive CTA text
  - **Professional Messaging**: "For Miners" card updated to remove specific rates/tiers
  - **Fully Responsive**: Mobile-optimized with breakpoints at 768px
  - **Premium Spacing**: Clean multi-section layout with focus on essential content

- 2024-12-01: Landing Page Repositioned as Community Earning Ecosystem (Complete)
  - Complete redesign reflecting true EthicX vision: "Mine EIX. Grow Your Team. Build On Blockchain."
  - Repositioned from generic "multi-chain tools" to **community-driven earning platform** (like OptimAI)
  - Hero messaging emphasizes 3 core pillars: Mine & Earn, Grow Community, Professional Tools
  - Three interactive pillar cards showing: 0.01-0.1 EIX/hour mining, 20% referral bonuses, Solana/EVM tools
  - Pillar cards feature hover effects and icon indicators (Zap, Users, Code)
  - Clean, professional design inspired by NEAR, HOT Protocol, and OptimAI landing pages
  - Background: Professional #0A0D12 with orange-themed gradients and grid overlay
  - CTA button: "GET STARTED" with orange gradient and smooth animations
  - Note highlights verification system unlock for referral rewards
  - Fully responsive: Works seamlessly on desktop, tablet, and mobile
  - Enhanced Claim button: Now only visible when commission tokens are available
  - Team page: 12 verified team members with full earnings tracking

- 2024-12-01: Team Page Layout Optimization (Complete)
  - Fixed "Total Earned" card and "Team Members" header at the top (non-scrollable)
  - Made member list below scrollable only when content exceeds viewport
  - Hidden scrollbar while maintaining smooth scroll functionality
  - Moved "Claim" button from bottom to right side of Team Members header
  - Button integrated into header with space-between layout
  - Compact button styling: 8px padding, 11px font, golden gradient
  - Full claim functionality with hover/disabled states
  - Added 4 sample team members for Bilawal with verified status and earnings data
  - Removed unused icon imports (Gift, Percent) - clean LSP diagnostics

- 2024-11-29: Professional Multi-Asset Wallet Redesign (Complete)
  - Complete redesign to match professional finance app design (Binance/OKX style)
  - Created "My Assets" page showing multiple assets (EIX, BTC, ETH) with professional cards
  - Each asset card displays Balance/Available/Frozen in three-column layout with orange accent labels
  - Implemented Asset Detail page with Deposit/Withdraw/Transfer action buttons
  - Built expandable Financial Records section with transaction history grouped by type
  - Consistent app theme throughout: dark background (#0A0D12), orange accents (#FF7A1A)
  - Professional spacing, typography, and animations matching app design language
  - Mobile-responsive layout with smooth interactions and proper scrolling

- 2024-11-28: Verification and Legal Pages
  - Created dedicated VerificationPage.tsx with step-by-step wallet connection and 0.006 ETH payment flow
  - Created PrivacyPage.tsx, TermsPage.tsx, and WhitepaperPage.tsx for legal documentation
  - Updated ProfilePage.tsx to link to new pages with improved navigation
  - Added routes for /verification, /privacy, /terms, /whitepaper
  - Consistent Binance-style professional design with golden accents (#DAA520)

- 2024-11-28: PostgreSQL Migration
  - Migrated entire database from SQLite to PostgreSQL for scalability
  - Updated all server modules (db.ts, auth.ts, mining.ts, wallet.ts, index.ts) to use async queries with pg driver
  - Database connection via DATABASE_URL environment variable

- 2024-11-27: Repository import and cleanup
  - Extracted project from nested V2-main/V1-main/V15-main directory structure
  - Cleaned up unused zip files and nested folders
  - Configured workflows for frontend (port 5000) and backend (port 3001)
  - Verified both servers running successfully
  - Database auto-initializes on first run

## Configuration Notes

- Vite config includes Node.js polyfills for blockchain libraries
- HMR configured to work with Replit's domain proxy
- Build optimization with code splitting for vendor, blockchain, and UI libraries
- Frontend binds to 0.0.0.0:5000, backend to 0.0.0.0:3001
- API requests proxied from /api/* to backend server
