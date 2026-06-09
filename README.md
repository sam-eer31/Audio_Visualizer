# SonicWave - Professional Audio Visualizer

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Three.js](https://img.shields.io/badge/Three.js-r184-black?logo=three.js)

**Transform your audio into stunning 3D visualizations. Create, customize, and export professional-grade video content—entirely in your browser.**

[🚀 Live Demo](https://audio-visualizer-teal-two.vercel.app) • [📖 Documentation](#documentation) • [🎯 Features](#features) • [💾 Installation](#installation)

</div>

---

## Overview

**SonicWave** is a cutting-edge, production-ready audio visualization platform designed for content creators, music producers, DJs, and developers. Built with modern web technologies, it provides a powerful yet intuitive interface to create captivating audio-reactive visualizations without requiring any backend infrastructure or subscriptions.

**Key Benefits:**
- ✅ **No Server Required** – 100% client-side processing
- ✅ **Zero Configuration** – Works out of the box
- ✅ **Professional Output** – Export up to 1440p @ 60 FPS
- ✅ **Open Source** – MIT licensed, fully customizable
- ✅ **Privacy-First** – Your audio never leaves your device

---

## 🎨 Features

### Visualization Modes
SonicWave offers **8 immersive, real-time 3D visualizations** that react dynamically to your audio:

| Visualization | Description |
|---|---|
| **Spectrum Bars** | Classic frequency-responsive bars with dynamic color mapping |
| **Circular Spectrum** | 360° frequency visualization radiating from center |
| **Particle Galaxy** | Audio-driven particle system creating an astronomical effect |
| **Audio Sphere** | Morphing 3D sphere responding to bass, mid, and treble frequencies |
| **Wave Tunnel** | Immersive tunnel effect with frequency-responsive waves |
| **Neon Rings** | Concentric rings pulsing with audio intensity |
| **Futuristic Orb** | Advanced sphere with multi-layer frequency analysis |
| **Cyber Grid** | Grid-based visualization with cyberpunk aesthetics |

### Advanced Audio Analysis
- **FFT Analysis** – Real-time Fast Fourier Transform with configurable resolution
- **Frequency Bands** – Dedicated bass, midrange, and treble detection
- **Beat Detection** – Automatic rhythm recognition for synchronized animations
- **Audio Normalization** – Intelligent level adjustment for consistent output

### Customization & Control
- **8+ Color Presets** – Pre-designed palettes for quick styling
- **Background Themes** – Multiple background options for visual variety
- **Parameter Fine-tuning** – Adjust sensitivity, glow, rotation, particle count
- **Real-time Preview** – See changes instantly as you adjust settings
- **Keyboard Shortcuts** – Full keyboard control for seamless workflow

### Professional Video Export
- **Multiple Formats** – MP4 and WebM support
- **Flexible Resolution** – 720p, 1080p, or 1440p output
- **Frame Rate Options** – 30 FPS or 60 FPS rendering
- **Hardware Acceleration** – Optimized encoding for fast exports
- **Progress Tracking** – Real-time export progress visualization

### Format Support
**Audio Formats:** MP3, WAV, M4A, OGG, AAC

**Supported Browsers:**
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18 or higher
- **npm** 9+ or **yarn** 4+
- Modern web browser with WebGL support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sam-eer31/Audio_Visualizer.git
   cd Audio_Visualizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   The application will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Generated files will be in the `dist/` directory, ready for deployment.

### Preview Production Build Locally

```bash
npm run preview
```

---

## 📚 Usage Guide

### Basic Workflow

1. **Upload Audio File**
   - Click the upload button or drag-and-drop your audio file
   - Supported formats: MP3, WAV, M4A, OGG, AAC

2. **Select Visualization**
   - Choose from 8 unique visualization modes
   - Preview updates in real-time

3. **Customize Settings**
   - Adjust colors, sensitivity, background
   - Fine-tune particle effects, rotation speed, glow intensity
   - Preview changes instantly

4. **Control Playback**
   - Use the player controls or keyboard shortcuts
   - Monitor real-time audio statistics

5. **Export Video**
   - Select desired resolution (720p, 1080p, 1440p)
   - Choose frame rate (30 or 60 FPS)
   - Initiate export and download

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `R` | Reset visualization |
| `F` | Toggle fullscreen |
| `E` | Open export panel |

---

## 🏗️ Architecture

### Project Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── audio/                 # Audio control components
│   ├── visualizers/           # Visualization implementations
│   ├── export/                # Export functionality
│   └── layout/                # Application layout
├── hooks/                     # Custom React hooks
├── stores/                    # Zustand state management
├── lib/                       # Utility functions
├── types/                     # TypeScript type definitions
├── utils/                     # Helper functions
├── App.tsx                    # Root component
└── main.tsx                   # Application entry point
```

### Technology Stack

**Frontend Framework:**
- React 19 – Modern UI library
- TypeScript – Type-safe JavaScript
- Vite – Lightning-fast build tool

**3D Graphics:**
- Three.js – WebGL 3D library
- React Three Fiber – React renderer for Three.js
- Drei – Useful helpers for React Three Fiber

**Styling & Animation:**
- Tailwind CSS v4 – Utility-first CSS framework
- Framer Motion – Production-ready animations

**State Management:**
- Zustand – Lightweight state management

**Audio Processing:**
- Web Audio API – Browser audio analysis
- FFT Analysis – Frequency domain analysis
- MediaRecorder API – Video encoding

**UI Components:**
- Lucide React – Beautiful SVG icons

---

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push your repository to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Click "Deploy"

### Deploy to GitHub Pages

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

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

---

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 🐛 Troubleshooting

### Visualization not responding to audio
- Ensure audio file is in a supported format
- Check browser console for errors
- Verify speaker/headphone volume

### Poor performance or stuttering
- Reduce particle count in settings
- Lower FFT size to decrease CPU load
- Close other browser tabs
- Update graphics drivers

### Export fails
- Reduce export resolution (try 720p first)
- Close other applications
- Ensure sufficient disk space
- Try a different browser

### "WebGL not supported" error
- Update your browser to the latest version
- Check GPU drivers
- Try Chrome (most compatible)
- Enable hardware acceleration

---

## 📋 Use Cases

- 🎵 **Music Videos** – Create professional audio visualizations
- 🎬 **Content Creation** – YouTube, TikTok, Instagram content
- 🎙️ **Streaming** – Twitch overlays and backgrounds
- 🎧 **DJ/Live Events** – Real-time performance visualization
- 📚 **Education** – Learn audio frequency visualization

---

## 📝 License

MIT License – See [LICENSE](LICENSE) file for details.

---

## 📞 Support

- **Issues** – [GitHub Issues](https://github.com/sam-eer31/Audio_Visualizer/issues)
- **Live Demo** – [https://audio-visualizer-teal-two.vercel.app](https://audio-visualizer-teal-two.vercel.app)

---

<div align="center">

**Made with ❤️ by [sam-eer31](https://github.com/sam-eer31)**

⭐ If you find this project useful, please consider giving it a star!

</div>