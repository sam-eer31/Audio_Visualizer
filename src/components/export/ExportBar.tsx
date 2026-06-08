import { Download, Loader2, CheckCircle, RotateCcw } from 'lucide-react'
import { useExportStore } from '@/stores/exportStore'
import { useExport } from '@/hooks/useExport'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/uiStore'

export function ExportBar() {
  const { resolution, quality, frameRate, isExporting, progress, setResolution, setQuality, setFrameRate, reset } = useExportStore()
  const { startExport } = useExport()

  const theme = useUIStore((s) => s.theme)
  const isLight = theme === 'light'

  return (
    <div className={cn(
      "glass rounded-2xl p-4 sm:p-5",
    )}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-semibold">Export Video</h3>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Save your visualization as video</p>
        </div>
        {progress >= 100 && !isExporting && (
          <button onClick={reset} className="text-[11px] text-primary hover:underline flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      {isExporting ? (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
            <span className="text-xs text-muted-foreground">Recording... don't close this tab</span>
            <span className="ml-auto text-xs font-mono font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : progress >= 100 ? (
        <div className="flex items-center gap-2 py-1">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium">Export complete! File downloaded.</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-end gap-2 sm:gap-3">
          {/* Resolution */}
          <MiniSelect label="Resolution" value={resolution}
            onChange={(v) => setResolution(v as '720p' | '1080p' | '1440p')}
            options={[{ v: '720p', l: '720p' }, { v: '1080p', l: '1080p' }, { v: '1440p', l: '1440p' }]} />

          {/* Quality */}
          <MiniSelect label="Quality" value={quality}
            onChange={(v) => setQuality(v as 'low' | 'medium' | 'high')}
            options={[{ v: 'low', l: 'Low' }, { v: 'medium', l: 'Medium' }, { v: 'high', l: 'High' }]} />

          {/* FPS */}
          <MiniSelect label="FPS" value={String(frameRate)}
            onChange={(v) => setFrameRate(Number(v) as 30 | 60)}
            options={[{ v: '30', l: '30' }, { v: '60', l: '60' }]} />

          {/* Export button */}
          <button
            onClick={startExport}
            className="ml-auto h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold flex items-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.97] shrink-0"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      )}
    </div>
  )
}

function MiniSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { v: string; l: string }[]
}) {
  const isLight = useUIStore((s) => s.theme) === 'light'
  return (
    <div className="space-y-1 min-w-0">
      <label className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-9 rounded-lg border text-[11px] px-2.5 text-foreground focus:outline-none focus:border-primary/40 w-full transition-colors",
          isLight ? "bg-black/[0.03] border-black/[0.08]" : "bg-white/[0.04] border-white/[0.08]"
        )}
      >
        {options.map((o) => <option key={o.v} value={o.v} className="bg-[#0a0a0f]">{o.l}</option>)}
      </select>
    </div>
  )
}
