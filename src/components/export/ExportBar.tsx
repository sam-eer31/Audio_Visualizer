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
      "glass rounded-2xl p-5 sm:p-6",
    )}>
      <div className="flex items-center justify-between mb-4">
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

      {progress >= 100 && !isExporting ? (
        <div className="flex items-center gap-2 py-1">
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-medium">Export complete! File downloaded.</span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Selectors Group */}
          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-end sm:gap-3 flex-1 min-w-0">
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
          </div>

          {/* Export button */}
          <button
            onClick={startExport}
            className="w-full sm:w-auto h-10 px-5 rounded-xl bg-primary text-primary-foreground text-[12px] font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all active:scale-[0.97] shrink-0"
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
    <div className="space-y-1 min-w-0 sm:w-28">
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
