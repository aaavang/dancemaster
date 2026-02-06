# DanceMaster

A web app for visualizing Irish ceili dance choreography. See formations, moves, and full dances animated in real-time with configurable dancer positions.

## Features

- **Formations**: Eight Hand Square, Two Facing Two
- **Moves**: Sidesteps, two-threes, swings, quarter circles, house moves, advance & retire, and more
- **Dances**: The Three Tunes, Bonfire Dance
- **Interactive**: Click dancers to see their role and relationships

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- **TypeScript** with strict mode
- **Vite** for bundling and dev server
- **anime.js** for smooth dancer animations
- **ESLint** with typescript-eslint
- **GitHub Actions** for automatic deployment to GitHub Pages

## Project Structure

```
src/
  main.ts           Entry point
  types.ts          Shared TypeScript types and interfaces
  enums.ts          Formation, position, direction constants
  header.ts         Header/ticker display management
  dance.ts          Dance class hierarchy (Dance, FigureDance, CeiliDance)
  danceMaster.ts    Core DanceMaster class - dancer creation and state
  dances.ts         Dance definitions (Three Tunes, Bonfire)
  style.css         Application styles
  moves/
    index.ts        Barrel exports and Moves sequencer class
    utils.ts        Position calculations, rotation helpers, animation utils
    facing.ts       Face partner, face center, turn around
    partner.ts      Switch, swing, advance & retire, turn partner
    circle.ts       Quarter circle, inner circle moves
    house.ts        Quarter house moves
    steps.ts        Sidestep, two-threes with direction variants
    special.ts      Sound, clap, go home, mingle, randomize
public/
  clap.mp3          Clap sound effect
```
