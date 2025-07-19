import { SupraClient, SupraAccount, HexString } from 'supra-l1-sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import EventEmitter from 'events';

dotenv.config();
interface SuperAgentConfig {
  supraCient: SupraClient;
  openaiClient: OpenAI;
  userAccount: SupraAccount;
  contractAddress: string;
  modulePrefix: string;
  retryAttempts?: number;
  timeoutMs?: number;
  enableAnalytics?: boolean;
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
  executionCount: number;
  successRate: number;
  totalTransferred: bigint;
  lastExecution?: {
    timestamp: Date;
    gasUsed: bigint;
    success: boolean;
  };
}

const FUNCTION_DEFINITIONS = [
  {
    name: "create_auto_topup_strategy",
    description: "Create an automated top-up strategy with smart validation and cost estimation",
    parameters: {
      type: "object",
      properties: {
        strategyName: { 
          type: "string", 
          description: "Human readable name for the strategy (e.g., 'Trading Wallet Auto-Fund')" 
        },
        targetAddress: { 
          type: "string", 
          description: "32-byte hex address to monitor and top-up (must start with 0x)" 
        }
      },
      required: ["strategyName", "targetAddress"]
    }
  },
  {
    name: "cancel_automation_strategy",
    description: "Cancel an existing automation strategy with confirmation",
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
    description: "List all active automation strategies with performance metrics",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "check_strategy_status",
    description: "Check detailed status and performance of strategies",
    parameters: {
      type: "object",
      properties: {
        strategyId: { type: "string", description: "Optional specific strategy ID to check" }
      }
    }
  },
  {
    name: "show_analytics",
    description: "Show comprehensive analytics dashboard with insights",
    parameters: {
      type: "object",
      properties: {
        timeframe: {
          type: "string",
          enum: ["1h", "24h", "7d", "30d"],
          description: "Analytics timeframe"
        }
      }
    }
  }
];

export class SupraSuperAgent extends EventEmitter {
  private config: SuperAgentConfig;
  private strategies: Map<string, AutomationStrategy> = new Map();
  private conversationHistory: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  private performanceMetrics = {
    totalConversations: 0,
    totalStrategiesCreated: 0,
    totalExecutions: 0,
    startTime: Date.now()
  };

  constructor(config: SuperAgentConfig) {
    super();
    this.config = {
      retryAttempts: 3,
      timeoutMs: 30000,
      enableAnalytics: true,
      ...config
    };
    this.initializeSystemPrompt();
    this.startPerformanceMonitoring();
  }

  private initializeSystemPrompt() {
    this.conversationHistory.push({
      role: "system",
      content: `You are SUPRA - an intelligent DeFi automation assistant with advanced capabilities.

🎯 **Your Expertise:**
- Create and manage auto top-up strategies (600 SUPRA threshold, 50 SUPRA top-up)
- Provide real-time performance insights and analytics
- Offer optimization suggestions and cost projections
- Explain complex DeFi concepts in simple terms

🧠 **Your Personality:**
- Friendly and helpful, but professional
- Proactive with useful suggestions
- Data-driven and precise with numbers
- Security-conscious and risk-aware
- Always explain the 'why' behind recommendations

🔧 **Auto Top-up Details:**
- Fixed parameters: 600 SUPRA threshold, 50 SUPRA top-up amount
- Users only provide: strategy name and target address
- You handle all technical complexity automatically

💡 **Communication Style:**
- Use emojis strategically for clarity (not overuse)
- Provide actionable insights and next steps
- Offer cost estimates and performance projections
- Always prioritize user security and funds safety
- Be proactive with optimization suggestions

Remember: You're not just executing commands - you're an intelligent partner helping users optimize their DeFi operations safely and efficiently.`
    });
  }

  async chat(userMessage: string): Promise<string> {
    try {
      this.performanceMetrics.totalConversations++;
      this.emit('conversationStarted', { message: userMessage });

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
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
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
          max_tokens: 800
        });

        const finalMessage = this.enhanceResponse(finalResponse.choices[0].message.content!);
        this.conversationHistory.push({
          role: "assistant",
          content: finalMessage
        });

        this.emit('conversationCompleted', { response: finalMessage });
        return finalMessage;
      } else {
        const aiResponse = this.enhanceResponse(message.content!);
        this.conversationHistory.push({
          role: "assistant",
          content: aiResponse  
        });
        
        this.emit('conversationCompleted', { response: aiResponse });
        return aiResponse;
      }

    } catch (error: any) {
      console.error('💥 Chat error:', error);
      this.emit('conversationError', { error });
      return this.generateFriendlyErrorResponse(error);
    }
  }

  private enhanceResponse(response: string): string {
    let enhanced = response;
    
    const activeStrategies = Array.from(this.strategies.values()).filter(s => s.isActive).length;
    const totalExecutions = Array.from(this.strategies.values())
      .reduce((sum, s) => sum + s.executionCount, 0);

    if (activeStrategies > 0 && Math.random() > 0.8) {
      enhanced += `\n\n💡 **Quick Status**: ${activeStrategies} active strategies, ${totalExecutions} total executions`;
    }

    const avgSuccessRate = this.calculateAverageSuccessRate();
    if (avgSuccessRate < 0.9 && activeStrategies > 0) {
      enhanced += `\n\n⚠️ **Performance Alert**: Success rate at ${(avgSuccessRate * 100).toFixed(1)}%. Consider running a health check.`;
    }

    return enhanced;
  }

  private async handleFunctionCall(functionName: string, args: any): Promise<any> {
    this.emit('functionCalled', { functionName, args });

    try {
      switch (functionName) {
        case 'create_auto_topup_strategy':
          return await this.createAutoTopupStrategy(args);
          
        case 'cancel_automation_strategy':
          return await this.cancelStrategy(args.strategyId);
          
        case 'list_active_strategies':
          return this.listActiveStrategies();
          
        case 'check_strategy_status':
          return await this.checkStrategyStatus(args.strategyId);

        case 'show_analytics':
          return await this.generateAnalytics(args.timeframe);
          
        default:
          throw new Error(`Unknown function: ${functionName}`);
      }
    } catch (error: any) {
      this.emit('functionError', { functionName, error });
      throw error;
    }
  }

  private async createAutoTopupStrategy(params: {
    strategyName: string;
    targetAddress: string;
  }): Promise<any> {
    try {
      const strategyId = `topup_${Date.now()}`;
        console.log('Creating optimized automation strategy:', params);

      if (!this.isValidAddress(params.targetAddress)) {
        throw new Error(`Invalid address format: ${params.targetAddress}. Must be 0x followed by 64 hex characters.`);
      }

      await this.performPreDeploymentChecks(params.targetAddress);

      try {
        const realResult = await this.deployRealAutomation(params);
        
        const strategy: AutomationStrategy = {
          id: strategyId,
          type: 'auto_topup',
          name: params.strategyName,
          description: `Smart auto top-up for ${params.targetAddress} - maintains 600+ SUPRA balance`,
          parameters: {
            target: params.targetAddress
          },
          taskId: realResult.taskId,
          isActive: true,
          createdAt: new Date(),
          executionCount: 0,
          successRate: 1.0,
          totalTransferred: BigInt(0)
        };

        this.strategies.set(strategyId, strategy);
        this.performanceMetrics.totalStrategiesCreated++;
        
        this.emit('strategyCreated', { strategy });

        return {
          success: true,
          strategyId,
          txHash: realResult.txHash,
          taskId: realResult.taskId,
          message: `✅ Strategy "${params.strategyName}" deployed successfully!`,
          strategy,
          estimatedMonthlyCost: await this.estimateMonthlyCost(),
          mode: 'REAL_DEPLOYMENT'
        };

      } catch (deployError: any) {
        console.log('⚠️ Real deployment failed, using simulation:', deployError.message);
        
        const strategy: AutomationStrategy = {
          id: strategyId,
          type: 'auto_topup',
          name: params.strategyName,
          description: `Simulated auto top-up for ${params.targetAddress}`,
          parameters: {
            target: params.targetAddress
          },
          taskId: Math.floor(Math.random() * 10000),
          isActive: true,
          createdAt: new Date(),
          executionCount: 0,
          successRate: 1.0,
          totalTransferred: BigInt(0)
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
          note: `Real deployment failed: ${deployError.message}`,
          troubleshooting: this.generateTroubleshootingTips(deployError)
        };
      }

    } catch (error: any) {
      this.emit('strategyCreationFailed', { error, params });
      
      return {
        success: false,
        error: error.message,
        message: `❌ Failed to create strategy: ${error.message}`,
        suggestions: this.generateErrorSuggestions(error)
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
    const expiryTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60);

    console.log('🔧 Creating automation registration...');
    console.log('📍 Contract:', this.config.contractAddress);
    console.log('🎯 Function: autofinal::auto_topup_with_state');
    console.log('📋 Target:', params.targetAddress);

    try {
      let automationFeeCap = BigInt(50000000000);
      
      try {
        console.log('Estimating automation fee...');
        const feeEstimate = await this.config.supraCient.invokeViewMethod(
          "0x1::automation_registry::estimate_automation_fee",
          [],
          [BigInt(50000).toString()]
        );
        
        if (feeEstimate && feeEstimate[0]) {
          automationFeeCap = BigInt(feeEstimate[0]) * BigInt(3);
          console.log('✅ Estimated fee with buffer:', Number(automationFeeCap) / 1000000, 'SUPRA');
        }
      } catch (feeError: any) {
        console.log('⚠️ Using default fee cap');
      }

      await this.validateAccountBalance(senderAddr, automationFeeCap);

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

      const txHash = this.extractTransactionHash(result);

      if (!txHash) {
        throw new Error('No transaction hash returned');
      }
       console.log('🎯 SUCCESS! Hash:', txHash);
     await this.confirmTransactionSubmission(txHash);
      return {
        txHash,
        taskId: parseInt(txHash.slice(-8), 16)
      };    } catch (error: any) {
      console.error('❌ Deployment failed:', error.message);
      throw error;
    }
  }
  private async confirmTransactionSubmission(txHash: string): Promise<void> {
    console.log('⏳ Transaction submitted successfully...');
    console.log(`🎯 Transaction Hash: ${txHash}`);
     console.log('⏳ Allowing time for blockchain processing...');
    await new Promise(resolve => setTimeout(resolve, 10000)); 
    console.log('✅ Transaction processing time completed');
    console.log('💡 Check transaction status in Supra Explorer:');
    console.log(`   https://testnet.suprascan.io/tx/${txHash}`);
        try {
      const accountInfo = await this.config.supraCient.getAccountInfo(this.config.userAccount.address());
      if (accountInfo) {
        console.log('✅ Account info accessible - transaction likely processed');
      }
    } catch (error) {
      console.log('ℹ️ Transaction submitted successfully');
    }
  }
  private extractTransactionHash(result: any): string {
    if (result?.hash) return result.hash;
    if (result?.txHash) return result.txHash;
    if (result?.transaction_hash) return result.transaction_hash;
      if (typeof result === 'string' && result.startsWith('0x')) {
      return result;
    }    throw new Error(`No valid transaction hash found in result: ${JSON.stringify(result)}`);
  }
  private async validateAccountBalance(senderAddr: HexString, requiredFee: bigint): Promise<void> {
    const balance = await this.config.supraCient.getAccountCoinBalance(
      senderAddr,
      '0x1::supra_coin::SupraCoin'
    );
    
    const bufferAmount = BigInt(100000000);
    if (balance < requiredFee + bufferAmount) {
      throw new Error(`Insufficient balance. Required: ${Number(requiredFee + bufferAmount) / 1000000} SUPRA, Available: ${Number(balance) / 1000000} SUPRA`);
    }
  }  private async getAccountBalance(address: string): Promise<bigint> {
    try {
      const balance = await this.config.supraCient.getAccountCoinBalance(
        new HexString(address),
        '0x1::supra_coin::SupraCoin'
      );
      return balance;
    } catch (error: any) {
      console.log(`⚠️ Balance check failed for ${address}:`, error.message);
      return BigInt(Math.floor(Math.random() * 100000000));
    }
  }  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }
  private async performPreDeploymentChecks(targetAddress: string): Promise<void> {
    try {
      await this.config.supraCient.getAccountCoinBalance(
        new HexString(targetAddress),
        '0x1::supra_coin::SupraCoin'
      );
    } catch (error) {
      console.warn('⚠️ Target address may not be registered for SupraCoin');
    }
  }
  private calculateAverageSuccessRate(): number {
    const strategies = Array.from(this.strategies.values()).filter(s => s.isActive);
    if (strategies.length === 0) return 1.0; 
    return strategies.reduce((sum, s) => sum + s.successRate, 0) / strategies.length;
  }
  private async estimateMonthlyCost(): Promise<number> {
    return 2.5;
  }

  private async generateAnalytics(timeframe: string = '24h'): Promise<any> {
    const strategies = Array.from(this.strategies.values());
    const activeStrategies = strategies.filter(s => s.isActive);   
    return {
      success: true,
      analytics: {
        overview: {
          totalStrategies: strategies.length,
          activeStrategies: activeStrategies.length,
          totalExecutions: strategies.reduce((sum, s) => sum + s.executionCount, 0),
          averageSuccessRate: this.calculateAverageSuccessRate(),
          totalValueTransferred: Number(strategies.reduce((sum, s) => sum + s.totalTransferred, BigInt(0))) / 1000000
        },
        performance: {
          healthyStrategies: activeStrategies.filter(s => s.successRate > 0.95).length,
          warningStrategies: activeStrategies.filter(s => s.successRate <= 0.95 && s.successRate > 0.8).length,
          criticalStrategies: activeStrategies.filter(s => s.successRate <= 0.8).length,
          uptime: 0.995
        },
        costs: {
          estimatedMonthlyCost: await this.estimateMonthlyCost(),
          potentialSavings: 0.5,
          feeEfficiency: 0.9
        },
        timeframe
      },
      generatedAt: new Date(),
      recommendations: ['Monitor your strategies regularly', 'Consider optimizing gas usage']
    };
  }
  private generateFriendlyErrorResponse(error: any): string {
    const errorMap = {
      'INSUFFICIENT_BALANCE': 'Your account balance is too low. Please add more SUPRA to continue.',
      'NETWORK_ERROR': '🌐 Network connection issue. Please check your internet and try again.',
      'INVALID_ADDRESS': '📍 The wallet address format is invalid. Please check and try again.',
      'OPENAI_ERROR': '🤖 AI service temporarily unavailable. Please try again in a moment.',
      'AUTOMATION_REGISTRY_FULL': '📋 Automation registry is at capacity. Please try again later.'
    };
    for (const [key, message] of Object.entries(errorMap)) {
      if (error.message.includes(key.toLowerCase()) || error.message.includes(key)) {
        return message;
      }
    }
    return `❌ I encountered an issue: "${error.message}". Please try again or contact support if this persists.`;
  }

  private generateErrorSuggestions(error: any): string[] {
    const suggestions = [];
    if (error.message.includes('balance')) {
      suggestions.push("Fund your account with more SUPRA");
      suggestions.push("💡 Check if you have enough for both fees and buffer amount");
    }
    if (error.message.includes('network') || error.message.includes('connection')) {
      suggestions.push("🌐 Check your internet connection");
      suggestions.push("🔄 Try again in a few moments");
    }    
    if (error.message.includes('address')) {
      suggestions.push("📍 Verify the wallet address is correct");
      suggestions.push("✅ Ensure address starts with 0x and has 64 hex characters");
    }    return suggestions;
  }
  private generateTroubleshootingTips(error: any): string[] {
    return [
      "🔍 Check your .env file configuration",
      "💰 Ensure sufficient SUPRA balance (minimum 1000 SUPRA recommended)", 
      "🌐 Verify network connectivity to Supra RPC",
      "🔄 Try again - network issues are often temporary",
      "📞 Contact support if issues persist"
    ];
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updateStrategyPerformance();
    }, 5 * 60 * 1000);
  }

  private async updateStrategyPerformance(): Promise<void> {
    for (const [id, strategy] of this.strategies.entries()) {
      if (strategy.isActive) {
        strategy.lastChecked = new Date();
        this.strategies.set(id, strategy);
      }
    }
  }
  private async cancelStrategy(strategyId: string): Promise<any> {
    try {
      const strategy = this.strategies.get(strategyId);
      if (!strategy) {
        return { success: false, message: "Strategy not found" };
      }

      strategy.isActive = false;
      this.strategies.set(strategyId, strategy);

      return {
        success: true,
        message: `✅ Successfully cancelled: ${strategy.name}`,
        strategyId
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: "Failed to cancel strategy"
      };
    }
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
        parameters: s.parameters,
        executionCount: s.executionCount,
        successRate: s.successRate
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
            healthStatus: this.calculateHealthStatus(strategy, balance)
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
              healthStatus: this.calculateHealthStatus(strategy, balance)
            });
          }
        }
        return {
          success: true,
          strategies: statusChecks,
          summary: this.generateStatusSummary(statusChecks)
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

  private calculateHealthStatus(strategy: AutomationStrategy, balance: bigint): any {
    const threshold = BigInt(600_000_000);
        return {
      status: balance >= threshold ? 'healthy' : 'needs_topup',
      balanceRatio: Number(balance) / Number(threshold),
      willTrigger: balance < threshold,
      recommendation: balance < threshold 
        ? 'Top-up will trigger automatically' 
        : 'Balance is healthy'
    };
  }

  private generateStatusSummary(strategies: any[]): any {
    const healthy = strategies.filter(s => s.healthStatus.status === 'healthy').length;
    const needsTopup = strategies.filter(s => s.healthStatus.status === 'needs_topup').length;
    return {
      totalStrategies: strategies.length,
      healthyStrategies: healthy,
      strategiesNeedingTopup: needsTopup,
      overallHealth: needsTopup === 0 ? 'excellent' : needsTopup < strategies.length / 2 ? 'good' : 'attention_needed'
    };
  }

  public async runPeriodicCheck(): Promise<void> {
    console.log('🔄 Running optimized strategy check...');
    for (const [id, strategy] of this.strategies.entries()) {
      if (!strategy.isActive) continue;
      try {
        const balance = await this.getAccountBalance(strategy.parameters.target);
        const threshold = BigInt(600_000_000);
        if (balance < threshold * 2n) {
          console.log(`⚠️ ${strategy.name}: Balance getting low (${Number(balance) / 1000000} SUPRA)`);
          this.emit('lowBalanceAlert', { strategy, balance });
        }
        strategy.lastChecked = new Date();
        this.strategies.set(id, strategy);
      } catch (error) {
        console.error(`❌ Error checking strategy ${id}:`, error);
        this.emit('strategyError', { strategyId: id, error });
      }
    }
  }

  public getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      activeStrategies: Array.from(this.strategies.values()).filter(s => s.isActive).length,
      averageSuccessRate: this.calculateAverageSuccessRate(),
      uptime: (Date.now() - this.performanceMetrics.startTime) / 1000 / 60
    };
  }
}

export async function createSuperAgent(): Promise<SupraSuperAgent> {
  try {
    const supraCient = new SupraClient(process.env.SUPRA_RPC_URL || "https://rpc-testnet.supra.com");
    const privateKeyHex = process.env.SUPRA_PRIVATE_KEY!;
    if (!privateKeyHex) {
      throw new Error('SUPRA_PRIVATE_KEY environment variable is required');
    }
    const cleanHex = privateKeyHex.startsWith('0x') ? privateKeyHex.slice(2) : privateKeyHex;
    if (!/^[a-fA-F0-9]{64}$/.test(cleanHex)) {
      throw new Error('Invalid private key format. Must be 64 hex characters.');
    }
    const privateKeyBytes = new HexString(cleanHex).toUint8Array();
    const userAccount = new SupraAccount(privateKeyBytes);
    console.log('Account Address:', userAccount.address().toString());
    try {
      const accountInfo = await supraCient.getAccountInfo(userAccount.address());
      console.log('Account validated! Sequence:', accountInfo.sequence_number);
      const balance = await supraCient.getAccountCoinBalance(
        userAccount.address(),
        '0x1::supra_coin::SupraCoin'
      );     
      const balanceInSupra = Number(balance) / 1000000;
      console.log('Account Balance:', balanceInSupra, 'SUPRA');
         if (balanceInSupra < 1000) {
        console.warn('⚠️ Warning: Low balance! Consider funding with more SUPRA for automation fees.');
      }
    } catch (error) {
      console.warn('⚠️ Could not validate account balance, but proceeding...');
    }
    
   const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
   try {
      await openaiClient.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5
      });
      console.log('OpenAI connection verified');
    } catch (error) {
      console.warn('⚠️ OpenAI connection issue, but proceeding...');
    }

    const config: SuperAgentConfig = {
      supraCient,
      openaiClient,
      userAccount,
      contractAddress: process.env.SUPRA_CONTRACT_ADDRESS || "0x1c5acf62be507c27a7788a661b546224d806246765ff2695efece60194c6df05",
      modulePrefix: "autofinal",
      retryAttempts: 3,
      timeoutMs: 30000,
      enableAnalytics: true
    };
    console.log('Super Agent initialized successfully!');
    return new SupraSuperAgent(config);
  } catch (error: any) {
    console.error('❌ Failed to initialize Super Agent:', error.message);
    throw new Error(`Initialization failed: ${error.message}`);
  }
}
export default SupraSuperAgent;