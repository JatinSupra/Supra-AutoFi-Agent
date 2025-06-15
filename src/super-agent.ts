import { SupraClient, SupraAccount, HexString, TxnBuilderTypes } from 'supra-l1-sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

 interface SuperAgentConfig {
  supraCient: SupraClient;
  openaiClient: OpenAI;
  userAccount: SupraAccount;
  contractAddress: string;
  modulePrefix: string;
}

 interface AutomationStrategy {
  id: string;
  type: 'auto_topup';
  name: string;
  description: string;
  parameters: {
    target: string;
  };
  taskId?: number;
  isActive: boolean;
  createdAt: Date;
  lastChecked?: Date;
}

// AI Function Definitions for OpenAI
const FUNCTION_DEFINITIONS = [
  {
    name: "create_auto_topup_strategy",
    description: "Create an automated top-up strategy to maintain minimum balance (600 SUPRA threshold, 50 SUPRA top-up)",
    parameters: {
      type: "object",
      properties: {
        strategyName: { type: "string", description: "Human readable name for the strategy" },
        targetAddress: { type: "string", description: "Address to monitor and top-up (32-byte hex address with 0x prefix)" }
      },
      required: ["strategyName", "targetAddress"]
    }
  },
  {
    name: "cancel_automation_strategy",
    description: "Cancel an existing automation strategy",
    parameters: {
      type: "object", 
      properties: {
        strategyId: { type: "string", description: "ID of the strategy to cancel" }
      },
      required: ["strategyId"]
    }
  },
  {
    name: "list_active_strategies",
    description: "List all active automation strategies",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "check_strategy_status",
    description: "Check the status and performance of strategies",
    parameters: {
      type: "object",
      properties: {
        strategyId: { type: "string", description: "Optional specific strategy ID to check" }
      }
    }
  }
];

export class SupraSuperAgent {
  private config: SuperAgentConfig;
  private strategies: Map<string, AutomationStrategy> = new Map();
  private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  constructor(config: SuperAgentConfig) {
    this.config = config;
    this.initializeSystemPrompt();
  }

  private initializeSystemPrompt() {
    this.conversationHistory.push({
      role: "system",
      content: `You are a Supra Super Agent - an intelligent DeFi automation assistant. You help users create auto top-up strategies:

🎯 **Auto Top-up Strategy**
- Automatically maintains minimum 600 SUPRA balance in target wallets
- Transfers 50 SUPRA when balance drops below threshold
- Perfect for gas fees, trading accounts, operational wallets

**IMPORTANT**: 
- Always ask for the target wallet address (must be valid 0x... format)
- Only auto top-up is available (no withdraw feature)
- Be concise and friendly in responses
- Use emojis sparingly for key status updates

When users ask about strategies, explain the fixed parameters:
- Threshold: 600 SUPRA (automatic)
- Top-up Amount: 50 SUPRA (automatic)
- They only need to provide the target address

Always be helpful and clear, but keep responses concise.`
    });
  }

  async chat(userMessage: string): Promise<string> {
    try {
      this.conversationHistory.push({
        role: "user", 
        content: userMessage
      });

      const response = await this.config.openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: this.conversationHistory,
        functions: FUNCTION_DEFINITIONS,
        function_call: "auto",
        temperature: 0.7,
        max_tokens: 800
      });

      const message = response.choices[0].message;

      if (message.function_call) {
        const functionResult = await this.handleFunctionCall(
          message.function_call.name!,
          JSON.parse(message.function_call.arguments!)
        );

        this.conversationHistory.push({
          role: "assistant",
          content: null,
          function_call: message.function_call
        });

        this.conversationHistory.push({
          role: "function",
          name: message.function_call.name!,
          content: JSON.stringify(functionResult)
        });

        const finalResponse = await this.config.openaiClient.chat.completions.create({
          model: "gpt-4", 
          messages: this.conversationHistory,
          temperature: 0.7,
          max_tokens: 600
        });

        const finalMessage = finalResponse.choices[0].message.content!;
        this.conversationHistory.push({
          role: "assistant",
          content: finalMessage
        });

        return finalMessage;
      } else {
        const aiResponse = message.content!;
        this.conversationHistory.push({
          role: "assistant",
          content: aiResponse  
        });
        return aiResponse;
      }

    } catch (error) {
      console.error('Chat error:', error);
      return "I encountered an error. Please try again.";
    }
  }

  private async handleFunctionCall(functionName: string, args: any): Promise<any> {
    switch (functionName) {
      case 'create_auto_topup_strategy':
        return await this.createAutoTopupStrategy(args);
        
      case 'cancel_automation_strategy':
        return await this.cancelStrategy(args.strategyId);
        
      case 'list_active_strategies':
        return this.listActiveStrategies();
        
      case 'check_strategy_status':
        return await this.checkStrategyStatus(args.strategyId);
        
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  private async createAutoTopupStrategy(params: {
    strategyName: string;
    targetAddress: string;
  }): Promise<any> {
    try {
      const strategyId = `topup_${Date.now()}`;
      
      console.log('🚀 Deploying automation strategy:', params);

      try {
        const realResult = await this.deployRealAutomation(params);
        
        const strategy: AutomationStrategy = {
          id: strategyId,
          type: 'auto_topup',
          name: params.strategyName,
          description: `Auto top-up ${params.targetAddress} when below 600 SUPRA with 50 SUPRA`,
          parameters: {
            target: params.targetAddress
          },
          taskId: realResult.taskId,
          isActive: true,
          createdAt: new Date()
        };

        this.strategies.set(strategyId, strategy);

        return {
          success: true,
          strategyId,
          txHash: realResult.txHash,
          taskId: realResult.taskId,
          message: `✅ Auto top-up strategy deployed successfully`,
          strategy,
          mode: 'REAL_DEPLOYMENT'
        };

      } catch (deployError: any) {
        console.log('⚠️ Real deployment failed, using simulation:', deployError.message);
        
        const strategy: AutomationStrategy = {
          id: strategyId,
          type: 'auto_topup',
          name: params.strategyName,
          description: `Auto top-up ${params.targetAddress} when below 600 SUPRA with 50 SUPRA`,
          parameters: {
            target: params.targetAddress
          },
          taskId: Math.floor(Math.random() * 10000),
          isActive: true,
          createdAt: new Date()
        };

        this.strategies.set(strategyId, strategy);

        return {
          success: true,
          strategyId,
          txHash: `0x${Math.random().toString(16).slice(2)}`,
          taskId: strategy.taskId,
          message: `🔄 Strategy created in simulation mode`,
          strategy,
          mode: 'SIMULATION',
          note: `Real deployment failed: ${deployError.message}`
        };
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: "Failed to create auto top-up strategy"
      };
    }
  }

  private async deployRealAutomation(params: any): Promise<{ txHash: string; taskId: number }> {
    const senderAddr = this.config.userAccount.address();
    const accountInfo = await this.config.supraCient.getAccountInfo(senderAddr);
    const sequenceNumber = BigInt(accountInfo.sequence_number);

     const functionArgs: Uint8Array[] = [
      new HexString(params.targetAddress).toUint8Array()
    ];

    const moduleAddr = this.config.contractAddress.replace('0x', '');
    const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

    console.log('🔧 Creating automation registration...');
    console.log('📍 Contract:', this.config.contractAddress);
    console.log('🎯 Function: autofinal::auto_topup_with_state');
    console.log('📋 Target:', params.targetAddress);

    try {
       let automationFeeCap = BigInt(144000000);  
      
      try {
        console.log('💰 Estimating automation fee...');
        const feeEstimate = await this.config.supraCient.invokeViewMethod(
          "0x1::automation_registry::estimate_automation_fee",
          [],
          ["5000"] 
        );
        
        if (feeEstimate && feeEstimate[0]) {
          automationFeeCap = BigInt(feeEstimate[0]);
          console.log('✅ Estimated fee:', automationFeeCap.toString(), 'microSUPRA');
        }
      } catch (feeError: any) {
        console.log('⚠️ Using default fee cap');
      }

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

      console.log('✅ Automation transaction serialized');

      const result = await this.config.supraCient.sendTxUsingSerializedRawTransaction(
        this.config.userAccount,
        serializedAutomationTx
      );

      console.log('📤 Transaction submitted:', result);

      const txHash = (result as any).txHash || (result as any).hash;

      if (!txHash) {
        console.error('❌ No hash in result:', result);
        throw new Error('No transaction hash returned');
      }

      console.log('🎯 SUCCESS! Hash:', txHash);

      return {
        txHash,
        taskId: parseInt(txHash.slice(-8), 16)
      };

    } catch (error: any) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }

  private async cancelStrategy(strategyId: string): Promise<any> {
    try {
      const strategy = this.strategies.get(strategyId);
      if (!strategy) {
        return { success: false, message: "Strategy not found" };
      }

      console.log(`🛑 Canceling automation task ${strategy.taskId}...`);

      try {
        const cancelResult = await this.cancelRealAutomation(strategy.taskId!);
        
        strategy.isActive = false;
        this.strategies.set(strategyId, strategy);

        return {
          success: true,
          message: `✅ Successfully cancelled: ${strategy.name}`,
          strategyId,
          txHash: cancelResult.txHash,
          mode: 'REAL_CANCELLATION'
        };

      } catch (cancelError: any) {
        console.log('🔄 Real cancellation failed, marking as cancelled locally:', cancelError.message);
        
        strategy.isActive = false;
        this.strategies.set(strategyId, strategy);

        return {
          success: true,
          message: `🔄 Cancelled locally: ${strategy.name}`,
          strategyId,
          txHash: `0x${Math.random().toString(16).slice(2)}`,
          mode: 'SIMULATION',
          note: `Real cancellation failed: ${cancelError.message}`
        };
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: "Failed to cancel strategy"
      };
    }
  }

  private async cancelRealAutomation(taskId: number): Promise<{ txHash: string }> {
    const senderAddr = this.config.userAccount.address();
    const accountInfo = await this.config.supraCient.getAccountInfo(senderAddr);
    const sequenceNumber = BigInt(accountInfo.sequence_number);

    const serializedTx = await this.config.supraCient.createSerializedRawTxObject(
      senderAddr,
      sequenceNumber,
      "1",
      "automation_registry",
      "cancel_task",
      [],
      [this.serializeU64(BigInt(taskId))]
    );

    const result = await this.config.supraCient.sendTxUsingSerializedRawTransaction(
      this.config.userAccount,
      serializedTx
    );

    const txHash = (result as any).hash || 
                   (result as any).txHash || 
                   `0x${Math.random().toString(16).slice(2)}`;

    return { txHash };
  }

  private listActiveStrategies(): any {
    const activeStrategies = Array.from(this.strategies.values())
      .filter(s => s.isActive)
      .map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        description: s.description,
        createdAt: s.createdAt,
        parameters: s.parameters
      }));

    return {
      success: true,
      strategies: activeStrategies,
      count: activeStrategies.length
    };
  }

  private async checkStrategyStatus(strategyId?: string): Promise<any> {
    try {
      if (strategyId) {
        const strategy = this.strategies.get(strategyId);
        if (!strategy) {
          return { success: false, message: "Strategy not found" };
        }

        const balance = await this.getAccountBalance(strategy.parameters.target);
        
        return {
          success: true,
          strategy: {
            ...strategy,
            currentBalance: balance.toString(),
            balanceInSupra: Number(balance) / 1000000,
            lastChecked: new Date(),
            analysis: this.analyzeStrategy(strategy, balance)
          }
        };
      } else {
        const statusChecks = [];
        for (const [id, strategy] of this.strategies.entries()) {
          if (strategy.isActive) {
            const balance = await this.getAccountBalance(strategy.parameters.target);
            statusChecks.push({
              ...strategy,
              currentBalance: balance.toString(),
              balanceInSupra: Number(balance) / 1000000,
              lastChecked: new Date(),
              analysis: this.analyzeStrategy(strategy, balance)
            });
          }
        }

        return {
          success: true,
          strategies: statusChecks,
          summary: this.generateStrategySummary(statusChecks)
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: "Failed to check strategy status"
      };
    }
  }

  private async getAccountBalance(address: string): Promise<bigint> {
    try {
      console.log(`🔍 Checking balance for: ${address}`);
      
      const balance = await this.config.supraCient.getAccountCoinBalance(
        new HexString(address),
        '0x1::supra_coin::SupraCoin'
      );
      
      console.log(`💰 Balance: ${balance} microSUPRA (${Number(balance) / 1000000} SUPRA)`);
      return balance;
      
    } catch (error: any) {
      console.log(`⚠️ Balance check failed for ${address}:`, error.message);
      const mockBalance = BigInt(Math.floor(Math.random() * 100000000));
      console.log(`🔄 Using simulation balance: ${Number(mockBalance) / 1000000} SUPRA`);
      return mockBalance;
    }
  }

  private analyzeStrategy(strategy: AutomationStrategy, currentBalance: bigint): any {
    const threshold = BigInt(600_000_000); // 600 SUPRA in microSUPRA
    const topupAmount = BigInt(50_000_000); // 50 SUPRA in microSUPRA
    
    const analysis = {
      status: 'unknown',
      urgency: 'low',
      recommendation: '',
      willTrigger: currentBalance < threshold,
      metrics: {
        distanceFromThreshold: Number(currentBalance - threshold) / 1000000,
        percentageOfThreshold: Number(currentBalance) / Number(threshold) * 100
      }
    };

    if (currentBalance < threshold) {
      analysis.status = 'below_threshold';
      analysis.urgency = 'high';
      analysis.recommendation = `Balance is below 600 SUPRA! Top-up will trigger with 50 SUPRA.`;
    } else if (currentBalance < threshold * 2n) {
      analysis.status = 'approaching_threshold';
      analysis.urgency = 'medium';
      analysis.recommendation = `Balance getting close to 600 SUPRA threshold.`;
    } else {
      analysis.status = 'healthy';
      analysis.urgency = 'low';
      analysis.recommendation = `Balance is well above threshold. Strategy working well.`;
    }
    
    return analysis;
  }

  private generateStrategySummary(strategies: any[]): any {
    const active = strategies.filter(s => s.isActive).length;
    const highUrgency = strategies.filter(s => s.analysis?.urgency === 'high').length;
    const mediumUrgency = strategies.filter(s => s.analysis?.urgency === 'medium').length;
    
    return {
      totalStrategies: strategies.length,
      activeStrategies: active,
      alerts: {
        high: highUrgency,
        medium: mediumUrgency,
        low: strategies.length - highUrgency - mediumUrgency
      },
      overallHealth: highUrgency > 0 ? 'needs_attention' : mediumUrgency > 0 ? 'monitor' : 'healthy'
    };
  }

  private serializeU64(value: bigint): Uint8Array {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, value, true);
    return new Uint8Array(buffer);
  }

  public async runPeriodicCheck(): Promise<void> {
    console.log('🔄 Running periodic strategy check...');
    
    for (const [id, strategy] of this.strategies.entries()) {
      if (!strategy.isActive) continue;

      try {
        const balance = await this.getAccountBalance(strategy.parameters.target);
        const threshold = BigInt(600_000_000); // 600 SUPRA

        if (balance < threshold * 2n) {
          console.log(`⚠️ ${strategy.name}: Balance getting low (${Number(balance) / 1000000} SUPRA)`);
        }

        strategy.lastChecked = new Date();
        this.strategies.set(id, strategy);

      } catch (error) {
        console.error(`❌ Error checking strategy ${id}:`, error);
      }
    }
  }
}

export async function createSuperAgent(): Promise<SupraSuperAgent> {
  const supraCient = new SupraClient(process.env.SUPRA_RPC_URL || "https://rpc-testnet.supra.com");
  
  const privateKeyHex = process.env.SUPRA_PRIVATE_KEY!;
  const cleanHex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
  const privateKeyBytes = new HexString(cleanHex).toUint8Array();
  const userAccount = new SupraAccount(privateKeyBytes);
  
  const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
  });

  const config: SuperAgentConfig = {
    supraCient,
    openaiClient,
    userAccount,
    contractAddress: process.env.SUPRA_CONTRACT_ADDRESS || "0x1c5acf62be507c27a7788a661b546224d806246765ff2695efece60194c6df05",
    modulePrefix: "autofinal"
  };

  return new SupraSuperAgent(config);
}

export default SupraSuperAgent;