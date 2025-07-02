
import { fetchSwapQuote } from './swapkitApi.ts';
import { processRoutes } from './routeFormatter.ts';
import { providerTestCases, validateProviderResponse } from './testHelpers.ts';

export const runIntegrationTests = async (apiKey: string) => {
  console.log('🧪 Starting comprehensive provider integration tests...');
  
  const testResults = {
    thorchain: { passed: 0, failed: 0, issues: [] as string[] },
    mayachain: { passed: 0, failed: 0, issues: [] as string[] },
    chainflip: { passed: 0, failed: 0, issues: [] as string[] },
    overall: { passed: 0, failed: 0, totalTests: 0 }
  };

  // Test each provider with multiple asset pairs
  const testCases = [
    {
      name: 'BTC to ETH (Primary Test)',
      fromAsset: 'BTC.BTC',
      toAsset: 'ETH.ETH',
      amount: '0.001',
      recipient: '0x742d35Cc6681C63581B87b8b26Ff4c6A8Db73543'
    },
    {
      name: 'ETH to BTC (Reverse Test)',
      fromAsset: 'ETH.ETH',
      toAsset: 'BTC.BTC',
      amount: '0.01',
      recipient: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    },
    {
      name: 'BTC to RUNE (THORChain Native)',
      fromAsset: 'BTC.BTC',
      toAsset: 'THOR.RUNE',
      amount: '0.001',
      recipient: 'thor1abc123def456789abc123def456789abc123def'
    },
    {
      name: 'BTC to CACAO (MayaChain Native)',
      fromAsset: 'BTC.BTC',
      toAsset: 'MAYA.CACAO',
      amount: '0.001',
      recipient: 'maya1abc123def456789abc123def456789abc123def'
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      console.log(`   From: ${testCase.fromAsset} → To: ${testCase.toAsset}`);
      console.log(`   Amount: ${testCase.amount}, Recipient: ${testCase.recipient}`);
      
      const quoteData = await fetchSwapQuote(testCase, apiKey);
      
      if (quoteData.routes && Array.isArray(quoteData.routes)) {
        const processedRoutes = processRoutes(quoteData.routes, testCase.recipient);
        
        console.log(`📋 Test "${testCase.name}" - Processing ${processedRoutes.length} routes`);
        
        // Track which providers are working
        const providersFound = new Set();
        
        for (const route of processedRoutes) {
          const provider = route.provider.toLowerCase();
          providersFound.add(provider);
          
          const validation = validateProviderResponse(route.provider, route);
          
          testResults.overall.totalTests++;
          
          if (validation.isValid) {
            testResults.overall.passed++;
            if (testResults[provider as keyof typeof testResults]) {
              (testResults[provider as keyof typeof testResults] as any).passed++;
            }
            console.log(`✅ ${route.provider} validation passed (score: ${validation.score})`);
          } else {
            testResults.overall.failed++;
            if (testResults[provider as keyof typeof testResults]) {
              (testResults[provider as keyof typeof testResults] as any).failed++;
              (testResults[provider as keyof typeof testResults] as any).issues.push(...validation.issues);
            }
            console.log(`❌ ${route.provider} validation failed:`, validation.issues);
          }
          
          // Enhanced route debugging
          console.log(`📊 ${route.provider} detailed analysis:`, {
            hasDepositAddress: !!route.depositAddress,
            depositAddressLength: route.depositAddress?.length || 0,
            depositAddressValid: route.depositAddress && route.depositAddress.length > 10,
            hasMemo: !!route.memo,
            memoLength: route.memo?.length || 0,
            expectedOutput: route.expectedOutput,
            expectedOutputValid: parseFloat(route.expectedOutput) > 0,
            estimatedTime: route.estimatedTime,
            warningsCount: route.warnings?.length || 0,
            warnings: route.warnings,
            validationScore: validation.score,
            totalFees: route.totalFees
          });
        }
        
        // Check for missing providers
        const expectedProviders = ['thorchain', 'mayachain', 'chainflip'];
        const missingProviders = expectedProviders.filter(p => !providersFound.has(p));
        
        if (missingProviders.length > 0) {
          console.warn(`⚠️ Missing providers in "${testCase.name}":`, missingProviders);
          missingProviders.forEach(provider => {
            if (testResults[provider as keyof typeof testResults]) {
              (testResults[provider as keyof typeof testResults] as any).issues.push(`Not available for ${testCase.name}`);
            }
          });
        }
        
      } else {
        console.error(`❌ No routes returned for test "${testCase.name}"`);
        testResults.overall.failed++;
        
        // Log provider errors if available
        if (quoteData.providerErrors && Array.isArray(quoteData.providerErrors)) {
          console.log('🔍 Provider errors for this test:');
          quoteData.providerErrors.forEach((error: any) => {
            console.log(`  • ${error.provider || 'Unknown'}: ${error.message || error.error}`);
            const provider = (error.provider || '').toLowerCase();
            if (testResults[provider as keyof typeof testResults]) {
              (testResults[provider as keyof typeof testResults] as any).issues.push(error.message || error.error || 'Unknown error');
            }
          });
        }
      }

    } catch (error) {
      console.error(`❌ Test "${testCase.name}" failed with error:`, error);
      testResults.overall.failed++;
      
      // Try to determine which provider might have caused the error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('MAYA') || errorMessage.includes('maya')) {
        testResults.mayachain.issues.push(`Test error: ${errorMessage}`);
      } else if (errorMessage.includes('THOR') || errorMessage.includes('thor')) {
        testResults.thorchain.issues.push(`Test error: ${errorMessage}`);
      } else if (errorMessage.includes('CHAINFLIP') || errorMessage.includes('chainflip')) {
        testResults.chainflip.issues.push(`Test error: ${errorMessage}`);
      }
    }

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Generate comprehensive test report
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: testResults.overall.totalTests,
      passed: testResults.overall.passed,
      failed: testResults.overall.failed,
      successRate: testResults.overall.totalTests > 0 ? 
        Math.round((testResults.overall.passed / testResults.overall.totalTests) * 100) : 0
    },
    providers: {
      thorchain: {
        ...testResults.thorchain,
        status: testResults.thorchain.passed > 0 ? 'FUNCTIONAL' : 
               testResults.thorchain.issues.length > 0 ? 'ISSUES' : 'NOT_TESTED'
      },
      mayachain: {
        ...testResults.mayachain,
        status: testResults.mayachain.passed > 0 ? 'FUNCTIONAL' : 
               testResults.mayachain.issues.length > 0 ? 'ISSUES' : 'NOT_TESTED'
      },
      chainflip: {
        ...testResults.chainflip,
        status: testResults.chainflip.passed > 0 ? 'FUNCTIONAL' : 
               testResults.chainflip.issues.length > 0 ? 'ISSUES' : 'NOT_TESTED'
      }
    },
    testCases: testCases.map(tc => tc.name),
    recommendations: generateRecommendations(testResults)
  };

  console.log('📋 Comprehensive integration test report:', JSON.stringify(report, null, 2));
  
  return report;
};

export const validateProviderIntegration = (routes: any[]) => {
  const integrationStatus = {
    thorchain: { available: false, functional: false, issues: [] as string[] },
    mayachain: { available: false, functional: false, issues: [] as string[] },
    chainflip: { available: false, functional: false, issues: [] as string[] }
  };

  console.log(`🔍 Validating integration for ${routes.length} routes`);

  for (const route of routes) {
    const provider = route.provider?.toLowerCase();
    
    console.log(`🔍 Checking route for provider: ${provider}`);
    
    if (provider && integrationStatus[provider as keyof typeof integrationStatus]) {
      const providerStatus = integrationStatus[provider as keyof typeof integrationStatus];
      providerStatus.available = true;
      
      // Enhanced functional checks
      const hasDepositAddress = !!route.depositAddress && route.depositAddress.length > 10;
      const hasValidOutput = !!route.expectedOutput && parseFloat(route.expectedOutput) > 0;
      
      // Provider-specific memo requirements
      let hasMemoWhenNeeded = true;
      if (provider === 'thorchain' || provider === 'mayachain') {
        hasMemoWhenNeeded = !!route.memo && route.memo.length > 5;
      }
      // ChainFlip memo is optional for most swaps
      
      const hasReasonableFees = !route.totalFees || route.totalFees < parseFloat(route.expectedOutput) * 0.1; // Fees < 10% of output
      
      if (hasDepositAddress && hasValidOutput && hasMemoWhenNeeded && hasReasonableFees) {
        providerStatus.functional = true;
        console.log(`✅ ${provider} is functional`);
      } else {
        console.log(`⚠️ ${provider} has issues:`, {
          hasDepositAddress,
          hasValidOutput,
          hasMemoWhenNeeded,
          hasReasonableFees
        });
        
        if (!hasDepositAddress) providerStatus.issues.push('Missing or invalid deposit address');
        if (!hasValidOutput) providerStatus.issues.push('Missing or invalid expected output');
        if (!hasMemoWhenNeeded) providerStatus.issues.push('Missing required memo');
        if (!hasReasonableFees) providerStatus.issues.push('Unreasonable fee structure');
      }
    }
  }

  console.log('🔧 Final provider integration status:', integrationStatus);
  return integrationStatus;
};

function generateRecommendations(testResults: any): string[] {
  const recommendations = [];
  
  if (testResults.mayachain.passed === 0) {
    recommendations.push('MayaChain integration needs attention - check API endpoint and data extraction');
  }
  
  if (testResults.chainflip.passed === 0) {
    recommendations.push('ChainFlip integration needs attention - check API response format and memo handling');
  }
  
  if (testResults.thorchain.passed === 0) {
    recommendations.push('THORChain integration needs attention despite usually being stable');
  }
  
  if (testResults.overall.successRate < 50) {
    recommendations.push('Overall integration health is poor - consider reviewing SwapKit API version compatibility');
  }
  
  return recommendations;
}
