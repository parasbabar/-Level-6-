import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Shield,
  CheckCircle2,
  AlertCircle,
  Layers,
  DollarSign,
  PieChart,
  ExternalLink,
  Info,
  Lock,
  RefreshCw,
} from 'lucide-react';
import type { PropertyMetadata } from '../utils/contract';
import { calculateAvailableShares } from '../utils/contract';
import { getSafeWalletFingerprint, type WalletConnectionStatus } from '../hooks/useMidnight';

interface AdminDashboardProps {
  properties: PropertyMetadata[];
  onAddProperty: (newProp: PropertyMetadata) => Promise<void>;
  onNavigateToMarketplace: () => void;
  isAdmin?: boolean;
  adminWalletAddress?: string;
  connectedWalletAddress?: string | null;
  walletStatus?: WalletConnectionStatus;
  isRefreshingInventory?: boolean;
  onRefreshInventory?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  properties,
  onAddProperty,
  onNavigateToMarketplace,
  isAdmin = false,
  adminWalletAddress = '',
  connectedWalletAddress = null,
  walletStatus = 'disconnected',
  isRefreshingInventory = false,
  onRefreshInventory,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [assetType, setAssetType] = useState('Residential Multifamily');
  const [totalValuationUsd, setTotalValuationUsd] = useState<number>(4_500_000);
  const [totalShares, setTotalShares] = useState<number>(90_000);
  const [complianceMinimumUsd, setComplianceMinimumUsd] = useState<number>(200_000);
  const [projectedYieldApy, setProjectedYieldApy] = useState('8.2%');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Aggregated Admin Dashboard Statistics
  const totalValuationAll = properties.reduce((acc, p) => acc + p.totalValuationUsd, 0);
  const totalSharesAll = properties.reduce((acc, p) => acc + p.totalShares, 0n);
  const totalAcquiredAll = properties.reduce((acc, p) => acc + p.acquiredShares, 0n);
  const totalAvailableAll = properties.reduce((acc, p) => acc + p.availableShares, 0n);

  const handleResetForm = () => {
    setName('');
    setLocation('');
    setAssetType('Residential Multifamily');
    setTotalValuationUsd(4_500_000);
    setTotalShares(90_000);
    setComplianceMinimumUsd(200_000);
    setProjectedYieldApy('8.2%');
    setImageUrl('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80');
    setFormError(null);
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // CRITICAL: Reject unauthorized wallets at action handler level
    if (!isAdmin) {
      setFormError(
        `Action rejected: Connected wallet (${getSafeWalletFingerprint(connectedWalletAddress)}) is not authorized as the platform admin. Admin wallet: ${getSafeWalletFingerprint(adminWalletAddress)}.`
      );
      return;
    }

    if (!name.trim()) {
      setFormError('Property name is required.');
      return;
    }
    if (!location.trim()) {
      setFormError('Property location is required.');
      return;
    }
    if (totalValuationUsd <= 0) {
      setFormError('Total Valuation must be a positive dollar amount.');
      return;
    }
    if (totalShares <= 0) {
      setFormError('Total Share Supply must be greater than 0.');
      return;
    }
    if (complianceMinimumUsd <= 0) {
      setFormError('Compliance minimum requirement must be greater than $0.');
      return;
    }

    const nextIdNum = properties.length + 1;
    const newId = `PROP-00${nextIdNum}`;
    const bytesId = new Uint8Array(32);
    bytesId.fill(nextIdNum);

    const totalSharesBig = BigInt(totalShares);
    const newProperty: PropertyMetadata = {
      id: newId,
      bytesId,
      name: name.trim(),
      location: location.trim(),
      assetType,
      totalValuationUsd,
      totalShares: totalSharesBig,
      acquiredShares: 0n,
      availableShares: calculateAvailableShares(totalSharesBig, 0n),
      complianceMinimumUsd: BigInt(complianceMinimumUsd),
      projectedYieldApy: projectedYieldApy.includes('%') ? projectedYieldApy : `${projectedYieldApy}%`,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      status: 'Preprod Verified',
      createdAt: new Date().toISOString(),
    };

    setIsPublishing(true);
    try {
      await onAddProperty(newProperty);
      setSuccessMessage(`Successfully published RWA asset "${newProperty.name}" (${newProperty.id}) to Midnight Preprod Marketplace! All users will now see this property.`);
      setIsModalOpen(false);
      handleResetForm();

      setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to add property due to authorization or validation error.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Admin Authorization Status Banner */}
      {!isAdmin && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-5 text-xs text-rose-200 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-100 flex items-center gap-2">
                <span>Admin Authorization Required</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  RESTRICTED
                </span>
              </h3>
              <p className="text-xs text-rose-300/90 mt-0.5">
                Only the designated admin public wallet address is authorized to publish or modify tokenized real estate assets on Midnight Preprod.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] font-mono">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Connected Wallet:</span>
              <span className={connectedWalletAddress ? 'text-amber-300 select-all break-all' : 'text-slate-500 italic'}>
                {connectedWalletAddress ? `${connectedWalletAddress} (${walletStatus})` : `No wallet connected (status: ${walletStatus})`}
              </span>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 space-y-1">
              <span className="text-slate-400 block uppercase tracking-wider text-[10px]">Configured Admin Public Address:</span>
              <span className="text-emerald-400 select-all break-all">
                {adminWalletAddress || 'VITE_ADMIN_WALLET_ADDRESS not configured in environment'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-rose-300/80 flex items-start gap-2 bg-slate-950/40 p-2.5 rounded border border-rose-900/40">
            <Info className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>
              To manage assets, connect with the configured admin wallet above or set <code className="bg-slate-900 text-rose-200 px-1 py-0.5 rounded font-mono">VITE_ADMIN_WALLET_ADDRESS</code> in your <code className="bg-slate-900 text-rose-200 px-1 py-0.5 rounded font-mono">.env</code> file.
            </span>
          </div>
        </div>
      )}

      {/* Admin Title & Architecture Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${isAdmin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'}`}>
                {isAdmin ? 'Admin Authorized' : 'Read-Only Mode'}
              </span>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <span>RWA Property Management & Asset Tokenization</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Issue, configure, and publish fractional real estate assets to the Midnight Preprod RWA Marketplace.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshInventory && (
              <button
                onClick={onRefreshInventory}
                disabled={isRefreshingInventory}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition disabled:opacity-60"
                title="Synchronize asset state with Midnight Preprod registry"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshingInventory ? 'animate-spin' : ''}`} />
                <span>{isRefreshingInventory ? 'Syncing...' : 'Sync Inventory'}</span>
              </button>
            )}

            <button
              onClick={() => {
                if (!isAdmin) {
                  setFormError(`Unauthorized: You must connect the admin wallet to add properties.`);
                  return;
                }
                setIsModalOpen(true);
              }}
              disabled={!isAdmin}
              className={`px-4 py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition shadow-lg ${
                isAdmin
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
              title={isAdmin ? 'Add New Property' : 'Admin wallet connection required'}
            >
              {isAdmin ? <PlusCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{isAdmin ? 'Add New RWA Property' : 'Admin Restricted'}</span>
            </button>
          </div>
        </div>

        {/* Security & Authorization Architecture Notice */}
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-3.5 text-xs text-amber-200/90 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-300">
              Midnight Compact Architecture & Security Model:
            </p>
            <p className="text-[11px] text-amber-200/80 leading-relaxed">
              Properties created via this Admin Console are structured with deterministic Compact parameters (<code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">propertyId</code>, <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">totalShares</code>, <code className="font-mono bg-slate-950 px-1 py-0.5 rounded text-amber-300">complianceMinimum</code>).
              To preserve Midnight privacy guarantees, private keys and administrative secrets are never hardcoded in source code or client bundles.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-4 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={onNavigateToMarketplace}
            className="px-3 py-1.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition text-[11px] flex items-center gap-1 shrink-0"
          >
            <span>View Marketplace</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* High-Level Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total RWA Assets</span>
            <Building2 className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{properties.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Listed properties</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Listed Valuation</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ${(totalValuationAll / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Combined valuation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Total Share Supply</span>
            <PieChart className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalSharesAll.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Authorized shares</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Marketplace Allocation</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-300 font-mono">
            {totalAvailableAll.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Available ({totalAcquiredAll.toLocaleString()} acquired)
          </div>
        </div>
      </div>

      {/* Property Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span>Active Property Inventory ({properties.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Live Preprod Registry</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-mono border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Property Name</th>
                <th className="py-3 px-4">Location & Type</th>
                <th className="py-3 px-4 text-right">Valuation (USD)</th>
                <th className="py-3 px-4 text-right">Total Shares</th>
                <th className="py-3 px-4 text-right">Acquired Shares</th>
                <th className="py-3 px-4 text-right">Available Shares</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {properties.map((prop) => {
                const acquiredPct = prop.totalShares > 0n
                  ? Number((prop.acquiredShares * 1000n) / prop.totalShares) / 10
                  : 0;

                return (
                  <tr key={prop.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono text-indigo-400 font-bold">{prop.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      <div className="flex items-center gap-2">
                        <img
                          src={prop.imageUrl}
                          alt={prop.name}
                          className="w-8 h-8 rounded object-cover border border-slate-700 shrink-0"
                        />
                        <span>{prop.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div>{prop.location}</div>
                      <div className="text-[10px] text-slate-500">{prop.assetType}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-emerald-400">
                      ${prop.totalValuationUsd.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-white">
                      {prop.totalShares.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-300">
                      {prop.acquiredShares.toLocaleString()} ({acquiredPct}%)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-300">
                      {prop.availableShares.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {prop.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Property */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Add New RWA Property</h3>
                  <p className="text-xs text-slate-400">Configure parameters for a new Midnight tokenized property</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  handleResetForm();
                }}
                className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/60 border border-rose-500/40 rounded-lg p-3 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-semibold">Property Title / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grand Horizon Tower"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Denver, CO"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Asset Category *</label>
                  <select
                    value={assetType}
                    onChange={(e) => setAssetType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Residential Multifamily">Residential Multifamily</option>
                    <option value="Commercial Grade-A Office">Commercial Grade-A Office</option>
                    <option value="Luxury Penthouse">Luxury Penthouse</option>
                    <option value="Industrial Logistics Hub">Industrial Logistics Hub</option>
                    <option value="Mixed-Use Hospitality">Mixed-Use Hospitality</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Total Valuation ($ USD) *</label>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={totalValuationUsd}
                    onChange={(e) => setTotalValuationUsd(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Total Authorized Share Supply *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={totalShares}
                    onChange={(e) => setTotalShares(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Compliance Minimum ($ USD) *</label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={complianceMinimumUsd}
                    onChange={(e) => setComplianceMinimumUsd(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">Projected Yield APY *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 8.5%"
                    value={projectedYieldApy}
                    onChange={(e) => setProjectedYieldApy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-300 font-semibold">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Share calculation preview */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">Calculation Preview:</div>
                <div className="flex justify-between text-slate-300">
                  <span>Price per Share:</span>
                  <span className="text-emerald-400 font-bold">
                    ${totalShares > 0 ? (totalValuationUsd / totalShares).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Initial Available Shares:</span>
                  <span className="text-indigo-400 font-bold">{totalShares.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    handleResetForm();
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition shadow-md shadow-indigo-600/30 flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Publishing to all users...
                    </>
                  ) : (
                    'Publish RWA Asset'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
