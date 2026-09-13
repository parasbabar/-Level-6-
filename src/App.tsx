import { useState, useEffect } from 'react';
import { useMidnight } from './hooks/useMidnight';
import { useDeployContract } from './hooks/useDeployContract';
import { Layout, type ActiveTab } from './components/Layout';
import { WalletConnect } from './components/WalletConnect';
import { DeployContract } from './components/DeployContract';
import { PropertyMarketplace } from './components/PropertyMarketplace';
import { Portfolio } from './components/Portfolio';
import { OwnershipProof } from './components/OwnershipProof';
import { ComplianceProof } from './components/ComplianceProof';
import { ProofVerifier } from './components/ProofVerifier';
import { AdminDashboard } from './components/AdminDashboard';
import type { PropertyMetadata } from './utils/contract';

export function App() {
  const midnight = useMidnight();
  const deploy = useDeployContract(midnight.connectedApi);
  const [activeTab, setActiveTab] = useState<ActiveTab>('marketplace');
  const [selectedProperty, setSelectedProperty] = useState<PropertyMetadata | null>(null);
  const [complianceMode, setComplianceMode] = useState<'compliance' | 'rental'>('compliance');

  useEffect(() => {
    console.log('[RESTORE 1] App mounted');
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

  return (
    <Layout
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      walletStatus={midnight.status}
      shieldedAddress={midnight.shieldedAddress}
      networkId={midnight.networkId}
    >
      <div className="space-y-8">
        {/* Wallet Connection Bar */}
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

        {/* Tab Content */}
        {activeTab === 'deploy' && (
          <DeployContract
            walletStatus={midnight.status}
            shieldedAddress={midnight.shieldedAddress}
            deployState={deploy.state}
            onConnectWallet={midnight.connectWallet}
            onDeploy={deploy.deploy}
            onReset={deploy.reset}
            onClearAndRedeploy={deploy.clearAndRedeploy}
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
          />
        )}

        {activeTab === 'marketplace' && (
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
            onNavigateToPortfolio={() => setActiveTab('portfolio')}
            onNavigateToOwnershipProof={(property) => {
              setSelectedProperty(property);
              setActiveTab('ownership');
            }}
          />
        )}

        {activeTab === 'portfolio' && (
          <Portfolio
            properties={midnight.properties}
            portfolio={midnight.portfolio}
            transactionHistory={midnight.transactionHistory}
            isRestoringState={midnight.isRestoringState}
            restorationError={midnight.error}
            onUpdateHolding={midnight.updateHolding}
            onSelectPropertyForProof={handleSelectPropertyForProof}
          />
        )}

        {activeTab === 'ownership' && (
          <OwnershipProof
            properties={midnight.properties}
            selectedProperty={selectedProperty}
            portfolio={midnight.portfolio}
            isGenerating={midnight.isProofGenerating}
            proofStatus={midnight.currentProofStatus}
            onSelectProperty={setSelectedProperty}
            onGenerateProof={midnight.proveOwnership}
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
          />
        )}

        {activeTab === 'compliance' && (
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
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
          />
        )}

        {activeTab === 'verifier' && (
          <ProofVerifier verificationHistory={midnight.verificationHistory} />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            properties={midnight.properties}
            onAddProperty={midnight.addProperty}
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
            isAdmin={midnight.isAdmin}
            adminWalletAddress={midnight.adminWalletAddress}
            connectedWalletAddress={midnight.shieldedAddress || midnight.coinPublicKey}
            walletStatus={midnight.status}
            isRefreshingInventory={midnight.isRefreshingInventory}
            onRefreshInventory={midnight.refreshInventory}
          />
        )}
      </div>
    </Layout>
  );
}

export default App;
