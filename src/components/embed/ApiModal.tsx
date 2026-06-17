import { X, Code2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'

interface ApiModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ApiModal({ isOpen, onClose }: ApiModalProps) {
  const theme = useUIStore((s) => s.theme)
  const [copied, setCopied] = useState(false)

  const codeSnippet = `<!-- The container where the visualizer will be rendered -->
<div id="audrix-container" style="width: 100%; height: 500px;"></div>

<!-- Your audio element -->
<audio id="my-audio" src="path/to/song.mp3" controls crossorigin="anonymous"></audio>

<!-- Include the Audrix Embed Script and styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/sam-eer31/Audio_Visualizer/dist-api/audrix-api.css">
<script src="https://cdn.jsdelivr.net/gh/sam-eer31/Audio_Visualizer/dist-api/audrix-api.umd.cjs"></script>

<script>
  // Initialize the Audrix visualizer
  const visualizer = new window.AudrixVisualizer({
    container: document.getElementById('audrix-container'),
    audioElement: document.getElementById('my-audio'),
    mode: 'particle-galaxy', // Visual style
    backgroundColor: '#0a0a2e', // Background color
    colorPreset: '#00ffcc' // Style color
  });
</script>`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeSnippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "glass rounded-2xl p-6 sm:p-8 max-w-2xl w-full mx-auto flex flex-col shadow-2xl border relative max-h-[90vh] overflow-hidden",
              theme === 'dark' ? 'border-white/10' : 'border-black/10 text-black'
            )}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Code2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Developer API</h2>
                <p className="text-sm text-muted-foreground">Embed Audrix directly into your website</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-2 space-y-5">
              <p className="text-sm text-muted-foreground/90">
                You can easily integrate the Audrix 3D visualization into your own web applications, music players, or portfolios. The visualizer automatically hooks into your existing HTML <code>&lt;audio&gt;</code> element.
              </p>

              <div>
                <h3 className="text-sm font-semibold mb-2">Usage Example</h3>
                <div className="relative group">
                  <pre className="text-xs p-4 rounded-xl overflow-x-auto bg-black/80 text-white/90 border border-white/10">
                    <code>{codeSnippet}</code>
                  </pre>
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 h-8 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-md"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span className="text-[11px] font-medium">{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Configuration Options</h3>
                <ul className="text-sm text-muted-foreground/90 space-y-2 list-disc pl-5">
                  <li><strong>container</strong>: An HTML element where the visualizer canvas will be rendered.</li>
                  <li><strong>audioElement</strong>: Your <code>HTMLAudioElement</code>. Audrix will read its audio data.</li>
                  <li><strong>mode</strong>: The visual style ID (e.g., <code>line-spectrum</code>, <code>neon-rings</code>).</li>
                  <li><strong>backgroundColor</strong>: Hex color for the background (e.g., <code>#000000</code>).</li>
                  <li><strong>colorPreset</strong>: Hex color for the main visualization lines/particles.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
