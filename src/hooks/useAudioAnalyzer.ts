import { useRef, useCallback } from 'react'
import { useAudioStore } from '@/stores/audioStore'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { getFrequencyBands, getPeakFrequency, getPeak } from '@/utils/audioUtils'
import type { AudioAnalysis } from '@/types'

const EMPTY_FREQUENCY = new Uint8Array(0)
const EMPTY_TIME = new Uint8Array(0)
const EMPTY_ANALYSIS: AudioAnalysis = {
  frequencyData: EMPTY_FREQUENCY,
  timeDomainData: EMPTY_TIME,
  bass: 0,
  mid: 0,
  treble: 0,
  peak: 0,
  peakFrequency: 0,
  isBeat: false,
}

export function useAudioAnalyzer() {
  const analyserNode = useAudioStore((s) => s.analyserNode)
  const audioContext = useAudioStore((s) => s.audioContext)
  const sensitivity = useVisualizerStore((s) => s.sensitivity)

  const frequencyRef = useRef<Uint8Array | null>(null)
  const timeDomainRef = useRef<Uint8Array | null>(null)
  const prevBassRef = useRef(0)
  const beatThresholdRef = useRef(0.3)

  const getAnalysis = useCallback((): AudioAnalysis => {
    if (!analyserNode || !audioContext) return EMPTY_ANALYSIS

    const bufferLength = analyserNode.frequencyBinCount

    if (!frequencyRef.current || frequencyRef.current.length !== bufferLength) {
      frequencyRef.current = new Uint8Array(bufferLength)
      timeDomainRef.current = new Uint8Array(bufferLength)
    }

    const frequencyData = frequencyRef.current
    const timeDomainData = timeDomainRef.current!

    analyserNode.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>)
    analyserNode.getByteTimeDomainData(timeDomainData as Uint8Array<ArrayBuffer>)

    const bands = getFrequencyBands(frequencyData, audioContext.sampleRate, analyserNode.fftSize)
    const peakFreq = getPeakFrequency(frequencyData, audioContext.sampleRate)
    const peak = getPeak(frequencyData)

    const bassWithSensitivity = Math.min(bands.bass * sensitivity, 1)
    const midWithSensitivity = Math.min(bands.mid * sensitivity, 1)
    const trebleWithSensitivity = Math.min(bands.treble * sensitivity, 1)

    // Beat detection: bass energy spike
    const bassDiff = bassWithSensitivity - prevBassRef.current
    const isBeat = bassDiff > beatThresholdRef.current
    prevBassRef.current = bassWithSensitivity

    // Adaptive threshold
    beatThresholdRef.current = beatThresholdRef.current * 0.95 + bassDiff * 0.05
    if (beatThresholdRef.current < 0.1) beatThresholdRef.current = 0.1

    return {
      frequencyData,
      timeDomainData,
      bass: bassWithSensitivity,
      mid: midWithSensitivity,
      treble: trebleWithSensitivity,
      peak,
      peakFrequency: peakFreq,
      isBeat,
    }
  }, [analyserNode, audioContext, sensitivity])

  return { getAnalysis }
}
