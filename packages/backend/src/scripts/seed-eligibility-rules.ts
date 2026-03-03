/**
 * Seed Eligibility Rules Script
 * 
 * This script seeds sample eligibility rules into DynamoDB.
 * Run this script to populate the database with initial test data.
 * 
 * Usage:
 *   npm run seed-rules
 *   or
 *   ts-node src/scripts/seed-eligibility-rules.ts
 */

import { seedSampleRules } from '../repositories/eligibility-rule-repository';
import { sampleEligibilityRules } from '../data/sample-eligibility-rules';

async function main() {
  console.log('Starting eligibility rules seeding...');
  console.log(`Seeding ${sampleEligibilityRules.length} sample rules...`);

  try {
    await seedSampleRules(sampleEligibilityRules);
    
    console.log('✓ Successfully seeded eligibility rules:');
    sampleEligibilityRules.forEach((rule) => {
      console.log(`  - ${rule.schemeName} (${rule.id})`);
    });
    
    console.log('\nSeeding completed successfully!');
  } catch (error) {
    console.error('✗ Error seeding eligibility rules:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

export { main as seedEligibilityRules };
