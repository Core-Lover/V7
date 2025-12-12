import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MiningOverviewGrid from '../components/MiningOverviewGrid';
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
      <MiningOverviewGrid 
        currentRate={127.43}
        hashrate="2.5 EH/s"
        difficulty="68.1 T"
        activeMiners={1247}
      />
    </div>
  );
};

export default MiningPage;
