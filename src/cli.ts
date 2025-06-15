#!/usr/bin/env node
import readline from 'readline';
import chalk from 'chalk';
import dotenv from 'dotenv';
import { SupraSuperAgent, createSuperAgent } from './super-agent';

dotenv.config();

class SuperAgentCLI {
  private agent: SupraSuperAgent | null = null;
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('🚀 ') + chalk.bold('Super Agent > ')
    });
  }

  async initialize() {
    console.clear();
    console.log(chalk.bold.blue(`
╔═══════════════════════════════════════════════╗
║           SUPRA AutoFi AGENT                  ║
╚═══════════════════════════════════════════════╝
    `));

    console.log(chalk.yellow('⚡ Initializing...'));
    
    try {
      this.agent = await createSuperAgent();
      console.log(chalk.green('✅ Ready! Start chatting about auto top-up strategies\n'));
      console.log(chalk.gray('💡 Quick Commands:'));
      console.log(chalk.gray('   • "help" - Show commands'));
      console.log(chalk.gray('   • "status" - Check strategies'));
      console.log(chalk.gray('   • "exit" - Quit agent\n'));
      
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error instanceof Error ? error.message : error);
      console.log(chalk.yellow('Please check your .env configuration'));
      process.exit(1);
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
      }
      await this.handleUserInput(message);
      this.rl.prompt();
    });

    this.rl.on('close', () => {
      console.log(chalk.blue('\n👋 Goodbye!'));
      process.exit(0);
    });
  }

  private async handleUserInput(input: string) {
    const command = input.toLowerCase();

    switch (command) {
      case 'exit':
      case 'quit':
        this.rl.close();
        break;

      case 'help':
        this.showHelp();
        break;

      case 'status':
        await this.showStatus();
        break;

      case 'strategies':
        await this.showStrategies();
        break;

      case 'clear':
        console.clear();
        break;

      default:
        await this.chatWithAgent(input);
        break;
    }
  }

  private async chatWithAgent(message: string) {
    if (!this.agent) {
      console.log(chalk.red('❌ Agent not ready'));
      return;
    }

    console.log(chalk.gray('🤖 Processing...'));
    
    try {
      const response = await this.agent.chat(message);
      console.log(chalk.green('\n🤖 Super Agent:'));
      console.log(this.formatResponse(response));
      console.log('');
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error instanceof Error ? error.message : String(error));
    }
  }

  private formatResponse(response: string): string {
    return response
      .replace(/\*\*(.*?)\*\*/g, chalk.bold('$1'))
      .replace(/\*(.*?)\*/g, chalk.italic('$1'))
      .replace(/`(.*?)`/g, chalk.cyan('$1'))
      .replace(/^(✅|🎯|⚠️|❌|🚀|📊)/gm, chalk.yellow('$1'));
  }

  private showHelp() {
    console.log(chalk.blue(`
📖 Super Agent Help:

${chalk.bold('Auto Top-up Strategy:')}
• Monitors target wallets automatically
• Triggers when balance < 600 SUPRA  
• Transfers 50 SUPRA to maintain balance

${chalk.bold('Natural Language Examples:')}
💡 "Set up auto top-up for my wallet 0x123..."
💡 "Create auto top-up strategy for 0xabc..."
💡 "Show my active strategies"
💡 "Cancel strategy [strategy-name]"

${chalk.bold('Quick Commands:')}
• help     - Show this help
• status   - Check all strategies  
• clear    - Clear screen
• exit     - Quit agent

${chalk.bold('Strategy Info:')}
• Threshold: 600 SUPRA (automatic)
• Top-up: 50 SUPRA (automatic)
• You only provide: target address
    `));
  }

  private async showStatus() {
    if (!this.agent) return;

    console.log(chalk.blue('📊 Checking strategies...'));
    
    try {
      await this.agent.runPeriodicCheck();
      const response = await this.agent.chat("Check status of all strategies");
      console.log(this.formatResponse(response));
    } catch (error) {
      console.error(chalk.red('❌ Status check failed:'), error instanceof Error ? error.message : String(error));
    }
  }

  private async showStrategies() {
    if (!this.agent) return;

    console.log(chalk.blue('📋 Loading strategies...'));
    
    try {
      const response = await this.agent.chat("List all my active strategies");
      console.log(this.formatResponse(response));
    } catch (error) {
      console.error(chalk.red('❌ Failed to load strategies:'), error instanceof Error ? error.message : String(error));
    }
  }

  private startPeriodicMonitoring() {
    if (!this.agent) return;
    setInterval(async () => {
      try {
        await this.agent!.runPeriodicCheck();
      } catch (error) {
        console.error(chalk.red('⚠️ Monitoring error:'), error instanceof Error ? error.message : String(error));
      }
    }, 5 * 60 * 1000);

    console.log(chalk.gray('🔄 Background monitoring active (5 min intervals)'));
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
    console.log(chalk.yellow('\nCreate .env file with:'));
    console.log(chalk.gray(`
OPENAI_API_KEY=your_openai_api_key
SUPRA_PRIVATE_KEY=your_supra_private_key  
SUPRA_CONTRACT_ADDRESS=0x1c5acf62be507c27a7788a661b546224d806246765ff2695efece60194c6df05
    `));
    
    const fs = require('fs');
    if (!fs.existsSync('.env')) {
      console.log(chalk.red('\n❌ .env file not found!'));
      console.log(chalk.yellow('Create a .env file in your project root.'));
    }
    
    process.exit(1);
  }
    const placeholders = [
    { key: 'OPENAI_API_KEY', placeholder: 'your_openai_api_key_here' },
    { key: 'SUPRA_PRIVATE_KEY', placeholder: 'your_supra_private_key_here' },
    { key: 'SUPRA_CONTRACT_ADDRESS', placeholder: 'your_deployed_contract_address_here' }
  ];
  
  const hasPlaceholders = placeholders.filter(p => 
    process.env[p.key] === p.placeholder
  );
  
  if (hasPlaceholders.length > 0) {
    console.error(chalk.yellow('⚠️ Found placeholder values:'));
    hasPlaceholders.forEach(p => console.error(chalk.yellow(`   • ${p.key}`)));
    console.log(chalk.yellow('\nReplace with actual values.'));
    process.exit(1);
  }
}
async function main() {
  try {
    checkConfiguration();
    
    const cli = new SuperAgentCLI();
    await cli.start();
  } catch (error) {
    console.error(chalk.red('❌ Fatal error:'), error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.log(chalk.blue('\n👋 Shutting down...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.blue('\n👋 Shutting down...'));
  process.exit(0);
});

if (require.main === module) {
  main();
}

export { SuperAgentCLI };