import { useCallback, useRef, useEffect } from 'react'
import { useAudioStore } from '@/stores/audioStore'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { useUIStore } from '@/stores/uiStore'
import type { AudioFile } from '@/types'
import { SUPPORTED_FORMATS } from '@/lib/constants'

export function useAudioControls() {
  const {
    audioFile,
    playbackState,
    volume,
    loop,
    audioContext,
    analyserNode,
    gainNode,
    audioElement,
    audioDestination,
    sourceNode,
    setAudioFile,
    setPlaybackState,
    setDuration,
    setCurrentTime,
    setLoop,
    setAudioContext,
    setAnalyserNode,
    setGainNode,
    setAudioElement,
    setAudioDestination,
    setSourceNode,
  } = useAudioStore()
  const fftSize = useVisualizerStore((s) => s.fftSize)
  const addToast = useUIStore((s) => s.addToast)
  const animFrameRef = useRef<number>(0)

  const teardownAudio = useCallback(async () => {
    // Stop and clean up audio element
    if (audioElement) {
      audioElement.pause()
      audioElement.removeAttribute('src')
      audioElement.load()
    }

    // Disconnect source node
    if (sourceNode) {
      try { sourceNode.disconnect() } catch { /* noop */ }
    }

    // Close audio context
    if (audioContext && audioContext.state !== 'closed') {
      try { await audioContext.close() } catch { /* noop */ }
    }

    // Reset all audio store refs
    setAudioContext(null)
    setAnalyserNode(null)
    setGainNode(null)
    setAudioDestination(null)
    setSourceNode(null)
    setAudioElement(null)
  }, [audioElement, audioContext, sourceNode, setAudioContext, setAnalyserNode, setGainNode, setAudioDestination, setSourceNode, setAudioElement])

  const createAudioGraph = useCallback(async (audio: HTMLAudioElement) => {
    const ctx = new AudioContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = fftSize
    analyser.smoothingTimeConstant = 0.8

    const gain = ctx.createGain()
    gain.gain.value = volume

    const dest = ctx.createMediaStreamDestination()

    const source = ctx.createMediaElementSource(audio)
    source.connect(gain)
    gain.connect(analyser)
    analyser.connect(ctx.destination)
    gain.connect(dest)

    setAudioContext(ctx)
    setAnalyserNode(analyser)
    setGainNode(gain)
    setAudioDestination(dest)
    setSourceNode(source)

    return { ctx, analyser, gain, dest, source }
  }, [fftSize, volume, setAudioContext, setAnalyserNode, setGainNode, setAudioDestination, setSourceNode])

  const loadFile = useCallback(
    async (file: File) => {
      if (!SUPPORTED_FORMATS.some((f) => file.type === f || file.name.match(/\.(mp3|wav|m4a|ogg|aac)$/i))) {
        addToast('Unsupported audio format. Please use MP3, WAV, M4A, OGG, or AAC.', 'error')
        return
      }

      try {
        useAudioStore.getState().setIsLoading(true)
        cancelAnimationFrame(animFrameRef.current)

        // Fully tear down previous audio setup
        await teardownAudio()

        // Create fresh audio element
        const url = URL.createObjectURL(file)
        const audio = new Audio(url)
        audio.crossOrigin = 'anonymous'
        audio.volume = 1
        audio.loop = useAudioStore.getState().loop

        await new Promise<void>((resolve, reject) => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true })
          audio.addEventListener('error', () => reject(new Error('Failed to load audio')), { once: true })
          audio.load()
        })

        // Build a fresh audio graph with new context
        await createAudioGraph(audio)

        audio.addEventListener('timeupdate', () => {
          setCurrentTime(audio.currentTime)
        })

        audio.addEventListener('ended', () => {
          setPlaybackState('stopped')
          setCurrentTime(0)
        })

        const info: AudioFile = {
          file,
          name: file.name,
          duration: audio.duration,
          format: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
          size: file.size,
        }

        setAudioFile(info)
        setAudioElement(audio)
        setDuration(audio.duration)
        setCurrentTime(0)
        setPlaybackState('idle')

        addToast(`Loaded: ${file.name}`, 'success')
      } catch (err) {
        addToast(err instanceof Error ? err.message : 'Failed to load audio file', 'error')
      } finally {
        useAudioStore.getState().setIsLoading(false)
      }
    },
    [teardownAudio, createAudioGraph, addToast, setAudioFile, setAudioElement, setDuration, setCurrentTime, setPlaybackState]
  )

  const play = useCallback(async () => {
    if (!audioElement) return
    const ctx = useAudioStore.getState().audioContext
    if (ctx && ctx.state === 'suspended') await ctx.resume()
    await audioElement.play()
    setPlaybackState('playing')
  }, [audioElement, setPlaybackState])

  const pause = useCallback(() => {
    if (!audioElement) return
    audioElement.pause()
    setPlaybackState('paused')
  }, [audioElement, setPlaybackState])

  const stop = useCallback(() => {
    if (!audioElement) return
    audioElement.pause()
    audioElement.currentTime = 0
    setCurrentTime(0)
    setPlaybackState('stopped')
  }, [audioElement, setCurrentTime, setPlaybackState])

  const seek = useCallback(
    (time: number) => {
      if (!audioElement) return
      audioElement.currentTime = time
      setCurrentTime(time)
    },
    [audioElement, setCurrentTime]
  )

  const setVolumeLevel = useCallback(
    (vol: number) => {
      useAudioStore.getState().setVolume(vol)
      const currentGain = useAudioStore.getState().gainNode
      if (currentGain) {
        currentGain.gain.value = vol
      }
    },
    []
  )

  // Update FFT size when it changes
  useEffect(() => {
    if (analyserNode) {
      analyserNode.fftSize = fftSize
    }
  }, [fftSize, analyserNode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const toggleLoop = useCallback(() => {
    const nextLoop = !loop
    setLoop(nextLoop)
    if (audioElement) {
      audioElement.loop = nextLoop
    }
  }, [loop, audioElement, setLoop])

  return {
    audioFile,
    playbackState,
    currentTime: useAudioStore((s) => s.currentTime),
    duration: useAudioStore((s) => s.duration),
    volume: useAudioStore((s) => s.volume),
    loop,
    loadFile,
    play,
    pause,
    stop,
    seek,
    setVolume: setVolumeLevel,
    toggleLoop,
  }
}
