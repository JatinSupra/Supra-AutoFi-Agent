# Supra AutoFi Agent
Transform natural language into Automated DeFi strategies on the Supra to deploy and manage auto top-up strategies without writing code.

## ✨ Features

- Chat normally about auto top-up needs
- AI converts intentions into executable automation Strategy.  
- Continuous Strategy performance tracking
- Uses Supra's native automation network
- 600 SUPRA threshold, 50 SUPRA top-up amount
- Always have gas fees
- No manual wallet monitoring
- Uninterrupted yield farming/trading
- Set once, works continuously

#### Installation

```bash
git clone https://github.com/JatinSupra/Supra-AutoFi-Agent.git
cd Supra-AutoFi-Agent
npm install
```

#### Configuration
Edit `.env` file:

```env
OPENAI_API_KEY=sk-your-openai-key
SUPRA_PRIVATE_KEY=0x...your-private-key
SUPRA_CONTRACT_ADDRESS=0x1c5acf62be507c27a7788a661b546224d806246765ff2695efece60194c6df05
SUPRA_RPC_URL=https://rpc-testnet.supra.com
```

#### Run the Agent

```bash
npm run dev
```

## Available Commands
- "Set up auto top-up for wallet 0x123..."
- "Create auto top-up strategy for my trading account"
- "Show all my strategies"
- "Cancel auto top-up for 0x456..."
- "How are my strategies performing?"

#### Quick Commands
- `help` - Show available commands
- `status` - Check all strategies
- `strategies` - List active strategies  
- `clear` - Clear screen
- `exit` - Quit agent

## Technical Workflow

```
👤 USER CHAT
↓
🧠 AI AGENT 
↓
📦 SUPRA SDK 
↓
⛓️ BLOCKCHAIN → 🤖 AUTOMATION
```

### Contract Integration
Uses Supra's `autofinal` contract:
- Module: `autofinal`
- Function: `auto_topup_with_state` 
- Parameters: Fixed 600 SUPRA threshold, 50 SUPRA top-up (YOU CAN CUSTOMIZE THIS AND REDEPLOY MODULE AND REPLACE ADDRESS IN `.env`)

### Automation Registration

```typescript
const txPayload = client.createSerializedAutomationRegistrationTxPayloadRawTxObject(
  senderAddr,
  sequenceNumber,
  moduleAddr,
  "autofinal",
  "auto_topup_with_state",
  [], // No type args
  [targetAddress], // Only target address needed
  BigInt(5000), // Gas amount
  BigInt(200),  // Gas price cap
  automationFeeCap,
  BigInt(expiryTime),
  []
);
```

## Example Scenarios

### Basic Auto Top-up Setup

```bash
USER > I want auto top-up for my trading wallet 0x123...

🤖 Super Agent: I'll set up auto top-up for your trading wallet!

✅ Strategy Created: "Trading Wallet Auto Top-up"
📊 Target: 0x123...
⚖️ Threshold: 600 SUPRA (automatic)
💰 Top-up: 50 SUPRA (automatic)
🔗 Transaction: 0xabc...def
🤖 Status: Active & Monitoring
```

### Strategy Management

```bash
USER > Show my strategies

🤖 Super Agent: Here are your active strategies:

**Active Strategies (1)**

1. **Trading Wallet Auto Top-up**
   • Target: 0x123...
   • Threshold: 600 SUPRA
   • Top-up: 50 SUPRA  
   • Status: ✅ Active
   • Last Check: 2 min ago

```

### Multiple Wallets
```
USER > Set up auto top-up for my DeFi wallet 0x456... and trading wallet 0x789...

🤖 Super Agent: I'll create auto top-up strategies for both wallets!

✅ Created 2 strategies:
1. DeFi Wallet Auto Top-up (0x456...)
2. Trading Wallet Auto Top-up (0x789...)

Both will maintain 600+ SUPRA automatically.

```

### Trading Account Management
```
"I trade frequently and need my wallet to always have SUPRA for gas fees"
→ Creates auto top-up to maintain 600+ SUPRA balance
```

### DeFi Operations
```
"My yield farming wallet runs out of SUPRA for transactions"
→ Sets up automated funding for uninterrupted farming
```

### Multi-Wallet Setup
```
"I have 3 wallets that all need SUPRA maintenance"
→ Creates individual auto top-up strategies for each
```

