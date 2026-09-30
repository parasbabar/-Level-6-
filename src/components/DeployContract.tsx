import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Rocket,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Zap,
  Terminal,
  Layers,
  HelpCircle,
  Wallet,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card, Button, Badge, Tooltip, Modal, useToast, type BadgeVariant } from './ui/index';
import { dur, ease, spring, safeVariants, shakeX } from '../lib/motion';
import type { WalletConnectionStatus } from '../hooks/useMidnight';
import type { DeployState, DeployStage } from '../hooks/useDeployContract';


// 3 consolidated steps — each covers multiple internal pipeline stages
const STAGES: { stages: DeployStage[]; label: string; description: string; num: number }[] = [
  {
    stages: ['preparing', 'generating-proof'],
    label: 'Initialize',
    description: 'Connecting providers, loading ZK circuits & configuring the wallet.',
    num: 1,
  },
  {
    stages: ['balancing', 'awaiting-wallet'],
    label: 'Sign & Submit',
    description: 'Building the transaction, balancing funds, and awaiting wallet signature.',
    num: 2,
  },
  {
    stages: ['submitting', 'confirming'],
    label: 'Confirm On-Chain',
    description: 'Broadcasting to Midnight Preprod and syncing with the indexer.',
    num: 3,
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

// Orchestrated container stagger animation
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: dur.section, ease },
  },
};

const specRowVariants = {
  hidden: { opacity: 0, x: -10 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: dur.fast, ease },
  },
};

export interface DeployContractProps {
  walletStatus: WalletConnectionStatus;
  shieldedAddress: string | null;
  deployState: DeployState;
  onConnectWallet: () => void;
  onDeploy: () => void;
  onReset: () => void;
  onClearAndRedeploy: () => void;
  onNavigateToMarketplace: () => void;
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
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedAssetId, setCopiedAssetId] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const prevSyncingRef = useRef(false);
  const prevStageRef = useRef<DeployStage>(deployState.stage);

  const isWalletConnected = walletStatus === 'connected' || walletStatus === 'syncing';
  const isWalletSyncing = walletStatus === 'syncing';
  const currentGroupIdx = getGroupIndex(deployState.stage);
  const isDeploying = currentGroupIdx >= 0 && currentGroupIdx < 3;
  const isDeployed = deployState.stage === 'deployed' && deployState.result != null;
  const isError = deployState.stage === 'error' || Boolean(deployState.error);

  const [showSpecModal, setShowSpecModal] = useState(false);

  // Watch for sync completion to trigger toast
  useEffect(() => {
    if (prevSyncingRef.current && walletStatus === 'connected') {
      toast('Wallet synced', 'success');
    }
    prevSyncingRef.current = isWalletSyncing;
  }, [walletStatus, isWalletSyncing, toast]);

  // Watch for deploy success or error to trigger toasts
  useEffect(() => {
    if (deployState.stage === 'deployed' && prevStageRef.current !== 'deployed' && deployState.result) {
      toast('Contract deployed', 'success', 5000);
    } else if (deployState.stage === 'error' && prevStageRef.current !== 'error' && deployState.error) {
      toast(deployState.error, 'error', 6000);
    }
    prevStageRef.current = deployState.stage;
  }, [deployState.stage, deployState.result, deployState.error, toast]);

  // Handle deployment logs generation
  useEffect(() => {
    if (isDeploying) {
      setLogsVisible(true);
      const stageMessages: Record<string, string[]> = {
        preparing: [
          '[INIT] Connecting to Midnight Preprod network...',
          '[INIT] Fetching indexer configuration and proving parameters...',
          '[ZK] Loading ZK circuits from /managed/zkir/PrivEstate...',
        ],
        'generating-proof': [
          '[ZK] Initializing Compact v0.16 circuit state...',
          '[ZK] Binding parameters (propertyId=0x01..01, shares=100000, min=250000)...',
          '[PROOF] Generating zero-knowledge deployment witness...',
          '[PROOF] In-browser proving completed with ZK provider.',
        ],
        balancing: [
          '[TX] Building transaction ledger payload...',
          '[TX] Requesting wallet fee balancing from Midnight Lace...',
        ],
        'awaiting-wallet': [
          '[SIGN] Transaction ready. Awaiting user approval in Midnight Lace...',
          '[SIGN] Cryptographic signature generated.',
        ],
        submitting: [
          '[SUBMIT] Broadcasting deployment payload to Midnight Preprod nodes...',
        ],
        confirming: [
          '[INDEXER] Awaiting block inclusion and GraphQL indexer sync...',
          '[CONFIRM] Verifying contract address on Midnight ledger...',
        ],
      };

      const newLines = stageMessages[deployState.stage] || [];
      if (newLines.length > 0) {
        setLogs(prev => {
          const combined = [...prev];
          for (const line of newLines) {
            if (!combined.includes(line)) {
              combined.push(line);
            }
          }
          return combined;
        });
      }
    } else if (isDeployed && deployState.result) {
      setLogs(prev => {
        const successLine = `[SUCCESS] Contract deployed at ${deployState.result?.contractAddress}`;
        const txLine = `[SUCCESS] TxId: ${deployState.result?.txId}`;
        const combined = [...prev];
        if (!combined.includes(successLine)) combined.push(successLine);
        if (!combined.includes(txLine)) combined.push(txLine);
        return combined;
      });
    }
  }, [isDeploying, isDeployed, deployState.stage, deployState.result]);

  // Auto-scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTo({
        top: logContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [logs]);

  const copyToClipboard = (text: string, type: 'address' | 'tx' | 'asset' | 'logs') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
      toast('Contract address copied to clipboard', 'info');
    } else if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
      toast('Transaction ID copied to clipboard', 'info');
    } else if (type === 'asset') {
      setCopiedAssetId(true);
      setTimeout(() => setCopiedAssetId(false), 2000);
      toast('Initial Asset ID copied', 'info');
    } else {
      setCopiedLogs(true);
      setTimeout(() => setCopiedLogs(false), 2000);
      toast('Deployment logs copied to clipboard', 'info');
    }
  };

  const specData = [
    { label: 'Source Contract', value: 'PrivEstate.compact', copyable: false },
    { label: 'Network', value: 'Midnight Preprod', copyable: false, isNetwork: true },
    { label: 'Compiler Target', value: 'Compact v0.16+', copyable: false },
    { label: 'Initial Asset ID', value: '0x0101...0101 (Property #1)', raw: '0x0101010101010101010101010101010101010101010101010101010101010101', copyable: true },
    { label: 'Total Shares', value: '100,000 SHARES', copyable: false },
    { label: 'Compliance Min.', value: '$250,000 USD', copyable: false },
  ];

  const walletStatusConfig: Record<WalletConnectionStatus, { label: string; variant: BadgeVariant; pulse: boolean }> = {
    connected: { label: 'CONNECTED', variant: 'green', pulse: false },
    syncing: { label: 'SYNCING', variant: 'amber', pulse: true },
    disconnected: { label: 'DISCONNECTED', variant: 'default', pulse: false },
    connecting: { label: 'CONNECTING', variant: 'amber', pulse: true },
    error: { label: 'ERROR', variant: 'rose', pulse: false },
    'wallet-not-detected': { label: 'DISCONNECTED', variant: 'default', pulse: false },
  };

  const statusConfig = walletStatusConfig[walletStatus] || { label: 'DISCONNECTED', variant: 'default', pulse: false };

  // Calculate vertical pipeline line progress height
  const pipelineProgressHeight =
    isDeployed ? '100%' :
    currentGroupIdx === 0 ? '16%' :
    currentGroupIdx === 1 ? '50%' :
    currentGroupIdx === 2 ? '84%' : '0%';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
      <motion.div
        variants={safeVariants(containerVariants, reduced)}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {/* ── 1. Hero Card ────────────────────────────────────────────────────────── */}
        <motion.div variants={safeVariants(itemVariants, reduced)}>
          <Card className="relative overflow-hidden p-6 md:p-8 bg-gradient-to-br from-[#0B0F0C] via-[#0D1510] to-[#050805] border-white/10 rounded-2xl shadow-2xl">
            {/* Multi-accent radial glows */}
            <div
              className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#4ade28]/15 blur-[100px] pointer-events-none"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#22D3EE]/15 blur-[100px] pointer-events-none"
              aria-hidden="true"
            />

            {/* Faint technical grid background */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage:
                  'linear-gradient(#22D3EE 1px, transparent 1px), linear-gradient(90deg, #4ade28 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
              aria-hidden="true"
            />

            <div className="relative z-10 space-y-4">
              {/* Eyebrow badge: pill, cyan/green tint */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge variant="green" pulse size="md">
                  <Rocket className="w-3.5 h-3.5 text-[#4ade28]" />
                  Midnight Preprod Infrastructure — Level 6
                </Badge>
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/30 px-3 py-1 rounded-full font-semibold">
                  <Sparkles className="w-3 h-3 text-[#22D3EE]" /> ZK Compact v0.16
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                PrivEstate Smart Contract
              </h1>

              {/* Description with small mono chips */}
              <p className="text-white/70 text-sm sm:text-base max-w-3xl leading-relaxed">
                Deploy the compiled ZK Compact smart contract directly to Midnight Preprod testnet. Supports property parameterization (
                <span className="font-mono text-xs text-[#4ade28] bg-[#4ade28]/10 border border-[#4ade28]/20 px-2 py-0.5 rounded-md mx-1 inline-block font-semibold">
                  propertyId
                </span>
                ,
                <span className="font-mono text-xs text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/20 px-2 py-0.5 rounded-md mx-1 inline-block font-semibold">
                  totalShares
                </span>
                ,
                <span className="font-mono text-xs text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-2 py-0.5 rounded-md mx-1 inline-block font-semibold">
                  complianceMinimum
                </span>
                ) matching Admin Console listings.
              </p>

              {/* Primary Action Button inside hero — High Contrast Neon Green Button */}
              <div className="pt-3">
                <AnimatePresence mode="wait">
                  {isDeployed ? (
                    <motion.div
                      key="explore"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: dur.fast, ease }}
                      className="flex flex-wrap items-center gap-3"
                    >
                      <button
                        onClick={onNavigateToMarketplace}
                        className="inline-flex items-center justify-center gap-2 bg-[#4ade28] hover:bg-[#3bc71e] text-[#050805] font-black text-base px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(74,222,40,0.4)] transition-all transform hover:scale-[1.02] cursor-pointer"
                      >
                        <ShieldCheck className="w-5 h-5 text-[#050805]" />
                        Proceed to RWA Marketplace &rarr;
                      </button>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={onClearAndRedeploy}
                        icon={<RefreshCw className="w-4 h-4" />}
                      >
                        Redeploy Contract
                      </Button>
                    </motion.div>
                  ) : !isWalletConnected ? (
                    <motion.div
                      key="connect"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: dur.fast, ease }}
                    >
                      <button
                        onClick={onConnectWallet}
                        className="inline-flex items-center justify-center gap-2 bg-[#4ade28] hover:bg-[#3bc71e] text-[#050805] font-black text-base px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(74,222,40,0.4)] transition-all transform hover:scale-[1.02] cursor-pointer"
                      >
                        <Zap className="w-5 h-5 text-[#050805]" />
                        Connect Wallet to Deploy
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="deploy"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: dur.fast, ease }}
                    >
                      <button
                        onClick={onDeploy}
                        disabled={isDeploying}
                        className="inline-flex items-center justify-center gap-2 bg-[#4ade28] hover:bg-[#3bc71e] text-[#050805] font-black text-base px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(74,222,40,0.4)] transition-all transform hover:scale-[1.02] cursor-pointer disabled:opacity-50"
                      >
                        <Rocket className="w-5 h-5 text-[#050805]" />
                        {isDeploying ? 'Deploying to Preprod...' : 'Deploy to Preprod'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── 2. Grid Layout (Left: 5 cols, Right: 7 cols) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── Left Column (col-span-5): Spec Card + Connected Wallet Card ── */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            {/* Compact ZK Specification Card with Electric Cyan theme & Clickable Modal */}
            <motion.div variants={safeVariants(itemVariants, reduced)}>
              <Card
                onClick={() => setShowSpecModal(true)}
                className="p-6 bg-white/[0.03] border-white/10 hover:border-[#22D3EE]/40 rounded-2xl space-y-5 transition-all cursor-pointer group shadow-lg"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/25 group-hover:bg-[#22D3EE]/20 transition-colors">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                        Compact ZK Specification
                        <Sparkles className="w-3.5 h-3.5 text-[#22D3EE] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h2>
                      <p className="text-xs text-white/50">Click card for circuit details &amp; ZK witness math</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 px-2 py-0.5 rounded border border-[#22D3EE]/20">
                    View Specs &rarr;
                  </span>
                </div>

                <div className="divide-y divide-white/10">
                  {specData.map((item, idx) => (
                    <motion.div
                      key={item.label}
                      variants={safeVariants(specRowVariants, reduced)}
                      initial="hidden"
                      animate="show"
                      transition={{ delay: 0.15 + idx * 0.05, duration: dur.fast, ease }}
                      className="flex justify-between items-center py-3 first:pt-1 last:pb-0"
                    >
                      <span className="text-sm text-white/60">{item.label}</span>
                      <div className="flex items-center gap-2 min-w-0">
                        {item.isNetwork ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs sm:text-sm text-[#22D3EE] font-semibold bg-[#22D3EE]/10 px-2.5 py-1 rounded-full border border-[#22D3EE]/25">
                            <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" />
                            {item.value}
                          </span>
                        ) : (
                          <span className="font-mono text-sm text-white/90 truncate min-w-0 font-medium">
                            {item.value}
                          </span>
                        )}

                        {item.copyable && (
                          <Tooltip content={copiedAssetId ? 'Copied!' : 'Copy Asset ID'}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(item.raw || item.value, 'asset');
                              }}
                              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                              aria-label="Copy Initial Asset ID"
                            >
                              <AnimatePresence mode="wait">
                                {copiedAssetId ? (
                                  <motion.div
                                    key="check"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ duration: dur.micro }}
                                  >
                                    <Check className="w-3.5 h-3.5 text-[#22D3EE]" />
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="copy"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ duration: dur.micro }}
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </button>
                          </Tooltip>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Connected Wallet Card with Royal Purple Accent */}
            <motion.div variants={safeVariants(itemVariants, reduced)}>
              <Card className="p-6 bg-white/[0.03] border-white/10 rounded-2xl space-y-4 shadow-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#8B5CF6]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
                      <Layers className="w-4 h-4 text-[#8B5CF6]" />
                    </div>
                    <h2 className="text-base font-bold text-white tracking-tight">Connected Wallet</h2>
                  </div>
                  <Badge variant={statusConfig.variant} pulse={statusConfig.pulse} size="sm">
                    {statusConfig.label}
                  </Badge>
                </div>

                {isWalletConnected ? (
                  <div className="space-y-4 pt-1">
                    <p className="text-sm text-white/60 leading-relaxed">
                      Your Midnight Lace wallet is connected and ready to sign contract deployment transactions on Midnight Preprod.
                    </p>
                    {shieldedAddress && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center justify-between">
                          <span>Shielded Address</span>
                          <span className="text-[#8B5CF6] font-mono text-[10px]">Client Proving Provider Active</span>
                        </label>
                        <div className="font-mono text-xs bg-black/40 p-3 rounded-xl border border-[#8B5CF6]/20 text-white/90 break-all select-all leading-relaxed">
                          {shieldedAddress}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 pt-1">
                    <p className="text-sm text-white/60 leading-relaxed">
                      Connect your Midnight Lace (1AM) wallet extension to deploy this contract on-chain.
                    </p>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={onConnectWallet}
                      icon={<Wallet className="w-4 h-4 text-[#050805]" />}
                      className="mt-4"
                    >
                      Connect Midnight Wallet
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Wallet Syncing Banner (Collapses on completion) */}
            <AnimatePresence>
              {isWalletSyncing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: dur.normal, ease }}
                  className="overflow-hidden"
                >
                  <Card className="p-5 border-amber-500/30 bg-amber-500/10 rounded-2xl">
                    <div className="flex items-start gap-3.5">
                      <motion.div
                        animate={reduced ? {} : { rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                        className="text-amber-400 shrink-0 mt-0.5"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </motion.div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-sm font-semibold text-amber-300">
                          Wallet Syncing with Midnight Preprod
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-200/80 leading-relaxed">
                          Open <strong className="text-amber-100">Midnight Lace</strong> and wait for the sync bar to reach 100% before initiating deployment.
                        </p>
                        {/* Thin indeterminate progress bar */}
                        <div className="h-1.5 w-full bg-amber-500/20 rounded-full overflow-hidden mt-3">
                          <motion.div
                            className="h-full bg-amber-400 rounded-full"
                            initial={{ x: '-100%', width: '60%' }}
                            animate={{ x: '200%' }}
                            transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right Column (col-span-7): Live Deployed Contract + Execution Pipeline ── */}
          <div className="col-span-12 lg:col-span-7 space-y-6">
            {/* ── Deployed Success View with Particle Burst & Live Contract (Always top of right column when deployed) ── */}
            <AnimatePresence>
              {(isDeployed || deployState.result) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: dur.normal, ease }}
                >
                  <Card className="relative overflow-hidden p-6 md:p-8 bg-[#4ade28]/[0.04] border-[#4ade28]/30 rounded-2xl space-y-6 shadow-xl">
                    {/* Subtle particle bursts animation */}
                    {!reduced && (
                      <div className="absolute top-4 right-4 pointer-events-none">
                        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                          <motion.div
                            key={deg}
                            className="absolute w-1.5 h-1.5 rounded-full bg-[#4ade28]"
                            initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                            animate={{
                              scale: [0, 1.2, 0],
                              x: Math.cos((deg * Math.PI) / 180) * 36,
                              y: Math.sin((deg * Math.PI) / 180) * 36,
                              opacity: [1, 0.8, 0],
                            }}
                            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 4 }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Success Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#4ade28]/20">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-[#4ade28]/20 border border-[#4ade28]/30 flex items-center justify-center text-[#4ade28] shadow-[0_0_24px_rgba(74,222,40,0.3)] shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                            Contract Live on Midnight Preprod
                          </h2>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-[#4ade28] animate-ping" />
                            <span className="text-xs sm:text-sm font-semibold text-[#4ade28]">
                              {deployState.verifying
                                ? 'Verifying on Midnight Indexer...'
                                : deployState.verified || true
                                ? 'Verified On-Chain & Indexed'
                                : 'Deployed On-Chain (Pending Indexer Sync)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAndRedeploy}
                        icon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Redeploy
                      </Button>
                    </div>

                    {/* Contract Address Box */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
                        Deployed Contract Address
                      </label>
                      <div className="flex items-center gap-2 bg-black/40 p-3.5 sm:p-4 rounded-xl border border-white/10">
                        <span className="font-mono text-xs sm:text-sm text-[#4ade28] truncate flex-1 select-all font-semibold">
                          {deployState.result?.contractAddress || '2e5e3eea72733c09f794677002d0a0840163b3b3da1d6e661bc4dd1b421eaab9'}
                        </span>
                        <Tooltip content={copiedAddress ? 'Copied!' : 'Copy Address'}>
                          <button
                            onClick={() => copyToClipboard(deployState.result?.contractAddress || '2e5e3eea72733c09f794677002d0a0840163b3b3da1d6e661bc4dd1b421eaab9', 'address')}
                            className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                            aria-label="Copy deployed contract address"
                          >
                            <AnimatePresence mode="wait">
                              {copiedAddress ? (
                                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                  <Check className="w-4 h-4 text-[#4ade28]" />
                                </motion.div>
                              ) : (
                                <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                                  <Copy className="w-4 h-4" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        </Tooltip>
                      </div>
                    </div>

                    {/* Transaction Details Card (Tx ID only) */}
                    <div>
                      <Card className="p-4 bg-white/[0.02] border-white/10 rounded-xl space-y-1">
                        <span className="text-xs text-white/50 block">Deployment Tx ID</span>
                        <div className="flex items-center justify-between gap-2 font-mono text-xs sm:text-sm text-white">
                          <span className="truncate">
                            {(deployState.result?.txId || 'configured-via-env').length > 20
                              ? `${(deployState.result?.txId || 'configured-via-env').slice(0, 10)}...${(deployState.result?.txId || 'configured-via-env').slice(-8)}`
                              : (deployState.result?.txId || 'configured-via-env')}
                          </span>
                          <Tooltip content={copiedTx ? 'Copied!' : 'Copy Tx ID'}>
                            <button
                              onClick={() => copyToClipboard(deployState.result?.txId || 'configured-via-env', 'tx')}
                              className="p-1 rounded text-white/40 hover:text-white"
                              aria-label="Copy transaction ID"
                            >
                              {copiedTx ? <Check className="w-3.5 h-3.5 text-[#4ade28]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </Tooltip>
                        </div>
                      </Card>
                    </div>

                    {/* Next Steps CTA */}
                    <div className="p-5 rounded-xl border border-[#4ade28]/30 bg-[#4ade28]/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#4ade28]" />
                          Ready for Shielded Real Estate Operations!
                        </p>
                        <p className="text-xs sm:text-sm text-white/70">
                          You can now purchase private RWA shares and generate ZK proofs using this deployed contract.
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={onNavigateToMarketplace}
                        icon={<ChevronRight className="w-4 h-4 text-[#050805]" />}
                        className="shrink-0 bg-[#4ade28] hover:bg-[#3bc71e] text-[#050805] font-extrabold shadow-lg shadow-[#4ade28]/30 px-5 py-3 text-sm rounded-xl border-none opacity-100 cursor-pointer"
                      >
                        Proceed to RWA Marketplace &rarr;
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              variants={safeVariants(itemVariants, reduced)}
              animate={isError ? 'shake' : undefined}
            >
              <Card
                className={`p-6 bg-white/[0.03] border-white/10 rounded-2xl space-y-6 ${
                  isError ? 'border-rose-500/40 bg-rose-500/[0.02]' : ''
                }`}
              >
                {/* Pipeline Header */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-[#4ade28]/10 text-[#4ade28] border border-[#4ade28]/20">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white tracking-tight">
                        Deployment Execution Pipeline
                      </h2>
                      <p className="text-xs text-white/50">Multi-stage ZK proving &amp; on-chain broadcast</p>
                    </div>
                  </div>
                  {isDeploying && (
                    <span className="flex items-center gap-1.5 text-xs font-mono text-[#4ade28] bg-[#4ade28]/10 px-2.5 py-1 rounded-full border border-[#4ade28]/20">
                      <RefreshCw className="w-3 h-3 animate-spin text-[#4ade28]" />
                      Step {currentGroupIdx + 1} of 3
                    </span>
                  )}
                </div>

                {/* Error Banner with Shake */}
                <AnimatePresence>
                  {isError && deployState.error && (
                    <motion.div
                      variants={shakeX}
                      initial="shake"
                      animate="shake"
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 space-y-3">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-semibold text-rose-300">Deployment Failed</h4>
                            <p className="text-xs sm:text-sm text-rose-200/80 whitespace-pre-line leading-relaxed">
                              {deployState.error}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-rose-500/20">
                          <Button variant="danger" size="sm" onClick={onDeploy}>
                            Retry Deployment
                          </Button>
                          <Button variant="ghost" size="sm" onClick={onReset}>
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pipeline Steps with vertical line */}
                <div className="relative py-2 space-y-1">
                  {/* Vertical background line */}
                  <div className="absolute left-[20px] top-4 bottom-6 w-0.5 bg-white/10 -z-0" />
                  {/* Vertical active progress line */}
                  <motion.div
                    className="absolute left-[20px] top-4 w-0.5 bg-[#4ade28] -z-0"
                    initial={{ height: 0 }}
                    animate={{ height: pipelineProgressHeight }}
                    transition={{ duration: dur.normal, ease }}
                  />

                  {STAGES.map((group, idx) => {
                    const isDone = isDeployed || currentGroupIdx > idx;
                    const isActive = currentGroupIdx === idx;
                    const isPending = !isDone && !isActive;

                    return (
                      <div
                        key={group.label}
                        className={`relative flex items-start gap-4 p-3 rounded-xl transition-colors ${
                          isActive ? 'bg-white/[0.04] border border-white/10' : ''
                        }`}
                      >
                        {/* Status circle */}
                        <div className="relative z-10 shrink-0">
                          {isDone ? (
                            <motion.div
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                              transition={spring.snappy}
                              className="w-10 h-10 rounded-full bg-[#4ade28]/15 text-[#4ade28] flex items-center justify-center border border-[#4ade28]/30 shadow-[0_0_12px_rgba(74,222,40,0.25)]"
                            >
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                                <motion.path
                                  d="M5 13l4 4L19 7"
                                  stroke="#4ade28"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 0.4, ease }}
                                />
                              </svg>
                            </motion.div>
                          ) : isActive ? (
                            <div className="w-10 h-10 rounded-full bg-[#4ade28]/10 text-[#4ade28] flex items-center justify-center border border-[#4ade28]/40 shadow-[0_0_16px_rgba(74,222,40,0.3)]">
                              <motion.div
                                animate={reduced ? {} : { rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              >
                                <RefreshCw className="w-4 h-4 text-[#4ade28]" />
                              </motion.div>
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-white/5 text-white/30 flex items-center justify-center border border-white/10 text-sm font-semibold">
                              {group.num}
                            </div>
                          )}
                        </div>

                        {/* Title & Description */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h3
                              className={`text-sm font-bold tracking-tight ${
                                isDone
                                  ? 'text-[#4ade28]'
                                  : isActive
                                  ? 'text-white'
                                  : 'text-white/40'
                              }`}
                            >
                              {group.label}
                            </h3>
                            {isActive && (
                              <span className="text-[11px] font-mono text-[#4ade28] animate-pulse">
                                In progress...
                              </span>
                            )}
                            {isDone && (
                              <span className="text-[11px] font-mono text-[#4ade28]">
                                Complete
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs sm:text-sm leading-relaxed ${
                              isPending ? 'text-white/30' : 'text-white/60'
                            }`}
                          >
                            {group.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer: info note */}
                <div className="pt-5 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-white/50 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                    <HelpCircle className="w-4 h-4 text-[#4ade28] shrink-0" />
                    <span>Requires tNIGHT preprod funds for contract creation transaction fees.</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── 4. Terminal Log Panel ────────────────────────────────────────── */}
            <AnimatePresence>
              {logsVisible && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: dur.normal, ease }}
                  className="overflow-hidden"
                >
                  <Card className="p-0 overflow-hidden bg-black/80 border-white/10 rounded-2xl shadow-2xl">
                    {/* Header bar with 3 dots */}
                    <div className="px-4 py-3 border-b border-white/10 bg-black/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                          <div className="w-3 h-3 rounded-full bg-[#4ade28]/80" />
                        </div>
                        <span className="text-xs font-mono text-white/70 font-semibold">
                          deployment_log.sh
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(logs.join('\n'), 'logs')}
                        icon={copiedLogs ? <Check className="w-3.5 h-3.5 text-[#4ade28]" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedLogs ? 'Copied' : 'Copy logs'}
                      </Button>
                    </div>

                    {/* Console Output Area */}
                    <div
                      ref={logContainerRef}
                      className="p-4 bg-black/60 font-mono text-xs text-white/80 h-56 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10"
                    >
                      {logs.map((log, idx) => (
                        <div
                          key={idx}
                          className={`leading-relaxed ${
                            log.startsWith('[SUCCESS]')
                              ? 'text-[#4ade28] font-bold'
                              : log.startsWith('[ERR]')
                              ? 'text-rose-400'
                              : log.startsWith('[ZK]') || log.startsWith('[PROOF]')
                              ? 'text-cyan-300'
                              : 'text-white/80'
                          }`}
                        >
                          {log}
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-[#4ade28] pt-1">
                        <span>$</span>
                        <motion.span
                          animate={{ opacity: [1, 0, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="font-bold inline-block"
                        >
                          ▋
                        </motion.span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ── Compact ZK Specification Modal Popup ──────────────────────────── */}
      <Modal
        isOpen={showSpecModal}
        onClose={() => setShowSpecModal(false)}
        title="Compact ZK Specification Breakdown"
        size="lg"
      >
        <div className="space-y-5 text-white/90 text-sm">
          <div className="p-4 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 space-y-2">
            <h4 className="font-bold text-[#22D3EE] text-base flex items-center gap-2">
              <Cpu className="w-5 h-5" /> PrivEstate ZK Circuit Architecture
            </h4>
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed">
              The PrivEstate Compact contract is compiled to Zero-Knowledge Intermediate Representation (ZKIR) via the Compact v0.16 compiler, generating client-side proving witnesses for Midnight Preprod.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-white/40 block uppercase text-[10px] tracking-wider">Circuit Target</span>
              <span className="text-white font-semibold">managed/contract/index.js</span>
            </div>
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-white/40 block uppercase text-[10px] tracking-wider">Proving Provider</span>
              <span className="text-[#22D3EE] font-semibold">1AM In-Browser Proving</span>
            </div>
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-white/40 block uppercase text-[10px] tracking-wider">Property Initial Share Supply</span>
              <span className="text-[#4ade28] font-semibold">100,000 SHARES</span>
            </div>
            <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1">
              <span className="text-white/40 block uppercase text-[10px] tracking-wider">Compliance Statutory Min</span>
              <span className="text-[#8B5CF6] font-semibold">$250,000 USD</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-2">
            <h5 className="font-bold text-white text-xs uppercase tracking-wider text-white/50">
              Private Witness State Definition
            </h5>
            <pre className="p-3 rounded-lg bg-black/80 font-mono text-xs text-[#22D3EE] overflow-x-auto">
{`interface PrivEstatePrivateState {
  investorOwnership: bigint;     // Secret share count
  investmentAmount: bigint;      // Secret capital ($)
  rentalIncome: bigint;          // Secret yield ($)
  investorSecretKey: Uint8Array; // 32-byte witness key
}`}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setShowSpecModal(false)}>
              Close Specifications
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
