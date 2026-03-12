// Script to clean up duplicate push subscriptions
// Run this before running prisma db push

import { db } from '../src/lib/db.js';

async function cleanupDuplicatePushSubscriptions() {
  try {
    console.log('🧹 Cleaning up duplicate push subscriptions...');
    
    // Find all push subscriptions grouped by endpoint
    const allSubscriptions = await db.pushSubscription.findMany({
      orderBy: { createdAt: 'asc' } // Keep the oldest one
    });
    
    console.log(`Found ${allSubscriptions.length} total push subscriptions`);
    
    // Group by endpoint
    const endpointGroups = {};
    allSubscriptions.forEach(sub => {
      if (!endpointGroups[sub.endpoint]) {
        endpointGroups[sub.endpoint] = [];
      }
      endpointGroups[sub.endpoint].push(sub);
    });
    
    let duplicatesRemoved = 0;
    
    // Remove duplicates (keep the first one, remove the rest)
    for (const [endpoint, subscriptions] of Object.entries(endpointGroups)) {
      if (subscriptions.length > 1) {
        console.log(`Found ${subscriptions.length} duplicates for endpoint: ${endpoint.substring(0, 50)}...`);
        
        // Keep the first one, remove the rest
        const toRemove = subscriptions.slice(1);
        
        for (const duplicate of toRemove) {
          await db.pushSubscription.delete({
            where: { id: duplicate.id }
          });
          duplicatesRemoved++;
        }
      }
    }
    
    console.log(`✅ Removed ${duplicatesRemoved} duplicate push subscriptions`);
    console.log('✅ Database is now ready for schema migration');
    console.log('Run: npx prisma db push');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  } finally {
    await db.$disconnect();
  }
}

cleanupDuplicatePushSubscriptions();