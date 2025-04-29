# DonutExtension

A browser extension application providing Web3 functionality support.

## Tech Stack

- [WXT](https://wxt.dev/) - Web Extension Development Tool
- [React](https://react.dev/) - Frontend UI Library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript superset
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Web3Auth](https://web3auth.io/) - Web3 Authentication
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana blockchain interaction
- [Zustand](https://zustand-demo.pmnd.rs/) - State Management

## Installation

This project uses [pnpm](https://pnpm.io/) as the package manager. If you haven't installed pnpm yet, please install it first:

```bash
npm install -g pnpm
```

Then, clone the repository and install dependencies:

```bash
git clone https://github.com/DonutLabs-ai/DonutExtension.git
cd DonutExtension
pnpm install
```

## Development

Start the development server:

```bash
# For Chrome browser development
pnpm dev

# For Firefox browser development
pnpm dev:firefox
```

## Build

Build production version:

```bash
# Build Chrome extension
pnpm build

# Build Firefox extension
pnpm build:firefox

# Package Chrome extension as a zip file
pnpm zip

# Package Firefox extension as a zip file
pnpm zip:firefox
```

## Project Structure

```
src/
├── api/            # API wrappers
├── assets/         # Static assets
├── components/     # Reusable components
├── constants/      # Constant definitions
├── entrypoints/    # Extension entry points
│   ├── background.ts  # Background script
│   ├── content.ts     # Content script
│   └── popup/         # Popup window
├── hooks/          # Custom React hooks
├── layouts/        # Layout components
├── pages/          # Page components
├── services/       # Service logic
├── store/          # State management
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Script Description

| Command               | Description                             |
| --------------------- | --------------------------------------- |
| `pnpm dev`            | Start Chrome extension dev server       |
| `pnpm dev:firefox`    | Start Firefox extension dev server      |
| `pnpm build`          | Build Chrome extension                  |
| `pnpm build:firefox`  | Build Firefox extension                 |
| `pnpm zip`            | Package Chrome extension as a zip file  |
| `pnpm zip:firefox`    | Package Firefox extension as a zip file |
| `pnpm compile`        | TypeScript type checking                |
| `pnpm lint`           | Run ESLint checks                       |
| `pnpm lint:fix`       | Fix ESLint errors                       |
| `pnpm lint:style`     | Run StyleLint checks                    |
| `pnpm lint:style:fix` | Fix StyleLint errors                    |
| `pnpm format`         | Format code                             |
