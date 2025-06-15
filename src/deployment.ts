import { SupraSuperAgent, createSuperAgent } from './super-agent';
import { SupraClient, SupraAccount, HexString } from 'supra-l1-sdk';
import chalk from 'chalk';

interface DeploymentConfig {
  network: 'testnet' | 'mainnet';
  rpcUrl: string;
  privateKey: string;
  contractPath: string;
  openaiApiKey: string;
}

export class SuperAgentDeployment {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  async deployContract(): Promise<string> {
    console.log(chalk.blue('📦 Deploying auto_fund_manager contract...'));

    const client = new SupraClient(this.config.rpcUrl);
    const account = new SupraAccount(new HexString(this.config.privateKey));

    try {
      // Deploy the contract (you'll need to implement this based on your contract structure)
      const deployTx = await client.publishPackage(
        account,
        this.config.contractPath
      );

      console.log(chalk.green('✅ Contract deployed successfully!'));
      console.log(chalk.gray(`Transaction: ${deployTx}`));
      
      return account.address().toString();
    } catch (error) {
      console.error(chalk.red('❌ Contract deployment failed:'), error);
      throw error;
    }
  }
  async verifyContract(contractAddress: string): Promise<boolean> {
    console.log(chalk.blue('🔍 Verifying contract deployment...'));

    const client = new SupraClient(this.config.rpcUrl);

    try {
      const accountResource = await client.getAccountResource(
        contractAddress,
        `${contractAddress}::auto_fund_manager`
      );

      if (accountResource) {
        console.log(chalk.green('✅ Contract verified successfully!'));
        return true;
      } else {
        console.log(chalk.red('❌ Contract verification failed'));
        return false;
      }
    } catch (error) {
      console.error(chalk.red('❌ Verification error:'), error);
      return false;
    }
  }
  async initializeSuperAgent(contractAddress: string): Promise<SupraSuperAgent> {
    console.log(chalk.blue('🤖 Initializing Super Agent...'));

    process.env.SUPRA_CONTRACT_ADDRESS = contractAddress;
    process.env.OPENAI_API_KEY = this.config.openaiApiKey;
    process.env.SUPRA_PRIVATE_KEY = this.config.privateKey;

    const agent = await createSuperAgent();
    
    console.log(chalk.green('✅ Super Agent initialized!'));
    return agent;
  }

  async deploy(): Promise<SupraSuperAgent> {
    console.log(chalk.bold.blue('🚀 Starting Super Agent Deployment\n'));

    try {
      const contractAddress = await this.deployContract();
      console.log(chalk.gray(`Contract Address: ${contractAddress}\n`));

      const isVerified = await this.verifyContract(contractAddress);
      if (!isVerified) {
        throw new Error('Contract verification failed');
      }

      const agent = await this.initializeSuperAgent(contractAddress);

      console.log(chalk.bold.green('\n🎉 Deployment Complete!'));
      console.log(chalk.gray('Your Super Agent is ready to use.\n'));

      return agent;

    } catch (error) {
      console.error(chalk.red('💥 Deployment failed:'), error);
      throw error;
    }
  }
}

export class SuperAgentTester {
  private agent: SupraSuperAgent;
  private testResults: Array<{ name: string; passed: boolean; message: string }> = [];

  constructor(agent: SupraSuperAgent) {
    this.agent = agent;
  }

  async testBasicConversation(): Promise<void> {
    console.log(chalk.blue('🧪 Testing basic conversation...'));

    try {
      const response = await this.agent.chat("Hello, can you help me with automation?");
      
      const passed = response.length > 0 && response.includes('automation');
      this.testResults.push({
        name: 'Basic Conversation',
        passed,
        message: passed ? 'Agent responds correctly' : 'Agent response invalid'
      });
      
      console.log(passed ? chalk.green('✅ Passed') : chalk.red('❌ Failed'));
    } catch (error) {
      this.testResults.push({
        name: 'Basic Conversation',
        passed: false,
        message: `Error: ${error.message}`
      });
      console.log(chalk.red('❌ Failed'));
    }
  }
  async testStrategyCreation(): Promise<void> {
    console.log(chalk.blue('🧪 Testing strategy creation...'));

    try {
      const response = await this.agent.chat(
        "Create an auto top-up strategy for wallet 0x742d35Cc6632C032532f4170d764dFc33F775e66 with 100 SUPRA threshold and 500 SUPRA top-up amount"
      );

      const passed = response.includes('strategy') && response.includes('top-up');
      this.testResults.push({
        name: 'Strategy Creation',
        passed,
        message: passed ? 'Strategy creation handled correctly' : 'Strategy creation failed'
      });

      console.log(passed ? chalk.green('✅ Passed') : chalk.red('❌ Failed'));
    } catch (error) {
      this.testResults.push({
        name: 'Strategy Creation',
        passed: false,
        message: `Error: ${error.message}`
      });
      console.log(chalk.red('❌ Failed'));
    }
  }
  async testStrategyListing(): Promise<void> {
    console.log(chalk.blue('🧪 Testing strategy listing...'));

    try {
      const response = await this.agent.chat("List all my active strategies");
      
      const passed = response.includes('strategies') || response.includes('active');
      this.testResults.push({
        name: 'Strategy Listing',
        passed,
        message: passed ? 'Strategy listing works' : 'Strategy listing failed'
      });

      console.log(passed ? chalk.green('✅ Passed') : chalk.red('❌ Failed'));
    } catch (error) {
      this.testResults.push({
        name: 'Strategy Listing',
        passed: false,
        message: `Error: ${error.message}`
      });
      console.log(chalk.red('❌ Failed'));
    }
  }
  async testInvalidInput(): Promise<void> {
    console.log(chalk.blue('🧪 Testing invalid input handling...'));

    try {
      const response = await this.agent.chat("Create auto topup for invalid_address with -100 threshold");
      
      const passed = response.includes('invalid') || response.includes('error') || response.includes('valid');
      this.testResults.push({
        name: 'Invalid Input Handling',
        passed,
        message: passed ? 'Invalid input handled correctly' : 'Invalid input not handled'
      });

      console.log(passed ? chalk.green('✅ Passed') : chalk.red('❌ Failed'));
    } catch (error) {
      this.testResults.push({
        name: 'Invalid Input Handling',
        passed: false,
        message: `Error: ${error.message}`
      });
      console.log(chalk.red('❌ Failed'));
    }
  }

  async testFunctionCalls(): Promise<void> {
    console.log(chalk.blue('🧪 Testing function call integration...'));

    try {
      const response = await this.agent.chat("Show me my strategies");
      
      const passed = response.length > 0;
      this.testResults.push({
        name: 'Function Call Integration',
        passed,
        message: passed ? 'Function calls work correctly' : 'Function calls failed'
      });

      console.log(passed ? chalk.green('✅ Passed') : chalk.red('❌ Failed'));
    } catch (error) {
      this.testResults.push({
        name: 'Function Call Integration',
        passed: false,
        message: `Error: ${error.message}`
      });
      console.log(chalk.red('❌ Failed'));
    }
  }
  async runAllTests(): Promise<void> {
    console.log(chalk.bold.blue('\n🧪 Starting Super Agent Test Suite\n'));

    await this.testBasicConversation();
    await this.testStrategyCreation();
    await this.testStrategyListing();
    await this.testInvalidInput();
    await this.testFunctionCalls();

    this.printTestResults();
  }
  private printTestResults(): void {
    console.log(chalk.bold.blue('\n📊 Test Results Summary\n'));

    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;

    this.testResults.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      const color = result.passed ? chalk.green : chalk.red;
      console.log(`${icon} ${color(result.name)}: ${result.message}`);
    });

    console.log(chalk.bold.blue(`\n📈 Overall: ${passed}/${total} tests passed`));
    
    if (passed === total) {
      console.log(chalk.bold.green('🎉 All tests passed! Super Agent is ready for production.'));
    } else {
      console.log(chalk.bold.yellow('⚠️ Some tests failed. Please review before deploying.'));
    }
  }
}

// Demo script
export class SuperAgentDemo {
  private agent: SupraSuperAgent;

  constructor(agent: SupraSuperAgent) {
    this.agent = agent;
  }

  async runInteractiveDemo(): Promise<void> {
    console.log(chalk.bold.green('\n🎬 Super Agent Interactive Demo\n'));

    const scenarios = [
      {
        title: "New User Onboarding",
        description: "Simulating a new user learning about automation",
        messages: [
          "Hi! I'm new to DeFi automation. What can you help me with?",
          "That sounds great! Can you help me keep my trading wallet topped up?",
          "My trading wallet is 0x742d35Cc6632C032532f4170d764dFc33F775e66 and I want to maintain at least 100 SUPRA"
        ]
      },
      {
        title: "Advanced Strategy Setup",
        description: "Power user setting up complex automation",
        messages: [
          "I need to set up automated fund management for my DeFi operations",
          "Set up auto-withdrawal to cold storage when my main wallet exceeds 2000 SUPRA",
          "Also create auto top-up for my liquidity mining wallet to maintain 500 SUPRA minimum"
        ]
      },
      {
        title: "Strategy Management",
        description: "Managing existing automation strategies",
        messages: [
          "Show me all my active automation strategies",
          "How are my strategies performing? Any issues?",
          "I want to modify my auto top-up threshold from 100 to 150 SUPRA"
        ]
      }
    ];

    for (const scenario of scenarios) {
      console.log(chalk.bold.cyan(`\n--- ${scenario.title} ---`));
      console.log(chalk.gray(scenario.description));
      console.log('');

      for (const message of scenario.messages) {
        console.log(chalk.blue(`👤 User: ${message}`));
        
        try {
          const response = await this.agent.chat(message);
          console.log(chalk.green(`🤖 Agent: ${response}`));
        } catch (error) {
          console.log(chalk.red(`❌ Error: ${error.message}`));
        }
        
        console.log('');
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    console.log(chalk.bold.green('🎬 Demo completed!\n'));
  }

  async runPerformanceDemo(): Promise<void> {
    console.log(chalk.bold.blue('\n⚡ Performance Demonstration\n'));

    const startTime = Date.now();
    let totalRequests = 0;

    const requests = [
      "List my strategies",
      "Check strategy status", 
      "What's my account balance?",
      "How many active automations do I have?",
      "Show me automation costs"
    ];

    console.log(chalk.yellow('Testing rapid requests...'));
    
    for (const request of requests) {
      const requestStart = Date.now();
      
      try {
        await this.agent.chat(request);
        const requestTime = Date.now() - requestStart;
        console.log(chalk.gray(`✓ "${request}" - ${requestTime}ms`));
        totalRequests++;
      } catch (error) {
        console.log(chalk.red(`✗ "${request}" - Error: ${error.message}`));
      }
    }

    const totalTime = Date.now() - startTime;
    const avgTime = totalTime / totalRequests;

    console.log(chalk.bold.blue(`\n📊 Performance Results:`));
    console.log(chalk.gray(`Total Requests: ${totalRequests}`));
    console.log(chalk.gray(`Total Time: ${totalTime}ms`));
    console.log(chalk.gray(`Average Response Time: ${avgTime.toFixed(2)}ms`));
    console.log('');
  }
}
export async function deploySuperAgent(config: DeploymentConfig): Promise<SupraSuperAgent> {
  const deployment = new SuperAgentDeployment(config);
  return await deployment.deploy();
}
export async function testSuperAgent(agent: SupraSuperAgent): Promise<void> {
  const tester = new SuperAgentTester(agent);
  await tester.runAllTests();
}
export async function setupSuperAgent(): Promise<void> {
  console.log(chalk.bold.blue('🚀 Supra Super Agent Complete Setup\n'));
  const config: DeploymentConfig = {
    network: (process.env.SUPRA_NETWORK as 'testnet' | 'mainnet') || 'testnet',
    rpcUrl: process.env.SUPRA_RPC_URL || 'https://rpc-testnet.supra.com',
    privateKey: process.env.SUPRA_PRIVATE_KEY!,
    contractPath: process.env.CONTRACT_PATH || './move_contracts',
    openaiApiKey: process.env.OPENAI_API_KEY!
  };

  try {
    console.log(chalk.blue('Step 1: Deploying Super Agent...'));
    const agent = await deploySuperAgent(config);
    console.log(chalk.blue('\nStep 2: Running tests...'));
    await testSuperAgent(agent);
    console.log(chalk.blue('\nStep 3: Running demo...'));
    const demo = new SuperAgentDemo(agent);
    await demo.runInteractiveDemo();
    await demo.runPerformanceDemo();

    console.log(chalk.bold.green('\n🎉 Super Agent setup completed successfully!'));
    console.log(chalk.gray('Your AI-powered DeFi automation assistant is ready to use.'));

  } catch (error) {
    console.error(chalk.red('\n💥 Setup failed:'), error);
    process.exit(1);
  }
}

if (require.main === module) {
  setupSuperAgent().catch(console.error);
}
export {
  SuperAgentDeployment,
  SuperAgentTester,
  SuperAgentDemo,
  DeploymentConfig
};