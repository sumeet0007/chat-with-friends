// Database migration script to add pin functionality
// Run this if you're getting database errors related to pinned fields

import { db } from '../src/lib/db.js';

async function migratePinFields() {
  try {
    console.log('Checking database schema for pin fields...');
    
    // Test if pin fields exist by trying to query them
    try {
      await db.message.findFirst({
        where: { pinned: true },
        select: { id: true, pinned: true, pinnedAt: true }
      });
      console.log('✅ Message pin fields exist');
    } catch (error) {
      console.log('❌ Message pin fields missing:', error.message);
    }

    try {
      await db.directMessage.findFirst({
        where: { pinned: true },
        select: { id: true, pinned: true, pinnedAt: true }
      });
      console.log('✅ DirectMessage pin fields exist');
    } catch (error) {
      console.log('❌ DirectMessage pin fields missing:', error.message);
    }

    console.log('Migration check complete. If fields are missing, run: npx prisma db push');
    
  } catch (error) {
    console.error('Migration check failed:', error);
  } finally {
    await db.$disconnect();
  }
}

migratePinFields();