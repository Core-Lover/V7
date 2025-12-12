import { useEffect, useRef, memo } from 'react';
import * as THREE from 'three';

interface BlockchainCubeThreeProps {
  autoRotate?: boolean;
}

// Cache texture creation to avoid re-creating on every render
const textureCache = new Map<string, THREE.Texture>();

const createFaceTexture = (color1: string, color2: string) => {
  const key = `${color1}-${color2}`;
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const gradient = ctx.createLinearGradient(0, 0, 256, 256);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  textureCache.set(key, texture);
  return texture;
};

const BlockchainCubeThree = memo(({ autoRotate = true }: BlockchainCubeThreeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cubeRef = useRef<THREE.Mesh | null>(null);
  const blockGroupRef = useRef<THREE.Group | null>(null);
  const rotationRef = useRef({ x: 0.3, y: 0.4 });
  const mouseRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog(0x0a0a0a, 20, 100);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 6;
    cameraRef.current = camera;

    // Renderer setup - optimized quality and performance balance
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        precision: 'highp',
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      });
    } catch (error) {
      console.error('WebGL initialization failed:', error);
      return;
    }
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.sortObjects = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create main cube with quality segments
    const geometry = new THREE.BoxGeometry(2, 2, 2, 8, 8, 8);

    const materials = [
      new THREE.MeshStandardMaterial({
        map: createFaceTexture('#FFD700', '#FFA000'),
        metalness: 0.6,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        map: createFaceTexture('#CC6600', '#884400'),
        metalness: 0.6,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        map: createFaceTexture('#FFE664', '#FFBE00'),
        metalness: 0.6,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        map: createFaceTexture('#664422', '#332211'),
        metalness: 0.6,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        map: createFaceTexture('#FFC800', '#FF9600'),
        metalness: 0.6,
        roughness: 0.3,
      }),
      new THREE.MeshStandardMaterial({
        map: createFaceTexture('#B46400', '#664422'),
        metalness: 0.6,
        roughness: 0.3,
      }),
    ];

    const cube = new THREE.Mesh(geometry, materials);
    cube.renderOrder = 0;
    scene.add(cube);
    cubeRef.current = cube;

    // Add high-visibility wireframe edges for HD sharpness
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffa500,
      linewidth: 3,
      fog: false,
      transparent: false,
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    wireframe.renderOrder = 10;
    cube.add(wireframe);

    // Create orbiting block group
    const blockGroup = new THREE.Group();
    const blockMat = new THREE.MeshStandardMaterial({
      color: 0xffa500,
      emissive: 0xffa500,
      emissiveIntensity: 0.6,
      metalness: 0.8,
      roughness: 0.2,
    });
    
    for (let i = 0; i < 8; i++) {
      const blockGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
      const block = new THREE.Mesh(blockGeo, blockMat);

      const angle = (i / 8) * Math.PI * 2;
      block.position.x = Math.cos(angle) * 3.5;
      block.position.y = Math.sin(angle * 2) * 2;
      block.position.z = Math.sin(angle) * 3.5;

      blockGroup.add(block);
    }
    scene.add(blockGroup);
    blockGroupRef.current = blockGroup;

    // Enhanced lighting for HD visibility
    const keyLight = new THREE.DirectionalLight(0xffa500, 1.4);
    keyLight.position.set(8, 8, 8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x0088ff, 0.8);
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    const ambientLight = new THREE.AmbientLight(0x505050, 1.8);
    scene.add(ambientLight);

    // Mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width * 2 - 1;
      mouseRef.current.y = -(e.clientY - rect.top) / rect.height * 2 + 1;
      autoRotateRef.current = false;
    };

    const handleMouseLeave = () => {
      autoRotateRef.current = autoRotate;
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('mouseleave', handleMouseLeave);
    }

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (autoRotateRef.current) {
        rotationRef.current.x += 0.004;
        rotationRef.current.y += 0.006;
      } else {
        rotationRef.current.x += (mouseRef.current.y * 0.5 - rotationRef.current.x) * 0.08;
        rotationRef.current.y += (mouseRef.current.x * 0.5 - rotationRef.current.y) * 0.08;
      }

      if (cubeRef.current) {
        cubeRef.current.rotation.x = rotationRef.current.x;
        cubeRef.current.rotation.y = rotationRef.current.y;
      }

      if (blockGroupRef.current) {
        blockGroupRef.current.rotation.y -= 0.008;
        for (let i = 0; i < blockGroupRef.current.children.length; i++) {
          const block = blockGroupRef.current.children[i];
          block.rotation.x += 0.015;
          block.rotation.y += 0.015;
          block.rotation.z += 0.01;
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('mouseleave', handleMouseLeave);
        if (rendererRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      geometry.dispose();
      materials.forEach((m) => m.dispose());
      rendererRef.current?.dispose();
    };
  }, [autoRotate]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        borderRadius: '0px',
        overflow: 'hidden',
      }}
      data-testid="canvas-blockchain-cube"
    />
  );
});

BlockchainCubeThree.displayName = 'BlockchainCubeThree';

export default BlockchainCubeThree;
