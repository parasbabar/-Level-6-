/**
 * PrivEstate - Midnight Preprod Real Contract Deployment Script
 * 
 * Uses the official Midnight JS SDK (@midnight-ntwrk/midnight-js-contracts,
 * @midnight-ntwrk/compact-js, @midnight-ntwrk/testkit-js) to execute a genuine
 * on-chain deployment to Midnight Preprod, balance transaction fees with tDUST,
 * wait for network finalization, and verify contract existence via the Preprod indexer.
 * 
 * Usage:
 *   node scripts/deploy-preprod.mjs
 */

import fs from 'fs';
import path from 'path';
import pino from 'pino';
import WebSocket from 'ws';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import {
  FluentWalletBuilder,
  MidnightWalletProvider,
  initializeMidnightProviders,
} from '@midnight-ntwrk/testkit-js';
import { NetworkId } from '@midnight-ntwrk/wallet-sdk';
import { ZswapSecretKeys, DustSecretKey } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { Contract } from '../managed/contract/index.js';

// Initialize global Network ID for Midnight JS
setNetworkId('preprod');

console.log('[PrivEstate] Midnight Preprod Deployment Script — Level 6 Supermoon Edition');

globalThis.WebSocket = globalThis.WebSocket || WebSocket;

// Zero-dependency native environment loading
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
} else if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      if (k && !process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  });
}

console.log('====================================================');
console.log('  PrivEstate — Midnight Preprod Contract Deployment  ');
console.log('====================================================\n');

const rawSeed = (process.env.WALLET_SEED || process.env.SEED_PHRASE || '').trim();
const proofServerUri = process.env.PROOF_SERVER_URI || 'http://localhost:6300';
const indexerUri = process.env.INDEXER_URI || process.env.VITE_INDEXER_URI || 'https://indexer.preprod.midnight.network/api/v4/graphql';
const indexerWsUri = process.env.INDEXER_WS_URI || process.env.VITE_INDEXER_WS_URI || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';
const nodeUri = process.env.NODE_URI || 'https://rpc.preprod.midnight.network';
const nodeWsUri = process.env.NODE_WS_URI || 'wss://rpc.preprod.midnight.network';

if (!rawSeed) {
  console.error('❌ ERROR: WALLET_SEED is missing from the local .env.');
  console.log('\nTo deploy to Midnight Preprod:');
  console.log('1. Ensure you have a funded wallet on Midnight Preprod.');
  console.log('   Faucet: https://faucet.preprod.midnight.network');
  console.log('2. Export your wallet seed into .env:');
  console.log('   WALLET_SEED="your 24 words mnemonic seed phrase here..."');
  console.log('3. Ensure Proof Server is running locally via Docker:');
  console.log('   docker run -d -p 6300:6300 midnightntwrk/proof-server:latest');
  console.log('4. Run this deployment script:');
  console.log('   node scripts/deploy-preprod.mjs\n');
  process.exit(1);
}

console.log('Configuration:');
console.log(`- Network: Preprod`);
console.log(`- Indexer: ${indexerUri}`);
console.log(`- RPC Node: ${nodeUri}`);
console.log(`- Proof Server: ${proofServerUri}`);
console.log(`- Wallet Seed: Configured [HIDDEN]`);

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

// Environment Configuration for Midnight Preprod
const envConfig = {
  walletNetworkId: NetworkId.NetworkId.PreProd,
  networkId: 'preprod',
  indexer: indexerUri,
  indexerWS: indexerWsUri,
  node: nodeUri,
  nodeWS: nodeWsUri,
  proofServer: proofServerUri,
  faucet: 'https://faucet.preprod.midnight.network/api/drips',
};

async function main() {
  let midnightWalletProvider = null;

  try {
    console.log('\n[1/5] Initializing headless wallet from configured seed...');
    const isMnemonic = rawSeed.includes(' ');
    const builder = FluentWalletBuilder.forEnvironment(envConfig);
    const { wallet, seeds, keystore } = isMnemonic
      ? await builder.withMnemonic(rawSeed).buildWithoutStarting()
      : await builder.withSeed(rawSeed).buildWithoutStarting();

    midnightWalletProvider = await MidnightWalletProvider.withWallet(
      logger,
      envConfig,
      wallet,
      ZswapSecretKeys.fromSeed(seeds.shielded),
      DustSecretKey.fromSeed(seeds.dust),
      keystore
    );

    const unshieldedAddress = keystore.getBech32Address().asString();
    console.log(`Wallet Preprod Unshielded Address: ${unshieldedAddress}`);

    console.log('[2/5] Starting wallet, requesting faucet/dust registration if needed, and syncing with Preprod...');
    await midnightWalletProvider.start(true);

    console.log('[3/5] Initializing Midnight Contract Providers (Proof Server, Indexer, State)...');
    const managedPath = path.resolve('managed');
    const contractConfig = {
      privateStateStoreName: 'privestate-deployment-state',
      zkConfigPath: managedPath,
    };
    const providers = initializeMidnightProviders(midnightWalletProvider, envConfig, contractConfig);

    console.log('[4/5] Preparing PrivEstate Compact contract binding...');
    const witnesses = {
      getInvestorOwnership: ({ privateState }) => [privateState, privateState.investorOwnership],
      getInvestmentAmount: ({ privateState }) => [privateState, privateState.investmentAmount],
      getRentalIncome: ({ privateState }) => [privateState, privateState.rentalIncome],
    };

    const compiledContract = CompiledContract.make('privestate', Contract).pipe(
      CompiledContract.withWitnesses(witnesses),
      CompiledContract.withCompiledFileAssets(managedPath)
    );

    // Initial parameters for Property #001 (PROP-001)
    const propertyId = new Uint8Array(32).fill(1); // PROP-001
    const totalShares = 100_000n; // 100,000 shares
    const complianceMinimum = 250_000n; // $250,000

    console.log('Contract Deployment Parameters:');
    console.log(`- Property ID: PROP-001`);
    console.log(`- Total Fractional Shares: ${totalShares.toLocaleString()}`);
    console.log(`- Compliance Minimum: $${complianceMinimum.toLocaleString()}`);

    console.log('\n[5/5] Submitting deployment transaction to Midnight Preprod ledger...');
    console.log('Generating ZK constructor proof via proof server and balancing fees...');

    const deployedContract = await deployContract(providers, {
      compiledContract,
      privateStateId: 'PROP-001',
      initialPrivateState: {
        investorOwnership: 0n,
        investmentAmount: 0n,
        rentalIncome: 0n,
        investorSecretKey: new Uint8Array(32),
      },
      args: [propertyId, totalShares, complianceMinimum],
    });

    const contractAddress = deployedContract.deployTxData.public.contractAddress;
    const txId = deployedContract.deployTxData.public.txId || deployedContract.deployTxData.public.txHash;
    const blockHeight = deployedContract.deployTxData.public.blockHeight;

    console.log('\n====================================================');
    console.log('  🎉 SUCCESS: Contract Deployed to Midnight Preprod!  ');
    console.log('====================================================\n');
    console.log(`REAL Contract Address: ${contractAddress}`);
    console.log(`REAL Deployment Transaction ID: ${txId}`);
    if (blockHeight != null) {
      console.log(`Confirmed on Preprod at Block Height: ${blockHeight}`);
    }

    console.log('\nVerifying contract existence against Midnight Preprod Indexer...');
    try {
      const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
      if (contractState != null) {
        console.log('✅ Network Verification Passed: Contract found on Midnight Preprod ledger.');
      } else {
        console.log('⚠️ Notice: Contract submitted; indexer may need a few moments to index state.');
      }
    } catch (queryErr) {
      console.warn('Note on indexer query:', queryErr.message || queryErr);
    }

    console.log('\nNext Steps:');
    console.log(`1. Add to .env: VITE_CONTRACT_ADDRESS="${contractAddress}"`);
    console.log(`2. Update README.md with the contract address.`);

  } catch (err) {
    console.error('\n❌ Deployment Failed:');
    console.error(err.message || err);
    if (err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  } finally {
    if (midnightWalletProvider) {
      try {
        await midnightWalletProvider.stop();
      } catch {}
    }
  }
}

main();
