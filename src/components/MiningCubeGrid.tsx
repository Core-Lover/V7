import { useRef, memo, lazy, Suspense } from 'react';
import './MiningCubeGrid.css';

const BlockchainCubeThree = lazy(() => import('./BlockchainCubeThree'));

interface MiningCubeGridProps {
  miningRate: number;
  themeColors: {
    primary: string;
    secondary: string;
    tertiary: string;
    gradientStart: string;
    gradientMid: string;
    gradientEnd: string;
    rgba: string;
  };
}

const MiningCubeGrid = memo(({ miningRate, themeColors }: MiningCubeGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="mining-cube-grid-container">
      {/* Three.js Professional 3D Blockchain Cube */}
      <div className="blocks-display-area" ref={containerRef}>
        <Suspense fallback={<div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFA500', fontSize: '14px' }}>Loading 3D...</div>}>
          <BlockchainCubeThree autoRotate={true} />
        </Suspense>
      </div>

      {/* Reward Rate Label */}
      <div className="cube-label" style={{ color: themeColors.secondary }}>
        Reward Rate
      </div>

      {/* Minimal Stats */}
      <div className="mining-stats-minimal">
        <div className="stat-value-only" style={{ color: themeColors.primary }}>
          {miningRate.toFixed(2)} EIX/h
        </div>
      </div>
    </div>
  );
});

MiningCubeGrid.displayName = 'MiningCubeGrid';

export default MiningCubeGrid;
