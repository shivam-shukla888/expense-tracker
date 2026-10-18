import argon2 from 'argon2';
import { getDatabase } from './database.js';
import { rupeesToPaise } from '../utils/currency.js';
import { logger } from '../utils/logger.js';

export async function seedDemoData(db) {
  const database = db || getDatabase();

  const DEMO_EMAIL = 'demo@expensetracker.local';
  const existing = database.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);

  if (existing) {
    logger.info('Demo user already exists. Skipping seed to prevent duplicate records.');
    return existing.id;
  }

  logger.info('Seeding synthetic demo user and financial data...');

  const passwordHash = await argon2.hash('DemoUser@2026', {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2
  });

  const insertUser = database.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  );
  const userResult = insertUser.run('Demo User', DEMO_EMAIL, passwordHash);
  const userId = userResult.lastInsertRowid;

  // Generate synthetic transactions across current and previous 2 months
  const today = new Date();
  const formatYMD = (d) => d.toISOString().split('T')[0];

  const getRelativeDate = (daysAgo) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    return formatYMD(d);
  };

  const syntheticTransactions = [
    // Current month income
    { type: 'income', category: 'Salary', amount: 85000, description: 'Monthly Tech Salary Credit', date: getRelativeDate(3) },
    { type: 'income', category: 'Freelance', amount: 22000, description: 'Frontend Consulting UI Design', date: getRelativeDate(10) },
    { type: 'income', category: 'Investment Returns', amount: 6500, description: 'Mutual Fund Dividend Payout', date: getRelativeDate(14) },
    
    // Current month expenses
    { type: 'expense', category: 'Rent', amount: 25000, description: 'Apartment Monthly Rent', date: getRelativeDate(2) },
    { type: 'expense', category: 'Bills', amount: 3200, description: 'High-speed Fiber Broadband Bill', date: getRelativeDate(4) },
    { type: 'expense', category: 'Food', amount: 6450, description: 'Monthly Supermarket Grocery Haul', date: getRelativeDate(5) },
    { type: 'expense', category: 'Transport', amount: 2800, description: 'Fuel & Metro Travel Card Recharge', date: getRelativeDate(7) },
    { type: 'expense', category: 'Entertainment', amount: 1499, description: 'Streaming & Media Subscriptions', date: getRelativeDate(9) },
    { type: 'expense', category: 'Shopping', amount: 4800, description: 'Ergonomic Desk Accessories', date: getRelativeDate(12) },
    { type: 'expense', category: 'Healthcare', amount: 1250, description: 'Routine Wellness Checkup & Vitamin Supplements', date: getRelativeDate(15) },
    { type: 'expense', category: 'Food', amount: 1850, description: 'Weekend Dinner with Friends', date: getRelativeDate(16) },

    // Previous month (approx 30-45 days ago)
    { type: 'income', category: 'Salary', amount: 85000, description: 'Previous Month Salary Credit', date: getRelativeDate(34) },
    { type: 'income', category: 'Freelance', amount: 18000, description: 'API Integration Client Retainer', date: getRelativeDate(42) },
    { type: 'expense', category: 'Rent', amount: 25000, description: 'Previous Month Rent Payment', date: getRelativeDate(33) },
    { type: 'expense', category: 'Bills', amount: 4100, description: 'Electricity & Gas Utility Bills', date: getRelativeDate(36) },
    { type: 'expense', category: 'Food', amount: 8200, description: 'Supermarket Groceries & Pantry Restock', date: getRelativeDate(38) },
    { type: 'expense', category: 'Education', amount: 7500, description: 'Advanced Cloud Architecture Course', date: getRelativeDate(40) },
    { type: 'expense', category: 'Transport', amount: 3100, description: 'Cab rides & Fuel expenses', date: getRelativeDate(44) },

    // Two months ago (approx 60-75 days ago)
    { type: 'income', category: 'Salary', amount: 85000, description: 'Two Months Ago Salary Credit', date: getRelativeDate(64) },
    { type: 'expense', category: 'Rent', amount: 25000, description: 'Two Months Ago Rent Payment', date: getRelativeDate(63) },
    { type: 'expense', category: 'Food', amount: 7800, description: 'Groceries & Household Supplies', date: getRelativeDate(68) },
    { type: 'expense', category: 'Bills', amount: 3500, description: 'Internet and Water Utility Bills', date: getRelativeDate(70) }
  ];

  const insertTx = database.prepare(
    `INSERT INTO transactions (user_id, type, category, amount_paise, description, date)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const seedBatch = database.transaction((txs) => {
    for (const tx of txs) {
      insertTx.run(
        userId,
        tx.type,
        tx.category,
        rupeesToPaise(tx.amount),
        tx.description,
        tx.date
      );
    }
  });

  seedBatch(syntheticTransactions);
  logger.info(`Seeded ${syntheticTransactions.length} synthetic records for demo user.`);
  return userId;
}

// Direct script execution support
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  try {
    await seedDemoData();
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}
