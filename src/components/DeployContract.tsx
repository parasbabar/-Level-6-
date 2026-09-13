import React from 'react';
import {
  Rocket,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Terminal,
  Layers,
  HelpCircle,
} from 'lucide-react';
import type { WalletConnectionStatus } from '../hooks/useMidnight';
import type { DeployState, DeployStage } from '../hooks/useDeployContract';

interface DeployContractProps {
  walletStatus: WalletConnectionStatus;
  shieldedAddress: string | null;
  deployState: DeployState;
  onConnectWallet: () => void;
  onDeploy: () => void;
  onReset: () => void;
  onClearAndRedeploy: () => void;
  onNavigateToMarketplace: () => void;
}

// 3 consolidated steps — each covers multiple internal pipeline stages
const STAGES: { stages: DeployStage[]; label: string; description: string; icon: string }[] = [
  {
    stages: ['preparing', 'generating-proof'],
    label: 'Initialize',
    description: 'Connecting providers, loading ZK circuits & configuring the wallet.',
    icon: '⚙',
  },
  {
    stages: ['balancing', 'awaiting-wallet'],
    label: 'Sign & Submit',
    description: 'Building the transaction, balancing funds, and awaiting wallet signature.',
    icon: '✍',
  },
  {
    stages: ['submitting', 'confirming'],
    label: 'Confirm On-Chain',
    description: 'Broadcasting to Midnight Preprod and syncing with the indexer.',
    icon: '⛓',
  },
];

function getGroupIndex(stage: DeployStage): number {
  switch (stage) {
    case 'preparing':
    case 'generating-proof':
      return 0;
    case 'balancing':
    case 'awaiting-wallet':
      return 1;
    case 'submitting':
    case 'confirming':
      return 2;
    case 'deployed':
      return 3; // all done
    default:
      return -1;
  }
}


export const DeployContract: React.FC<DeployContractProps> = ({
  walletStatus,
  shieldedAddress,
  deployState,
  onConnectWallet,
  onDeploy,
  onReset,
  onClearAndRedeploy,
  onNavigateToMarketplace,
}) => {
  const [copiedAddress, setCopiedAddress] = React.useState(false);
  const [copiedTx, setCopiedTx] = React.useState(false);

  const isWalletConnected = walletStatus === 'connected';
  const currentGroupIdx = getGroupIndex(deployState.stage);
  const isDeploying = currentGroupIdx >= 0 && currentGroupIdx < 3;
  const isDeployed = deployState.stage === 'deployed' && deployState.result != null;

  const copyToClipboard = (text: string, type: 'address' | 'tx') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold">
              <Rocket className="w-3.5 h-3.5 text-indigo-400" />
              <span>Midnight Preprod Contract Infrastructure — Level 6</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              PrivEstate Smart Contract
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Deploy the compiled ZK Compact smart contract directly to Midnight Preprod testnet. Supports property parameterization (<code className="font-mono text-indigo-300">propertyId</code>, <code className="font-mono text-indigo-300">totalShares</code>, <code className="font-mono text-indigo-300">complianceMinimum</code>) matching Admin Console listings.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isDeployed ? (
              <button
                onClick={onNavigateToMarketplace}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Explore Marketplace</span>
              </button>
            ) : !isWalletConnected ? (
              <button
                onClick={onConnectWallet}
                className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition"
              >
                <Zap className="w-4 h-4" />
                <span>Connect Wallet to Deploy</span>
              </button>
            ) : (
              <button
                onClick={onDeploy}
                disabled={isDeploying}
                className={`px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 ${
                  isDeploying
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-emerald-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50'
                }`}
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                    <span>Deploying to Preprod...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>Deploy Contract Now</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Contract Metadata & Configuration */}
        <div className="space-y-6">
          {/* Architecture Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
              <Cpu className="w-4 h-4" />
              <h2>Compact ZK Specification</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Source Contract</span>
                <span className="font-mono text-slate-200 font-medium">PrivEstate.compact</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Network</span>
                <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Midnight Preprod
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Compiler Target</span>
                <span className="font-mono text-slate-200">Compact v0.16+</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Initial Asset ID</span>
                <span className="font-mono text-indigo-300">0x0101...0101 (Property #1)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Total Shares</span>
                <span className="font-mono text-slate-200">100,000 SHARES</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Compliance Min.</span>
                <span className="font-mono text-slate-200">$250,000 USD</span>
              </div>
            </div>
          </div>

          {/* Wallet Status Card */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Layers className="w-4 h-4" />
                <h2>Connected Wallet</h2>
              </div>
              <span
                className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                  isWalletConnected
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {walletStatus}
              </span>
            </div>

            {isWalletConnected ? (
              <div className="space-y-2 text-xs">
                <p className="text-slate-400">Shielded Address:</p>
                <div className="font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-slate-300 break-all">
                  {shieldedAddress}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Connect your Midnight Lace (1AM) wallet extension to deploy this contract on-chain.
                </p>
                <button
                  onClick={onConnectWallet}
                  className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition"
                >
                  Connect Midnight Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (2 cols): Deploy Experience & Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active / Deployed Status View */}
          {isDeployed && deployState.result && (
            <div className="bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 rounded-2xl border border-emerald-500/30 p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Contract Live on Midnight Preprod</h2>
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>
                        {deployState.verifying
                          ? 'Verifying on Midnight Indexer...'
                          : deployState.verified
                          ? 'Verified On-Chain & Indexed'
                          : 'Deployed On-Chain (Pending Indexer Sync)'}
                      </span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={onClearAndRedeploy}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                  title="Redeploy a new instance of the contract"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Redeploy</span>
                </button>
              </div>

              {/* Contract Address */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Deployed Contract Address</label>
                <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-sm text-emerald-300 select-all">
                  <span className="truncate flex-1">{deployState.result.contractAddress}</span>
                  <button
                    onClick={() => copyToClipboard(deployState.result!.contractAddress, 'address')}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Copy contract address"
                  >
                    {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400">Deployment Tx ID</span>
                  <div className="flex items-center gap-2 font-mono text-slate-200">
                    <span className="truncate">
                      {deployState.result.txId.length > 20
                        ? `${deployState.result.txId.slice(0, 10)}...${deployState.result.txId.slice(-8)}`
                        : deployState.result.txId}
                    </span>
                    <button
                      onClick={() => copyToClipboard(deployState.result!.txId, 'tx')}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-slate-400">Deployment Timestamp</span>
                  <p className="font-mono text-slate-200">
                    {new Date(deployState.result.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Next Steps CTA */}
              <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs space-y-1 text-indigo-200">
                  <p className="font-semibold text-white">Ready for Shielded Real Estate Operations!</p>
                  <p className="text-slate-300">
                    You can now purchase private RWA shares and generate ZK proofs using this deployed contract.
                  </p>
                </div>
                <button
                  onClick={onNavigateToMarketplace}
                  className="w-full sm:w-auto whitespace-nowrap px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition"
                >
                  Proceed to RWA Marketplace &rarr;
                </button>
              </div>
            </div>
          )}

          {/* Deployment Pipeline Stepper */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Terminal className="w-4 h-4" />
                <h2>Deployment Execution Pipeline</h2>
              </div>
              {isDeploying && (
                <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-mono">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Step {currentGroupIdx + 1} of 3</span>
                </span>
              )}
            </div>

            {/* Error Banner */}
            {deployState.error && (
              <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3 text-red-200 text-xs">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1 leading-relaxed">
                    <p className="font-bold text-red-300 text-sm">Deployment Failed</p>
                    <p className="whitespace-pre-line text-red-200/90">{deployState.error}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-red-500/20">
                  <button
                    onClick={onDeploy}
                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={onReset}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* Pipeline Stage List — 3 consolidated steps */}
            <div className="space-y-3">
              {STAGES.map((group, idx) => {
                let status: 'pending' | 'active' | 'completed' = 'pending';
                if (isDeployed || currentGroupIdx > idx) {
                  status = 'completed';
                } else if (currentGroupIdx === idx) {
                  status = 'active';
                }

                return (
                  <div
                    key={group.label}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition ${
                      status === 'completed'
                        ? 'bg-slate-950/80 border-emerald-500/30'
                        : status === 'active'
                        ? 'bg-indigo-950/50 border-indigo-500/50 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-950/30 border-slate-800/80 opacity-50'
                    }`}
                  >
                    {/* Step number / icon */}
                    <div className="flex-shrink-0">
                      {status === 'completed' ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/40">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : status === 'active' ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/40">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center border border-slate-700 text-sm">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    {/* Step text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-bold ${
                          status === 'completed' ? 'text-emerald-300'
                          : status === 'active' ? 'text-white'
                          : 'text-slate-400'
                        }`}>
                          {group.label}
                        </h3>
                        {status === 'active' && (
                          <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest animate-pulse">
                            In progress
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-normal mt-0.5">{group.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Footer */}
            {!isDeployed && (
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <HelpCircle className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>Requires tNIGHT preprod funds for contract creation fees.</span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <a
                    href="https://faucet.preprod.midnight.network"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center justify-center gap-1.5 transition w-full sm:w-auto"
                  >
                    <span>Get Preprod Faucet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <button
                    onClick={onDeploy}
                    disabled={isDeploying || !isWalletConnected}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition w-full sm:w-auto ${
                      isDeploying || !isWalletConnected
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                    }`}
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>{isDeploying ? 'Deploying...' : 'Deploy to Preprod'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
