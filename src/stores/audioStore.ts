import { create } from 'zustand'
import type { AudioFile, PlaybackState } from '@/types'

interface AudioStore {
  audioFile: AudioFile | null
  playbackState: PlaybackState
  currentTime: number
  duration: number
  volume: number
  audioContext: AudioContext | null
  analyserNode: AnalyserNode | null
  sourceNode: AudioBufferSourceNode | MediaElementAudioSourceNode | null
  gainNode: GainNode | null
  audioElement: HTMLAudioElement | null
  audioDestination: MediaStreamAudioDestinationNode | null
  setAudioFile: (file: AudioFile | null) => void
  setPlaybackState: (state: PlaybackState) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setAudioContext: (ctx: AudioContext | null) => void
  setAnalyserNode: (node: AnalyserNode | null) => void
  setSourceNode: (node: AudioBufferSourceNode | MediaElementAudioSourceNode | null) => void
  setGainNode: (node: GainNode | null) => void
  setAudioElement: (el: HTMLAudioElement | null) => void
  setAudioDestination: (dest: MediaStreamAudioDestinationNode | null) => void
  reset: () => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  audioFile: null,
  playbackState: 'idle',
  currentTime: 0,
  duration: 0,
  volume: 0.75,
  audioContext: null,
  analyserNode: null,
  sourceNode: null,
  gainNode: null,
  audioElement: null,
  audioDestination: null,
  setAudioFile: (file) => set({ audioFile: file }),
  setPlaybackState: (state) => set({ playbackState: state }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setAudioContext: (ctx) => set({ audioContext: ctx }),
  setAnalyserNode: (node) => set({ analyserNode: node }),
  setSourceNode: (node) => set({ sourceNode: node }),
  setGainNode: (node) => set({ gainNode: node }),
  setAudioElement: (el) => set({ audioElement: el }),
  setAudioDestination: (dest) => set({ audioDestination: dest }),
  reset: () =>
    set({
      audioFile: null,
      playbackState: 'idle',
      currentTime: 0,
      duration: 0,
    }),
}))
