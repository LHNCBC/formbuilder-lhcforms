// global-setup.ts
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Access baseURL from the top-level config or a specific project
  const url = process.env.baseUrl || config.projects[0]?.use?.baseURL || 'No baseURL defined';

  console.log('\n=====================================');
  console.log(`🚀 RUNNING TESTS AGAINST: ${url}`);
  console.log('=====================================\n');
}

export default globalSetup;
