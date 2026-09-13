# 🏠 PrivEstate — Level 6 Supermoon

Privacy-Preserving Fractional Real Estate on Midnight Network Preprod

*"This project is built on the Midnight Network."*

[![CI](https://github.com/parasbabar/level4/actions/workflows/ci.yml/badge.svg)](https://github.com/parasbabar/level4/actions/workflows/ci.yml)

---

## 🌝 Level 6 — Supermoon Overview

**PrivEstate Level 6** is the Supermoon refinement of the existing MVP built during Level 4 and validated in Level 5 of the Midnight Builder Challenge.

Rather than building an unrelated project or making unnecessary architectural resets, Level 6 refines the same MVP product based on **genuine Level 5 user feedback**.

### 🔁 Feedback Loop Workflow

```
User Feedback
    │
    ▼
Identify Recurring Requests (UI/UX Polish, Share Transparency, Admin Dashboard)
    │
    ▼
Prioritize Technical Improvements & Safety
    │
    ▼
Implement Improvements (AdminDashboard, Share Bar, Validation, Vitest Tests)
    │
    ▼
Test Refined MVP (Vitest unit tests + TypeScript checks + Production build)
    │
    ▼
Validate with Preprod Users (Midnight Preprod Network)
    │
    ▼
Collect New Feedback & Extend Evidence (users.md & feedback.md)
```

---

## 🌟 Level 6 Implemented Refinements

### 1. 🎨 Systemic UI / UX Refinement
- **Visual Polish**: Upgraded dark-mode design system with curated HSL color accents, modern typography, card hover dynamics, and Level 6 Supermoon navigation indicators.
- **Responsive Layout**: Dedicated mobile navigation bar and responsive grid layouts ensuring an optimal experience across mobile, tablet, and desktop viewports.
- **Transaction Feedback**: Clear state machine visual cues for every step: `Idle` $\rightarrow$ `Preparing` $\rightarrow$ `Wallet Signature` $\rightarrow$ `Broadcasting` $\rightarrow$ `Confirmation`.

### 2. 📊 Property Share Transparency & Live Inventory
- **Explicit Share Metrics**: For every property listing, PrivEstate clearly displays:
  - **Total Shares**: Authorized fractional share supply (e.g. 100,000 shares).
  - **Acquired Shares**: Shares already acquired by investors.
  - **Available Shares**: Remaining fractional inventory available for purchase.
- **Mathematical Formula**:
  $$\text{Available Shares} = \text{Total Shares} - \text{Acquired Shares}$$
- **Responsive Sizing**: Overflow-proof numeric stat boxes (`min-w-0`, `tabular-nums`) ensuring readability for large numbers ($90\text{k}, 100\text{k}, 250\text{k}, 1\text{M}, 10\text{M}$) across mobile and desktop.
- **Live Inventory Synchronization**: Synchronizes confirmed Midnight Preprod transactions with the shared asset registry. Includes a **Sync Inventory** control to re-fetch state without stale mock overwrites.
- **Purchase Validation**: Strict pre-transaction bounds checks prevent over-subscription. If a transaction fails, inventory remains untouched (no false deductions).

### 3. 🛡️ Secure Admin Property Authorization
- **Designated Public Admin Wallet**: Configured via `VITE_ADMIN_WALLET_ADDRESS=<admin-public-wallet-address>`.
- **Public Security**: Admin wallet address is public information. Private keys, seeds, or mnemonics are **NEVER** placed in frontend bundles, configuration files, or source code.
- **Dual-Layer Enforcement**:
  - **UI State**: Non-admin users see a clear "Admin Authorization Required / Restricted" warning banner with locked controls.
  - **Action Handler**: The `addProperty` callback rejects unauthorized wallets at execution time.
- **Property Listing Form**: Authorized admins can tokenize new RWA properties with title, location, category, valuation ($), share supply, APY %, compliance minimums ($), and custom image URLs.

---

## 🔗 Submission Links & Resources

| Resource | Link / Identifier | Notes |
| :--- | :--- | :--- |
| 📦 **Level 6 GitHub Repo** | [https://github.com/parasbabar/-Level-6-.git](https://github.com/parasbabar/-Level-6-.git) | Main Level 6 Supermoon repository |
| 🚀 **Live MVP** | [https://level-6.vercel.app](https://level-6.vercel.app) | Live on Midnight Preprod |
| ⛓️ **Preprod Contract Address** | `2e5e3eea72733c09f794677002d0a0840163b3b3da1d6e661bc4dd1b421eaab9` | Deployed Compact smart contract |
| 🌐 **Midnight Block Explorer** | [https://explorer.preprod.midnight.network/](https://explorer.preprod.midnight.network/) | Midnight Preprod Explorer |
| 📋 **Feedback Analysis Report** | [feedback.md](feedback.md) | Level 5 feedback themes & Level 6 improvements |
| 👥 **Preprod User Evidence** | [users.md](users.md) | 70 genuine Midnight Preprod user validation records |
| 🎥 **MVP Demo Video** | [YouTube — PrivEstate Walkthrough](https://www.youtube.com/watch?v=FTd3XnOjuc4) | Walkthrough of MVP functionality |
| ⚙️ **CI/CD Pipeline** | [.github/workflows/ci.yml](.github/workflows/ci.yml) | Automated Vitest test suite and Vite build |

---

## 👥 Preprod User Validation & Feedback

We collected structured feedback from **70 genuine Preprod users** (students, developers, and Web3 users) who tested the live PrivEstate application on Midnight Preprod.

### User Feedback Sheet (Source of Truth)
[View Feedback & Validation Google Sheet](https://docs.google.com/spreadsheets/d/10SIy8qraGBTP5IZZtQ1TTgLDLfcxyMqsNFrFeTqRTzk/edit?usp=sharing)

### User Validation Records (All 70 wallets)
[View Preprod User Validation Records → users.md](./users.md)


---

## ✨ What is PrivEstate?

**PrivEstate** is a privacy-preserving fractional real estate investment MVP built on the **Midnight Network**.

Real-world asset (RWA) tokenization allows multi-million dollar properties to be divided into liquid, accessible fractional shares. However, traditional public blockchains force all wallet balances, cap tables, investment figures, and rental payouts into the clear for any observer to inspect.

PrivEstate resolves this dilemma using Midnight's **Compact** smart contract language and **Zero-Knowledge (ZK) Proofs**:

* **Fractional Property Ownership**: High-value properties are divided into tokenized fractional shares (e.g., 100,000 shares).
* **Private Investor Holdings**: Share allocations and capital balances are stored off-chain in client-shielded witness state.
* **Confidential Investment Amounts**: The exact dollar amount deployed by an investor is never recorded on the public ledger.
* **Zero-Knowledge Ownership Threshold Proofs**: Investors mathematically prove they satisfy an ownership requirement without disclosing their exact holdings.
* **Compliance & Accreditation Verification**: Investors prove their capital meets statutory accreditation standards (e.g., $\ge \$250,000$) without disclosing total net worth or bank statements.
* **Confidential Rental-Yield Verification**: Investors verify rental distributions meet target benchmarks without revealing private payout figures.
* **Auditor & Regulator Verification**: Third parties verify mathematical validity on-chain through public verification audit counters without exposing confidential investor data.

> **Example**: An investor privately holds **17.43%** (17,430 shares) of a property. When joining a syndicate requiring a 10% minimum, the investor generates a ZK proof asserting:  
> **"I own at least 10% of this property."**  
> The verifier confirms the threshold claim with mathematical certainty, while the investor's exact 17.43% holding remains completely secret.

---

## 🎯 Problem

Public blockchains introduce a fundamental **transparency-vs-privacy conflict** for financial and real estate applications:

1. **Exposure of Sensitive Ownership**: On public ledgers, every token balance is visible. Competitors, tenants, and adversaries can inspect an investor's exact holdings, asset accumulation strategy, and property stake.
2. **Confidential Capital at Risk**: High-net-worth individuals and corporate syndicates cannot accept having total deployed capital and liquidity publicly searchable.
3. **Rental Income & Distribution Privacy**: Exposing ongoing rental income payouts leaks personal cash flow and financial profiles.
4. **Intrusive All-or-Nothing Compliance**: Traditional off-chain syndicates force investors to hand over full tax filings, bank statements, and identification to prove eligibility, creating centralized data honeypots prone to breaches.

---

## 💡 Solution

PrivEstate applies Midnight's **selective-disclosure model** to real-world asset investing:

> *"Reveal the result that needs to be verified, not the private data used to produce it."*

* **Decoupled Verification**: The application verifies predicates over private data inside local zero-knowledge circuits.
* **Succinct Ledger State**: The public ledger records property parameters and increments public verification counters (`verifiedOwnershipCount`, `verifiedComplianceCount`, `verifiedRentalYieldCount`).
* **Zero Data Honeypots**: Auditors, syndicate managers, and regulators receive cryptographic guarantees without storing or inspecting raw investor financial records.

---

## 🏗️ Architecture

```text
+-----------------------------------------------------------------------+
|                       INVESTOR CLIENT BROWSER                         |
|                                                                       |
|  [ React / Vite Frontend ] <-------------------> [ Private Witness ]  |
|  - Property Marketplace                           - investorOwnership  |
|  - Shielded Portfolio                             - investmentAmount   |
|  - ZK Proof Generation UI                         - rentalIncome       |
|  - Auditor Verifier Portal                        - secretKey          |
+-----------------------------------------------------------------------+
                                   |
                                   | (Midnight DApp Connector API)
                                   v
+-----------------------------------------------------------------------+
|                    MIDNIGHT LACE WALLET EXTENSION                     |
|                                                                       |
|  - Shielded Address & Public Key Management                           |
|  - Transaction Signing & Proof Delegation                             |
|  - Preprod Network Connection                                         |
+-----------------------------------------------------------------------+
                                   |
                                   | (Submits Proofs & State Updates)
                                   v
+-----------------------------------------------------------------------+
|                       MIDNIGHT PREPROD NETWORK                        |
|                                                                       |
|  [ Compact Smart Contract: contracts/privestate.compact ]             |
|                                                                       |
|  - ZK Circuits (Evaluated with private witnesses):                    |
|    * proveOwnershipThreshold(requiredShares)                          |
|    * proveCompliance(minimumRequired)                                 |
|    * proveRentalClaim(minimumYield)                                   |
|    * computeInvestorCommitment(sk, propId)                            |
|                                                                       |
|  - Public Ledger State (On-Chain):                                    |
|    * propertyId: Bytes<32>                                            |
|    * totalShares: Uint<64>                                            |
|    * complianceMinimum: Uint<64>                                      |
|    * verifiedOwnershipCount: Counter                                  |
|    * verifiedComplianceCount: Counter                                 |
|    * verifiedRentalYieldCount: Counter                                |
|    * lastVerifiedThreshold: Uint<64>                                  |
+-----------------------------------------------------------------------+
                                   |
                                   | (Public Verifiable Audit Log)
                                   v
+-----------------------------------------------------------------------+
|                         AUDITOR / REGULATOR                           |
|                                                                       |
|  - Inspects on-chain public verification counters                     |
|  - Validates cryptographic proof certificates                         |
|  - Learns: "Claim is cryptographically VALID"                         |
|  - Zero disclosure of underlying shares, capital, or rental payouts   |
+-----------------------------------------------------------------------+
```

---

## 🔐 Privacy Model

PrivEstate strictly partitions application state between private witness data and public verifiable ledger state:

### 🔒 Strictly Private (Shielded Client-Side)
* **Investor Ownership Shares**: Exact share count (e.g., 17,430 shares) resides strictly in client-shielded witness storage.
* **Capital Invested**: Exact dollar amount deployed (e.g., $500,000) is shielded from external inspection.
* **Confidential Rental Income**: Annual rental payouts, yield distributions, and bank routing details remain private.
* **Private Identity & Secret Keys**: Cryptographic salt and private keys used to derive Zero-Knowledge commitments.
* **Private Verification Inputs**: Raw numbers used during witness execution are never transmitted across the network.

### 🌐 Public & Verifiable (On-Chain Midnight Ledger)
* **Contract Address**: Deployed contract identity on Midnight Preprod.
* **Network Identifier**: Target environment (`preprod`).
* **Property Metadata**: Public asset identifiers (`propertyId`), total authorized shares (`totalShares`), and compliance minimums (`complianceMinimum`).
* **Verification Audit Counters**: Incremented on-chain counters recording valid proofs (`verifiedOwnershipCount`, `verifiedComplianceCount`, `verifiedRentalYieldCount`).
* **Last Verified Threshold**: Publicly disclosed threshold benchmark from the latest successful verification.
* **Transaction Identifiers**: Real Midnight Preprod transaction IDs confirming state changes.

*PrivEstate does not claim that every transaction detail is publicly visible; privacy is preserved by disclosing only the verified boolean outcome to the ledger.*

---

## 🧠 Smart Contract

The core contract is implemented in Midnight's **Compact** language:
📄 [contracts/privestate.compact](contracts/privestate.compact)

### Implemented Circuits

1. **`proveOwnershipThreshold(requiredShares: Uint<64>): []`**
   - **Private Witness**: `getInvestorOwnership()`
   - **Public Input**: `requiredShares`
   - **ZK Constraint**: `actualOwnership >= requiredShares && actualOwnership <= totalShares`
   - **Ledger Effect**: Increments `verifiedOwnershipCount` and records `lastVerifiedThreshold = disclose(requiredShares)`.

2. **`proveCompliance(minimumRequired: Uint<64>): []`**
   - **Private Witness**: `getInvestmentAmount()`
   - **Public Input**: `minimumRequired`
   - **ZK Constraint**: `actualInvestment >= minimumRequired`
   - **Ledger Effect**: Increments `verifiedComplianceCount`.

3. **`proveRentalClaim(minimumYield: Uint<64>): []`**
   - **Private Witness**: `getRentalIncome()`
   - **Public Input**: `minimumYield`
   - **ZK Constraint**: `actualRental >= minimumYield`
   - **Ledger Effect**: Increments `verifiedRentalYieldCount`.

4. **`computeInvestorCommitment(sk: Bytes<32>, propId: Bytes<32>): Bytes<32>`**
   - **Pure Circuit**: Computes a deterministic identity hash:
     `persistentHash([pad(32, "privestate:inv:"), propId, sk])`
   - Allows investors to prove identity binding across transactions without disclosing their secret key.

---

## 🏘️ Property Marketplace

The marketplace presents tokenized Real-World Assets configured for demonstration on Midnight Preprod:

* **Featured Property**: *Sunrise Luxury Residences*
* **Property ID**: `PROP-001`
* **Total Asset Valuation**: $5,000,000 USD
* **Fractional Share Supply**: 100,000 fractional shares ($50 / share)
* **Projected Rental Yield**: 8.4% APY
* **Statutory Compliance Minimum**: $250,000 USD (Accredited Tier)

Users can connect a Midnight wallet, select an allocation, and acquire fractional shares via real Midnight Preprod transactions. The marketplace includes per-property state isolation and persistent holding badges to support multi-property workflows.

---

## 👛 Wallet Integration

PrivEstate natively integrates with the **Midnight DApp Connector Standard** (`@midnight-ntwrk/dapp-connector-api`) for the **Midnight Lace Wallet**:

* **Connector Detection**: Automatically detects `window.midnight.mnLace` on page load.
* **Network Validation**: Verifies the wallet is connected to the **Midnight Preprod** network.
* **Shielded Identity**: Safely accesses shielded addresses and coin public keys to derive deterministic, wallet-scoped client storage.
* **Contract Interaction**: Executes contract calls with automatic proof generation.
* **Real Preprod Transactions**: Submits scoped transactions signed by the user's wallet with confirmation tracking.
* **Stale Lock Resilience**: Includes automatic retry handling with exponential backoff for wallet extension internal queue locks.

> ⚠️ **Security Notice**: PrivEstate never requests, stores, or handles wallet seed phrases or private signing keys. All authorization occurs inside the user's Midnight Lace Wallet extension.

---

## 📊 Portfolio

The **Shielded Portfolio** view displays the investor's confidential position:

* **Private Fractional Shares**: Displayed as share quantity and calculated ownership percentage.
* **Shielded Capital Invested**: Total fiat-equivalent capital deployed into the asset.
* **Estimated Annual Rental Yield**: Expected annual rental disbursements based on ownership.
* **Visual Privacy Masking**: Toggleable masking button (`Mask Private Values / Reveal Shielded Values`) allowing investors to safely navigate the interface in public settings without exposing figures.
* **Scenario Adjustment**: Ability to adjust test holding amounts to test different verification threshold outcomes against the contract.

---

## 🛡️ Proof Verification

PrivEstate provides an intuitive interface for generating and inspecting Zero-Knowledge proofs:

1. **Ownership Threshold Verification**: Choose a property and threshold (e.g., 5%, 10%, 20%). The Compact circuit evaluates the witness locally and increments the on-chain audit counter.
2. **Accreditation & Compliance Verification**: Select standard accreditation tiers ($100k, $250k, $500k). The circuit verifies compliance without revealing deployed capital.
3. **Confidential Rental Yield Verification**: Prove annual earnings meet a benchmark yield without disclosing payout amounts.
4. **Auditor & Regulator Verification Portal**: A dedicated verifier view displaying the complete on-chain audit log. Auditors verify proof status (`VALID`), circuit identifier (`proveOwnershipThreshold.zkir`), and identity commitments while confirming that underlying values remain masked (`🔒 NOT DISCLOSED`).

---

## 🧪 Testing

PrivEstate includes an automated test suite verifying contract execution, private witness behavior, circuit constraints, and ledger assertions:
📄 [tests/privestate.test.ts](tests/privestate.test.ts)

Run the test suite:
```bash
npm test
```

### Verified Test Results: 8/8 Passing

1. **Contract Initialization**: Verifies initial ledger parameters (`propertyId`, `totalShares`, `complianceMinimum`, counters at 0) while confirming private state is shielded off-chain.
2. **Valid Ownership Threshold Proof (PASS)**: Confirms that an investor holding 17.43% satisfies a 10% threshold claim, incrementing the public counter without leaking the exact share count.
3. **Invalid Ownership Threshold Proof (FAIL)**: Confirms contract assertion rejects claims when holdings (7%) fall below the requested threshold (10%).
4. **Regulatory Accreditation Proof (PASS)**: Validates compliance proof when capital ($500,000) meets the statutory minimum ($250,000) without revealing the investment amount.
5. **Sub-Threshold Compliance Rejection (FAIL)**: Rejects accreditation proof when capital ($150,000) is below the required threshold ($250,000).
6. **Confidential Rental Yield Claim (PASS)**: Verifies rental yield claim ($\ge \$30,000$) against private income ($45,000$) without exposing actual earnings.
7. **Invalid Rental Yield Rejection (FAIL)**: Confirms rejection when claimed yield ($\ge \$60,000$) exceeds actual earnings ($45,000$).
8. **Cryptographic Identity Commitment**: Confirms deterministic investor commitment derivation over identity secret keys and property identifiers without exposing the secret.

---

## ⚙️ CI/CD

Continuous Integration is automated via GitHub Actions:
📄 [.github/workflows/ci.yml](.github/workflows/ci.yml)

[![CI](https://github.com/parasbabar/level4/actions/workflows/ci.yml/badge.svg)](https://github.com/parasbabar/level4/actions/workflows/ci.yml)

On every push and pull request to `main`, the pipeline validates:
1. **Repository Checkout & Setup**: Node.js v22 environment configuration with npm caching.
2. **Dependency Installation**: Clean dependency resolution with `npm ci`.
3. **Contract & Circuit Tests**: Full execution of `npm test` (8/8 tests passing).
4. **Frontend Production Build**: Zero-error compilation and bundling via `npm run build` (`tsc && vite build`).

---

## 🚀 Local Setup

### Prerequisites
* **Node.js**: v22.x or higher
* **npm**: v10.x or higher
* **Midnight Lace Wallet**: Browser extension configured for Midnight Preprod
* **Compact CLI Toolchain** *(optional, for recompiling `.compact` contracts)*: `compact` v0.5.2

### Step-by-Step Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/parasbabar/-Level-6-.git
   cd Level-6-
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```
   The default `.env.example` is pre-configured for the live Midnight Preprod deployment:
   ```env
   VITE_MIDNIGHT_NETWORK_ID=preprod
   VITE_INDEXER_URI=https://indexer.preprod.midnight.network/api/v4/graphql
   VITE_INDEXER_WS_URI=wss://indexer.preprod.midnight.network/api/v4/graphql/ws
   VITE_NODE_URI=https://rpc.preprod.midnight.network
   VITE_PROOF_SERVER_URI=http://localhost:6300
   VITE_CONTRACT_ADDRESS=2e5e3eea72733c09f794677002d0a0840163b3b3da1d6e661bc4dd1b421eaab9
   ```

   > 🔒 **Security Notice**: Never commit `.env`, wallet seeds, or private credentials to version control.

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in a Chromium-based browser with the Midnight Lace Wallet extension installed.

---

## 🛠️ Development Commands

These commands correspond directly to the scripts defined in `package.json`:

| Command | Action |
| :--- | :--- |
| `npm install` | Install all project dependencies |
| `npm run dev` | Start local Vite development server with HMR |
| `npm test` | Run Vitest contract and circuit test suite (8 tests) |
| `npm run build` | Typecheck (`tsc`) and create production bundle (`vite build`) |
| `npm run compact` | Compile Compact smart contract (`scripts/compile-compact.mjs`) |
| `npm run preview` | Locally preview the built production distribution |

---

## 📁 Project Structure

```text
Level-6-/
├── .github/
│   └── workflows/
│       └── ci.yml                # CI/CD pipeline definition
├── contracts/
│   └── privestate.compact        # Midnight Compact smart contract & circuits
├── docs/
│   └── USAGE.md                  # Comprehensive user and auditor guide
├── managed/
│   └── contract/                 # Compiled Compact TypeScript bindings & ZKIR
├── public/                       # Static public assets
├── scripts/
│   ├── compile-compact.mjs       # Compact compilation script
│   ├── deploy-preprod.mjs        # Midnight Preprod deployment utility
│   └── start-dev.mjs             # Dev startup utility
├── src/
│   ├── components/
│   │   ├── ComplianceProof.tsx   # Regulatory compliance proof interface
│   │   ├── DeployContract.tsx    # In-dApp contract deployment utility
│   │   ├── Layout.tsx            # Navigation header, network status, tabs
│   │   ├── OwnershipProof.tsx    # Ownership threshold ZK proof interface
│   │   ├── Portfolio.tsx         # Shielded portfolio with privacy masking
│   │   ├── ProofVerifier.tsx     # Auditor/regulator verification portal
│   │   ├── PropertyMarketplace.tsx # Fractional property acquisition & cards
│   │   └── WalletConnect.tsx     # Midnight Lace Wallet connection banner
│   ├── hooks/
│   │   ├── useDeployContract.ts  # Contract deployment hook
│   │   └── useMidnight.ts        # Midnight DApp Connector & circuit state hook
│   ├── utils/
│   │   ├── contract.ts           # Contract helpers & witness binding
│   │   ├── zkArtifactsData.ts    # Bundled ZKIR circuit artifact definitions
│   │   └── zkConfigProvider.ts   # ZK proof provider configuration
│   ├── App.tsx                   # Main application entry point & routing
│   ├── index.css                 # Custom design system & styles
│   └── main.tsx                  # React DOM mount point
├── tests/
│   └── privestate.test.ts        # Compact contract, witness, & circuit tests
├── .env.example                  # Template environment configuration
├── index.html                    # Single-page application entry HTML
├── package.json                  # Dependencies and build scripts
├── PROPOSAL.md                   # Level 4 project proposal & specification
├── README.md                     # Project overview and documentation
├── tsconfig.json                 # TypeScript compiler configuration
├── vite.config.ts                # Vite build configuration (WASM & polyfills)
└── vitest.config.ts              # Vitest test runner configuration
```

---

## 🌐 Deployment

* **Frontend Application**: Deployed live on Vercel at [https://level-6.vercel.app](https://level-6.vercel.app)
* **Target Blockchain Network**: Midnight Preprod (`preprod`)
* **Deployed Contract Address**:  
  `2e5e3eea72733c09f794677002d0a0840163b3b3da1d6e661bc4dd1b421eaab9`
* **Block Explorer Reference**: [Midnight Preprod Explorer](https://explorer.preprod.midnight.network/)

---

## 🎥 Demo

* **Demo Video**: [▶️ Watch on YouTube — PrivEstate MVP Walkthrough](https://www.youtube.com/watch?v=FTd3XnOjuc4)
* **X Demo Post**: [View on X (@PrivEstate)](https://x.com/PrivEstate/status/2098676086213329125)

### Recommended Demo Flow

1. **Connect Wallet**: Connect the Midnight Lace Wallet extension configured for Midnight Preprod.
2. **Explore Marketplace**: View *Sunrise Luxury Residences* (Property ID: `PROP-001`) with public economic parameters.
3. **Acquire Fractional Shares**: Select an allocation (e.g., 10%) and submit the real Midnight Preprod transaction.
4. **Verify Transaction**: Observe the real Preprod transaction submission and confirmation.
5. **Inspect Shielded Portfolio**: View private shares, capital deployed, and estimated rental yield; toggle privacy masking.
6. **Generate Ownership ZK Proof**: Select an ownership threshold (e.g., $\ge 10\%$) and generate a Zero-Knowledge proof.
7. **Verify on Ledger**: Observe the incremented public verification counter on the Midnight contract.
8. **Test Compliance & Rental Proofs**: Generate regulatory accreditation and confidential rental yield proofs.
9. **Auditor Portal**: Open the auditor verifier view to inspect verified proofs without exposing private investor figures.

---

## 🐦 Building in Public

* **Product X Profile**: [@PrivEstate on X](https://x.com/PrivEstate)
* **Launch Post**: [PrivEstate announcement on X](https://x.com/PrivEstate/status/2098676086213329125)

PrivEstate updates and development milestones will be published to the official product X account as part of the Midnight Level 6 Supermoon challenge.

---

## 🏆 Midnight Level 6 Supermoon Submission Checklist

- [x] **Public GitHub repository**: [https://github.com/parasbabar/-Level-6-](https://github.com/parasbabar/-Level-6-)
- [x] **Live MVP deployed on Midnight Preprod**: [https://level-6.vercel.app](https://level-6.vercel.app)
- [x] **Verifiable contract address**: `2e5e3eea72733c09f794677002d0a0840163b3b3da1d6e661bc4dd1b421eaab9` on Midnight Preprod
- [x] **70 Preprod users with verifiable wallet addresses**: [users.md](users.md) — one combined table, all wallets from Google Sheet
- [x] **Feedback documentation & living feedback loop**: [Google Feedback Sheet](https://docs.google.com/spreadsheets/d/10SIy8qraGBTP5IZZtQ1TTgLDLfcxyMqsNFrFeTqRTzk/edit?usp=sharing)
- [x] **Comprehensive documentation**: [docs/USAGE.md](docs/USAGE.md), [PROPOSAL.md](PROPOSAL.md), [feedback.md](feedback.md), and [users.md](users.md)
- [x] **CI/CD workflow**: [.github/workflows/ci.yml](.github/workflows/ci.yml) validating tests and production builds
- [x] **Meaningful commits in repository history**: 46+ verified commits
- [x] **Demo video showing full MVP functionality**: [YouTube — PrivEstate MVP Walkthrough](https://www.youtube.com/watch?v=FTd3XnOjuc4)
- [x] **Product X profile**: [@PrivEstate](https://x.com/PrivEstate)

---

## 🔒 Security & Privacy Notes

* **Experimental Demonstration**: PrivEstate is a technical prototype developed for the Midnight Builder Challenge Level 4. It operates on the Midnight Preprod test network.
* **Testnet Assets**: Do not transfer real-world capital, production credentials, or real securities to testnet addresses.
* **Credential Safety**: Never commit `.env` files, wallet recovery phrases, or private keys to source control.
* **Witness Confidentiality**: Private witness data is processed locally within the client and is never transmitted in cleartext over the network.

---

## 📚 Documentation

* 👥 [users.md](users.md) — 70 genuine Midnight Preprod user validation records and structured feedback
* 📖 [docs/USAGE.md](docs/USAGE.md) — Comprehensive investor and auditor guide
* 📋 [PROPOSAL.md](PROPOSAL.md) — Project proposal, problem statement, and architecture specification
* 🧠 [contracts/privestate.compact](contracts/privestate.compact) — Midnight Compact smart contract and circuit definitions
* 🧪 [tests/privestate.test.ts](tests/privestate.test.ts) — Full contract and circuit test suite
* ⚙️ [.github/workflows/ci.yml](.github/workflows/ci.yml) — GitHub Actions continuous integration pipeline

---

## 🔭 Future Development

Following Level 4 submission, the planned roadmap includes:

* **Native Shielded Tokens**: Integration with Midnight native token standards for shielded fractional tokens.
* **Secondary Market**: Privacy-preserving peer-to-peer share trading via atomic swaps.
* **Confidential Dividend Distributions**: Automated rental payout distribution using shielded Midnight transactions.
* **Multi-Property Portfolios**: Aggregate cross-property proof generation across diversified portfolios.
* **Decentralized Syndicate Governance**: Anonymous token-weighted voting based on verified private ownership thresholds.
* **Advanced Indexing**: Full blockchain transaction indexing integration as Midnight ecosystem indexer tools mature.

---

## 🌙 Built with Midnight

> *"PrivEstate explores how financial applications can make financial facts verifiable without making every financial detail public."*
