import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './LegalPage.css';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Terms of Service</h1>
      </div>

      <div className="legal-content">
        <div className="legal-section">
          <p className="last-updated">Last Updated: December 2025</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the ETHICX platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            ETHICX is a multi-chain blockchain tools platform that provides:
          </p>
          <ul>
            <li>EIX token mining system</li>
            <li>User-to-user token transfers</li>
            <li>Account verification services</li>
            <li>Referral reward system</li>
            <li>Token creation tools</li>
          </ul>

          <h2>3. Account Responsibility</h2>
          <p>
            You are solely responsible for:
          </p>
          <ul>
            <li>Maintaining the security of your private key</li>
            <li>All activities that occur under your account</li>
            <li>Keeping your 6-digit PIN secure</li>
            <li>Any transactions made from your account</li>
          </ul>
          <p>
            <strong>Warning:</strong> Your private key is the ONLY way to access your account. We cannot recover lost private keys.
          </p>

          <h2>4. Verification Requirements</h2>
          <p>
            Account verification requires a one-time payment of 0.006 ETH on Ethereum Mainnet. This verification:
          </p>
          <ul>
            <li>Enables referral reward earnings</li>
            <li>Confirms wallet ownership</li>
            <li>Cannot be transferred to another account</li>
          </ul>

          <h2>5. Referral Program</h2>
          <p>
            Verified users earn 20% of mining rewards from their direct verified referrals. Rewards are calculated and distributed automatically upon mining reward claims.
          </p>

          <h2>6. Prohibited Activities</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Create multiple accounts for abuse</li>
            <li>Attempt to manipulate the mining system</li>
            <li>Use bots or automated tools</li>
            <li>Engage in fraudulent referral activities</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>

          <h2>7. Disclaimer of Warranties</h2>
          <p>
            The platform is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access or that the service will be error-free.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            ETHICX shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform.
          </p>

          <h2>9. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            For questions regarding these Terms of Service, please contact us through our official channels.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
