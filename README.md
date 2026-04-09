# 🤖 AI Trading Agent #31 — ERC-8004 x Kraken Hackathon

> **Rank #3** | Agent ID: 31 | Validation: 97/100 | Reputation: 97/100  
> Built solo in 1.5 days | 500+ on-chain trade intents | Sharpe Ratio: 14.88+

[![Live Dashboard](https://img.shields.io/badge/Dashboard-Live-green)](http://localhost:3000)
[![Etherscan](https://img.shields.io/badge/Etherscan-Sepolia-blue)](https://sepolia.etherscan.io/address/0xBB78252F4a1F03C1b82eeFe21Eee2D56B5278650)
[![GitHub](https://img.shields.io/badge/GitHub-ai--trading--agent-black)](https://github.com/cluna80/ai-trading-agent-template)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Smart Contracts](#smart-contracts)
- [Trading Strategy](#trading-strategy)
- [Risk Management](#risk-management)
- [Live Dashboard](#live-dashboard)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Hackathon Achievements](#hackathon-achievements)
- [How It Was Built](#how-it-was-built)

---

## 🎯 Overview

A fully autonomous AI trading agent built for the **Kraken x ERC-8004 Hackathon** competing for $55,000 in prizes. The agent:

- Registers identity on the **ERC-8004 Identity Registry** (Agent NFT #31)
- Executes real trades through a **whitelisted Risk Router** on Ethereum Sepolia
- Signs every trade intent with **EIP-712 typed data signatures**
- Tracks reputation and validation scores through **on-chain attestations**
- Streams live trading data to a **real-time WebSocket dashboard**

This is a **combined submission** eligible for both the ERC-8004 Challenge and the Kraken Challenge.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Trading Dashboard                      │
│         (Node.js + WebSocket + HTML/CSS/JS)              │
└─────────────────────┬───────────────────────────────────┘
                      │ WebSocket (real-time)
┌─────────────────────▼───────────────────────────────────┐
│                  server.js (Express)                      │
│     Spawns agent, parses logs, broadcasts to browser     │
└─────────────────────┬───────────────────────────────────┘
                      │ child_process spawn
┌─────────────────────▼───────────────────────────────────┐
│           continuous_trader_upgraded.js                   │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Signal Engine│  │Risk Management│  │ Position Track│  │
│  │ RSI-7 + Mom  │  │ SL/TP/CB     │  │ agent_state   │  │
│  │ + MACD       │  │              │  │ .json persist │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         └────────────────▼───────────────────┘          │
│                    Trade Execution                         │
│              EIP-712 Sign → Risk Router                   │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│              Ethereum Sepolia (ERC-8004)                  │
│                                                           │
│  AgentRegistry    RiskRouter      ValidationRegistry     │
│  0x97b07dDc...    0xd6A695...     0x92bF63E5...          │
│                                                           │
│  ReputationRegistry    Agent NFT #31                      │
│  0x423a9904...         Token ID: 31                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Core Languages
- **JavaScript (Node.js)** — Primary trading agent and server
- **Solidity** — Smart contract interactions (via ethers.js)
- **Python** — File manipulation, config scripts
- **HTML/CSS** — Live trading dashboard UI

### Key Libraries & Frameworks
| Library | Version | Purpose |
|---------|---------|---------|
| `ethers.js` | v6.16.0 | EVM interaction, EIP-712 signing |
| `ws` | ^8.0.0 | WebSocket server for live dashboard |
| `dotenv` | ^16.0.0 | Environment variable management |
| `node-fetch` | built-in | Kraken + PRISM API calls |
| `chart.js` | CDN | Price chart in dashboard |

### APIs & Data Sources
| Service | Usage |
|---------|-------|
| **Kraken Public API** | BTC/USD price feed (fallback) |
| **PRISM API (Strykr)** | Primary price feed + AI confidence signals |
| **Alchemy (Sepolia)** | Ethereum RPC endpoint |

### AI Tools Used To Build This
- **Claude (Anthropic)** — Primary coding assistant, architecture design, debugging
- **DeepSeek** — Additional code generation and strategy logic

### Blockchain Infrastructure
| Contract | Address | Purpose |
|----------|---------|---------|
| AgentRegistry | `0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3` | ERC-721 NFT identity |
| RiskRouter | `0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC` | Trade execution gateway |
| ValidationRegistry | `0x92bF63E5C7Ac6980f237a7164Ab413BE226187F1` | Validation attestations |
| ReputationRegistry | `0x423a9904e39537a9997fbaF0f220d79D7d545763` | Reputation scoring |

---

## 🔗 Smart Contracts & On-Chain Identity

### Agent NFT (ERC-721)
- **Contract:** `0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3`
- **Token ID:** 31
- **Owner:** `0xBB78252F4a1F03C1b82eeFe21Eee2D56B5278650`
- **View:** [Etherscan NFT](https://sepolia.etherscan.io/nft/0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3/31)

### Wallets
- **Operator Wallet:** `0xBB78252F4a1F03C1b82eeFe21Eee2D56B5278650`
- **Agent Wallet:** `0xda1c6f84dB9d564902613F89a770132192A49d08`

### Trade Intent Signing (EIP-712)
Every trade is signed using EIP-712 typed data:
```javascript
const domain = {
  name: "RiskRouter",
  version: "1", 
  chainId: 11155111,  // Sepolia
  verifyingContract: RISK_ROUTER
};

const types = {
  TradeIntent: [
    { name: "agentId",         type: "uint256" },
    { name: "agentWallet",     type: "address" },
    { name: "pair",            type: "string"  },
    { name: "action",          type: "string"  },
    { name: "amountUsdScaled", type: "uint256" },
    { name: "maxSlippageBps",  type: "uint256" },
    { name: "nonce",           type: "uint256" },
    { name: "deadline",        type: "uint256" }
  ]
};
```

---

## 📊 Trading Strategy

### Signal Engine: RSI Mean Reversion + Momentum

The agent uses a **multi-indicator scoring system** requiring a minimum score of 3 before entering any position:

```
Signal Score Calculation:
├── RSI < 30 (oversold)     → +3 bull points
├── RSI < 40                → +1 bull point  
├── RSI > 70 (overbought)   → +3 bear points
├── RSI > 60                → +1 bear point
├── 5m momentum > +0.15%   → +2 bull points
├── 5m momentum > +0.05%   → +1 bull point
├── 5m momentum < -0.15%   → +2 bear points
├── 10m trend confirms      → +1 point
└── MACD histogram          → +1 point

Entry: Score ≥ 3 required
Signal flip: Only on High/Very High confidence
```

### Indicators
- **RSI-7** — Fast response (7-period for scalping)
- **5-minute Momentum** — Price change over 5 candles
- **10-minute Momentum** — Trend confirmation
- **MACD** — EMA12 vs EMA26 histogram
- **PRISM AI Confidence** — External multi-exchange signal

### Position Management
- Always enters immediately when FLAT (momentum-based if no strong signal)
- Signal flip exits only on High/Very High confidence to prevent whipsawing
- Stop loss and take profit managed automatically every 30 seconds

---

## 🛡️ Risk Management

| Parameter | Value | Reason |
|-----------|-------|--------|
| Position Size | $10 per trade | High frequency, minimal risk |
| Stop Loss | 0.5% | Tight protection |
| Take Profit | 0.3% | Fast cycling for more trades |
| Circuit Breaker | 5% daily max loss | Capital protection |
| Max Slippage | 1% (100 bps) | Execution quality |
| Trade Interval | 30 seconds | Maximize on-chain activity |

### Circuit Breaker
```javascript
if (dailyLossPct >= MAX_DAILY_LOSS_PCT) {
  circuitBreaker = true;
  // Halts all trading, resets at midnight
}
```

### Sharpe Ratio Tracking
Real-time Sharpe calculated from trade returns:
```javascript
function calculateSharpe() {
  const mean = tradeReturns.reduce((a, b) => a + b) / tradeReturns.length;
  const stdDev = Math.sqrt(variance);
  return (mean / stdDev) * Math.sqrt(1440); // Annualized
}
```

---

## 📺 Live Dashboard

The dashboard (`server.js` + `dashboard.html`) provides:

- **Real-time BTC price** from PRISM (Kraken fallback)
- **Live RSI, Momentum, Sharpe** indicators
- **Current position** with unrealized P&L
- **Trade history table** with clickable TX hash links to Etherscan
- **Flash animations** on profit (green) and loss (red)
- **Strategy panel** explaining all risk parameters
- **WebSocket streaming** — zero polling, pure push updates

### Running The Dashboard
```bash
cd trading-dashboard/
npm install ws
node server.js
# Open http://localhost:3000
```

---

## 🚀 Installation

### Prerequisites
- Node.js v18+
- npm
- WSL2 (if on Windows)

### Setup
```bash
# Clone the repo
git clone https://github.com/cluna80/ai-trading-agent-template
cd ai-trading-agent-template

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys:
# RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
# PRIVATE_KEY=your_operator_private_key
```

### Running The Agent
```bash
# Run agent only (no dashboard)
node continuous_trader_upgraded.js

# Run agent + live dashboard
cd ../trading-dashboard
node server.js
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
ai-trading-agent-template/
├── continuous_trader_upgraded.js  # Main trading agent (v4)
├── agent_state.json               # Persistent position state
├── trade_history.json             # Full trade record with TX hashes
├── .env                           # RPC URL + private keys
├── package.json
└── README.md

trading-dashboard/
├── server.js                      # Express + WebSocket server
├── dashboard.html                 # Live trading UI
└── package.json
```

---

## 🏆 Hackathon Achievements

### ERC-8004 Challenge ✅
- [x] Agent Registered (ID #31) on ERC-8004 Identity Registry
- [x] Capital Claimed (0.0010 ETH) from Hackathon Vault
- [x] 500+ Trade Intents submitted to Risk Router
- [x] Validation Score: 97/100 (judge bot attested)
- [x] Reputation Score: 97/100
- [x] EIP-712 typed data signatures on every trade
- [x] Full on-chain audit trail (Sepolia Etherscan)

### Kraken Challenge ✅
- [x] Kraken CLI configured
- [x] Real-time market data integration
- [x] PRISM AI signal integration
- [x] Build in public (Twitter + GitHub)

### Prize Eligibility
| Prize | Category | Amount |
|-------|----------|--------|
| 🥇 Best Trustless Trading Agent | ERC-8004 | $10,000 |
| 🥈 Best Risk-Adjusted Return | ERC-8004 | $5,000 |
| 🥉 Best Validation & Trust Model | ERC-8004 | $2,500 |
| 🏆 Best Compliance & Risk Guardrails | ERC-8004 | $2,500 |
| 🏆 Kraken PnL Challenge | Kraken | $1,800 |
| 🏆 Social Engagement | Both | $1,200 |

**Combined submission eligible for BOTH challenges.**

---

## 🔨 How It Was Built

This project was built entirely in **1.5 days** as a solo developer using:

### Development Process
1. **Day 1 Morning** — Registered agent on ERC-8004, minted NFT #31, set up Risk Router integration
2. **Day 1 Afternoon** — Built first trading agent (`continuous_trader.js`), debugged EIP-712 signing
3. **Day 1 Evening** — Fixed validation registry errors, built signal engine (RSI + Momentum)
4. **Day 2 Morning** — Added PRISM API integration, built live WebSocket dashboard
5. **Day 2 Afternoon** — Optimized strategy (aggressive mode, confidence filter, trade history)

### Key Technical Challenges Solved
- **`ValidationRegistry: not an authorized validator`** — Removed self-attestation, relies on judge bot
- **EIP-712 signature format** — Correct typed data domain for Sepolia Risk Router
- **Position state persistence** — `agent_state.json` survives agent restarts
- **WebSocket browser/WSL2 networking** — Fixed `window.location.port` bug
- **RSI whipsawing** — Added confidence filter for signal flip exits
- **PRISM API rate limiting** — Set as primary with Kraken fallback

### AI-Assisted Development
This project was built with the assistance of:
- **Claude (Anthropic Claude Sonnet)** — Architecture, debugging, strategy design, dashboard UI
- **DeepSeek** — Additional code generation support

All code was written, reviewed, and deployed by the solo developer.

---

## 📈 Live Performance (at time of submission)

```
Rank:              #3 of 30+ agents
Trade Intents:     500+
Completed Trades:  13+
Win Rate:          67%+
Sharpe Ratio:      14.88+
Total P&L:         +$0.08+
Validation:        97/100
Reputation:        97/100
Chain:             Ethereum Sepolia
```

---

## 🔗 Links

- [Live Leaderboard](https://lablab.ai/event/ai-trading-agents-hackathon/leaderboard)
- [Operator Wallet on Etherscan](https://sepolia.etherscan.io/address/0xBB78252F4a1F03C1b82eeFe21Eee2D56B5278650)
- [Agent NFT #31](https://sepolia.etherscan.io/nft/0x97b07dDc405B0c28B17559aFFE63BdB3632d0ca3/31)
- [Risk Router Contract](https://sepolia.etherscan.io/address/0xd6A6952545FF6E6E6681c2d15C59f9EB8F40FdBC)
- [Twitter/X @QuarkCharmBit](https://x.com/QuarkCharmBit)

---

## ⚠️ Disclaimer

This project runs on **Ethereum Sepolia testnet** with test funds only. Not financial advice. Do not use with real funds without proper backtesting, auditing, and risk assessment.

---

*Built with ❤️ using Claude + DeepSeek | Kraken x ERC-8004 Hackathon 2026*
