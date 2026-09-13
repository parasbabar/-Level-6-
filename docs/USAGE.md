# How to Use PrivEstate

PrivEstate makes tokenized real-world real estate ownership private and cryptographically verifiable using Midnight and Zero-Knowledge Proofs. This guide explains how to use the platform from the perspective of both an investor and an auditor.

---

## What You Need

1. **Modern Web Browser**: Google Chrome, Brave, or Chromium-based browser.
2. **Midnight Lace Wallet Extension**: Downloaded and configured for the Midnight Preprod network.
3. **Internet Connection**: To communicate with Midnight indexers and verification nodes.

---

## Step-by-Step Guide

### 1. Connecting Your Wallet
1. Open the PrivEstate application.
2. Locate the **Connect Midnight Wallet** banner at the top of the interface.
3. Click **Connect Midnight Wallet**.
4. The Midnight Lace extension will prompt you to authorize the connection.
5. Once approved, your connection status will switch to **Wallet Connected**, displaying your network (`preprod`) and shielded public address identifier.

> **Note**: If the wallet extension is not installed, PrivEstate automatically provides a link to the official Midnight Lace installation documentation. You can still test all real Compact Zero-Knowledge circuits in in-browser verification mode.

---

### 2. Exploring RWA Marketplace & Share Transparency
1. Navigate to the **RWA Marketplace** tab.
2. Review the tokenized real-estate offerings (e.g., *Sunrise Luxury Residences*, *Apex Commercial Plaza*).
3. Each property card features **Share Transparency Metrics**:
   - **Total Shares**: Authorized fractional token supply (e.g., 100,000 shares).
   - **Acquired Shares**: Shares already acquired by investors.
   - **Available Shares**: Remaining fractional shares available for purchase.
   - **Visual Share Allocation Bar**: Color-coded progress indicator showing acquired vs available ratio.
4. When acquiring shares:
   - Input share counts are dynamically validated against **Available Shares**.
   - Attempting to acquire more shares than available triggers over-subscription validation and disables purchase confirmation.

---

### 3. Admin Property Management (Admin Dashboard)
1. Navigate to the **Admin Dashboard** tab.
2. View platform-wide metrics: Total RWA Assets, Total Listed Valuation, Total Share Supply, and Available Allocations.
3. Click **Add New RWA Property** to tokenization a new asset:
   - Provide Property Name, Location, Asset Category.
   - Set Total Valuation ($ USD), Total Share Supply, Compliance Minimum ($ USD), APY %, and Image URL.
4. Click **Publish RWA Asset**. The new property is registered into marketplace state with initial 100% share availability and is immediately ready for investor share acquisition and ZK proofs.
5. **Architecture Note**: Properties created via Admin Console map deterministically to Midnight Compact contract parameters (`propertyId`, `totalShares`, `complianceMinimum`), ensuring zero private key exposure in frontend bundles.

---

### 4. Viewing Your Shielded Portfolio
1. Click the **Shielded Portfolio** tab.
2. This screen shows your private ownership holdings:
   - Your private shares and ownership percentage (e.g., 17,430 shares = 17.43%).
   - Total capital invested (e.g., $500,000).
   - Confidential annual rental income (e.g., $45,000/year).
3. Click **Mask Private Values / Reveal Shielded Values** to see how sensitive financial details are hidden from casual observers.
4. You can click the edit icon to adjust testnet holding amounts to test different verification scenarios.

---

### 4. Generating an Ownership Threshold ZK Proof
1. Navigate to the **Ownership Proof** tab or click **Generate Ownership ZK Proof** from any property card.
2. Select the target property.
3. Select the public threshold claim you wish to prove (e.g., *"I own at least 10%"*).
4. Click **Generate & Verify ZK Proof**.
5. PrivEstate executes the compiled Midnight Compact circuit:
   - Private witness fetches your actual share count ($17,430$).
   - Circuit establishes: $17,430 \ge 10,000$ shares ($10\%$).
   - A cryptographic proof and identity commitment are generated.
   - The public ledger audit counter is incremented.
6. The verification result confirms: **✓ Claim verified**. Your actual share count ($17.43\%$) is never disclosed to anyone.

---

### 5. Proving Regulatory Compliance & Accreditation
1. Navigate to the **Compliance Proof** tab.
2. Select your property offering and choose an accreditation benchmark (e.g., Standard Accredited: $\$100,000$, Qualified Investor: $\$250,000$, Institutional Tier: $\$500,000$).
3. Click **Generate Compliance Proof**.
4. The circuit checks that your private investment capital satisfies the requirement.
5. The result displays: **✓ Eligible & Cryptographically Validated**.
6. The underlying investment capital is labeled as **NOT DISCLOSED (🔒 PRIVATE)**.

---

### 6. Auditor & Regulator Verification
1. Navigate to the **Auditor Verifier** tab.
2. This interface displays the complete on-chain audit log of verified proofs.
3. Auditors can inspect:
   - **The Claim**: *"Investor owns at least 10% of Sunrise Residences"*.
   - **The Status**: `VALID`.
   - **Zero-Knowledge Circuit**: `proveOwnershipThreshold.zkir`.
   - **Identity Commitment**: Cryptographic hash proving authenticity.
4. The auditor's view confirms that underlying sensitive fields (exact percentage, bank deposits, rental disbursements) remain **NOT DISCLOSED**.

---

## What Gets Proved (and What Stays Private)

| Feature | What the Verifier Learns | What Stays Strictly Confidential |
| :--- | :--- | :--- |
| **Ownership Proof** | The investor owns $\ge X\%$ of the property. | The investor's exact share count and exact percentage. |
| **Accreditation Proof** | The investor deployed capital $\ge$ required minimum. | The investor's total net worth, bank balances, or exact capital. |
| **Rental Yield Claim** | The property's rental distribution meets yield target. | Exact payout amounts, bank account numbers, or dividend schedules. |
| **Identity Verification**| Valid cryptographic proof originates from authorized investor. | Investor's real-world identity, passport, or private secret keys. |

---

## Troubleshooting

### "Midnight Wallet Extension Not Detected"
- Ensure that you have installed the Midnight Lace Wallet extension in a Chromium-based browser (Chrome or Brave).
- Verify that the extension is unlocked and configured for the **Preprod** network.
- Reload the page.

### "Circuit Assertion Failed: Ownership threshold requirement not satisfied"
- This means your private holding owns fewer shares than the threshold you attempted to prove (e.g. attempting to prove 20% when you own 17.43%).
- In the **Shielded Portfolio** tab, verify your current shares or select a lower threshold claim.

### "Investment does not meet minimum compliance threshold"
- The selected regulatory minimum exceeds your private investment capital. Adjust the testnet investment amount in your portfolio or choose a lower benchmark tier.
