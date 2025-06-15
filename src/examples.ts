import { SupraSuperAgent } from './super-agent';

export async function runExampleConversation(agent: SupraSuperAgent) {
  console.log("🎬 Auto Top-up Example Conversations\n");

  console.log("=== EXAMPLE 1: Basic Auto Top-up ===");
  const response1 = await agent.chat(
    "I want to set up auto top-up for my trading wallet 0x742d35Cc6632C032532f4170d764dFc33F775e66. I keep running out of SUPRA for gas fees."
  );
  console.log("🤖 Agent Response:", response1);
  console.log("\n");

  console.log("=== EXAMPLE 2: DeFi Vault Auto Top-up ===");
  const response2 = await agent.chat(
    "Can you help me automatically maintain SUPRA balance in my DeFi vault wallet 0x8ba1f109551bD432803012645Hac136c42138798? I use it for liquidity mining."
  );
  console.log("🤖 Agent Response:", response2);
  console.log("\n");

  console.log("=== EXAMPLE 3: Strategy Status ===");
  const response3 = await agent.chat("How are my auto top-up strategies performing?");
  console.log("🤖 Agent Response:", response3);
  console.log("\n");

  console.log("=== EXAMPLE 4: Multiple Wallets ===");
  const response4 = await agent.chat(
    "I need auto top-up for both my main trading wallet 0x123abc and my DeFi operations wallet 0x456def"
  );
  console.log("🤖 Agent Response:", response4);
  console.log("\n");

  console.log("=== EXAMPLE 5: Cancel Strategy ===");
  const response5 = await agent.chat("I want to cancel the auto top-up for my trading wallet");
  console.log("🤖 Agent Response:", response5);
  console.log("\n");

  console.log("=== EXAMPLE 6: How Auto Top-up Works ===");
  const response6 = await agent.chat("How does the auto top-up work? What are the parameters?");
  console.log("🤖 Agent Response:", response6);
  console.log("\n");

  console.log("=== EXAMPLE 7: List Strategies ===");
  const response7 = await agent.chat("Show me all my active auto top-up strategies");
  console.log("🤖 Agent Response:", response7);
  console.log("\n");
}
export async function runAdvancedConversations(agent: SupraSuperAgent) {
  console.log("🎭 Advanced Auto Top-up Conversations\n");

  console.log("=== EDGE CASE 1: Invalid Address ===");
  const edge1 = await agent.chat("Set up auto top-up for wallet InvalidAddress123");
  console.log("🤖 Agent Response:", edge1);
  console.log("\n");

  console.log("=== EDGE CASE 2: Threshold Questions ===");
  const edge2 = await agent.chat("What happens when my wallet balance goes below 600 SUPRA?");
  console.log("🤖 Agent Response:", edge2);
  console.log("\n");

  console.log("=== EDUCATION 1: How Automation Works ===");
  const edu1 = await agent.chat("How does Supra's automation work? Is it decentralized?");
  console.log("🤖 Agent Response:", edu1);
  console.log("\n");

  console.log("=== EDUCATION 2: Security Discussion ===");
  const edu2 = await agent.chat("Is auto top-up safe? What are the risks?");
  console.log("🤖 Agent Response:", edu2);
  console.log("\n");

  console.log("=== OPTIMIZATION: Strategy Efficiency ===");
  const optimization = await agent.chat("My auto top-up is triggering too often. What can I do?");
  console.log("🤖 Agent Response:", optimization);
  console.log("\n");
}

export async function runMonitoringConversation(agent: SupraSuperAgent) {
  console.log("📊 Monitoring & Performance Conversations\n");

  console.log("=== PERFORMANCE CHECK ===");
  const perf1 = await agent.chat("Give me a detailed report on my auto top-up strategies");
  console.log("🤖 Agent Response:", perf1);
  console.log("\n");

  console.log("=== ANALYTICS REQUEST ===");
  const analytics = await agent.chat("How much gas have my auto top-ups saved me?");
  console.log("🤖 Agent Response:", analytics);
  console.log("\n");

  console.log("=== PREDICTIVE INSIGHTS ===");
  const insights = await agent.chat("Based on my usage patterns, should I adjust my auto top-up settings?");
  console.log("🤖 Agent Response:", insights);
  console.log("\n");
}

export const CONVERSATION_SAMPLES = {
  beginner: [
    "I'm new to DeFi. Can you help me set up auto top-up for gas fees?",
    "What is auto top-up and why would I need it?",
    "Help me keep my wallet funded for transactions automatically"
  ],

  trader: [
    "I need auto top-up for my trading wallets to avoid failed transactions",
    "Set up automatic SUPRA funding for my arbitrage bot wallet",
    "My trading strategy needs constant wallet funding - can you automate this?"
  ],

  defi: [
    "I manage liquidity across multiple protocols and need auto top-up for gas",
    "Set up auto funding for my yield farming wallets",
    "I need automated SUPRA management for my DeFi operations"
  ],

  conservative: [
    "I want simple auto top-up that's safe and predictable",
    "What's the most secure way to automate my wallet funding?",
    "I need basic auto top-up without complex features"
  ]
};

export async function simulateUserSession(agent: SupraSuperAgent, userType: keyof typeof CONVERSATION_SAMPLES) {
  const samples = CONVERSATION_SAMPLES[userType];
  
  console.log(`🎪 Simulating ${userType.toUpperCase()} user session\n`);
  
  for (let i = 0; i < samples.length; i++) {
    console.log(`--- Conversation ${i + 1} ---`);
    console.log(`👤 User: ${samples[i]}`);
    
    const response = await agent.chat(samples[i]);
    console.log(`🤖 Agent: ${response}`);
    console.log("\n");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export async function multiWalletExample(agent: SupraSuperAgent) {
  console.log("🏗️ Multi-Wallet Auto Top-up Example\n");

  const step1 = await agent.chat(`
    I'm a DeFi power user with multiple wallets:
    - Trading wallet: 0x742d35Cc...
    - DeFi farming wallet: 0x8ba1f109... 
    - Bot operations wallet: 0x9cd2e456...
    
    I want auto top-up for all of them to avoid transaction failures.
  `);
  console.log("🤖 Step 1 Response:", step1);

  const step2 = await agent.chat(`
    Let's start with the trading wallet: 0x742d35Cc6632C032532f4170d764dFc33F775e66
    This needs to stay funded for high-frequency trading.
  `);
  console.log("🤖 Step 2 Response:", step2);
  const step3 = await agent.chat(`
    Now set up auto top-up for my DeFi farming wallet: 0x8ba1f109551bD432803012645Hac136c42138798
    This is for yield farming operations.
  `);
  console.log("🤖 Step 3 Response:", step3);

  const step4 = await agent.chat("How will I monitor all these auto top-up strategies?");
  console.log("🤖 Step 4 Response:", step4);

  console.log("✅ Multi-wallet example completed\n");
}
export {
  runExampleConversation,
  runAdvancedConversations,
  runMonitoringConversation,
  simulateUserSession,
  multiWalletExample
};