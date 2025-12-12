
import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';

interface EthereumMagicPotProps {
  autoRotate?: boolean;
}

const EthereumMagicPot = memo(({ autoRotate = true }: EthereumMagicPotProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coinRef = useRef<THREE.Group | null>(null);
  const fireParticlesRef = useRef<THREE.Points[]>([]);
  const smokeParticlesRef = useRef<THREE.Points[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 9);
    camera.lookAt(0, 1.5, 0);
    cameraRef.current = camera;

    // Renderer setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        precision: 'highp',
      });
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      return;
    }

    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Advanced Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x4a4a6a, 0.6);
    scene.add(ambientLight);

    // Main spotlight from above (for coin) - brighter for pastel colors
    const spotLight = new THREE.SpotLight(0xffffff, 4.5, 50, Math.PI / 5, 0.4, 2);
    spotLight.position.set(0, 8, 2);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 2048;
    spotLight.shadow.mapSize.height = 2048;
    scene.add(spotLight);

    // Fire glow from below
    const fireLight = new THREE.PointLight(0xff6600, 2.5, 20);
    fireLight.position.set(0, -0.5, 0);
    scene.add(fireLight);

    // Cyan/blue accent light for the top
    const cyanLight = new THREE.PointLight(0xAFE9FF, 3, 35);
    cyanLight.position.set(0, 4, 3);
    scene.add(cyanLight);

    // Peach accent light from the side
    const peachLight = new THREE.PointLight(0xF5D5C8, 2.5, 30);
    peachLight.position.set(-4, 3, -1);
    scene.add(peachLight);

    // Lavender accent light from the other side
    const lavenderLight = new THREE.PointLight(0xD5C8F5, 2.5, 30);
    lavenderLight.position.set(4, 3, -1);
    scene.add(lavenderLight);

    // Create Premium Magic Cauldron Pot
    const potGroup = new THREE.Group();
    
    // Pot body - using custom shape for realistic cauldron
    const potCurve: THREE.Vector2[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const y = t * 2.2;
      let x;
      
      if (t < 0.1) {
        x = 0.6 + t * 2;
      } else if (t < 0.8) {
        x = 0.8 + Math.sin(t * Math.PI) * 0.5;
      } else {
        x = 1.3 - (t - 0.8) * 2;
      }
      
      potCurve.push(new THREE.Vector2(x, y));
    }
    
    const potGeometry = new THREE.LatheGeometry(potCurve, 48);
    const potMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.8,
      roughness: 0.4,
      emissive: 0x0a0a0a,
      emissiveIntensity: 0.3,
    });
    const pot = new THREE.Mesh(potGeometry, potMaterial);
    pot.castShadow = true;
    pot.receiveShadow = true;
    potGroup.add(pot);

    // Golden rim with intricate detail
    const rimGeometry = new THREE.TorusGeometry(1.35, 0.12, 20, 64);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.05,
      emissive: 0xffaa00,
      emissiveIntensity: 0.6,
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    rim.position.y = 2.2;
    rim.rotation.x = Math.PI / 2;
    rim.castShadow = true;
    potGroup.add(rim);

    // Decorative bands
    for (let i = 0; i < 3; i++) {
      const bandGeometry = new THREE.TorusGeometry(0.9 + i * 0.15, 0.04, 12, 48);
      const bandMaterial = new THREE.MeshStandardMaterial({
        color: 0xb8860b,
        metalness: 0.9,
        roughness: 0.2,
      });
      const band = new THREE.Mesh(bandGeometry, bandMaterial);
      band.position.y = 0.5 + i * 0.6;
      band.rotation.x = Math.PI / 2;
      potGroup.add(band);
    }

    // Inner magical glow
    const innerGlowGeometry = new THREE.CylinderGeometry(1.1, 0.9, 0.8, 48);
    const innerGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x3366ff,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    innerGlow.position.y = 1.8;
    potGroup.add(innerGlow);

    potGroup.position.y = -1.2;
    scene.add(potGroup);

    // Fire particles under pot
    for (let layer = 0; layer < 2; layer++) {
      const fireParticleCount = 150;
      const firePositions = new Float32Array(fireParticleCount * 3);
      const fireVelocities = new Float32Array(fireParticleCount * 3);
      const fireLifetimes = new Float32Array(fireParticleCount);

      for (let i = 0; i < fireParticleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1.2;
        
        firePositions[i * 3] = Math.cos(angle) * radius;
        firePositions[i * 3 + 1] = -Math.random() * 0.5;
        firePositions[i * 3 + 2] = Math.sin(angle) * radius;
        
        fireVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
        fireVelocities[i * 3 + 1] = 0.03 + Math.random() * 0.02;
        fireVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
        
        fireLifetimes[i] = Math.random();
      }

      const fireGeometry = new THREE.BufferGeometry();
      fireGeometry.setAttribute('position', new THREE.BufferAttribute(firePositions, 3));
      fireGeometry.setAttribute('velocity', new THREE.BufferAttribute(fireVelocities, 3));
      fireGeometry.setAttribute('lifetime', new THREE.BufferAttribute(fireLifetimes, 1));

      const fireMaterial = new THREE.PointsMaterial({
        size: 0.2,
        color: layer === 0 ? 0xff6600 : 0xffaa00,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const fireParticles = new THREE.Points(fireGeometry, fireMaterial);
      fireParticles.position.y = -1.2;
      scene.add(fireParticles);
      fireParticlesRef.current.push(fireParticles);
    }

    // Create Ethereum logo group using PNG texture
    const coinGroup = new THREE.Group();
    const textureLoader = new THREE.TextureLoader();
    
    // Load the ETH logo PNG texture
    const ethTexture = textureLoader.load('/textures/eth-logo.png', (texture) => {
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      texture.colorSpace = THREE.SRGBColorSpace;
    });
    
    // Main ETH logo sprite - billboard effect (always faces camera)
    const logoMaterial = new THREE.SpriteMaterial({
      map: ethTexture,
      transparent: true,
      alphaTest: 0.1,
      depthWrite: false,
    });
    const logoSprite = new THREE.Sprite(logoMaterial);
    logoSprite.scale.set(2.0, 3.0, 1);
    coinGroup.add(logoSprite);
    
    // Additive glow halo behind the logo
    const glowMaterial = new THREE.SpriteMaterial({
      map: ethTexture,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glowSprite = new THREE.Sprite(glowMaterial);
    glowSprite.scale.set(2.4, 3.6, 1);
    glowSprite.position.z = -0.1;
    coinGroup.add(glowSprite);
    
    // Secondary outer glow for more ethereal effect
    const outerGlowMaterial = new THREE.SpriteMaterial({
      map: ethTexture,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      color: 0x8888ff,
    });
    const outerGlowSprite = new THREE.Sprite(outerGlowMaterial);
    outerGlowSprite.scale.set(2.8, 4.2, 1);
    outerGlowSprite.position.z = -0.2;
    coinGroup.add(outerGlowSprite);

    coinGroup.position.set(0, 3, 0);
    scene.add(coinGroup);
    coinRef.current = coinGroup;

    // Blue mystical smoke
    for (let layer = 0; layer < 4; layer++) {
      const smokeCount = 100;
      const smokePositions = new Float32Array(smokeCount * 3);
      const smokeVelocities = new Float32Array(smokeCount * 3);
      const smokeLifetimes = new Float32Array(smokeCount);

      for (let i = 0; i < smokeCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 1;
        
        smokePositions[i * 3] = Math.cos(angle) * radius;
        smokePositions[i * 3 + 1] = Math.random() * 0.5;
        smokePositions[i * 3 + 2] = Math.sin(angle) * radius;
        
        smokeVelocities[i * 3] = (Math.random() - 0.5) * 0.015;
        smokeVelocities[i * 3 + 1] = 0.025 + Math.random() * 0.02;
        smokeVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
        
        smokeLifetimes[i] = Math.random();
      }

      const smokeGeometry = new THREE.BufferGeometry();
      smokeGeometry.setAttribute('position', new THREE.BufferAttribute(smokePositions, 3));
      smokeGeometry.setAttribute('velocity', new THREE.BufferAttribute(smokeVelocities, 3));
      smokeGeometry.setAttribute('lifetime', new THREE.BufferAttribute(smokeLifetimes, 1));

      const smokeMaterial = new THREE.PointsMaterial({
        size: 0.2 + layer * 0.05,
        color: 0x4488ff,
        transparent: true,
        opacity: 0.5 - layer * 0.08,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const smokeParticles = new THREE.Points(smokeGeometry, smokeMaterial);
      smokeParticles.position.y = 0.8;
      scene.add(smokeParticles);
      smokeParticlesRef.current.push(smokeParticles);
    }

    // Magical sparkles
    const sparkleCount = 80;
    const sparkleGeometry = new THREE.BufferGeometry();
    const sparklePositions = new Float32Array(sparkleCount * 3);
    
    for (let i = 0; i < sparkleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 1.5 + Math.random() * 1.5;
      
      sparklePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      sparklePositions[i * 3 + 1] = radius * Math.cos(phi);
      sparklePositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    sparkleGeometry.setAttribute('position', new THREE.BufferAttribute(sparklePositions, 3));
    
    const sparkleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    
    const sparkles = new THREE.Points(sparkleGeometry, sparkleMaterial);
    sparkles.position.y = 3;
    scene.add(sparkles);

    // Animation Loop
    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      // Animate Ethereum logo - smooth floating with gentle effects
      if (coinRef.current) {
        coinRef.current.position.y = 3 + Math.sin(time * 0.8) * 0.4;
        coinRef.current.position.x = Math.sin(time * 0.5) * 0.15;
        coinRef.current.rotation.z = Math.sin(time * 0.3) * 0.08;
        const pulseScale = 1 + Math.sin(time * 1.2) * 0.03;
        coinRef.current.scale.set(pulseScale, pulseScale, 1);
      }
      
      // Animate glow sprites for pulsing effect
      if (glowSprite) {
        glowSprite.material.opacity = 0.25 + Math.sin(time * 2) * 0.1;
      }
      if (outerGlowSprite) {
        outerGlowSprite.material.opacity = 0.12 + Math.sin(time * 1.5) * 0.05;
      }

      // Fire particles
      fireParticlesRef.current.forEach((fireSystem) => {
        const positions = fireSystem.geometry.attributes.position.array as Float32Array;
        const velocities = fireSystem.geometry.attributes.velocity.array as Float32Array;
        const lifetimes = fireSystem.geometry.attributes.lifetime.array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i];
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2];

          lifetimes[i / 3] += 0.01;

          if (positions[i + 1] > 0.5 || lifetimes[i / 3] > 1) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 1.2;
            positions[i] = Math.cos(angle) * radius;
            positions[i + 1] = -Math.random() * 0.5;
            positions[i + 2] = Math.sin(angle) * radius;
            lifetimes[i / 3] = 0;
          }
        }

        fireSystem.geometry.attributes.position.needsUpdate = true;
        fireSystem.geometry.attributes.lifetime.needsUpdate = true;
      });

      // Smoke particles with spiral
      smokeParticlesRef.current.forEach((smokeSystem) => {
        const positions = smokeSystem.geometry.attributes.position.array as Float32Array;
        const velocities = smokeSystem.geometry.attributes.velocity.array as Float32Array;
        const lifetimes = smokeSystem.geometry.attributes.lifetime.array as Float32Array;

        for (let i = 0; i < positions.length; i += 3) {
          const spiralAngle = time * 1.5 + lifetimes[i / 3] * Math.PI * 2;
          const spiralRadius = 0.15 * (positions[i + 1] / 5);
          
          positions[i] += velocities[i] + Math.cos(spiralAngle) * spiralRadius * 0.015;
          positions[i + 1] += velocities[i + 1];
          positions[i + 2] += velocities[i + 2] + Math.sin(spiralAngle) * spiralRadius * 0.015;

          lifetimes[i / 3] += 0.004;

          if (positions[i + 1] > 5 || lifetimes[i / 3] > 1) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random();
            positions[i] = Math.cos(angle) * radius;
            positions[i + 1] = 0;
            positions[i + 2] = Math.sin(angle) * radius;
            lifetimes[i / 3] = 0;
          }
        }

        smokeSystem.geometry.attributes.position.needsUpdate = true;
        smokeSystem.geometry.attributes.lifetime.needsUpdate = true;
      });

      // Pulsing inner glow
      if (innerGlow) {
        innerGlow.material.opacity = 0.5 + Math.sin(time * 2.5) * 0.3;
        innerGlow.scale.set(1 + Math.sin(time * 3) * 0.05, 1, 1 + Math.sin(time * 3) * 0.05);
      }

      // Rotate sparkles
      sparkles.rotation.y = time * 0.4;
      sparkles.rotation.x = Math.sin(time * 0.3) * 0.2;

      // Fire light flicker
      fireLight.intensity = 2.5 + Math.sin(time * 8) * 0.5;

      // Removed aura and glow ring animations for cleaner logo visibility

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }

      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry?.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
        if (object instanceof THREE.Sprite) {
          if (object.material instanceof THREE.SpriteMaterial) {
            object.material.map?.dispose();
            object.material.dispose();
          }
        }
      });
      
      ethTexture?.dispose();
      renderer.dispose();
    };
  }, [autoRotate]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    />
  );
});

EthereumMagicPot.displayName = 'EthereumMagicPot';

export default EthereumMagicPot;
