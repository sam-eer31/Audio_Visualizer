export function getFrequencyBands(frequencyData: Uint8Array, sampleRate: number, fftSize: number) {
  const binCount = frequencyData.length
  const nyquist = sampleRate / 2
  const binWidth = nyquist / binCount

  const bassEnd = Math.floor(250 / binWidth)
  const midEnd = Math.floor(4000 / binWidth)

  let bassSum = 0
  let midSum = 0
  let trebleSum = 0
  let bassCount = 0
  let midCount = 0
  let trebleCount = 0

  for (let i = 0; i < binCount; i++) {
    if (i < bassEnd) {
      bassSum += frequencyData[i]
      bassCount++
    } else if (i < midEnd) {
      midSum += frequencyData[i]
      midCount++
    } else {
      trebleSum += frequencyData[i]
      trebleCount++
    }
  }

  return {
    bass: bassCount > 0 ? bassSum / bassCount / 255 : 0,
    mid: midCount > 0 ? midSum / midCount / 255 : 0,
    treble: trebleCount > 0 ? trebleSum / trebleCount / 255 : 0,
  }
}

export function getPeakFrequency(frequencyData: Uint8Array, sampleRate: number): number {
  let maxVal = 0
  let maxIndex = 0
  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i] > maxVal) {
      maxVal = frequencyData[i]
      maxIndex = i
    }
  }
  return (maxIndex * sampleRate) / (frequencyData.length * 2)
}

export function getPeak(frequencyData: Uint8Array): number {
  let max = 0
  for (let i = 0; i < frequencyData.length; i++) {
    if (frequencyData[i] > max) max = frequencyData[i]
  }
  return max / 255
}

export function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
