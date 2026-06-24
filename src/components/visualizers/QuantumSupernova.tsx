import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { useVisualizerStore } from '@/stores/visualizerStore'
import { COLOR_PRESETS } from '@/lib/constants'

const PARTICLE_COUNT = 3500

interface ParticleInfo {
  angle: number
  radius: number
  speed: number
  yFactor: number
  phase: number
  colorIndex: number
}

function generateParticleStates(colorsLength: number): ParticleInfo[] {
  const list: ParticleInfo[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const radius = 1.0 + Math.pow(Math.random(), 2) * 5.0
    list.push({
      angle: Math.random() * Math.PI * 2,
      radius: radius,
      speed: (0.25 + Math.random() * 0.4) / Math.sqrt(radius),
      yFactor: (Math.random() - 0.5) * 0.55,
      phase: Math.random() * Math.PI * 2,
      colorIndex: i % colorsLength,
    })
  }
  return list
}

function generateBufferArrays() {
  const pos = new Float32Array(PARTICLE_COUNT * 3)
  const cols = new Float32Array(PARTICLE_COUNT * 3)
  return { pos, cols }
}

export function QuantumSupernova() {
  const pointsRef = useRef<THREE.Points>(null)
  const coreRef = useRef<THREE.Mesh>(null)
  const flareRef = useRef<THREE.Mesh>(null)
  const shockwaveRef = useRef<THREE.Mesh>(null)
  const magneticGroupRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)

  const { getAnalysis } = useAudioAnalyzer()
  const colorPreset = useVisualizerStore((s) => s.colorPreset)
  const rotationSpeed = useVisualizerStore((s) => s.rotationSpeed)

  const colors = useMemo(() => {
    const preset = COLOR_PRESETS.find((p) => p.id === colorPreset) || COLOR_PRESETS[0]
    return preset.colors.map((c) => new THREE.Color(c))
  }, [colorPreset])

  // Setup initial particle states and buffers via useState initializers
  const [particleStates] = useState(() => generateParticleStates(colors.length))
  const [buffers] = useState(() => generateBufferArrays())

  // Generate a circular glowing texture dynamically via HTML5 Canvas
  const glowTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 32)

    return new THREE.CanvasTexture(canvas)
  }, [])

  // Create custom shader materials for realistic core and outer flare
  const coreMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying float vNoise;
        
        // Simplex 3D Noise by Ashima Arts / Stefan Gustavson
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        
        float snoise(vec3 v){
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;
        
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
        
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
        
          i = mod(i, 289.0 );
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
        
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
        
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
        
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
        
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
        
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
        
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
        
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          // Noise frequency & offset based on audio
          vec3 noisePos = position * (1.1 + uMid * 0.5) + vec3(0.0, 0.0, uTime * 0.5);
          float n1 = snoise(noisePos);
          float n2 = snoise(noisePos * 2.5 + vec3(uTime * 0.3, 0.0, 0.0)) * 0.5;
          float noise = n1 + n2;
          vNoise = noise;
          
          // Core deforms organically but gently with noise + bass (comfort focus)
          float displacement = (noise * 0.04 * (1.0 + uBass * 0.6)) + (uBass * 0.05);
          vec3 newPos = position + normal * displacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying float vNoise;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float ndotv = max(dot(normal, viewDir), 0.0);
          
          // Fresnel glow factor
          float fresnel = pow(1.0 - ndotv, 3.5);
          
          // Normalize noise
          float tMap = (vNoise + 1.5) / 3.0;
          tMap = clamp(tMap, 0.0, 1.0);
          
          // Plasma gradient
          vec3 plasmaColor = mix(uColor1, uColor2, tMap);
          plasmaColor = mix(plasmaColor, uColor3, fresnel * 0.8);
          
          // Muted heat hotspots (comfortable levels)
          float hotSpot = pow(tMap, 5.0) * (0.3 + uBass * 0.5);
          vec3 finalColor = plasmaColor + vec3(1.1, 1.0, 0.9) * hotSpot;
          
          // Rim glow
          float coronaIntensity = 0.2 + uMid * 0.4 + uBass * 0.2;
          finalColor += uColor3 * fresnel * coronaIntensity;
          
          // Bloom interaction (highly dampened to avoid flashing/poking eyes)
          float glow = 1.0 + uBass * 0.35 + uMid * 0.15;
          
          gl_FragColor = vec4(finalColor * glow, 1.0);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE.Color() },
        uColor2: { value: new THREE.Color() },
        uColor3: { value: new THREE.Color() },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
    })
  }, [])

  const flareMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying float vNoise;
        
        // Simplex 3D Noise by Ashima Arts / Stefan Gustavson
        vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
        vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
        
        float snoise(vec3 v){
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
        
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;
        
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
        
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
        
          i = mod(i, 289.0 );
          vec4 p = permute( permute( permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
        
          float n_ = 0.142857142857;
          vec3  ns = n_ * D.wyz - D.xzx;
        
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
        
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
        
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
        
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
        
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
        
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
        
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
        
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vViewPosition = -mvPosition.xyz;
          
          // Outer flare deforms gently
          vec3 noisePos = position * (0.8 + uBass * 0.2) + vec3(0.0, uTime * 0.8, 0.0);
          float noise = snoise(noisePos) * 0.5 + snoise(noisePos * 2.0 - vec3(0.0, 0.0, uTime * 0.5)) * 0.25;
          vNoise = noise;
          
          float displacement = (noise * 0.08 * (1.0 + uBass * 0.8)) + (uBass * 0.08);
          vec3 newPos = position + normal * displacement;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uBass;
        uniform float uMid;
        uniform float uTreble;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec3 vViewPosition;
        varying float vNoise;
        
        void main() {
          vec3 normal = normalize(vNormal);
          vec3 viewDir = normalize(vViewPosition);
          float ndotv = max(dot(normal, viewDir), 0.0);
          
          float fresnel = pow(1.0 - ndotv, 2.5);
          float noiseFactor = clamp((vNoise + 1.0) * 0.5, 0.0, 1.0);
          
          // Soft volumetric alpha values
          float alpha = (fresnel * 0.25 + noiseFactor * 0.3) * (0.05 + uBass * 0.15 + uMid * 0.05);
          
          vec3 flareColor = mix(uColor2, uColor3, noiseFactor);
          flareColor += vec3(1.0, 0.8, 0.6) * pow(noiseFactor, 5.0) * uBass * 0.3;
          
          float glow = 1.0 + uBass * 0.2;
          
          gl_FragColor = vec4(flareColor * glow, alpha);
        }
      `,
      uniforms: {
        uTime: { value: 0 },
        uBass: { value: 0 },
        uMid: { value: 0 },
        uTreble: { value: 0 },
        uColor1: { value: new THREE.Color() },
        uColor2: { value: new THREE.Color() },
        uColor3: { value: new THREE.Color() },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    })
  }, [])

  // Shockwave ring material
  const shockwaveMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: new THREE.Color(),
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
  }, [])

  // Magnetic flux loop materials
  const magneticMaterial1 = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  const magneticMaterial2 = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }), [])
  const magneticMaterial3 = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(), transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false }), [])

  const smoothBass = useRef(0)
  const smoothMid = useRef(0)
  const smoothTreble = useRef(0)
  const lastShockwaveTime = useRef(0)

  useFrame((state, delta) => {
    if (!pointsRef.current || !coreRef.current || !flareRef.current) return
    const analysis = getAnalysis()
    const t = state.clock.elapsedTime

    // Smooth audio inputs (slower interpolation for maximum fluid smoothness)
    smoothBass.current += (analysis.bass - smoothBass.current) * 0.05
    smoothMid.current += (analysis.mid - smoothMid.current) * 0.04
    smoothTreble.current += (analysis.treble - smoothTreble.current) * 0.04

    const bass = smoothBass.current
    const mid = smoothMid.current
    const treble = smoothTreble.current

    // Trigger shockwave logic on strong bass hits (> 0.84) and debounce
    if (analysis.bass > 0.84 && t - lastShockwaveTime.current > 0.6) {
      lastShockwaveTime.current = t
    }

    const timeSinceShockwave = t - lastShockwaveTime.current
    const shockwaveActive = timeSinceShockwave < 1.0 // lasts 1.0s (slower expansion)
    let currentShockwaveScale = 0
    let shockwaveAlpha = 0

    if (shockwaveActive) {
      const progress = timeSinceShockwave / 1.0
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      currentShockwaveScale = 0.7 + easeOut * 5.0
      shockwaveAlpha = Math.sin(progress * Math.PI) * 0.18 * bass
    }

    // Update shockwave ring mesh
    if (shockwaveRef.current) {
      if (shockwaveActive) {
        shockwaveRef.current.scale.set(currentShockwaveScale, currentShockwaveScale, 1.0)
        shockwaveRef.current.visible = true
        shockwaveMaterial.opacity = shockwaveAlpha
        shockwaveMaterial.color.copy(colors[0]).lerp(colors[1] || colors[0], 0.4)
      } else {
        shockwaveRef.current.visible = false
      }
    }

    // Update custom shaders uniforms
    coreMaterial.uniforms.uTime.value = t
    coreMaterial.uniforms.uBass.value = bass
    coreMaterial.uniforms.uMid.value = mid
    coreMaterial.uniforms.uTreble.value = treble
    coreMaterial.uniforms.uColor1.value.copy(colors[0])
    coreMaterial.uniforms.uColor2.value.copy(colors[1])
    coreMaterial.uniforms.uColor3.value.copy(colors[2] || colors[1])

    flareMaterial.uniforms.uTime.value = t
    flareMaterial.uniforms.uBass.value = bass
    flareMaterial.uniforms.uMid.value = mid
    flareMaterial.uniforms.uTreble.value = treble
    flareMaterial.uniforms.uColor1.value.copy(colors[0])
    flareMaterial.uniforms.uColor2.value.copy(colors[1])
    flareMaterial.uniforms.uColor3.value.copy(colors[2] || colors[1])

    // Update magnetic materials & rotation
    magneticMaterial1.color.copy(colors[1])
    magneticMaterial2.color.copy(colors[2] || colors[1])
    magneticMaterial3.color.copy(colors[0])

    if (magneticGroupRef.current) {
      magneticGroupRef.current.rotation.y += delta * 0.12
      magneticGroupRef.current.rotation.x += delta * 0.06
      const magScale = 1.0 + treble * 0.05 + Math.sin(t * 3.0) * 0.01
      magneticGroupRef.current.scale.setScalar(magScale)
    }

    // Dynamic point light matching core (dimmer, soft ambient fill)
    if (lightRef.current) {
      lightRef.current.intensity = 1.5 + bass * 2.5
      lightRef.current.color.copy(colors[0]).lerp(colors[1] || colors[0], mid)
    }

    // Rotate core/flare helper scales (though shader handles positions, we still keep base rotation)
    coreRef.current.rotation.y += delta * 0.15
    flareRef.current.rotation.y -= delta * 0.1

    // Swirl particles in vector/curl noise field
    const geom = pointsRef.current.geometry
    const posAttr = geom.attributes.position as THREE.BufferAttribute
    const colAttr = geom.attributes.color as THREE.BufferAttribute
    const posArr = posAttr.array as Float32Array
    const colArr = colAttr.array as Float32Array

    // Global rotation speed based on user settings + mids
    const baseRot = delta * rotationSpeed * 0.25
    const audioRotMult = 1.0 + bass * 1.0

    particleStates.forEach((p, i) => {
      p.angle += p.speed * audioRotMult * baseRot

      // Simulate curl noise displacement in 3D space
      const curlFreq = 1.8 + bass * 0.3
      const curlTime = t * 1.0 + p.phase
      
      const curlX = Math.sin(p.angle * curlFreq + curlTime) * (0.15 + mid * 0.25)
      const curlY = Math.cos(p.angle * 1.2 - curlTime * 0.8) * (0.1 + treble * 0.2)
      const curlZ = Math.cos(p.angle * curlFreq + curlTime * 1.2) * (0.15 + mid * 0.25)

      // Base orbital position
      let x = Math.cos(p.angle) * p.radius + curlX
      let y = p.yFactor * p.radius * (1.0 + treble * 0.35) + curlY
      let z = Math.sin(p.angle) * p.radius + curlZ

      // Shockwave front pushing particles away physically (soft push)
      if (shockwaveActive) {
        const shockwaveDist = currentShockwaveScale
        const distFromCenter = Math.sqrt(x * x + z * z)
        const diff = distFromCenter - shockwaveDist
        
        // Push particles that are close to the expanding shockwave front
        if (Math.abs(diff) < 1.0) {
          const pushForce = (1.0 - Math.abs(diff) / 1.0) * bass * 0.35
          x += (x / (distFromCenter || 1.0)) * pushForce
          z += (z / (distFromCenter || 1.0)) * pushForce
          y += (y / (distFromCenter || 1.0)) * pushForce * 0.1
        }
      }

      const i3 = i * 3
      posArr[i3] = x
      posArr[i3 + 1] = y
      posArr[i3 + 2] = z

      // Particle color reactive mapping
      const baseCol = colors[p.colorIndex].clone()
      const col = baseCol
      if (p.colorIndex % 3 === 0) {
        col.lerp(colors[(p.colorIndex + 1) % colors.length], mid)
      } else if (p.colorIndex % 3 === 1) {
        col.lerp(colors[(p.colorIndex + 2) % colors.length], treble)
      }

      // Gently blend towards white in the center during bass hits
      if (bass > 0.4 && p.radius < 2.2) {
        col.lerp(new THREE.Color('#ffffff'), (bass - 0.4) * 0.3)
      }

      colArr[i3] = col.r
      colArr[i3 + 1] = col.g
      colArr[i3 + 2] = col.b
    })

    posAttr.needsUpdate = true
    colAttr.needsUpdate = true

    // Rotate parent group
    pointsRef.current.rotation.y += delta * rotationSpeed * 0.02
    
    // Resize particles dynamically to create "sparkle" details via built-in points material
    const pointsMat = pointsRef.current.material as THREE.PointsMaterial
    pointsMat.size = 0.035 + treble * 0.05
    pointsMat.opacity = 0.65 + mid * 0.25
  })

  return (
    <group>
      {/* Dynamic point light centered at the core */}
      <pointLight ref={lightRef} distance={15} decay={1.5} />

      {/* Core Star (Boiling Plasma custom shader) */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.7, 64, 64]} />
        <primitive object={coreMaterial} attach="material" />
      </mesh>

      {/* Volumetric Corona Flare Shield (Custom outer shader) */}
      <mesh ref={flareRef}>
        <sphereGeometry args={[0.82, 64, 64]} />
        <primitive object={flareMaterial} attach="material" />
      </mesh>

      {/* Shockwave Energy Ring */}
      <mesh ref={shockwaveRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.96, 1.0, 64]} />
        <primitive object={shockwaveMaterial} attach="material" />
      </mesh>

      {/* Magnetic Flux Lines */}
      <group ref={magneticGroupRef}>
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[1.25, 0.015, 8, 64]} />
          <primitive object={magneticMaterial1} attach="material" />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <torusGeometry args={[1.35, 0.012, 8, 64]} />
          <primitive object={magneticMaterial2} attach="material" />
        </mesh>
        <mesh rotation={[-Math.PI / 4, 0, Math.PI / 4]}>
          <torusGeometry args={[1.3, 0.012, 8, 64]} />
          <primitive object={magneticMaterial3} attach="material" />
        </mesh>
      </group>

      {/* Swirling Plasma Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[buffers.pos, 3]} count={PARTICLE_COUNT} />
          <bufferAttribute attach="attributes-color" args={[buffers.cols, 3]} count={PARTICLE_COUNT} />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          map={glowTexture || undefined}
          transparent
          opacity={0.8}
          sizeAttenuation
          vertexColors
          toneMapped={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}
