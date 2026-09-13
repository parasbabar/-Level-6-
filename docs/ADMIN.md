# 🛡️ PrivEstate Admin Property Tokenization Guide

This guide documents the administrative workflows, property tokenization parameters, and security architecture of the **PrivEstate Admin Console** implemented in Level 6 Supermoon.

---

## 1. Overview of Admin Property Management

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

## 2. Step-by-Step Property Creation Workflow

1. Open the PrivEstate application.
2. Click the **Admin Dashboard** tab from the top navigation bar.
3. Review existing asset statistics (Total Listed Valuation, Share Supply, Allocation breakdown).
4. Click **Add New RWA Property**.
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
7. The property is immediately registered into the marketplace with initial 100% share availability (`availableShares = totalShares`).

---

## 3. Compact Architecture & Security Model

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
