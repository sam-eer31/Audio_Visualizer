# SonicWave - Audio Visualizer

A premium, production-ready audio visualizer that runs entirely in the browser. Upload audio files, choose from 8 stunning 3D visualizations, customize settings, and export your creation as a video.

## Features

- **8 Visualization Modes**: Spectrum Bars, Circular Spectrum, Particle Galaxy, Audio Sphere, Wave Tunnel, Neon Rings, Futuristic Orb, Cyber Grid
- **Real-time Audio Analysis**: FFT analysis, bass/mid/treble detection, beat detection
- **Customizable**: Color presets, background presets, sensitivity, FFT size, particle count, glow intensity, rotation speed
- **Video Export**: Export your visualization as MP4/WebM in 720p, 1080p, or 1440p at 30 or 60 FPS
- **Premium UI**: Dark glassmorphism design inspired by Linear, Stripe, and Vercel
- **100% Client-Side**: No backend, no server, no authentication required
- **GitHub Pages Ready**: Static site, deploy anywhere

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4
- Three.js + React Three Fiber + Drei
- Framer Motion
- Zustand
- Web Audio API + MediaRecorder API
- Lucide React Icons

## Getting Started

### Prerequisites

- Node.js 18+

### Install & Run

```bash
npm install
npm run dev
```

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deploy to GitHub Pages

1. Build the project: `npm run build`
2. Push the `dist/` folder to your `gh-pages` branch, or use GitHub Actions:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Keyboard Shortcuts

| Key   | Action       |
|-------|-------------|
| Space | Play / Pause |
| R     | Reset        |
| F     | Fullscreen   |
| E     | Export       |

## Project Structure

```
src/
  components/
    ui/           # Base UI components (Button, Badge, Progress, Toast)
    audio/        # Audio controls (Uploader, Player, Volume, Info, LiveStats)
    visualizers/  # 8 visualization modes + Canvas wrapper + Settings
    export/       # Export panel and progress
    layout/       # App layout (Header, LeftPanel, CenterPanel, RightPanel)
  hooks/          # useAudioControls, useAudioAnalyzer, useKeyboardShortcuts, useExport
  stores/         # Zustand stores (audio, visualizer, export, UI)
  lib/            # Utilities and constants
  types/          # TypeScript type definitions
  utils/          # Audio processing utilities
```

## Supported Audio Formats

MP3, WAV, M4A, OGG, AAC

## License

MIT
