
// Testing utilities for provider integrations

export interface TestCase {
  name: string;
  fromAsset: string;
  toAsset: string;
  amount: string;
  recipient: string;
  expectedProvider?: string;
  shouldSucceed: boolean;
}

export const providerTestCases: TestCase[] = [
  // THORChain test cases
  {
    name: 'BTC to ETH via THORChain',
    fromAsset: 'BTC.BTC',
    toAsset: 'ETH.ETH',
    amount: '0.001',
    recipient: '0x742d35Cc6681C63581B87b8b26Ff4c6A8Db73543',
    expectedProvider: 'THORCHAIN',
    shouldSucceed: true
  },
  {
    name: 'ETH to RUNE via THORChain',
    fromAsset: 'ETH.ETH',
    toAsset: 'THOR.RUNE',
    amount: '0.1',
    recipient: 'thor1abc123def456...',
    expectedProvider: 'THORCHAIN',
    shouldSucceed: true
  },

  // MayaChain test cases
  {
    name: 'BTC to CACAO via MayaChain',
    fromAsset: 'BTC.BTC',
    toAsset: 'MAYA.CACAO',
    amount: '0.001',
    recipient: 'maya1abc123def456...',
    expectedProvider: 'MAYACHAIN',
    shouldSucceed: true
  },

  // ChainFlip test cases
  {
    name: 'BTC to ETH via ChainFlip',
    fromAsset: 'BTC.BTC',
    toAsset: 'ETH.ETH',
    amount: '0.001',
    recipient: '0x742d35Cc6681C63581B87b8b26Ff4c6A8Db73543',
    expectedProvider: 'CHAINFLIP',
    shouldSucceed: true
  },

  // Cross-provider comparison
  {
    name: 'Multi-provider BTC to ETH',
    fromAsset: 'BTC.BTC',
    toAsset: 'ETH.ETH',
    amount: '0.01',
    recipient: '0x742d35Cc6681C63581B87b8b26Ff4c6A8Db73543',
    shouldSucceed: true
  },

  // Edge cases
  {
    name: 'Small amount test',
    fromAsset: 'BTC.BTC',
    toAsset: 'ETH.ETH',
    amount: '0.0001',
    recipient: '0x742d35Cc6681C63581B87b8b26Ff4c6A8Db73543',
    shouldSucceed: false // May fail due to minimum amounts
  },

  // Invalid cases
  {
    name: 'Invalid recipient address',
    fromAsset: 'BTC.BTC',
    toAsset: 'ETH.ETH',
    amount: '0.001',
    recipient: 'invalid_address',
    shouldSucceed: false
  }
];

export const runProviderTests = async (
  testFunction: (testCase: TestCase) => Promise<any>
): Promise<{ passed: number; failed: number; results: any[] }> => {
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of providerTestCases) {
    try {
      console.log(`🧪 Running test: ${testCase.name}`);
      const result = await testFunction(testCase);
      
      if (testCase.shouldSucceed && result.routes && result.routes.length > 0) {
        passed++;
        console.log(`✅ Test passed: ${testCase.name}`);
      } else if (!testCase.shouldSucceed && (!result.routes || result.routes.length === 0)) {
        passed++;
        console.log(`✅ Test passed (expected failure): ${testCase.name}`);
      } else {
        failed++;
        console.log(`❌ Test failed: ${testCase.name}`);
      }

      results.push({
        testCase,
        result,
        status: passed > failed ? 'PASSED' : 'FAILED'
      });

    } catch (error) {
      failed++;
      console.log(`❌ Test error: ${testCase.name} - ${error.message}`);
      results.push({
        testCase,
        error: error.message,
        status: 'ERROR'
      });
    }

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return { passed, failed, results };
};

export const validateProviderResponse = (provider: string, routeData: any): {
  isValid: boolean;
  issues: string[];
  score: number;
} => {
  const issues: string[] = [];
  let score = 100;

  // Check required fields
  if (!routeData.depositAddress) {
    issues.push('Missing deposit address');
    score -= 30;
  }

  if (!routeData.expectedOutput || parseFloat(routeData.expectedOutput) <= 0) {
    issues.push('Invalid expected output');
    score -= 25;
  }

  // Provider-specific checks
  switch (provider.toUpperCase()) {
    case 'THORCHAIN':
    case 'MAYACHAIN':
      if (!routeData.memo) {
        issues.push(`${provider} missing required memo`);
        score -= 25;
      }
      break;
    
    case 'CHAINFLIP':
      // ChainFlip memo is optional for native swaps
      if (!routeData.memo) {
        issues.push('ChainFlip route has no memo (may be normal)');
        score -= 5;
      }
      break;
  }

  // Check fees structure
  if (!routeData.fees || !Array.isArray(routeData.fees)) {
    issues.push('Missing or invalid fees structure');
    score -= 15;
  }

  // Check estimated time
  if (!routeData.estimatedTime) {
    issues.push('Missing estimated time');
    score -= 10;
  }

  return {
    isValid: score >= 70,
    issues,
    score: Math.max(0, score)
  };
};
