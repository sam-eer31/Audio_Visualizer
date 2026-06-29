import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { useExportStore } from '@/stores/exportStore'
import { useAudioStore } from '@/stores/audioStore'
import { COLOR_PRESETS } from '@/lib/constants'

// Initial coordinate offsets for a 3x3x3 cube (27 sub-cubes)
const SUB_CUBE_COORDS = (() => {
  const coords: THREE.Vector3[] = []
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        coords.push(new THREE.Vector3(x, y, z))
      }
    }
  }
  return coords
})()

interface Move {
  axis: 'x' | 'y' | 'z'
  slice: number
  dir: number
}

interface Spark {
  pos: THREE.Vector3
  vel: THREE.Vector3
  color: THREE.Color
  size: number
  age: number
  maxAge: number
}

const MAX_SPARKS = 600

// Seeded LCG Random Number Generator
class SeededRandom {
  private seed: number
  constructor(seed: number) {
    this.seed = seed
  }
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296
    return this.seed / 4294967296
  }
}

// Map the color presets in the store to our custom 6-face color themes
const THEMES: Record<string, string[]> = {
  classic: ['#FFFFFF', '#FFFF00', '#FF0000', '#FFA500', '#0000FF', '#008000'],
  neon: ['#00FFFF', '#FF00FF', '#00FF00', '#FF8C00', '#8A2BE2', '#1E90FF'],
  pastel: ['#AEC6CF', '#B3F6D4', '#FFD1DC', '#E6E6FA', '#FFB7B2', '#FFFDD0'],
  dark: ['#1A1A1A', '#DC143C', '#50C878', '#0F52BA', '#FFD700', '#C0C0C0'],
  cyberpunk: ['#FF007F', '#00E5FF', '#9400D3', '#39FF14', '#FFBF00', '#FFFFFF'],
}

const presetToThemeMap: Record<string, string> = {
  emerald: 'classic',
  platinum: 'classic',
  electric: 'neon',
  rose: 'pastel',
  dark: 'dark',
  arctic: 'dark',
  'sunset-gold': 'cyberpunk',
}

export function BeatDice() {
  const groupRef = useRef<THREE.Group>(null)
  const starsRef = useRef<THREE.Points>(null)
  const sparkGeometryRef = useRef<THREE.BufferGeometry>(null)

  const coreLightRef = useRef<THREE.PointLight>(null)
  const light1Ref = useRef<THREE.PointLight>(null)
  const light2Ref = useRef<THREE.PointLight>(null)

  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)
  const isExporting = useExportStore((s) => s.isExporting)

  const audioFile = useAudioStore((s) => s.audioFile)
  const storeTime = useAudioStore((s) => s.currentTime)
  const duration = useAudioStore((s) => s.duration)
  const playbackState = useAudioStore((s) => s.playbackState)
  const isPlaying = playbackState === 'playing'

  // Sub-cube geometry state
  const currentPositions = useRef<THREE.Vector3[]>([])
  const currentQuaternions = useRef<THREE.Quaternion[]>([])

  if (currentPositions.current.length === 0) {
    currentPositions.current = SUB_CUBE_COORDS.map((c) => c.clone())
    currentQuaternions.current = SUB_CUBE_COORDS.map(() => new THREE.Quaternion())
  }

  const [faceColors, setFaceColors] = useState<string[]>(THEMES.classic)

  useEffect(() => {
    const themeName = presetToThemeMap[colorPreset] || 'classic'
    const newColors = THEMES[themeName] || THEMES.classic
    setFaceColors(newColors)
  }, [colorPreset, audioFile])

  const colors = useMemo(() => {
    return faceColors.map((c) => new THREE.Color(c))
  }, [faceColors])

  const seed = useMemo(() => {
    if (!audioFile) return 54321
    let hash = 0
    const name = audioFile.name
    const size = audioFile.size
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash + size)
  }, [audioFile])

  // Solve target duration is 2 seconds before the end of the song
  const solveDuration = useMemo(() => {
    return Math.max(10, (duration || 180) - 2.0)
  }, [duration])

  // Scale the number of steps dynamically based on song length (roughly 1 move every 6.5s)
  const scrambleSteps = useMemo(() => {
    return Math.max(20, Math.min(80, Math.floor(solveDuration / 6.5)))
  }, [solveDuration])

  // Generate sequence of scramble moves
  const sequence = useMemo(() => {
    const rand = new SeededRandom(seed)
    const axes: ('x' | 'y' | 'z')[] = ['x', 'y', 'z']
    const slices = [-1, 0, 1]
    const dirs: (-1 | 1)[] = [-1, 1]

    const scramble: Move[] = []
    let lastAxis = ''
    let lastSlice = 99

    for (let i = 0; i < scrambleSteps; i++) {
      let axis = axes[Math.floor(rand.next() * axes.length)]
      let slice = slices[Math.floor(rand.next() * slices.length)]

      while (axis === lastAxis && slice === lastSlice) {
        axis = axes[Math.floor(rand.next() * axes.length)]
        slice = slices[Math.floor(rand.next() * slices.length)]
      }

      const dir = dirs[Math.floor(rand.next() * dirs.length)]
      scramble.push({ axis, slice, dir })
      lastAxis = axis
      lastSlice = slice
    }

    return { scramble }
  }, [seed, scrambleSteps])

  // Apply M scramble moves to baseline
  const rebuildBaseline = (M: number) => {
    for (let i = 0; i < 27; i++) {
      currentPositions.current[i].copy(SUB_CUBE_COORDS[i])
      currentQuaternions.current[i].set(0, 0, 0, 1)
    }

    for (let m = 0; m < M; m++) {
      const move = sequence.scramble[m]
      if (!move) continue

      const axisVector = new THREE.Vector3(
        move.axis === 'x' ? 1 : 0,
        move.axis === 'y' ? 1 : 0,
        move.axis === 'z' ? 1 : 0
      )
      const angle = move.dir * Math.PI / 2
      const rot = new THREE.Quaternion().setFromAxisAngle(axisVector, angle)

      for (let i = 0; i < 27; i++) {
        const pos = currentPositions.current[i]
        const val = move.axis === 'x' ? pos.x : move.axis === 'y' ? pos.y : pos.z
        if (Math.abs(val - move.slice) < 0.1) {
          pos.applyAxisAngle(axisVector, angle)
          pos.x = Math.round(pos.x)
          pos.y = Math.round(pos.y)
          pos.z = Math.round(pos.z)
          currentQuaternions.current[i].premultiply(rot).normalize()
        }
      }
    }
  }

  // Refs for tracking synchronization state
  const currentSolveIdx = useRef<number>(0)
  const moveActive = useRef<boolean>(false)
  const moveStartTime = useRef<number>(0)
  const localTimeRef = useRef<number>(0)
  const lastStoreTime = useRef<number>(0)
  const currentOrbitSpeed = useRef<number>(0.15)
  const spacingRef = useRef<number>(1.02)

  // Reset visualizer on song change
  useEffect(() => {
    currentSolveIdx.current = 0
    moveActive.current = false
    localTimeRef.current = 0
    lastStoreTime.current = 0
    rebuildBaseline(scrambleSteps)
  }, [audioFile, sequence, scrambleSteps])

  // Glass physical core material
  const coreMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: '#080a0f',
      roughness: 0.15,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.15,
      transmission: 0.5,
      thickness: 1.2,
      ior: 1.5,
    })
  }, [])

  useEffect(() => {
    return () => {
      coreMaterial.dispose()
    }
  }, [coreMaterial])

  // Ambient Star particles
  const starCount = 400
  const starPositions = useMemo(() => {
    const pos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3
      const radius = Math.random() * 6 + 3
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(Math.random() * 2 - 1)

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta)
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      pos[i3 + 2] = radius * Math.cos(phi)
    }
    return pos
  }, [])

  // Dynamic Spark Trail Particles
  const sparksRef = useRef<Spark[]>([])
  const sparkPositions = useMemo(() => {
    const arr = new Float32Array(MAX_SPARKS * 3)
    arr.fill(9999)
    return arr
  }, [])
  const sparkColors = useMemo(() => new Float32Array(MAX_SPARKS * 3), [])

  const spawnSparks = (axis: 'x' | 'y' | 'z', slice: number, dir: number, spacing: number, spawnProbability = 0.2) => {
    const axisVector = new THREE.Vector3(
      axis === 'x' ? 1 : 0,
      axis === 'y' ? 1 : 0,
      axis === 'z' ? 1 : 0
    )
    const angularVel = axisVector.clone().multiplyScalar(dir * 15)

    for (let i = 0; i < 27; i++) {
      const pos = currentPositions.current[i]
      const val = axis === 'x' ? pos.x : axis === 'y' ? pos.y : pos.z
      if (Math.abs(val - slice) < 0.1) {
        if (Math.random() > spawnProbability) continue

        const basePos = pos.clone().multiplyScalar(spacing)
        const offset = new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 0.8
        )
        const sparkPos = basePos.clone().add(offset)
        const sparkVel = new THREE.Vector3().crossVectors(angularVel, sparkPos)

        const radialPush = sparkPos.clone().normalize().multiplyScalar(1.0 + Math.random() * 2.0)
        sparkVel.add(radialPush)

        sparkVel.x += (Math.random() - 0.5) * 1.2
        sparkVel.y += (Math.random() - 0.5) * 1.2
        sparkVel.z += (Math.random() - 0.5) * 1.2

        const randColorStr = faceColors[Math.floor(Math.random() * faceColors.length)]
        const randColor = new THREE.Color(randColorStr)

        const spark: Spark = {
          pos: sparkPos,
          vel: sparkVel,
          color: randColor,
          size: 0.04 + Math.random() * 0.08,
          age: 0,
          maxAge: 0.3 + Math.random() * 0.3,
        }

        if (sparksRef.current.length < MAX_SPARKS) {
          sparksRef.current.push(spark)
        } else {
          const replaceIdx = Math.floor(Math.random() * MAX_SPARKS)
          sparksRef.current[replaceIdx] = spark
        }
      }
    }
  }

  // Overshoot easeOutBack
  const easeOutBack = (x: number): number => {
    const c1 = 1.70158
    const c2 = c1 + 1
    return 1 + c2 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const analysis = getAnalysis()
    const time = state.clock.getElapsedTime()

    const targetBass = isPlaying ? (analysis.bass || 0) : 0
    const targetMid = isPlaying ? (analysis.mid || 0) : 0
    const targetTreble = isPlaying ? (analysis.treble || 0) : 0
    const targetPeak = isPlaying ? (analysis.peak || 0) : 0

    const bass = THREE.MathUtils.lerp(0, targetBass, isPlaying ? 1.0 : delta * 5)
    const mid = THREE.MathUtils.lerp(0, targetMid, isPlaying ? 1.0 : delta * 5)
    const treble = THREE.MathUtils.lerp(0, targetTreble, isPlaying ? 1.0 : delta * 5)
    const peak = THREE.MathUtils.lerp(0, targetPeak, isPlaying ? 1.0 : delta * 5)

    // Keep spacing completely constant at 1.02 to avoid any size vibration
    spacingRef.current = 1.02

    // Sync high-resolution playhead
    const songDuration = duration || 180
    if (storeTime !== lastStoreTime.current) {
      if (Math.abs(localTimeRef.current - storeTime) > 0.5) {
        localTimeRef.current = storeTime
        const targetIdx = Math.floor((storeTime / solveDuration) * scrambleSteps)
        currentSolveIdx.current = Math.min(scrambleSteps - 1, Math.max(0, targetIdx))
        moveActive.current = false
        rebuildBaseline(scrambleSteps - currentSolveIdx.current)
      } else {
        localTimeRef.current = storeTime
      }
      lastStoreTime.current = storeTime
    } else if (isPlaying) {
      localTimeRef.current += delta
    }

    const t = Math.max(0, Math.min(solveDuration + 2.0, localTimeRef.current))
    const progress = Math.min(1.0, t / solveDuration)
    const isSolved = t >= solveDuration

    // Target index according to chronological timeline
    const targetIdx = Math.floor(progress * scrambleSteps)

    if (isSolved) {
      currentSolveIdx.current = scrambleSteps
      moveActive.current = false
      rebuildBaseline(0) // Solve completely
    } else {
      const scheduledStartTime = currentSolveIdx.current * (solveDuration / scrambleSteps)

      // Audio-reactive beat-driven solving triggers
      if (!moveActive.current && currentSolveIdx.current < scrambleSteps) {
        const isBehind = currentSolveIdx.current < targetIdx
        const isNearSchedule = t >= scheduledStartTime
        const isBassBeat = isPlaying && analysis.isBeat

        if (isBehind || (isNearSchedule && isBassBeat) || (t - scheduledStartTime >= 0.4 * (solveDuration / scrambleSteps))) {
          moveActive.current = true
          moveStartTime.current = t
          // Build target baseline state (with scramble move S_{N-K} not applied)
          rebuildBaseline(scrambleSteps - 1 - currentSolveIdx.current)
        }
      }
    }

    // Determine visual rotation angle
    let activeAxis = new THREE.Vector3()
    let activeAngle = 0
    let activeSlice = 0
    let isMoving = false
    let currentMove: Move | null = null

    if (moveActive.current) {
      isMoving = true
      
      // Speed up rotations when catching up or on heavy beats
      const lag = targetIdx - currentSolveIdx.current
      const speedFactor = lag > 1 ? Math.max(0.35, 1.0 - (lag - 1) * 0.2) : 1.0
      const moveDuration = 0.32 * speedFactor * (isPlaying ? Math.max(0.5, 1.0 - bass * 0.3) : 1.0)

      const elapsed = t - moveStartTime.current
      const x = Math.max(0, Math.min(1.0, elapsed / moveDuration))

      const scrambleIdx = scrambleSteps - 1 - currentSolveIdx.current
      const move = sequence.scramble[scrambleIdx]

      if (move) {
        currentMove = move
        activeAxis.set(
          move.axis === 'x' ? 1 : 0,
          move.axis === 'y' ? 1 : 0,
          move.axis === 'z' ? 1 : 0
        )
        activeSlice = move.slice

        const eased = easeOutBack(x)
        // Transition from 90 degrees to 0 degrees to align colors smoothly during motion
        activeAngle = (1.0 - eased) * move.dir * (Math.PI / 2)

        if (isPlaying && x < 0.95) {
          spawnSparks(move.axis, move.slice, move.dir, spacingRef.current, 0.05)
        }
      }

      if (elapsed >= moveDuration) {
        moveActive.current = false
        currentSolveIdx.current += 1
        rebuildBaseline(scrambleSteps - currentSolveIdx.current)
      }
    }

    // Update Spark particles
    const sparks = sparksRef.current
    const activeCount = sparks.length

    for (let i = 0; i < MAX_SPARKS; i++) {
      const i3 = i * 3
      if (i < activeCount) {
        const spark = sparks[i]
        
        if (isPlaying) {
          spark.age += delta
        }

        if (spark.age >= spark.maxAge) {
          sparks[i] = sparks[sparks.length - 1]
          sparks.pop()
          i--
          continue
        }

        if (isPlaying) {
          spark.vel.multiplyScalar(0.91)
          spark.pos.addScaledVector(spark.vel, delta)
        }

        sparkPositions[i3] = spark.pos.x
        sparkPositions[i3 + 1] = spark.pos.y
        sparkPositions[i3 + 2] = spark.pos.z

        const lifeRatio = 1.0 - spark.age / spark.maxAge
        const faded = spark.color.clone().multiplyScalar(lifeRatio * (isPlaying ? 1.5 : 0))
        sparkColors[i3] = faded.r
        sparkColors[i3 + 1] = faded.g
        sparkColors[i3 + 2] = faded.b
      } else {
        sparkPositions[i3] = 9999
        sparkPositions[i3 + 1] = 9999
        sparkPositions[i3 + 2] = 9999
        sparkColors[i3] = 0
        sparkColors[i3 + 1] = 0
        sparkColors[i3 + 2] = 0
      }
    }

    if (sparkGeometryRef.current) {
      const posAttr = sparkGeometryRef.current.attributes.position as THREE.BufferAttribute
      const colAttr = sparkGeometryRef.current.attributes.color as THREE.BufferAttribute
      if (posAttr) posAttr.needsUpdate = true
      if (colAttr) colAttr.needsUpdate = true
    }

    // Dynamic Lights (decay immediately on solve)
    if (coreLightRef.current) {
      const burstFactor = Math.max(0, spacingRef.current - 1.0) * 18.0
      coreLightRef.current.intensity = isSolved ? 0.2 : (0.2 + bass * 12.0 * burstFactor)
      coreLightRef.current.color.lerp(colors[0], delta * 5)
    }

    if (light1Ref.current) {
      const theta = time * 0.7
      light1Ref.current.position.set(Math.cos(theta) * 4.5, Math.sin(time * 0.3) * 2.5, Math.sin(theta) * 4.5)
      light1Ref.current.intensity = isSolved ? 0.3 : (0.3 + mid * 3.0)
      light1Ref.current.color.lerp(colors[1], delta * 5)
    }

    if (light2Ref.current) {
      const theta = time * -0.55 + Math.PI
      light2Ref.current.position.set(Math.cos(theta) * 4.5, Math.sin(time * -0.45) * 2.5, Math.sin(theta) * 4.5)
      light2Ref.current.intensity = isSolved ? 0.3 : (0.3 + treble * 3.0)
      light2Ref.current.color.lerp(colors[2], delta * 5)
    }

    // Update Cubies transforms (keep scale completely static to stop size vibration)
    const children = groupRef.current.children
    for (let i = 0; i < 27; i++) {
      const child = children[i] as THREE.Group
      if (!child) continue

      const pos = currentPositions.current[i]
      const quat = currentQuaternions.current[i]

      const visualPos = pos.clone().multiplyScalar(spacingRef.current)
      const visualQuat = quat.clone()

      if (isMoving && currentMove) {
        const val = currentMove.axis === 'x' ? pos.x : currentMove.axis === 'y' ? pos.y : pos.z
        if (Math.abs(val - activeSlice) < 0.1) {
          visualPos.applyAxisAngle(activeAxis, activeAngle)
          const rotQuat = new THREE.Quaternion().setFromAxisAngle(activeAxis, activeAngle)
          visualQuat.premultiply(rotQuat)
        }
      }

      child.position.copy(visualPos)
      child.quaternion.copy(visualQuat)

      // Set scale completely static to stop any size vibration
      child.scale.set(1.0, 1.0, 1.0)

      const meshes = child.children as THREE.Mesh[]
      for (let j = 0; j < meshes.length; j++) {
        const m = meshes[j]
        if (j === 0) {
          const mat = m.material as THREE.MeshPhysicalMaterial
          if (mat) {
            mat.roughness = 0.1
            mat.clearcoatRoughness = 0.15
          }
        } else {
          // Stickers: stable emissive intensity (no blinking)
          const mat = m.material as THREE.MeshStandardMaterial
          if (mat) {
            mat.emissiveIntensity = 0.65
          }
        }
      }
    }

    // Stars Galaxy
    if (starsRef.current) {
      if (isPlaying && !isSolved) {
        // Swirling stars react dynamically and speed up on musical drops/beats
        starsRef.current.rotation.y += delta * rotationSpeed * 0.08 * (1.0 + peak * 2.5 + bass * 1.5)
        starsRef.current.rotation.z -= delta * rotationSpeed * 0.03 * (1.0 + peak * 1.5)
      }

      const pointsMat = starsRef.current.material as THREE.PointsMaterial
      if (pointsMat) {
        pointsMat.size = isSolved ? 0.03 : (0.03 + treble * 0.05)
        pointsMat.opacity = isSolved ? 0.35 : (0.35 + mid * 0.3)
      }
    }

    // Keep the cube body completely still in space (fixed isometric tilt for optimal 3D visibility)
    groupRef.current.position.set(0, 0, 0)
    groupRef.current.rotation.set(0.35, 0.45, 0)
  })

  return (
    <group>
      {/* Dynamic Lights */}
      <pointLight ref={coreLightRef} position={[0, 0, 0]} distance={7} decay={2} intensity={0.5} color={colors[0]} />
      <pointLight ref={light1Ref} distance={10} intensity={0.5} color={colors[1]} />
      <pointLight ref={light2Ref} distance={10} intensity={0.5} color={colors[2]} />

      {/* Swirling Star particles */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[starPositions, 3]}
            count={starCount}
          />
        </bufferGeometry>
        <pointsMaterial
          color={colors[2]}
          size={0.04}
          transparent
          opacity={0.5}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* Spark Trails */}
      <points>
        <bufferGeometry ref={sparkGeometryRef}>
          <bufferAttribute
            attach="attributes-position"
            args={[sparkPositions, 3]}
            count={MAX_SPARKS}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[sparkColors, 3]}
            count={MAX_SPARKS}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          transparent
          opacity={0.95}
          vertexColors
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </points>

      {/* Main cube container scaled down slightly to keep it compact */}
      <group ref={groupRef} scale={[0.72, 0.72, 0.72]}>
        {SUB_CUBE_COORDS.map((coord, idx) => {
          const hasPX = coord.x === 1
          const hasNX = coord.x === -1
          const hasPY = coord.y === 1
          const hasNY = coord.y === -1
          const hasPZ = coord.z === 1
          const hasNZ = coord.z === -1

          return (
            <group key={idx} position={[coord.x, coord.y, coord.z]}>
              {/* Glass core crystal block */}
              <mesh material={coreMaterial}>
                <boxGeometry args={[0.85, 0.85, 0.85]} />
              </mesh>

              {/* Glowing face plates */}
              {hasPX && (
                <mesh position={[0.43, 0, 0]}>
                  <boxGeometry args={[0.04, 0.72, 0.72]} />
                  <meshStandardMaterial
                    color={faceColors[0]}
                    emissive={faceColors[0]}
                    roughness={0.15}
                    metalness={0.1}
                    toneMapped={false}
                  />
                </mesh>
              )}
              {hasNX && (
                <mesh position={[-0.43, 0, 0]}>
                  <boxGeometry args={[0.04, 0.72, 0.72]} />
                  <meshStandardMaterial
                    color={faceColors[1]}
                    emissive={faceColors[1]}
                    roughness={0.15}
                    metalness={0.1}
                    toneMapped={false}
                  />
                </mesh>
              )}
              {hasPY && (
                <mesh position={[0, 0.43, 0]}>
                  <boxGeometry args={[0.72, 0.04, 0.72]} />
                  <meshStandardMaterial
                    color={faceColors[2]}
                    emissive={faceColors[2]}
                    roughness={0.15}
                    metalness={0.1}
                    toneMapped={false}
                  />
                </mesh>
              )}
              {hasNY && (
                <mesh position={[0, -0.43, 0]}>
                  <boxGeometry args={[0.72, 0.04, 0.72]} />
                  <meshStandardMaterial
                    color={faceColors[3]}
                    emissive={faceColors[3]}
                    roughness={0.15}
                    metalness={0.1}
                    toneMapped={false}
                  />
                </mesh>
              )}
              {hasPZ && (
                <mesh position={[0, 0, 0.43]}>
                  <boxGeometry args={[0.72, 0.72, 0.04]} />
                  <meshStandardMaterial
                    color={faceColors[4]}
                    emissive={faceColors[4]}
                    roughness={0.15}
                    metalness={0.1}
                    toneMapped={false}
                  />
                </mesh>
              )}
              {hasNZ && (
                <mesh position={[0, 0, -0.43]}>
                  <boxGeometry args={[0.72, 0.72, 0.04]} />
                  <meshStandardMaterial
                    color={faceColors[5]}
                    emissive={faceColors[5]}
                    roughness={0.15}
                    metalness={0.1}
                    toneMapped={false}
                  />
                </mesh>
              )}
            </group>
          )
        })}
      </group>
    </group>
  )
}
