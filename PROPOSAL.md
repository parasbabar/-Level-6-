# PrivEstate — Project Proposal & Product Specification

**Private ownership. Verifiable real estate.**  
*Midnight Builder Challenge — Level 6 Supermoon Submission (Track: Finance)*

---

## Level 6 Supermoon Evolution & Feedback Integration

Based on 50 genuine Preprod user responses collected during Level 5, Level 6 delivers three core architectural refinements:
1. **Systemic UI / UX Polish**: Modernized dark mode design, HSL color tokens, responsive mobile drawer, and clear transaction state machine indicators.
2. **Property Share Transparency Accounting**: Explicit display of **Total Shares**, **Acquired Shares**, and **Available Shares** (`Available = Total - Acquired`), visual allocation bars, and over-subscription validation.
3. **Admin Property Management**: Dedicated Admin Dashboard allowing property tokenization, listing management, and Compact parameter setup matching Midnight smart contract architecture.

---

## 1. Executive Summary

PrivEstate is a decentralized, privacy-preserving application designed for tokenized Real-World Assets (RWA) with an initial focus on commercial and residential real estate. By integrating Midnight's Zero-Knowledge blockchain and Compact smart contracts, PrivEstate allows investors to hold fractional property tokens in private state and prove selective claims (such as ownership thresholds, regulatory compliance, and yield qualifications) without exposing their confidential financial records.

> **Disclaimer**: PrivEstate is a technical demonstration prototype developed exclusively for the Midnight Builder Challenge Level 4. It does not constitute a live securities offering, real estate investment syndicate, or financial advisory service.

---

## 2. The Problem: The Real Estate Privacy Paradox

Real-world asset tokenization is transforming property finance by allowing multi-million dollar assets to be divided into liquid digital shares. However, existing public blockchain architectures introduce severe drawbacks:

1. **Radical Public Transparency**: In traditional public blockchains (e.g. Ethereum, Solana), every address balance, token transfer, and transaction value is visible to the public. High-net-worth individuals and corporate institutions cannot accept having their exact real estate holdings, investment amounts, and rental income visible to competitors, tenants, and adversaries.
2. **Intrusive Off-Chain Compliance**: Because public ledgers lack privacy, developers frequently rely on off-chain databases and manual KYC/AML processes. Investors are forced to share exhaustive bank records, tax returns, and passport details with numerous intermediaries, creating enormous data breach liabilities.
3. **All-or-Nothing Disclosure**: When an investor needs to prove they qualify for syndicate voting, property access, or regulatory accreditation, they must disclose their exact holdings rather than proving that they simply satisfy the prerequisite condition.

---

## 3. The Solution: Zero-Knowledge Real Estate on Midnight

PrivEstate solves this dilemma by decoupling **verification** from **disclosure**. Using Midnight's Compact smart contract language and zero-knowledge circuits:

* **Shielded Asset Ownership**: Investors hold property tokens privately in off-chain shielded storage.
* **Selective ZK Claims**: Investors generate mathematical proofs of specific conditions without revealing their raw data.
* **Verifiable On-Chain Auditability**: The Midnight ledger records only the verified claim result and an aggregated audit counter, providing complete cryptographic trust to verifiers and regulators.

---

## 4. Target Users

1. **Institutional & Syndicate Investors**: Entities requiring confidentiality regarding portfolio size, asset accumulation strategies, and rental payouts.
2. **High-Net-Worth Individuals (HNWIs)**: Investors seeking fractional exposure to prime commercial and residential properties without publicizing their wealth.
3. **Property Syndicators & Issuers**: Real estate developers seeking to attract capital while guaranteeing institutional-grade confidentiality.
4. **Regulators & Compliance Auditors**: Auditors who require cryptographic certainty that investors meet statutory requirements without storing sensitive personal data.

---

## 5. Why Midnight?

Midnight is uniquely engineered for privacy-preserving verifiable computation:

* **Dual-State Model**: Compact contracts explicitly distinguish between public ledger state and private witness state.
* **Native ZK Proving Engine**: Zero-Knowledge intermediate representation (ZKIR) compiles directly from Compact contracts, executing proofs locally in the user's browser or proof server.
* **Selective Disclosure (`disclose`)**: Developers have granular control over exactly what leaves the privacy shield, preventing accidental leakage.
* **Regulatory Compliance Friendly**: Midnight enables verifiable compliance—allowing participants to prove adherence to laws without creating centralized data honeypots.

---

## 6. Architecture & System Flow

```text
+-------------------------------------------------------------+
|                      INVESTOR CLIENT                        |
|                                                             |
|  [ Private Witness State ]                                  |
|  - investorOwnership (e.g. 17,430 shares)                   |
|  - investmentAmount  (e.g. $500,000)                        |
|  - rentalIncome      (e.g. $45,000/yr)                      |
|  - secretKey         (Cryptographic identity key)           |
|                              |                              |
|                              v                              |
|              [ Compact Circuit Evaluation ]                 |
|              - proveOwnershipThreshold(10%)                 |
|              - proveCompliance($250k)                       |
+-------------------------------------------------------------+
                               |
                               | (Succinct ZK Proof & Commitment)
                               v
+-------------------------------------------------------------+
|                     MIDNIGHT NETWORK                        |
|                                                             |
|  [ Public Ledger State ]                                    |
|  - propertyId: Bytes<32>                                    |
|  - totalShares: 100,000                                     |
|  - complianceMinimum: $250,000                              |
|  - verifiedOwnershipCount: Counter (Incremented)            |
|  - lastVerifiedThreshold: 10%                               |
+-------------------------------------------------------------+
                               |
                               | (Public Verification Status)
                               v
+-------------------------------------------------------------+
|                    AUDITOR / REGULATOR                      |
|                                                             |
|  Learns:   "Claim is VALID and Verified"                    |
|  Does NOT: Learn exact shares, net worth, or bank balances  |
+-------------------------------------------------------------+
```

---

## 7. Core MVP Features

1. **Tokenized RWA Marketplace**: Showcase of fractional real-estate assets with transparent public economic parameters.
2. **Shielded Private Portfolio**: Client-side encrypted asset management showing private shares, capital invested, and rental yield with visual privacy masking.
3. **Zero-Knowledge Ownership Proofs**: Verifiable proof that the investor holds $\ge X\%$ without disclosing whether they hold 10%, 17.43%, or more.
4. **Accreditation & Compliance Proofs**: Zero-Knowledge proof that deployed capital satisfies regulatory thresholds ($\ge \$250,000$).
5. **Auditor Verification Portal**: Independent inspection interface providing mathematical verification while confirming that all sensitive fields remain masked.
6. **Midnight DApp Connector Integration**: Native compatibility with the Midnight Lace Wallet standard (`window.midnight`).

---

## 8. Future Roadmap

* **Phase 1 (Completed — Level 4 MVP)**: Compact contract implementation, full circuit tests, frontend dApp, CI/CD pipeline, and Preprod deployment readiness.
* **Phase 2 (Post-Preprod)**: Integration with Midnight's token minting standards for native shielded RWA tokens.
* **Phase 3**: Confidential multi-party syndicate voting based on private ownership thresholds.
* **Phase 4**: Automated shielded rental dividend distribution using confidential Midnight transactions.
* **Phase 5**: Production audit and mainnet deployment.
