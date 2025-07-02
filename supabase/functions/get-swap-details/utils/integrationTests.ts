
import { fetchSwapQuote } from './swapkitApi.ts';
import { processRoutes } from './routeFormatter.ts';
import { providerTestCases, validateProviderResponse } from './testHelpers.ts';

export const runIntegrationTests = async (apiKey: string) => {
  console.log('🧪 Starting provider integration tests...');
  
  const testResults = {
    thorchain: { passed: 0, failed: 0, issues: [] as string[] },
    mayachain: { passed: 0, failed: 0, issues: [] as string[] },
    chainflip: { passed: 0, failed: 0, issues: [] as string[] },
    overall: { passed: 0, failed: 0, totalTests: 0 }
  };

  // Test each provider with a simple BTC to ETH swap
  const commonTestParams = {
    fromAsset: 'BTC.BTC',
    toAsset: 'ETH.ETH',
    amount: '0.001',
    recipient: '0x742d35Cc6681C63581B87b8b26Ff4c6A8Db73543'
  };

  try {
    console.log('🔍 Testing all providers with common parameters...');
    const quoteData = await fetchSwapQuote(commonTestParams, apiKey);
    
    if (quoteData.routes && Array.isArray(quoteData.routes)) {
      const processedRoutes = processRoutes(quoteData.routes, commonTestParams.recipient);
      
      console.log(`📋 Testing ${processedRoutes.length} processed routes`);
      
      for (const route of processedRoutes) {
        const provider = route.provider.toLowerCase();
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
        
        // Log route details for debugging
        console.log(`📊 ${route.provider} route details:`, {
          hasDepositAddress: !!route.depositAddress,
          depositAddressLength: route.depositAddress?.length || 0,
          hasMemo: !!route.memo,
          memoLength: route.memo?.length || 0,
          expectedOutput: route.expectedOutput,
          estimatedTime: route.estimatedTime,
          warningsCount: route.warnings?.length || 0,
          validationScore: validation.score
        });
      }
    } else {
      console.error('❌ No routes returned from SwapKit API');
      testResults.overall.failed = 1;
    }

  } catch (error) {
    console.error('❌ Integration test failed:', error);
    testResults.overall.failed++;
  }

  // Generate test report
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
      thorchain: testResults.thorchain,
      mayachain: testResults.mayachain,
      chainflip: testResults.chainflip
    },
    testParameters: commonTestParams
  };

  console.log('📋 Integration test report:', JSON.stringify(report, null, 2));
  
  return report;
};

export const validateProviderIntegration = (routes: any[]) => {
  const integrationStatus = {
    thorchain: { available: false, functional: false, issues: [] as string[] },
    mayachain: { available: false, functional: false, issues: [] as string[] },
    chainflip: { available: false, functional: false, issues: [] as string[] }
  };

  for (const route of routes) {
    const provider = route.provider?.toLowerCase();
    
    if (provider && integrationStatus[provider as keyof typeof integrationStatus]) {
      const providerStatus = integrationStatus[provider as keyof typeof integrationStatus];
      providerStatus.available = true;
      
      // Check if route is functional
      const hasDepositAddress = !!route.depositAddress && route.depositAddress.length > 10;
      const hasValidOutput = !!route.expectedOutput && parseFloat(route.expectedOutput) > 0;
      const hasMemoWhenNeeded = provider === 'chainflip' || !!route.memo;
      
      if (hasDepositAddress && hasValidOutput && hasMemoWhenNeeded) {
        providerStatus.functional = true;
      } else {
        if (!hasDepositAddress) providerStatus.issues.push('Missing or invalid deposit address');
        if (!hasValidOutput) providerStatus.issues.push('Missing or invalid expected output');
        if (!hasMemoWhenNeeded) providerStatus.issues.push('Missing required memo');
      }
    }
  }

  return integrationStatus;
};
