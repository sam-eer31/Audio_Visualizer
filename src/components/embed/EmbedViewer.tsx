import { VisualizerCanvas } from '@/components/visualizers/VisualizerCanvas'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { BACKGROUND_PRESETS } from '@/lib/constants'

export function EmbedViewer() {
  const backgroundPreset = useVisualizerStore((s) => s.backgroundPreset)
  const bg = BACKGROUND_PRESETS.find((b) => b.id === backgroundPreset) || BACKGROUND_PRESETS[0]

  return (
    <div 
      className="audrix-embed-container"
      style={{ 
        width: '100%', 
        height: '100%', 
        background: bg.gradient || bg.color,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <VisualizerCanvas />
    </div>
  )
}
