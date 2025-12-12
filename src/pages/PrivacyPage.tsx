import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './LegalPage.css';

const PrivacyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="legal-page">
      <div className="legal-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="page-title">Privacy Policy</h1>
      </div>

      <div className="legal-content">
        <div className="legal-section">
          <p className="last-updated">Last Updated: December 2025</p>
          
          <h2>1. Introduction</h2>
          <p>
            ETHICX ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>

          <h2>2. Information We Collect</h2>
          <p>We collect information that you provide directly to us:</p>
          <ul>
            <li>Username and account credentials</li>
            <li>Ethereum wallet addresses for verification</li>
            <li>Transaction data on the blockchain</li>
            <li>Mining and referral activity data</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and mining rewards</li>
            <li>Track referral bonuses and team statistics</li>
            <li>Verify account ownership</li>
            <li>Communicate with you about updates and promotions</li>
          </ul>

          <h2>4. Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information. Your private keys are never stored on our servers - they remain solely in your possession.
          </p>

          <h2>5. Blockchain Data</h2>
          <p>
            Please note that transactions on the Ethereum blockchain are public and immutable. While we do not publicly associate your identity with your wallet addresses, blockchain transactions are permanently recorded.
          </p>

          <h2>6. Third-Party Services</h2>
          <p>
            We may use third-party services for analytics and blockchain verification (such as Alchemy). These services have their own privacy policies governing their use of your information.
          </p>

          <h2>7. Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request deletion of your account</li>
            <li>Export your transaction history</li>
            <li>Opt out of promotional communications</li>
          </ul>

          <h2>8. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us through our official Telegram channel or support email.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
