// Quick fix for ALL duplicate key errors
// Run this in your terminal: node fix-database.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixDatabase() {
  try {
    console.log('🔧 Fixing ALL database duplicate key issues...');
    
    // Delete all push subscriptions to resolve duplicate key error
    const pushSubResult = await prisma.pushSubscription.deleteMany({});
    console.log(`✅ Deleted ${pushSubResult.count} push subscriptions`);
    
    // Delete all expo push tokens to resolve duplicate key error
    const expoPushResult = await prisma.expoPushToken.deleteMany({});
    console.log(`✅ Deleted ${expoPushResult.count} expo push tokens`);
    
    console.log('✅ Database is now clean and ready for schema update');
    console.log('Run: npx prisma db push');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔄 If this fails, try the nuclear option:');
    console.log('npx prisma migrate reset --force');
    console.log('npx prisma db push');
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabase();