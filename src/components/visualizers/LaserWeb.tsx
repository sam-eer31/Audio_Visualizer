import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const NODE_COUNT = 45
const MAX_CONNECTIONS = 220
const BOUNDING_RADIUS = 4.2
const MAX_CONNECT_DIST = 2.0

interface Node {
  position: THREE.Vector3
  velocity: THREE.Vector3
  basePosition: THREE.Vector3
  colorIndex: number
}

export function LaserWeb() {
  const nodesMeshRef = useRef<THREE.InstancedMesh>(null)
  const linesMeshRef = useRef<THREE.InstancedMesh>(null)
  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const glowIntensity = 0.2

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  // Instantiate nodes data once
  const nodes = useMemo<Node[]>(() => {
    const list: Node[] = []
    for (let i = 0; i < NODE_COUNT; i++) {
      // Uniform random distribution inside a sphere
      const u = Math.random()
      const v = Math.random()
      const theta = u * 2.0 * Math.PI
      const phi = Math.acos(2.0 * v - 1.0)
      const r = Math.cbrt(Math.random()) * BOUNDING_RADIUS

      const pos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )

      // Random slow velocity vectors
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.5) * 0.4
      )

      list.push({
        position: pos.clone(),
        velocity: vel,
        basePosition: pos.clone(),
        colorIndex: i % colors.length,
      })
    }
    return list
  }, [colors.length])

  const nodeDummy = useMemo(() => new THREE.Object3D(), [])
  const lineDummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, delta) => {
    if (!nodesMeshRef.current || !linesMeshRef.current) return
    const analysis = getAnalysis()
    const bass = analysis.bass
    const treble = analysis.treble

    // Dynamic factors based on audio
    const speedFactor = 1.0 + bass * 2.5
    const jitterFactor = treble * 0.12

    // Update node positions and matrices
    nodes.forEach((node, i) => {
      // Drift node
      node.position.addScaledVector(node.velocity, delta * speedFactor)

      // Bounce nodes when hitting the boundary sphere
      if (node.position.length() > BOUNDING_RADIUS) {
        node.position.normalize().multiplyScalar(BOUNDING_RADIUS)
        node.velocity.reflect(node.position.clone().normalize())
      }

      // Render node with a slight audio vibration displacement
      const renderPos = node.position.clone()
      if (jitterFactor > 0) {
        renderPos.add(
          new THREE.Vector3(
            (Math.random() - 0.5) * jitterFactor,
            (Math.random() - 0.5) * jitterFactor,
            (Math.random() - 0.5) * jitterFactor
          )
        )
      }

      nodeDummy.position.copy(renderPos)
      const nodeScale = 0.08 + bass * 0.06 // Nodes pulse on bass
      nodeDummy.scale.setScalar(nodeScale)
      nodeDummy.updateMatrix()
      nodesMeshRef.current!.setMatrixAt(i, nodeDummy.matrix)
      
      const nodeColor = colors[node.colorIndex].clone()
      if (bass > 1.2) nodeColor.lerp(new THREE.Color(1, 1, 1), 0.3)
      nodesMeshRef.current!.setColorAt(i, nodeColor)
    })

    nodesMeshRef.current.instanceMatrix.needsUpdate = true
    if (nodesMeshRef.current.instanceColor) nodesMeshRef.current.instanceColor.needsUpdate = true

    // Compute proximity connections and update line segments
    let lineIdx = 0

    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (lineIdx >= MAX_CONNECTIONS) break

        const n1 = nodes[i]
        const n2 = nodes[j]
        const dist = n1.position.distanceTo(n2.position)

        if (dist < MAX_CONNECT_DIST) {
          const midpoint = new THREE.Vector3().addVectors(n1.position, n2.position).multiplyScalar(0.5)
          const dir = new THREE.Vector3().subVectors(n2.position, n1.position)
          const len = dir.length()

          lineDummy.position.copy(midpoint)
          lineDummy.lookAt(n2.position)
          lineDummy.rotateX(Math.PI / 2)

          // Line thickness increases with audio volume
          const lineThickness = 0.01 + bass * 0.008
          lineDummy.scale.set(lineThickness, len, lineThickness)
          lineDummy.updateMatrix()
          linesMeshRef.current.setMatrixAt(lineIdx, lineDummy.matrix)

          // Symmetrical/blend coloring of connection lines
          const color = colors[n1.colorIndex].clone().lerp(colors[n2.colorIndex], 0.5)
          linesMeshRef.current.setColorAt(lineIdx, color)
          lineIdx++
        }
      }
    }

    // Hide any unused instanced cylinders by scaling them to 0
    for (let k = lineIdx; k < MAX_CONNECTIONS; k++) {
      lineDummy.scale.setScalar(0)
      lineDummy.updateMatrix()
      linesMeshRef.current.setMatrixAt(k, lineDummy.matrix)
    }

    linesMeshRef.current.instanceMatrix.needsUpdate = true
    if (linesMeshRef.current.instanceColor) linesMeshRef.current.instanceColor.needsUpdate = true
  })

  return (
    <group>
      {/* Drifting Node Points */}
      <instancedMesh ref={nodesMeshRef} args={[undefined, undefined, NODE_COUNT]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial
          toneMapped={false}
          transparent
          opacity={0.95}
          emissive={colors[0]}
          emissiveIntensity={glowIntensity * 1.5}
        />
      </instancedMesh>

      {/* Proximity Laser Connection Lines */}
      <instancedMesh ref={linesMeshRef} args={[undefined, undefined, MAX_CONNECTIONS]}>
        <cylinderGeometry args={[1, 1, 1, 6]} />
        <meshStandardMaterial
          toneMapped={false}
          transparent
          opacity={0.65}
          emissive={colors[1]}
          emissiveIntensity={glowIntensity * 2.5}
        />
      </instancedMesh>
    </group>
  )
}
