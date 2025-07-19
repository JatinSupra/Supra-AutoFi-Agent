import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { SupraSuperAgent, createSuperAgent } from './super-agent';
dotenv.config();
interface CLIState {
  agent: SupraSuperAgent | null;
  isInitialized: boolean;
  commandCount: number;
  startTime: Date;
  lastCommand: string;
  notifications: string[];
}

class SuperAgentCLI {
  private agent: SupraSuperAgent | null = null;
  private rl: readline.Interface;
  private state: CLIState = {
    agent: null,
    isInitialized: false,
    commandCount: 0,
    startTime: new Date(),
    lastCommand: '',
    notifications: []
  };

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.getPrompt()
    });
    this.setupSignalHandlers();
  }  async initialize() {
    console.clear();
    this.showWelcomeMessage();
     try {
      console.log(chalk.bgGreen.bold('Initializing Supra Super Agent...'));  
      this.agent = await createSuperAgent();
      this.state.agent = this.agent;
      this.state.isInitialized = true;
      this.setupAgentEventListeners();      
      console.log(chalk.green('✅ Agent ready! Start chatting about auto top-up strategies\n'));
      this.showQuickHelp();    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error instanceof Error ? error.message : error);
      console.log(chalk.yellow('\n🔧 Troubleshooting tips:'));
      console.log(chalk.gray('  • Check your .env file exists and has all required variables'));
      console.log(chalk.gray('  • Verify your SUPRA_PRIVATE_KEY is valid (64 hex characters)'));
      console.log(chalk.gray('  • Ensure you have sufficient SUPRA balance (min 1000 SUPRA)'));
      console.log(chalk.gray('  • Check your internet connection'));
      
      process.exit(1);
    }
  }
  private showWelcomeMessage() {
    console.log(chalk.magenta.bold(`
╔═════════════════════════════════════════════╗
║           SUPRA AutoFi AGENT                ║
╚═════════════════════════════════════════════╝
    `));
    console.log(chalk.magenta.bold('- Create intelligent auto top-up strategies'));
    console.log(chalk.magenta.bold('- Monitor performance with real-time analytics'));
    console.log(chalk.magenta.bold('- Secure automation on Supra MoveVM\n'));
  }
  private showQuickHelp() {
    console.log(chalk.bgGreen.bold('Quick Start Commands:'));
    console.log(chalk.cyan.underline('create') + chalk.white(' - Create new auto top-up strategy'));
    console.log(chalk.cyan.underline('analytics') + chalk.white(' - View performance dashboard'));
    console.log(chalk.cyan.underline('health') + chalk.white(' - Check strategy health'));
    console.log(chalk.cyan.underline('status') + chalk.white(' - Show all strategies'));
    console.log(chalk.cyan.underline('help') + chalk.white(' - Show detailed help'));
    console.log(chalk.cyan.underline('exit') + chalk.white(' - Quit agent\n'));
    console.log(chalk.bgGreen.bold('Natural Language Examples:'));
    console.log(chalk.white('"Create auto top-up for my wallet 0x123..."'));
    console.log(chalk.white('"Show me my strategy performance"'));
    console.log(chalk.white('"How much have I saved this month?"\n'));
  }
  private setupAgentEventListeners() {
    if (!this.agent) return;
    this.agent.on('strategyCreated', (data) => {
      this.addNotification(`✅ Strategy "${data.strategy.name}" created successfully!`);
    });
    this.agent.on('strategyError', (data) => {
      this.addNotification(`❌ Strategy creation failed: ${data.error.message}`);
    });
    this.agent.on('lowBalanceAlert', (data) => {
      this.addNotification(`⚠️ Low balance alert for strategy: ${data.strategy.name}`);
    });
    this.agent.on('conversationError', (data) => {
      console.log(chalk.red('- AI Error: '), data.error.message);
    });
  }
  private getPrompt(): string {
    const statusIcon = this.state.isInitialized ? '🤖' : '⏳';
    const commandNum = this.state.commandCount > 0 ? `[${this.state.commandCount}] ` : '';
    return chalk.cyan(`${statusIcon} ${commandNum}YOU > `);
  }
  private addNotification(message: string) {
    this.state.notifications.push(message);
    console.log(chalk.blue('\n📢 ') + message);
    if (this.state.notifications.length > 5) {
      this.state.notifications = this.state.notifications.slice(-5);
    }
  }
  async start() {
    await this.initialize();
    this.startPeriodicMonitoring();
    this.rl.prompt(); 
    this.rl.on('line', async (input) => {
      const message = input.trim();
      if (!message) {
        this.rl.prompt();
        return;
      }      this.state.commandCount++;
      this.state.lastCommand = message;
      await this.handleUserInput(message);
      this.updatePrompt();
      this.rl.prompt();
    });
    this.rl.on('close', () => {
      this.shutdown();
    });  }
  private async handleUserInput(input: string) {
    const command = input.toLowerCase().split(' ')[0];

    switch (command) {
      case 'exit':
      case 'quit':
      case 'q':
        this.rl.close();
        break;
      case 'help':
      case 'h':
        this.showDetailedHelp();
        break;
      case 'status':
      case 'list':
        await this.showStatus();
        break;
      case 'strategies':
        await this.showStrategies();
        break;
      case 'analytics':
      case 'stats':
        await this.showAnalytics();
        break;
      case 'health':
      case 'check':
        await this.runHealthCheck();
        break;
      case 'clear':
      case 'cls':
        console.clear();
        this.showQuickHelp();
        break;
      case 'create':
        await this.handleQuickCreate();
        break;
      case 'notifications':
      case 'alerts':
        this.showNotifications();
        break;
      case 'performance':
      case 'metrics':
        this.showPerformanceMetrics();
        break;
      default:
        await this.chatWithAgent(input);
        break;
    }
  }
  private async handleQuickCreate() {
    console.log(chalk.cyan('\n🎯 Quick Strategy Creation'));
    console.log(chalk.gray('Tip: You can also say "Create auto top-up for my wallet 0x..." naturally\n')); 
    await this.chatWithAgent('I want to create a new auto top-up strategy. Can you help me?');
  }
  private async chatWithAgent(message: string) {
    if (!this.agent) {
      console.log(chalk.red('❌ Agent not ready. Please wait for initialization.'));
      return;
    }
    const thinkingMessages = [
      '🤖 AI is analyzing your request...',
      '🧠 Processing automation strategy...',
      'Checking blockchain status...',
      'Optimizing parameters...'
    ];    
    const loadingMessage = thinkingMessages[Math.floor(Math.random() * thinkingMessages.length)];
    console.log(chalk.yellow(loadingMessage));
    try {
      const response = await this.agent.chat(message);
      console.log(chalk.green('\n🤖 SUPRA AI:'));
      console.log(this.formatResponse(response));
      console.log('');
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
      console.log(chalk.gray('💡 Try rephrasing your request or use a quick command like "help"'));
    }
  }
  private formatResponse(response: string): string {
    return response
      .replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'))
      .replace(/\*(.*?)\*/g, chalk.italic('$1'))
      .replace(/`(.*?)`/g, chalk.cyan('$1'))
      .replace(/^(✅)/gm, chalk.yellow('$1'))
      .replace(/(\d+\.?\d*)\s*SUPRA/gi, chalk.green('$1 SUPRA'))
      .replace(/(0x[a-fA-F0-9]{8,})/g, chalk.cyan('$1'));
  }
  private async showAnalytics() {
    if (!this.agent) return;
    console.log(chalk.blue('📊 Generating analytics dashboard...'));
    try {
      const response = await this.agent.chat("Show me comprehensive analytics dashboard with performance insights");
      console.log(this.formatResponse(response));
    } catch (error) {
      console.error(chalk.red('❌ Analytics failed:'), error instanceof Error ? error.message : String(error));
    }
  }
  private async runHealthCheck() {
    if (!this.agent) return;
    console.log(chalk.blue('🏥 Running comprehensive health check...')); 
    try {
      const metrics = this.agent.getPerformanceMetrics();      
      console.log(chalk.green('\n✅ System Health Report:'));
      console.log(`Active Strategies: ${metrics.activeStrategies}`);
      console.log(`Success Rate: ${(metrics.averageSuccessRate * 100).toFixed(1)}%`);
      console.log(`⏱️ Uptime: ${metrics.uptime.toFixed(1)} minutes`);
      console.log(`💬 Conversations: ${metrics.totalConversations}`);
      const response = await this.agent.chat("Perform a detailed health check on all my strategies");
      console.log(this.formatResponse(response));
    } catch (error) {
      console.error(chalk.red('❌ Health check failed:'), error instanceof Error ? error.message : String(error));
    }
  }

  private async showStatus() {
    if (!this.agent) return;
    console.log(chalk.blue('📋 Checking strategy status...'));
    try {
      await this.agent.runPeriodicCheck();
      const response = await this.agent.chat("Show me the current status of all my strategies");
      console.log(this.formatResponse(response));
    } catch (error) {
      console.error(chalk.red('❌ Status check failed:'), error instanceof Error ? error.message : String(error));
    }  }

  private async showStrategies() {
    if (!this.agent) return;
    console.log(chalk.blue('📋 Loading your strategies...'));
    try {
      const response = await this.agent.chat("List all my active strategies with their performance metrics");
      console.log(this.formatResponse(response));
    } catch (error) {
      console.error(chalk.red('❌ Failed to load strategies:'), error instanceof Error ? error.message : String(error));
    }
  }

  private showNotifications() {
    console.log(chalk.yellow('\n📢 Recent Notifications:'));  
    if (this.state.notifications.length === 0) {
      console.log(chalk.gray('   No recent notifications'));
    } else {
      this.state.notifications.forEach((notification, index) => {
        console.log(`   ${index + 1}. ${notification}`);
      });
    }
    console.log('');
  }

  private showPerformanceMetrics() {
    if (!this.agent) {
      console.log(chalk.red('❌ Agent not initialized'));
      return;
    }
    const metrics = this.agent.getPerformanceMetrics();
    const sessionTime = Math.floor((Date.now() - this.state.startTime.getTime()) / 1000);
    console.log(chalk.cyan('\n⚡ Performance Metrics:'));
    console.log(`Commands Executed: ${this.state.commandCount}`);
    console.log(`AI Conversations: ${metrics.totalConversations}`);
    console.log(`Strategies Created: ${metrics.totalStrategiesCreated}`);
    console.log(`Active Strategies: ${metrics.activeStrategies}`);
    console.log(`Success Rate: ${(metrics.averageSuccessRate * 100).toFixed(1)}%`);
    console.log(`Session Time: ${sessionTime}s`);
    console.log(`Agent Uptime: ${metrics.uptime.toFixed(1)} minutes`);
    console.log('');
  }

  private showDetailedHelp() {
    console.log(chalk.blue(`
📖 SUPRA AutoFi Agent - Detailed Help
${chalk.bold('AUTO TOP-UP STRATEGY:')}
Automatically maintains minimum balance in your wallets:
• Threshold: 600 SUPRA (triggers when balance drops below)
• Top-up Amount: 50 SUPRA (transferred to maintain balance)
• Monitoring: Real-time blockchain monitoring
• Execution: Instant when threshold is reached

${chalk.cyan('Strategy Creation:')}
  • "Create auto top-up for my trading wallet 0x123..."
  • "Set up automation for wallet 0xabc... for gas fees"
  • "I need auto top-up for my DeFi operations wallet"

  ${chalk.cyan('Monitoring & Analytics:')}
  • "Show me my strategy performance"
  • "How are my strategies doing this week?"
  • "What's my total cost savings from automation?"
  • "Check health of all my strategies"

${chalk.cyan('Management:')}
  • "Cancel the strategy for wallet 0x456..."
  • "List all my active strategies"
  • "Show me analytics for the past month"

${chalk.bold('⚡ QUICK COMMANDS:')}
${chalk.cyan('create')}        - Quick strategy creation wizard
${chalk.cyan('analytics')}     - Show performance dashboard
${chalk.cyan('health')}        - Run comprehensive health check
${chalk.cyan('status')}        - Check all strategy statuses
${chalk.cyan('strategies')}    - List active strategies
${chalk.cyan('notifications')} - Show recent alerts
${chalk.cyan('performance')}   - Show system metrics
${chalk.cyan('clear')}         - Clear screen and show quick help
${chalk.cyan('help')}          - Show this detailed help
${chalk.cyan('exit')}          - Quit the agent

${chalk.bold('🔧 STRATEGY PARAMETERS:')}
• Threshold: 600 SUPRA (automatic - when to trigger)
• Top-up: 50 SUPRA (automatic - how much to transfer)
• You provide: Target wallet address and strategy name
• Agent handles: All technical setup and monitoring

${chalk.bold('💡 TIPS:')}
• Speak naturally - the AI understands conversational language
• Use wallet addresses starting with 0x followed by 64 hex characters
• Keep at least 1000 SUPRA in your main account for automation fees
• Monitor your strategies regularly with 'health' or 'analytics'
• Each strategy costs ~0.005 SUPRA per execution

${chalk.bold('🚨 EMERGENCY:')}
If you need to stop all automation immediately, type: "emergency stop all strategies"
    `));
  }
  private startPeriodicMonitoring() {
    if (!this.agent) return;
    setInterval(async () => {
      try {
        await this.agent!.runPeriodicCheck();
      } catch (error) {
        console.error(chalk.red('⚠️ Background monitoring error:'), error instanceof Error ? error.message : String(error));
      }
    }, 10 * 60 * 1000); 
    console.log(chalk.gray('🔄 Background monitoring active (10 min intervals)'));
  }

  private setupSignalHandlers() {
    const gracefulShutdown = () => {
      console.log(chalk.blue('\n👋 Shutting down gracefully...'));
      this.shutdown();
    };    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);
  }
  private updatePrompt() {
    this.rl.setPrompt(this.getPrompt());
  }

  private shutdown() {
    const sessionTime = Math.floor((Date.now() - this.state.startTime.getTime()) / 1000);    
    console.log(chalk.cyan('\n🎉 Thank you for using SUPRA AutoFi Agent!'));
    console.log(chalk.gray('Session Summary:'));
    console.log(chalk.gray(`   • Commands executed: ${this.state.commandCount}`));
    console.log(chalk.gray(`   • Session duration: ${sessionTime}s`));
    console.log(chalk.gray(`   • Last command: ${this.state.lastCommand || 'none'}`));
    if (this.agent) {
      const metrics = this.agent.getPerformanceMetrics();
      console.log(chalk.gray(`   • Strategies created: ${metrics.totalStrategiesCreated}`));
      console.log(chalk.gray(`   • Active strategies: ${metrics.activeStrategies}`));
    }    
    console.log(chalk.gray('\n💡 Your automation strategies continue running on Supra Network'));
    console.log(chalk.gray('🔄 Restart anytime with: npm start'));
    process.exit(0);
  }
}

function checkConfiguration() {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'SUPRA_PRIVATE_KEY', 
    'SUPRA_CONTRACT_ADDRESS'
  ];
  const missing = requiredEnvVars.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.error(chalk.red('❌ Missing environment variables:'));
    missing.forEach(env => console.error(chalk.red(`   • ${env}`)));
    console.log(chalk.yellow('\n🔧 Create .env file with:'));
    console.log(chalk.gray(`
OPENAI_API_KEY=your_openai_api_key
SUPRA_PRIVATE_KEY=your_supra_private_key  
SUPRA_CONTRACT_ADDRESS=0x1c5acf62be507c27a7788a661b546224d806246765ff2695efece60194c6df05
SUPRA_RPC_URL=https://rpc-testnet.supra.com
    `));
        const fs = require('fs');
    if (!fs.existsSync('.env')) {
      console.log(chalk.red('\n❌ .env file not found!'));
      console.log(chalk.yellow('💡 Copy .env.example to .env and fill in your values'));
    }
    process.exit(1);
  }

  // 🚀 OPTIMIZED: Check for placeholder values
  const placeholders = [
    { key: 'OPENAI_API_KEY', placeholder: 'your_openai_api_key' },
    { key: 'SUPRA_PRIVATE_KEY', placeholder: 'your_supra_private_key' },
    { key: 'SUPRA_CONTRACT_ADDRESS', placeholder: 'your_deployed_contract_address' }
  ];
  
  const hasPlaceholders = placeholders.filter(p => 
    process.env[p.key] === p.placeholder || 
    process.env[p.key] === `${p.placeholder}_here`
  );
  
  if (hasPlaceholders.length > 0) {
    console.error(chalk.yellow('⚠️ Found placeholder values:'));
    hasPlaceholders.forEach(p => console.error(chalk.yellow(`   • ${p.key}`)));
    console.log(chalk.yellow('\n🔧 Replace with your actual API keys and addresses'));
    process.exit(1);
  }
}

// 🚀 OPTIMIZED: Enhanced main function with better error handling
async function main() {
  try {
    console.log(chalk.cyan('🚀 Starting SUPRA AutoFi Agent...\n'));
    
    checkConfiguration();
    
    const cli = new SuperAgentCLI();
    await cli.start();
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error instanceof Error ? error.message : String(error));
    console.log(chalk.yellow('\n🔧 Troubleshooting:'));
    console.log(chalk.gray('1. Check your .env file configuration'));
    console.log(chalk.gray('2. Verify your network connection'));
    console.log(chalk.gray('3. Ensure sufficient SUPRA balance'));
    console.log(chalk.gray('4. Try restarting the application'));
    process.exit(1);
  }
}
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
if (require.main === module) {
  main();
}
export { SuperAgentCLI };