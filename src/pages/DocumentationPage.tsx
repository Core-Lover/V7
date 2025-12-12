import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coins, Users, Shield, Globe, TrendingUp } from 'lucide-react';
import './LegalPage.css';

const DocumentationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page whitepaper-page">
      <div className="legal-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Documentation</h1>
      </div>

      <div className="legal-content">
        <div className="legal-section">
          <div className="whitepaper-hero">
            <img src="/ethicx-logo.png" alt="ETHICX" className="whitepaper-logo" />
            <h1>ETHICX Platform</h1>
            <p className="whitepaper-tagline">Multi-Chain Blockchain Tools & Mining Ecosystem</p>
            <p className="version">Version 1.0 - December 2025</p>
          </div>

          <h2>Abstract</h2>
          <p>
            ETHICX is a comprehensive blockchain platform designed to democratize access to cryptocurrency tools and rewards. Through our innovative mining system, referral network, and multi-chain support, we aim to create a sustainable ecosystem where users can earn, trade, and grow together.
          </p>

          <h2>1. Introduction</h2>
          <p>
            The blockchain space has evolved rapidly, yet many platforms remain complex and inaccessible to everyday users. ETHICX addresses this by providing:
          </p>
          <div className="feature-grid">
            <div className="feature-item">
              <Coins size={24} />
              <h4>EIX Mining</h4>
              <p>Earn tokens through our tiered mining system</p>
            </div>
            <div className="feature-item">
              <Users size={24} />
              <h4>Referral Rewards</h4>
              <p>20% earnings from verified referrals</p>
            </div>
            <div className="feature-item">
              <Shield size={24} />
              <h4>Secure Verification</h4>
              <p>Blockchain-based identity verification</p>
            </div>
            <div className="feature-item">
              <Globe size={24} />
              <h4>Multi-Chain</h4>
              <p>Support for Ethereum and Solana</p>
            </div>
          </div>

          <h2>2. EIX Token</h2>
          <p>
            EIX is the native utility token of the ETHICX ecosystem. It powers all platform activities including:
          </p>
          <ul>
            <li>Mining rewards distribution</li>
            <li>Upgrade tier purchases</li>
            <li>User-to-user transfers</li>
            <li>Referral bonus payments</li>
          </ul>

          <h2>3. Mining System</h2>
          <p>
            Our mining system operates on a tiered model that rewards dedication and investment:
          </p>
          <table className="tier-table">
            <thead>
              <tr>
                <th>Tier</th>
                <th>Rate</th>
                <th>Duration</th>
                <th>Upgrade Cost</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Default</td>
                <td>0.01 EIX/hr</td>
                <td>3 hours</td>
                <td>-</td>
              </tr>
              <tr>
                <td>Bronze</td>
                <td>0.03 EIX/hr</td>
                <td>6 hours</td>
                <td>6.60 EIX</td>
              </tr>
              <tr>
                <td>Silver</td>
                <td>0.05 EIX/hr</td>
                <td>12 hours</td>
                <td>8.40 EIX</td>
              </tr>
              <tr>
                <td>Gold</td>
                <td>0.10 EIX/hr</td>
                <td>24 hours</td>
                <td>10.00 EIX</td>
              </tr>
            </tbody>
          </table>

          <h2>4. Verification System</h2>
          <p>
            Account verification ensures platform integrity and enables premium features:
          </p>
          <ul>
            <li><strong>One-time fee:</strong> 0.006 ETH on Ethereum Mainnet</li>
            <li><strong>Blockchain verification:</strong> Transaction validated via Alchemy API</li>
            <li><strong>Unique wallet binding:</strong> One wallet per account</li>
            <li><strong>Anti-replay protection:</strong> Transaction hashes cannot be reused</li>
          </ul>

          <h2>5. Referral Program</h2>
          <p>
            The referral system rewards users for growing the ETHICX community:
          </p>
          <div className="highlight-box">
            <TrendingUp size={24} />
            <div>
              <h4>20% Referral Bonus</h4>
              <p>Earn 20% of all mining rewards claimed by your verified direct referrals. Rewards are automatically credited when your referrals claim their mining rewards.</p>
            </div>
          </div>

          <h2>6. Security</h2>
          <p>
            Security is paramount in our design:
          </p>
          <ul>
            <li>Private keys are never stored on servers</li>
            <li>All transfers are user-to-user by username only</li>
            <li>Verification requires cryptographic signature proof</li>
            <li>PostgreSQL database for enterprise-grade reliability</li>
          </ul>

          <h2>7. Roadmap</h2>
          <div className="roadmap">
            <div className="roadmap-item">
              <span className="phase">Phase 1</span>
              <span className="status completed">Completed</span>
              <p>Platform launch, mining system, referral program</p>
            </div>
            <div className="roadmap-item">
              <span className="phase">Phase 2</span>
              <span className="status active">In Progress</span>
              <p>Multi-chain token creation tools, enhanced verification</p>
            </div>
            <div className="roadmap-item">
              <span className="phase">Phase 3</span>
              <span className="status upcoming">Upcoming</span>
              <p>DEX integration, staking mechanisms, governance</p>
            </div>
            <div className="roadmap-item">
              <span className="phase">Phase 4</span>
              <span className="status upcoming">Upcoming</span>
              <p>Mobile apps, advanced analytics, enterprise features</p>
            </div>
          </div>

          <h2>8. Conclusion</h2>
          <p>
            ETHICX represents a new paradigm in blockchain accessibility. By combining intuitive design with powerful features, we're building a platform that empowers users at every level to participate in the decentralized future.
          </p>
          <p>
            Join us in building the future of blockchain technology.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPage;
