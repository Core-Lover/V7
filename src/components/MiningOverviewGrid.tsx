import { useEffect, useRef, useMemo, memo } from 'react';
import './MiningOverviewGrid.css';

interface MiningGridProps {
  currentRate?: number;
  hashrate?: string;
  difficulty?: string;
  activeMiners?: number;
}

interface Cube {
  id: number;
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  speed: number;
  color: string;
}

const MiningOverviewGrid = memo(({
  currentRate = 127.43,
  hashrate = '2.5 EH/s',
  difficulty = '68.1 T',
  activeMiners = 1247
}: MiningGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cubesRef = useRef<Cube[]>([]);
  const animationFrameRef = useRef<number>();

  const cubes = useMemo<Cube[]>(() => {
    return Array.from({ length: 9 }, (_, i) => ({
      id: i,
      x: (i % 3) * 40 - 40,
      y: Math.floor(i / 3) * 40 - 40,
      z: 0,
      rotationX: Math.random() * 360,
      rotationY: Math.random() * 360,
      rotationZ: Math.random() * 360,
      speed: 0.5 + Math.random() * 1.5,
      color: i % 3 === 0 ? 'hsl(30, 100%, 50%)' : i % 3 === 1 ? 'hsl(173, 58%, 39%)' : 'hsl(197, 37%, 24%)',
    }));
  }, []);

  useEffect(() => {
    cubesRef.current = cubes;
  }, [cubes]);

  useEffect(() => {
    let lastTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      if (containerRef.current) {
        cubesRef.current.forEach((cube, index) => {
          const cubeEl = containerRef.current?.querySelector(`[data-cube="${index}"]`) as HTMLElement;
          if (cubeEl) {
            cube.rotationX += cube.speed * deltaTime * 30;
            cube.rotationY += cube.speed * deltaTime * 45;
            cube.rotationZ += cube.speed * deltaTime * 20;

            const float = Math.sin(now / 2000 + index) * 5;
            cubeEl.style.transform = `
              translate3d(${cube.x}px, ${cube.y + float}px, ${cube.z}px)
              rotateX(${cube.rotationX}deg)
              rotateY(${cube.rotationY}deg)
              rotateZ(${cube.rotationZ}deg)
            `;
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="mining-overview-grid">
      <div className="grid-container">
        {/* Header */}
        <div className="grid-header">
          <h2 className="grid-title">Mining Overview</h2>
          <div className="rate-badge">
            <span className="rate-label">Current Rate</span>
            <span className="rate-value">${currentRate.toFixed(2)}</span>
          </div>
        </div>

        {/* 3D Animated Grid */}
        <div className="cube-grid-wrapper">
          <div className="perspective-container" ref={containerRef}>
            {cubes.map((cube) => (
              <div
                key={cube.id}
                data-cube={cube.id}
                className="animated-cube"
                style={{
                  backgroundColor: cube.color,
                }}
              >
                <div className="cube-inner">
                  <div className="cube-face cube-front" />
                  <div className="cube-face cube-back" />
                  <div className="cube-face cube-right" />
                  <div className="cube-face cube-left" />
                  <div className="cube-face cube-top" />
                  <div className="cube-face cube-bottom" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="grid-stats">
          <div className="stat-item">
            <div className="stat-label">Network Hashrate</div>
            <div className="stat-value">{hashrate}</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-label">Difficulty</div>
            <div className="stat-value">{difficulty}</div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <div className="stat-label">Active Miners</div>
            <div className="stat-value">{activeMiners.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

MiningOverviewGrid.displayName = 'MiningOverviewGrid';

export default MiningOverviewGrid;
