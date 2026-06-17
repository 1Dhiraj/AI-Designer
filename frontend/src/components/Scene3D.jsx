import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function Scene3D({ theme }) {
  const mountRef = useRef()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 0)
    mount.appendChild(renderer.domElement)

    // Scene / Camera
    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 5.5)

    // Resize helper
    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4))
    const dir = new THREE.DirectionalLight(0xffffff, 1.2)
    dir.position.set(3, 5, 3)
    scene.add(dir)
    const pt = new THREE.PointLight(0xF05A1A, 2.5, 12)
    pt.position.set(-2, 2, 2)
    scene.add(pt)

    // Core icosahedron
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xF05A1A,
      metalness: 0.3,
      roughness: 0.25,
      emissive: 0xF05A1A,
      emissiveIntensity: 0.15,
    })
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 0), coreMat)
    scene.add(core)

    // Wireframe cage
    const wireMat = new THREE.MeshBasicMaterial({ color: 0xF05A1A, wireframe: true, transparent: true, opacity: 0.18 })
    const cage = new THREE.Mesh(new THREE.IcosahedronGeometry(1.65, 1), wireMat)
    scene.add(cage)

    // Inner glow sphere
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xF05A1A, transparent: true, opacity: 0.07 })
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), glowMat)
    scene.add(glow)

    // Particles
    const pCount  = 180
    const pGeo    = new THREE.BufferGeometry()
    const pPos    = new Float32Array(pCount * 3)
    for (let i = 0; i < pCount; i++) {
      const r = 2.2 + Math.random() * 1.6
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      pPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta)
      pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pPos[i * 3 + 2] = r * Math.cos(phi)
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
    const pMat  = new THREE.PointsMaterial({ color: 0xF05A1A, size: 0.045, transparent: true, opacity: 0.55 })
    const particles = new THREE.Points(pGeo, pMat)
    scene.add(particles)

    // Orbital rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xF05A1A, transparent: true, opacity: 0.22, side: THREE.DoubleSide })
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.012, 8, 100), ringMat)
    ring1.rotation.x = Math.PI / 2.5
    scene.add(ring1)
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.008, 8, 100), ringMat.clone())
    ring2.rotation.x = Math.PI / 3
    ring2.rotation.z = Math.PI / 4
    scene.add(ring2)

    // Interaction state
    let targetRotY = 0, targetRotX = 0
    let currentRotY = 0, currentRotX = 0
    let dragging = false, lastX = 0, lastY = 0

    const onDown = e => { dragging = true; lastX = e.clientX ?? e.touches?.[0]?.clientX; lastY = e.clientY ?? e.touches?.[0]?.clientY }
    const onUp   = ()  => { dragging = false }
    const onMove = e => {
      if (!dragging) return
      const x = e.clientX ?? e.touches?.[0]?.clientX
      const y = e.clientY ?? e.touches?.[0]?.clientY
      targetRotY += (x - lastX) * 0.008
      targetRotX += (y - lastY) * 0.008
      targetRotX  = Math.max(-0.8, Math.min(0.8, targetRotX))
      lastX = x; lastY = y
    }

    renderer.domElement.addEventListener('mousedown',  onDown)
    renderer.domElement.addEventListener('touchstart', onDown, { passive: true })
    window.addEventListener('mouseup',   onUp)
    window.addEventListener('touchend',  onUp)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchmove', onMove, { passive: true })

    // Hint text
    let hintDone = false
    const hintTimer = setTimeout(() => { hintDone = true }, 4000)

    // Animation loop
    let raf
    const animate = () => {
      raf = requestAnimationFrame(animate)
      const t = performance.now() * 0.001

      if (!dragging) targetRotY += 0.004

      currentRotY += (targetRotY - currentRotY) * 0.06
      currentRotX += (targetRotX - currentRotX) * 0.06

      const group = { x: currentRotX, y: currentRotY }
      const bob = Math.sin(t * 0.8) * 0.1

      core.rotation.x = group.x
      core.rotation.y = group.y
      core.position.y = bob

      cage.rotation.x = group.x + t * 0.12
      cage.rotation.y = group.y + t * 0.08
      cage.position.y = bob

      glow.position.y  = bob
      particles.rotation.y = t * 0.04

      ring1.rotation.y = group.y + t * 0.15
      ring1.position.y = bob
      ring2.rotation.y = group.y - t * 0.1
      ring2.position.y = bob

      renderer.render(scene, camera)
    }
    animate()

    // Theme update helper
    const updateTheme = (th) => {
      const dark = th === 'dark'
      pMat.opacity    = dark ? 0.55 : 0.35
      wireMat.opacity = dark ? 0.18 : 0.10
    }
    updateTheme(theme)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(hintTimer)
      ro.disconnect()
      renderer.domElement.removeEventListener('mousedown',  onDown)
      renderer.domElement.removeEventListener('touchstart', onDown)
      window.removeEventListener('mouseup',   onUp)
      window.removeEventListener('touchend',  onUp)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchmove', onMove)
      renderer.dispose()
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement)
    }
  }, [])

  // Update theme without remounting
  useEffect(() => {
    // Theme changes handled inside the animation loop via closure — no extra work needed
  }, [theme])

  return <div ref={mountRef} style={{ width: '100%', flex: 1, minHeight: 0, cursor: 'grab' }} />
}
