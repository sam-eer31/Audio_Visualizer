import { useCallback } from 'react'
import { useExportStore } from '@/stores/exportStore'
import { useAudioStore } from '@/stores/audioStore'
import { useUIStore } from '@/stores/uiStore'
import * as Mp4Muxer from 'mp4-muxer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { BACKGROUND_PRESETS } from '@/lib/constants'
import { RESOLUTION_MAP } from '@/types'

function drawBackground(ctx: CanvasRenderingContext2D, presetId: string, width: number, height: number) {
  let fill: string | CanvasGradient
  if (presetId === 'deep-space') {
    const g = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2)
    g.addColorStop(0, '#0a0a2e'); g.addColorStop(0.6, '#050510'); g.addColorStop(1, '#000000')
    fill = g
  } else if (presetId === 'midnight') {
    const g = ctx.createLinearGradient(0, 0, 0, height)
    g.addColorStop(0, '#0d1117'); g.addColorStop(1, '#161b22')
    fill = g
  } else if (presetId === 'nebula') {
    const g = ctx.createRadialGradient(width * 0.3, height * 0.4, 0, width * 0.3, height * 0.4, width)
    g.addColorStop(0, '#1a0040'); g.addColorStop(0.5, '#0a0015'); g.addColorStop(1, '#000000')
    fill = g
  } else if (presetId === 'obsidian') {
    const g = ctx.createLinearGradient(0, 0, width, height)
    g.addColorStop(0, '#0c0c0c'); g.addColorStop(0.5, '#1a1a2e'); g.addColorStop(1, '#0c0c0c')
    fill = g
  } else if (presetId === 'slate-dark') {
    const g = ctx.createLinearGradient(0, 0, width * 0.6, height)
    g.addColorStop(0, '#0f172a'); g.addColorStop(1, '#1e293b')
    fill = g
  } else {
    const bg = BACKGROUND_PRESETS.find(b => b.id === presetId) || BACKGROUND_PRESETS[0]
    fill = bg.color
  }
  ctx.fillStyle = fill
  ctx.fillRect(0, 0, width, height)
}

function drawImageContain(ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, w: number, h: number) {
  const imgW = img.width
  const imgH = img.height
  const imgRatio = imgW / imgH
  const targetRatio = w / h

  let dx = 0, dy = 0, dWidth = w, dHeight = h

  if (imgRatio > targetRatio) {
    // Image is wider than target
    dHeight = w / imgRatio
    dy = (h - dHeight) / 2
  } else {
    // Image is taller than target
    dWidth = h * imgRatio
    dx = (w - dWidth) / 2
  }

  ctx.drawImage(img, 0, 0, imgW, imgH, dx, dy, dWidth, dHeight)
}

export function useExport() {
  const { resolution, quality, frameRate, setIsExporting, setProgress, setError, setCancelExport, setExportSnapshot } = useExportStore()
  const { audioElement, audioDestination, audioFile, audioContext, analyserNode } = useAudioStore()
  const addToast = useUIStore((s) => s.addToast)

  const startExport = useCallback(async () => {
    if (!(window as any).VideoEncoder || !(window as any).AudioEncoder) {
      addToast('WebCodecs not supported. Please use Chrome, Edge, or Brave.', 'error')
      return
    }

    if (!audioElement || !audioFile || !audioDestination) {
      addToast('Please load audio first', 'error')
      return
    }

    const unmuteSpeakers = () => {
      if (analyserNode && audioContext) {
        try {
          analyserNode.disconnect()
          analyserNode.connect(audioContext.destination)
        } catch (e) {
          console.warn('Failed to reconnect analyser to destination:', e)
        }
      }
    }

    try {
      const glCanvasEl = document.querySelector('canvas')
      if (glCanvasEl) {
        try {
          const snapshot = glCanvasEl.toDataURL('image/png')
          setExportSnapshot(snapshot)
        } catch (e) {
          console.warn('Failed to take canvas snapshot:', e)
        }
      }

      setIsExporting(true)
      setProgress(0)
      setError(null)

      const originalLoop = audioElement.loop
      audioElement.loop = false

      // Wait a tick for the DPR-inflation effect to kick in
      const targetRes = RESOLUTION_MAP[resolution]
      const encWidth = targetRes.width
      const encHeight = targetRes.height

      // Wait for the canvas to resize to the target size
      let glCanvas = document.querySelector('canvas') as HTMLCanvasElement | null
      for (let i = 0; i < 20; i++) {
        glCanvas = document.querySelector('canvas')
        if (glCanvas && glCanvas.width >= encWidth * 0.9 && glCanvas.height >= encHeight * 0.9) {
          break
        }
        await new Promise(r => setTimeout(r, 100))
      }
      if (!glCanvas) throw new Error('Canvas not found')

      // Composite canvas: background + WebGL
      const comp = document.createElement('canvas')
      comp.width = encWidth
      comp.height = encHeight
      const ctx = comp.getContext('2d', { alpha: false })!
      const bgPreset = useVisualizerStore.getState().backgroundPreset

      // ─── Pick best video codec ───────────────────────────────
      const videoBitrate = { low: 10_000_000, medium: 25_000_000, high: 50_000_000 }[quality]
      const tryCodecs = [
        { codec: 'avc1.640033', width: encWidth, height: encHeight, bitrate: videoBitrate, framerate: frameRate },
        { codec: 'avc1.4D0033', width: encWidth, height: encHeight, bitrate: videoBitrate, framerate: frameRate },
        { codec: 'avc1.42E01F', width: encWidth, height: encHeight, bitrate: videoBitrate, framerate: frameRate },
        { codec: 'vp09.00.50.08', width: encWidth, height: encHeight, bitrate: videoBitrate, framerate: frameRate },
        { codec: 'vp09.00.10.08', width: encWidth, height: encHeight, bitrate: videoBitrate, framerate: frameRate },
      ]
      let videoCfg: any = null
      for (const cfg of tryCodecs) {
        try {
          const r = await (window as any).VideoEncoder.isConfigSupported(cfg)
          if (r.supported) { videoCfg = r.config ?? cfg; break }
        } catch { /* next */ }
      }
      if (!videoCfg) throw new Error('No supported video codec found on this device.')

      // ─── Muxer ──────────────────────────────────────────────
      const muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: { codec: videoCfg.codec.startsWith('vp09') ? 'vp9' : 'avc', width: encWidth, height: encHeight },
        audio: { codec: 'aac', sampleRate: 48000, numberOfChannels: 2 },
        fastStart: false,
        firstTimestampBehavior: 'cross-track-offset',
      })

      // ─── Video encoder ───────────────────────────────────────
      const videoEncoder = new (window as any).VideoEncoder({
        output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta),
        error: (e: any) => console.error('VideoEncoder:', e),
      })
      videoEncoder.configure(videoCfg)

      // ─── Audio ──────────────────────────────────────────────
      const audioTrack = audioDestination.stream.getAudioTracks()[0]
      const audioEncoder = new (window as any).AudioEncoder({
        output: (chunk: any, meta: any) => muxer.addAudioChunk(chunk, meta),
        error: (e: any) => console.error('AudioEncoder:', e),
      })
      audioEncoder.configure({ codec: 'mp4a.40.2', sampleRate: 48000, numberOfChannels: 2, bitrate: 192_000 })

      // Audio capture via MediaStreamTrackProcessor
      const audioProcessor = new (window as any).MediaStreamTrackProcessor({ track: audioTrack })
      const audioReader = audioProcessor.readable.getReader()

      let firstAudioTimestampUs: number | null = null
      let firstAudioTimeMs = 0
      let stopped = false
      let ticker: any = null
      let safetyTimeout: any = null

      const cleanupTickers = () => {
        if (ticker) clearInterval(ticker)
        if (safetyTimeout) clearTimeout(safetyTimeout)
      }

      function pumpAudio() {
        audioReader.read().then(({ done, value }: any) => {
          if (value) {
            if (firstAudioTimestampUs === null) {
              firstAudioTimestampUs = value.timestamp
              firstAudioTimeMs = performance.now()
            }
            if (!stopped && audioEncoder.state === 'configured') audioEncoder.encode(value)
            value.close()
          }
          if (!done && !stopped) pumpAudio()
        }).catch(() => {})
      }

      // ─── Video capture: Synchronous Callback from R3F ────────
      let frameCount = 0
      let lastTime = 0
      const videoFrameDurationUs = 1_000_000 / frameRate

      const onR3FFrame = (canvasElement: HTMLCanvasElement) => {
        if (stopped) return
        if (videoEncoder.state !== 'configured') return
        if (firstAudioTimestampUs === null) return // Wait for audio stream to start

        const now = performance.now()
        if (now - lastTime < 1000 / frameRate) return
        lastTime = now

        try {
          // Draw background
          drawBackground(ctx, bgPreset, encWidth, encHeight)
          // Draw the WebGL visualizer on top with contain fitting (no stretching, zooming, or blur)
          drawImageContain(ctx, canvasElement, encWidth, encHeight)
          
          // Create VideoFrame with precise timestamp aligned to the audio timeline
          const elapsedMs = now - firstAudioTimeMs
          const timestampUs = Math.round(firstAudioTimestampUs + (elapsedMs * 1000))
          
          const frame = new (window as any).VideoFrame(comp, { timestamp: timestampUs })
          videoEncoder.encode(frame, { keyFrame: frameCount % (frameRate * 2) === 0 })
          frame.close()
          frameCount++
        } catch (e) {
          console.error('Frame capture error:', e)
        }
      }

      useExportStore.getState().setOnFrame(onR3FFrame)

      // ─── Stop / finalize ─────────────────────────────────────
      const startTime = Date.now()
      const duration = audioElement.duration

      const stopExport = async () => {
        if (stopped) return
        stopped = true
        cleanupTickers()
        useExportStore.getState().setOnFrame(null)
        setCancelExport(null)
        setExportSnapshot(null)
        audioElement.pause()
        audioElement.loop = originalLoop
        await audioReader.cancel().catch(() => {})

        unmuteSpeakers()

        try {
          if (frameCount === 0) throw new Error('No video frames captured — WebGL canvas could not be read.')

          await videoEncoder.flush()
          await audioEncoder.flush()
          videoEncoder.close()
          audioEncoder.close()
          muxer.finalize()

          const blob = new Blob([muxer.target.buffer], { type: 'video/mp4' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `audrix-${Date.now()}.mp4`
          a.click()
          URL.revokeObjectURL(url)

          setIsExporting(false)
          setProgress(100)
          setExportSnapshot(null)
          addToast('Export complete!', 'success')
        } catch (e: any) {
          console.error('Finalize error:', e)
          setError(e.message)
          addToast('Export failed: ' + e.message, 'error')
          setIsExporting(false)
          setExportSnapshot(null)
        }
      }

      const cancelExport = async () => {
        if (stopped) return
        stopped = true
        cleanupTickers()
        useExportStore.getState().setOnFrame(null)
        setCancelExport(null)
        setExportSnapshot(null)
        audioElement.pause()
        audioElement.loop = originalLoop
        await audioReader.cancel().catch(() => {})

        unmuteSpeakers()

        try {
          videoEncoder.close()
          audioEncoder.close()
        } catch (e) {
          console.warn('Error closing encoders:', e)
        }

        setIsExporting(false)
        setProgress(0)
        setExportSnapshot(null)
        addToast('Export cancelled', 'info')
      }

      setCancelExport(cancelExport)

      // Mute speakers during export
      if (analyserNode && audioContext) {
        try {
          analyserNode.disconnect(audioContext.destination)
        } catch (e) {
          try {
            analyserNode.disconnect()
          } catch (err) {
            console.warn('Failed to disconnect analyserNode:', err)
          }
        }
      }

      // Start everything
      pumpAudio()
      audioElement.currentTime = 0
      await audioElement.play()

      // Progress ticker
      ticker = setInterval(() => {
        if (stopped) { clearInterval(ticker); return }
        const elapsed = (Date.now() - startTime) / 1000
        setProgress(Math.min((elapsed / duration) * 100, 99))
      }, 300)

      audioElement.addEventListener('ended', () => {
        cleanupTickers()
        stopExport()
      }, { once: true })

      // Safety timeout
      safetyTimeout = setTimeout(() => {
        if (!stopped) { cleanupTickers(); stopExport() }
      }, (duration + 3) * 1000)

    } catch (err: any) {
      console.error('Export error:', err)
      useExportStore.getState().setOnFrame(null)
      setCancelExport(null)
      setExportSnapshot(null)
      setIsExporting(false)
      setError(err.message)
      addToast('Export failed: ' + err.message, 'error')

      if (analyserNode && audioContext) {
        try {
          analyserNode.disconnect()
          analyserNode.connect(audioContext.destination)
        } catch (e) {
          console.warn('Failed to reconnect analyser to destination:', e)
        }
      }
    }
  }, [resolution, quality, frameRate, audioElement, audioFile, audioDestination, audioContext, analyserNode, setIsExporting, setProgress, setError, setCancelExport, setExportSnapshot, addToast])

  return { startExport }
}
