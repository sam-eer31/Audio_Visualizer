<div align="center">
  <img src="public/logo.png" alt="Audrix Logo" width="160" />
---
  [![Live App](https://img.shields.io/badge/🚀_OPEN_APP-Start_Creating-FF6B6B?style=for-the-badge&labelColor=1a1a2e)](https://audio-visualizer-teal-two.vercel.app)
</div>

---
<div align="center">
  
## ⚡ Start Creating Now - No Installation Required!

### **👉 [OPEN AUDRIX](https://audio-visualizer-teal-two.vercel.app) 👈**

**Transform your audio into stunning 3D visualizations. Upload audio, choose visualization, customize effects, and export professional videos—all in your browser!**
</div>
---

<div align="center">

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-purple?logo=vite)
![Three.js](https://img.shields.io/badge/Three.js-r184-black?logo=three.js)

</div>

---

## Overview

**Audrix** is a production-ready audio visualization platform designed for content creators, music producers, DJs, and developers. Create captivating audio-reactive visualizations without requiring any backend infrastructure, subscriptions, or complex setup.

**Key Benefits:**
- ✅ **No Server Required** – 100% client-side processing
- ✅ **Instant Access** – Start creating immediately
- ✅ **Professional Output** – Export up to 1440p @ 60 FPS
- ✅ **Open Source** – MIT licensed, fully customizable
- ✅ **Privacy-First** – Your audio never leaves your device

---

## 🎨 Features

### 8 Visualization Modes
Choose from 8 immersive, real-time 3D visualizations that react dynamically to your audio:

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
- **Color Presets** – Pre-designed palettes for quick styling
- **Background Themes** – Multiple background options for visual variety
- **Fine-tune Parameters** – Adjust sensitivity, glow, rotation, particle count
- **Real-time Preview** – See changes instantly as you adjust settings
- **Keyboard Shortcuts** – Full keyboard control for seamless workflow

### Professional Video Export
- **Multiple Formats** – MP4 and WebM support
- **Flexible Resolution** – 720p, 1080p, or 1440p output
- **Frame Rate Options** – 30 FPS or 60 FPS rendering
- **Hardware Acceleration** – Optimized encoding for fast exports
- **Progress Tracking** – Real-time export progress visualization

### Supported Audio Formats
**MP3 • WAV • M4A • OGG • AAC**

### Browser Compatibility
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 🚀 Getting Started

### Option 1: Use Online (Instant - No Installation)
👉 **[Open Audrix](https://audio-visualizer-teal-two.vercel.app)** ← Click to Start Creating!

1. Upload your audio file
2. Select a visualization mode
3. Customize colors and effects
4. Export as video

### Option 2: Run Locally

```bash
# Clone the repository
git clone https://github.com/sam-eer31/Audio_Visualizer.git
cd Audio_Visualizer

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:5173`

---

## 📚 How to Use

### Step-by-Step Workflow

1. **Upload Audio File**
   - Click the upload button or drag-and-drop your audio file
   - Supported formats: MP3, WAV, M4A, OGG, AAC

2. **Choose Visualization**
   - Select from 8 unique visualization modes
   - Preview updates in real-time as you explore

3. **Customize & Refine**
   - Adjust colors, sensitivity, and backgrounds
   - Fine-tune particle effects, rotation speed, and glow intensity
   - See changes instantly in the preview

4. **Play & Control**
   - Use player controls or keyboard shortcuts
   - Monitor real-time audio statistics and frequency data

5. **Export Video**
   - Select desired resolution (720p, 1080p, 1440p)
   - Choose frame rate (30 or 60 FPS)
   - Click export and download your video

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `R` | Reset visualization |
| `F` | Toggle fullscreen |
| `E` | Open export panel |

---

## 🏗️ Project Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── audio/                 # Audio controls & upload
│   ├── visualizers/           # 8 visualization implementations
│   ├── export/                # Video export functionality
│   └── layout/                # App layout & panels
├── hooks/                     # Custom React hooks
├── stores/                    # Zustand state management
├── lib/                       # Utility functions & constants
├── types/                     # TypeScript definitions
├── utils/                     # Helper functions
├── App.tsx                    # Root component
└── main.tsx                   # Entry point
```

### Tech Stack

**Frontend:**
- React 19 – Modern UI library with hooks
- TypeScript – Type-safe JavaScript
- Vite – Fast build tool with HMR

**3D Graphics:**
- Three.js – WebGL 3D library
- React Three Fiber – React renderer for Three.js
- Drei – Helper components and utilities

**Styling & Animation:**
- Tailwind CSS v4 – Utility-first CSS framework
- Framer Motion – Smooth animations

**State Management:**
- Zustand – Lightweight, fast state management

**Audio & Export:**
- Web Audio API – Real-time audio analysis
- FFT Analysis – Frequency domain analysis
- MediaRecorder API – Video encoding

**UI Components:**
- Lucide React – Icon library

---

## 🌐 Deploy Your Own

### Deploy to Vercel (Recommended)

1. Push your repository to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Click "Deploy"

Your app will be live in minutes with zero configuration.

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

### Build for Production

```bash
npm run build
```

---

## 🔧 Development

### Available Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run preview      # Preview production build locally
npm run lint         # Run ESLint checks
```

### Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Commit with clear messages (`git commit -m 'Add your feature'`)
5. Push to your branch (`git push origin feature/your-feature`)
6. Open a Pull Request

**Code Guidelines:**
- Use TypeScript for type safety
- Follow ESLint rules
- Write descriptive commit messages
- Add comments for complex logic

---

## 🐛 Troubleshooting

### Visualization not responding to audio
**Solution:**
- Ensure audio file is in a supported format (MP3, WAV, M4A, OGG, AAC)
- Check browser console for errors (F12)
- Verify speaker/headphone volume
- Try uploading a different audio file

### Poor performance or stuttering
**Solution:**
- Reduce particle count in visualization settings
- Lower FFT size to decrease CPU usage
- Close other browser tabs and applications
- Update graphics drivers
- Ensure GPU acceleration is enabled

### Export fails or is very slow
**Solution:**
- Reduce export resolution (start with 720p)
- Close other applications to free up system memory
- Ensure sufficient disk space (~500MB for 1080p video)
- Try a different browser
- Clear browser cache

### "WebGL not supported" error
**Solution:**
- Update your browser to the latest version
- Check and update GPU drivers
- Try Chrome (best WebGL support)
- Enable hardware acceleration in browser settings

### Audio upload fails
**Solution:**
- Verify file is in supported format
- Check file size is under 500MB
- Remove special characters from filename
- Try re-encoding the audio file

---

## 📋 Use Cases

- 🎵 **Music Videos** – Create stunning audio-reactive music video backgrounds
- 🎬 **Content Creation** – Generate content for YouTube, TikTok, Instagram Reels
- 🎙️ **Streaming** – Twitch stream overlays and background content
- 🎧 **DJ/Live Events** – Real-time visualization during performances
- 📚 **Education** – Visual teaching tool for audio frequency concepts
- 🎨 **Creative Projects** – Any project requiring audio visualization

---

## 📝 License

MIT License – See [LICENSE](LICENSE) file for complete details.

You are free to:
- Use commercially
- Modify and distribute
- Use privately

Simply include the license notice in any distribution.

---

## 📞 Support & Feedback

- **Report Issues** – [GitHub Issues](https://github.com/sam-eer31/Audio_Visualizer/issues)
- **Discussions** – [GitHub Discussions](https://github.com/sam-eer31/Audio_Visualizer/discussions)
- **Live Application** – [https://audio-visualizer-teal-two.vercel.app](https://audio-visualizer-teal-two.vercel.app)

---

<div align="center">

### 👉 **[START CREATING NOW](https://audio-visualizer-teal-two.vercel.app)** 👈

**Made with ❤️ by [sam-eer31](https://github.com/sam-eer31)**

⭐ If you find this useful, please give it a star!

</div>
