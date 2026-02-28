import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Shield, Zap } from 'lucide-react';
import './MiningPage.css';

const MiningPage = () => {
  const navigate = useNavigate();

  return (
    <div className="mining-page">
      <button 
        className="back-button"
        onClick={() => navigate('/')}
        data-testid="button-back-to-home"
      >
        <ArrowLeft size={20} />
        <span>Back to Home</span>
      </button>
      
      <div className="mining-interface-professional" style={{
        padding: '2rem',
        maxWidth: '1200px',
        margin: '4rem auto',
        width: '100%'
      }}>
        <div style={{
          background: '#141820',
          borderRadius: '16px',
          border: '1px solid rgba(120, 132, 156, 0.18)',
          padding: '2rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.35)'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem', color: '#F4F6F8' }}>Network Intelligence</h1>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'rgba(28, 31, 36, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(120, 132, 156, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#FF7A1A' }}>
                <Activity size={20} />
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Network Hashrate</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#F4F6F8' }}>2.5 EH/s</div>
            </div>

            <div style={{ background: 'rgba(28, 31, 36, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(120, 132, 156, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#00FF7F' }}>
                <Shield size={20} />
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Difficulty</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#F4F6F8' }}>68.1 T</div>
            </div>

            <div style={{ background: 'rgba(28, 31, 36, 0.4)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(120, 132, 156, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: '#9333EA' }}>
                <Zap size={20} />
                <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Active Nodes</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#F4F6F8' }}>1,247</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiningPage;
