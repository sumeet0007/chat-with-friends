// Nuclear option - Complete database reset for push notifications
// Run this if the regular fix doesn't work: node nuclear-fix.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function nuclearFix() {
  try {
    console.log('💥 NUCLEAR OPTION: Clearing ALL push notification data...');
    console.log('⚠️  This will remove all push subscriptions and tokens');
    
    // Clear all push-related data
    await prisma.pushSubscription.deleteMany({});
    console.log('✅ Cleared all PushSubscriptions');
    
    await prisma.expoPushToken.deleteMany({});
    console.log('✅ Cleared all ExpoPushTokens');
    
    // Clear telemetry data if it exists
    try {
      await prisma.telemetry.deleteMany({});
      console.log('✅ Cleared all Telemetry data');
    } catch (e) {
      console.log('ℹ️  No telemetry data to clear');
    }
    
    console.log('✅ Database is now completely clean');
    console.log('🚀 Now run: npx prisma db push');
    
  } catch (error) {
    console.error('❌ Nuclear fix failed:', error.message);
    console.log('\n🆘 LAST RESORT:');
    console.log('1. Go to MongoDB Compass');
    console.log('2. Delete the entire discord-clone database');
    console.log('3. Run: npx prisma db push');
    console.log('4. This will recreate everything fresh');
  } finally {
    await prisma.$disconnect();
  }
}

nuclearFix();