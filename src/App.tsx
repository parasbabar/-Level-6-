import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useMidnight } from './hooks/useMidnight';
import { useDeployContract } from './hooks/useDeployContract';
import { Layout, type ActiveTab } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { WalletConnect } from './components/WalletConnect';
import { DeployContract } from './components/DeployContract';
import { PropertyMarketplace } from './components/PropertyMarketplace';
import { Portfolio } from './components/Portfolio';
import { OwnershipProof } from './components/OwnershipProof';
import { ComplianceProof } from './components/ComplianceProof';
import { ProofVerifier } from './components/ProofVerifier';
import { AdminDashboard } from './components/AdminDashboard';
import { ToastProvider } from './components/motion';
import { PageTransition } from './components/motion';
import type { PropertyMetadata } from './utils/contract';

export function App() {
  const midnight = useMidnight();
  const deploy = useDeployContract(midnight.connectedApi);
  const [activeTab, setActiveTab] = useState<ActiveTab>('marketplace');
  const [showLanding, setShowLanding] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<PropertyMetadata | null>(null);
  const [complianceMode, setComplianceMode] = useState<'compliance' | 'rental'>('compliance');

  useEffect(() => {
    console.log('[PrivEstate] App mounted — Level 6 Supermoon');
  }, []);

  const handleSelectPropertyForProof = (
    property: PropertyMetadata,
    type: 'ownership' | 'compliance' | 'rental'
  ) => {
    setSelectedProperty(property);
    if (type === 'ownership') {
      setActiveTab('ownership');
    } else if (type === 'compliance') {
      setComplianceMode('compliance');
      setActiveTab('compliance');
    } else {
      setComplianceMode('rental');
      setActiveTab('compliance');
    }
  };

  const handleNavigateFromLanding = (tab: ActiveTab) => {
    setShowLanding(false);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ToastProvider>
      <AnimatePresence mode="wait" initial={false}>
        {showLanding ? (
          <PageTransition key="landing" id="landing">
            <LandingPage
              properties={midnight.properties}
              onNavigate={handleNavigateFromLanding}
              walletStatus={midnight.status}
              onConnectWallet={midnight.connectWallet}
              shieldedAddress={midnight.shieldedAddress}
            />
          </PageTransition>
        ) : (
          <PageTransition key="app" id="app">
            <Layout
              activeTab={activeTab}
              onSelectTab={handleTabChange}
              walletStatus={midnight.status}
              shieldedAddress={midnight.shieldedAddress}
              networkId={midnight.networkId}
              onGoHome={() => setShowLanding(true)}
            >
              {/* Wallet banner (hidden on Admin page which has its own slim status strip) */}
              {activeTab !== 'admin' && (
                <WalletConnect
                  status={midnight.status}
                  walletName={midnight.walletName}
                  walletIcon={midnight.walletIcon}
                  shieldedAddress={midnight.shieldedAddress}
                  walletSyncing={midnight.walletSyncing}
                  networkId={midnight.networkId}
                  error={midnight.error}
                  onConnect={midnight.connectWallet}
                  onDisconnect={midnight.disconnectWallet}
                />
              )}

              {/* Tab content with inner AnimatePresence */}
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === 'deploy' && (
                  <PageTransition key="deploy" id="deploy">
                    <DeployContract
                      walletStatus={midnight.status}
                      shieldedAddress={midnight.shieldedAddress}
                      deployState={deploy.state}
                      onConnectWallet={midnight.connectWallet}
                      onDeploy={deploy.deploy}
                      onReset={deploy.reset}
                      onClearAndRedeploy={deploy.clearAndRedeploy}
                      onNavigateToMarketplace={() => handleTabChange('marketplace')}
                    />
                  </PageTransition>
                )}
                {activeTab === 'marketplace' && (
                  <PageTransition key="marketplace" id="marketplace">
                    <PropertyMarketplace
                      properties={midnight.properties}
                      portfolio={midnight.portfolio}
                      walletStatus={midnight.status}
                      transactionStatus={midnight.transactionStatus}
                      transactionTxId={midnight.transactionTxId}
                      transactionError={midnight.transactionError}
                      currentProofStatus={midnight.currentProofStatus}
                      isRefreshingInventory={midnight.isRefreshingInventory}
                      onRefreshInventory={midnight.refreshInventory}
                      onSelectPropertyForProof={handleSelectPropertyForProof}
                      onExecutePurchase={midnight.executeSharePurchase}
                      onResetTransaction={midnight.resetTransactionState}
                      onNavigateToPortfolio={() => handleTabChange('portfolio')}
                      onNavigateToOwnershipProof={(property) => {
                        setSelectedProperty(property);
                        handleTabChange('ownership');
                      }}
                    />
                  </PageTransition>
                )}
                {activeTab === 'portfolio' && (
                  <PageTransition key="portfolio" id="portfolio">
                    <Portfolio
                      properties={midnight.properties}
                      portfolio={midnight.portfolio}
                      transactionHistory={midnight.transactionHistory}
                      isRestoringState={midnight.isRestoringState}
                      restorationError={midnight.error}
                      onUpdateHolding={midnight.updateHolding}
                      onSelectPropertyForProof={handleSelectPropertyForProof}
                    />
                  </PageTransition>
                )}
                {activeTab === 'ownership' && (
                  <PageTransition key="ownership" id="ownership">
                    <OwnershipProof
                      properties={midnight.properties}
                      selectedProperty={selectedProperty}
                      portfolio={midnight.portfolio}
                      isGenerating={midnight.isProofGenerating}
                      proofStatus={midnight.currentProofStatus}
                      onSelectProperty={setSelectedProperty}
                      onGenerateProof={midnight.proveOwnership}
                      onNavigateToMarketplace={() => handleTabChange('marketplace')}
                    />
                  </PageTransition>
                )}
                {activeTab === 'compliance' && (
                  <PageTransition key="compliance" id="compliance">
                    <ComplianceProof
                      properties={midnight.properties}
                      selectedProperty={selectedProperty}
                      portfolio={midnight.portfolio}
                      isGenerating={midnight.isProofGenerating}
                      proofStatus={midnight.currentProofStatus}
                      onSelectProperty={setSelectedProperty}
                      onGenerateProof={midnight.proveCompliance}
                      onGenerateRentalProof={midnight.proveRentalYield}
                      initialMode={complianceMode}
                      onNavigateToMarketplace={() => handleTabChange('marketplace')}
                    />
                  </PageTransition>
                )}
                {activeTab === 'verifier' && (
                  <PageTransition key="verifier" id="verifier">
                    <ProofVerifier verificationHistory={midnight.verificationHistory} />
                  </PageTransition>
                )}
                {activeTab === 'admin' && (
                  <PageTransition key="admin" id="admin">
                    <AdminDashboard
                      properties={midnight.properties}
                      onAddProperty={midnight.addProperty}
                      onNavigateToMarketplace={() => handleTabChange('marketplace')}
                      isAdmin={midnight.isAdmin}
                      adminWalletAddress={midnight.adminWalletAddress}
                      connectedWalletAddress={midnight.shieldedAddress || midnight.coinPublicKey}
                      walletStatus={midnight.status}
                      isRefreshingInventory={midnight.isRefreshingInventory}
                      onRefreshInventory={midnight.refreshInventory}
                    />
                  </PageTransition>
                )}
              </AnimatePresence>
            </Layout>
          </PageTransition>
        )}
      </AnimatePresence>
    </ToastProvider>
  );
}

export default App;
