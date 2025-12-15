import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixAccountIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const accountsCollection = db.collection('accounts');

    // Get current indexes
    console.log('\nCurrent indexes:');
    const indexes = await accountsCollection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the old problematic index if it exists
    try {
      console.log('\nDropping old user_1_externalId_1 index...');
      await accountsCollection.dropIndex('user_1_externalId_1');
      console.log('✓ Old index dropped successfully');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('Index does not exist or already dropped');
      } else {
        throw error;
      }
    }

    // Create new partial index
    console.log('\nCreating new partial index...');
    await accountsCollection.createIndex(
      { user: 1, externalId: 1 },
      { 
        unique: true, 
        partialFilterExpression: { externalId: { $type: 'string' } },
        name: 'user_1_externalId_1'
      }
    );
    console.log('✓ New partial index created successfully');

    // Show updated indexes
    console.log('\nUpdated indexes:');
    const updatedIndexes = await accountsCollection.indexes();
    console.log(JSON.stringify(updatedIndexes, null, 2));

    console.log('\n✓ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing account index:', error);
    process.exit(1);
  }
}

fixAccountIndex();
