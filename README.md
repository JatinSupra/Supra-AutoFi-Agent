# Supra AutoFi Agent
AI Agent to Make Automated DeFi strategies on the Supra to deploy and manage auto top-up strategies without writing code.

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
Create & Edit `.env` file:

> You can get your OpenAI API Key [HERE](https://platform.openai.com/api-keys)

```env
OPENAI_API_KEY=sk-your-openai-key
SUPRA_PRIVATE_KEY=0x...your-private-key
SUPRA_CONTRACT_ADDRESS=0x...f05
SUPRA_RPC_URL=https://rpc-testnet.supra.com
```

#### Run the Agent

> Make sure you redeploy the Move contract by your Supra CLI to replace your Address & Pvt key in `.env`

```bash
npm start
```

## Available Commands
- "Set up auto top-up for wallet 0x123..."
- "Create auto top-up strategy for my trading account"
- "Show all my strategies"
- "Cancel auto top-up for 0x456..."
- "How are my strategies performing?"

#### Quick Commands
- `create`: Create new auto top-up strategy
- `analytics`: View performance dashboard
- `health`: Check strategy health
- `status`: Show all strategies
- `help`: Show detailed help
- `exit`: Quit agent

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
      const serializedAutomationTx = this.config.supraCient.createSerializedAutomationRegistrationTxPayloadRawTxObject(
        senderAddr,
        sequenceNumber,
        moduleAddr,
        "autofinal",  
        "auto_topup_with_state",  
        [], 
        functionArgs,
        BigInt(5000),
        BigInt(200),     
        automationFeeCap,  
        BigInt(expiryTime),
        []
      );

      console.log('✅ Transaction serialized successfully');
      const result = await this.config.supraCient.sendTxUsingSerializedRawTransaction(
        this.config.userAccount,
        serializedAutomationTx
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