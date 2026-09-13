# 🛡️ PrivEstate Admin Property Tokenization & Authorization Guide

This guide documents the administrative workflows, public wallet authorization architecture, property tokenization parameters, and security models of the **PrivEstate Admin Console** implemented in Level 6 Supermoon.

---

## 1. Secure Admin Authorization Architecture

In PrivEstate Level 6, the Admin Console is protected by a cryptographic wallet authorization mechanism rather than insecure fake passwords or hardcoded private keys.

### Public Admin Wallet Configuration

The designated administrator is configured via the environment variable `VITE_ADMIN_WALLET_ADDRESS`:

```bash
# In .env (Public information - NEVER put private keys or mnemonics here)
VITE_ADMIN_WALLET_ADDRESS=mn_addr_preprod1cwtsm6mjm0ygeu4a8lankwhurgenflvsrhwkhyl9p4r8u9a9dxus95c8qd
```

### Authorization Rules & Enforcement

1. **Public Information**: The admin wallet address is public information. Private keys, seeds, or mnemonics are **NEVER** placed in frontend bundles, configuration files, or source code.
2. **Dual-Level Verification**:
   - **UI Level**: Non-admin users see a clear "Admin Authorization Required / Restricted" warning banner displaying their connected wallet address alongside the configured public admin address, and creation buttons are locked.
   - **Action Handler Level**: The `addProperty` callback directly inspects the active connected wallet address / public coin key against the authorized admin list. If an unauthorized wallet attempts an execution, it is rejected immediately with an authorization error.
3. **Multi-Admin Support**: Comma-separated addresses can be configured if multiple administrators manage the platform.

---

## 2. Overview of Admin Property Management

The PrivEstate Admin Console allows property syndicators, real estate developers, and platform administrators to tokenize, configure, and publish fractional Real-World Assets (RWAs) to the Midnight Preprod marketplace.

### Supported Property Parameters

| Parameter | Type | Example | Description |
|---|---|---|---|
| **Property ID** | `Bytes<32>` / String | `PROP-004` | Unique cryptographic identifier matching the Compact contract on-chain ledger. |
| **Title / Name** | String | `Grand Horizon Tower` | Human-readable title of the real estate offering. |
| **Location & Category** | String | `Denver, CO` / `Residential Multifamily` | Property location and commercial asset classification. |
| **Total Valuation ($)** | Number / USD | `$4,500,000` | Aggregated appraisal dollar valuation of the asset. |
| **Total Share Supply** | `Uint<64>` / BigInt | `90,000` | Total authorized fractional shares issued for the property. |
| **Compliance Minimum ($)** | `Uint<64>` / BigInt | `$200,000` | Regulatory minimum accreditation threshold for investor eligibility proofs. |
| **Projected APY (%)** | String | `8.2%` | Expected annual rental yield distribution percentage. |
| **Share Availability** | `Uint<64>` / BigInt | `90,000 Available` | Derived dynamically as `Available = Total - Acquired`. |

---

## 3. Step-by-Step Property Creation Workflow

1. Connect your Midnight Lace / 1AM Wallet containing the designated admin address.
2. Click the **Admin Dashboard** tab from the top navigation bar.
3. Review existing portfolio statistics (Total Listed Valuation, Share Supply, Allocation breakdown).
4. Click **Add New RWA Property** (unlocked only for authorized admins).
5. Fill out the property parameters:
   - **Property Title**: Enter the formal asset title.
   - **Location**: Enter city and state/country.
   - **Asset Category**: Select asset type (Multifamily, Office, Penthouse, Industrial, Mixed-Use).
   - **Total Valuation ($)**: Enter total asset appraisal dollar amount.
   - **Total Shares**: Enter authorized share count (e.g. 100,000).
   - **Compliance Minimum ($)**: Enter statutory accreditation requirement.
   - **Projected APY**: Enter expected annual yield rate.
   - **Image URL**: Enter property photography URL.
6. Click **Publish RWA Asset**.
7. The property is validated and registered into the marketplace with initial 100% share availability (`availableShares = totalShares`).

---

## 4. Live Share Inventory & Purchase Lifecycle

PrivEstate calculates fractional share inventory dynamically:

$$\text{Available Shares} = \text{Total Shares} - \text{Acquired Shares}$$

### Inventory Updates on Purchase

- **Before Purchase**: The frontend and smart contract provider validate that requested shares $\le$ `availableShares`. If an investor attempts to exceed inventory, the purchase is blocked.
- **On Transaction Success**: The on-chain Midnight transaction increments `acquiredShares` and recalculates `availableShares`. All views (Marketplace, Admin Dashboard, Portfolio) update synchronously.
- **On Transaction Failure**: If a transaction is rejected or fails, the inventory remains strictly unchanged (no optimistic false deductions).
- **Manual / Auto-Sync**: The **Sync Inventory** button allows instant re-fetching from the authoritative registry across browser sessions without displaying stale mock data.

---

## 5. Compact Architecture & Security Model

> **CRITICAL SECURITY GUARANTEE**:
> PrivEstate adheres strictly to Midnight security best practices. The Admin Console does **NOT** use fake frontend passwords or hardcode private keys into source code.

- **On-Chain Alignment**: Property parameters created via Admin Console directly mirror the constructor fields of the compiled `privestate.compact` contract:
  ```compact
  constructor(
    initPropertyId: Bytes<32>,
    initTotalShares: Uint<64>,
    initComplianceMinimum: Uint<64>
  )
  ```
- **Shielded Witness Integrity**: Investor ownership and rental income claims are generated inside local client Zero-Knowledge circuits. The Admin Console never accesses, stores, or modifies private investor secret keys.

