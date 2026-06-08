import { VISUALIZATION_MODES, COLOR_PRESETS, BACKGROUND_PRESETS, FFT_SIZES } from '@/lib/constants'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Palette, Layers, SlidersHorizontal, Music } from 'lucide-react'

export function SettingsPanel() {
  return (
    <div className="h-full flex flex-col w-full">
      {/* Header */}
      <div className="shrink-0" style={{ paddingLeft: '8px', paddingRight: '8px', paddingTop: '8px', paddingBottom: '10px' }}>
        <h2 className="text-xl font-semibold">Customize</h2>
        <p className="text-xs text-muted-foreground mt-1">Style your visualization</p>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 min-h-0 overflow-y-auto" style={{ paddingBottom: '8px' }}>
        <div style={{ marginBottom: '10px', paddingLeft: '8px', paddingRight: '8px' }}>
          <CollapsibleSection icon={<Layers className="h-4 w-4" />} title="Visual Style" defaultOpen>
            <ModeGrid />
          </CollapsibleSection>
        </div>

        <div style={{ marginBottom: '10px', paddingLeft: '8px', paddingRight: '8px' }}>
          <CollapsibleSection icon={<Palette className="h-4 w-4" />} title="Colors" defaultOpen>
            <ColorSection />
            <div style={{ marginTop: '10px' }}>
              <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium" style={{ marginBottom: '10px' }}>Background</p>
              <BackgroundSection />
            </div>
          </CollapsibleSection>
        </div>

        <div style={{ marginBottom: '10px', paddingLeft: '8px', paddingRight: '8px' }}>
          <CollapsibleSection icon={<SlidersHorizontal className="h-4 w-4" />} title="Adjust" defaultOpen>
            <SlidersSection />
          </CollapsibleSection>
        </div>

        <div style={{ paddingLeft: '8px', paddingRight: '8px' }}>
          <CollapsibleSection icon={<Music className="h-4 w-4" />} title="Audio" defaultOpen={false}>
            <AudioSection />
          </CollapsibleSection>
        </div>
      </div>
    </div>
  )
}

function CollapsibleSection({ icon, title, defaultOpen, children }: {
  icon: React.ReactNode; title: string; defaultOpen: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/[0.08] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {icon}
          {title}
        </div>
        <div className="text-muted-foreground/40">
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>
      {open && <div style={{ marginTop: '10px' }}>{children}</div>}
    </div>
  )
}

function ModeGrid() {
  const { mode, setMode } = useVisualizerStore()
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {VISUALIZATION_MODES.map((m) => {
        const Icon = m.icon
        const active = mode === m.id
        return (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'flex items-center rounded-xl border text-left transition-all duration-200 w-full',
              active
                ? 'border-primary/50 bg-primary/[0.08] text-foreground ring-1 ring-primary/20'
                : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
            )}
            style={{ padding: '12px 14px', gap: '12px' }}
          >
            <div className={cn(
              'h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
              active ? 'bg-primary/15 text-primary' : 'bg-white/[0.04] text-muted-foreground'
            )}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold leading-tight truncate">{m.name}</span>
              <span className="text-[10px] text-muted-foreground/60 leading-tight mt-0.5 truncate">{m.description}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function ColorSection() {
  const { colorPreset, setColorPreset } = useVisualizerStore()
  return (
    <div>
      <p className="text-[10px] text-muted-foreground/80 uppercase tracking-wider font-medium" style={{ marginBottom: '10px' }}>Theme</p>
      <div className="grid grid-cols-2 gap-2.5">
        {COLOR_PRESETS.map((p) => {
          const active = colorPreset === p.id
          const gradient = `linear-gradient(135deg, ${p.colors[0]} 0%, ${p.colors[1]} 50%, ${p.colors[2]} 100%)`
          return (
            <button
              key={p.id}
              onClick={() => setColorPreset(p.id)}
              className={cn(
                'flex items-center rounded-xl border transition-all duration-200 w-full text-left',
                active
                  ? 'border-primary/50 ring-1 ring-primary/20'
                  : 'border-white/[0.06] hover:border-white/[0.12]'
              )}
              style={{ padding: '10px 12px', gap: '10px' }}
            >
              <div
                className="h-7 w-7 rounded-lg shrink-0 ring-1 ring-white/[0.08]"
                style={{ background: gradient }}
              />
              <div className="flex flex-col min-w-0">
                <span className={cn(
                  'text-[11px] font-semibold leading-tight truncate',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {p.name}
                </span>
                <div className="flex gap-0.5 mt-1">
                  {p.colors.map((c, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BackgroundSection() {
  const { backgroundPreset, setBackgroundPreset } = useVisualizerStore()
  return (
    <div className="flex flex-col gap-2.5">
      {BACKGROUND_PRESETS.map((p) => {
        const active = backgroundPreset === p.id
        return (
          <button
            key={p.id}
            onClick={() => setBackgroundPreset(p.id)}
            className={cn(
              'flex items-center rounded-xl border transition-all duration-200 w-full text-left',
              active
                ? 'border-primary/50 ring-1 ring-primary/20'
                : 'border-white/[0.06] hover:border-white/[0.12]'
            )}
            style={{ padding: '10px 12px', gap: '12px' }}
          >
            <div
              className="h-8 w-12 rounded-lg shrink-0 ring-1 ring-inset ring-black/[0.1] border border-white/[0.08]"
              style={{ background: p.gradient || p.color }}
            />
            <span className={cn(
              'text-[12px] font-semibold',
              active ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {p.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function SlidersSection() {
  const {
    sensitivity, setSensitivity,
    particleCount, setParticleCount,
    glowIntensity, setGlowIntensity,
    rotationSpeed, setRotationSpeed,
  } = useVisualizerStore()

  return (
    <div className="space-y-5">
      <SliderRow label="Sensitivity" value={sensitivity} min={0.1} max={3} step={0.1} onChange={setSensitivity}
        display={`${sensitivity.toFixed(1)}x`} />
      <SliderRow label="Particles" value={particleCount} min={100} max={5000} step={100} onChange={setParticleCount}
        display={`${particleCount}`} />
      <SliderRow label="Glow" value={glowIntensity} min={0} max={2} step={0.1} onChange={setGlowIntensity}
        display={`${Math.round(glowIntensity * 50)}%`} />
      <SliderRow label="Rotation" value={rotationSpeed} min={0} max={2} step={0.1} onChange={setRotationSpeed}
        display={`${rotationSpeed.toFixed(1)}x`} />
    </div>
  )
}

function AudioSection() {
  const { fftSize, setFftSize } = useVisualizerStore()
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">FFT Size</span>
        <select
          value={fftSize}
          onChange={(e) => setFftSize(Number(e.target.value))}
          className="h-9 rounded-lg bg-white/5 border border-white/10 text-sm px-3 text-foreground focus:outline-none focus:border-primary/50"
        >
          {FFT_SIZES.map((s) => <option key={s} value={s} className="bg-[#0a0a0f]">{s}</option>)}
        </select>
      </div>
      <p className="text-[11px] text-muted-foreground/60 leading-relaxed">Higher values give more detail but use more CPU</p>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onChange, display }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; display: string
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-muted-foreground font-medium">{label}</span>
        <span className="text-[11px] font-mono text-foreground/60 tabular-nums bg-white/[0.04] px-2 py-0.5 rounded-md">{display}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full" />
    </div>
  )
}
