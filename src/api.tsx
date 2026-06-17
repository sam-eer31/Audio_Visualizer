import { createRoot, Root } from 'react-dom/client'
import { EmbedViewer } from '@/components/embed/EmbedViewer'
import { useAudioStore } from '@/stores/audioStore'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS, BACKGROUND_PRESETS } from '@/lib/constants'
import type { VisualizationMode } from '@/types'

import './index.css'

export interface AudrixOptions {
  container: HTMLElement
  audioElement: HTMLAudioElement
  mode?: VisualizationMode
  backgroundColor?: string
  colorPreset?: string // can be a hex or a preset name
}

export class AudrixVisualizer {
  private container: HTMLElement
  private root: Root
  private audioElement: HTMLAudioElement
  private audioContextInitialized: boolean = false

  constructor(options: AudrixOptions) {
    this.container = options.container
    this.audioElement = options.audioElement

    if (!this.container) throw new Error('AudrixVisualizer requires a container element.')
    if (!this.audioElement) throw new Error('AudrixVisualizer requires an audioElement.')

    // Add custom colors to constants if they are hex codes
    if (options.colorPreset && options.colorPreset.startsWith('#')) {
      const customId = `custom-${options.colorPreset}`
      if (!COLOR_PRESETS.find(p => p.id === customId)) {
        COLOR_PRESETS.push({ id: customId, name: 'Custom', colors: [options.colorPreset, options.colorPreset, options.colorPreset] })
      }
      options.colorPreset = customId
    }

    if (options.backgroundColor && options.backgroundColor.startsWith('#')) {
      const customBgId = `custom-bg-${options.backgroundColor}`
      if (!BACKGROUND_PRESETS.find(p => p.id === customBgId)) {
        BACKGROUND_PRESETS.push({ id: customBgId, name: 'Custom', color: options.backgroundColor })
      }
      options.backgroundColor = customBgId
    }

    // Initialize stores
    if (options.mode) useVisualizerStore.getState().setMode(options.mode)
    if (options.colorPreset) useVisualizerStore.getState().setColorPreset(options.colorPreset)
    if (options.backgroundColor) useVisualizerStore.getState().setBackgroundPreset(options.backgroundColor)

    // Setup audio and event listeners
    this.setupAudio(this.audioElement).catch(console.error)

    this.audioElement.addEventListener('play', () => {
      const ctx = useAudioStore.getState().audioContext
      if (ctx?.state === 'suspended') {
        ctx.resume()
      }
    })

    // Render the React tree
    this.root = createRoot(this.container)
    this.root.render(<EmbedViewer />)
  }

  private async setupAudio(audio: HTMLAudioElement) {
    if (this.audioContextInitialized) return
    this.audioContextInitialized = true

    const fftSize = useVisualizerStore.getState().fftSize

    let ctx = useAudioStore.getState().audioContext
    if (!ctx) {
       ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
       useAudioStore.getState().setAudioContext(ctx)
    }

    let analyser = useAudioStore.getState().analyserNode
    if (!analyser) {
       analyser = ctx.createAnalyser()
       analyser.fftSize = fftSize
       analyser.smoothingTimeConstant = 0.8
       useAudioStore.getState().setAnalyserNode(analyser)
    }
    
    // Attempt to create source node
    try {
      const source = ctx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(ctx.destination)
      useAudioStore.getState().setSourceNode(source)
    } catch (err) {
      console.warn('Audrix: Failed to create MediaElementSource. If the host already created one, Audrix needs to be passed the AnalyserNode directly, or the host should not create one.', err)
    }
    
    useAudioStore.getState().setAudioElement(audio)
  }

  public setMode(mode: VisualizationMode) {
    useVisualizerStore.getState().setMode(mode)
  }

  public setBackgroundColor(color: string) {
    if (color.startsWith('#')) {
      const customBgId = `custom-bg-${color}`
      if (!BACKGROUND_PRESETS.find(p => p.id === customBgId)) {
        BACKGROUND_PRESETS.push({ id: customBgId, name: 'Custom', color: color })
      }
      useVisualizerStore.getState().setBackgroundPreset(customBgId)
    } else {
      useVisualizerStore.getState().setBackgroundPreset(color)
    }
  }

  public setColorPreset(color: string) {
    if (color.startsWith('#')) {
      const customId = `custom-${color}`
      if (!COLOR_PRESETS.find(p => p.id === customId)) {
        COLOR_PRESETS.push({ id: customId, name: 'Custom', colors: [color, color, color] })
      }
      useVisualizerStore.getState().setColorPreset(customId)
    } else {
      useVisualizerStore.getState().setColorPreset(color)
    }
  }

  public destroy() {
    this.root.unmount()
  }
}

// Expose globally for UMD build
if (typeof window !== 'undefined') {
  (window as any).AudrixVisualizer = AudrixVisualizer
}
