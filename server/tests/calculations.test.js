import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment, teardownTestEnvironment } from './testHelper.js';
import { rupeesToPaise, paiseToRupees, formatINR } from '../src/utils/currency.js';

describe('Financial Calculations & Precision Arithmetic', () => {
  let req;
  let userCookie, userCsrf;

  before(async () => {
    const env = setupTestEnvironment();
    req = env.request;

    const res = await req.post('/api/auth/register').send({
      name: 'Finance Tester',
      email: 'calc@example.com',
      password: 'Password123'
    });
    userCookie = res.headers['set-cookie'];
    userCsrf = res.body.csrfToken;
  });

  after(() => {
    teardownTestEnvironment();
  });

  it('converts INR rupees to integer paise without floating point inaccuracy', () => {
    assert.equal(rupeesToPaise(0.1 + 0.2), 30);
    assert.equal(rupeesToPaise(19.99), 1999);
    assert.equal(rupeesToPaise('499.50'), 49950);
    assert.equal(rupeesToPaise(100000), 10000000);
  });

  it('converts integer paise back to INR number with 2 decimal places', () => {
    assert.equal(paiseToRupees(1999), 19.99);
    assert.equal(paiseToRupees(49950), 499.50);
    assert.equal(paiseToRupees(10000000), 100000);
  });

  it('formats amounts in Indian Rupees (₹) with Indian digit grouping', () => {
    assert.equal(formatINR(12500000), '₹1,25,000.00'); // 1.25 Lakh
    assert.equal(formatINR(1000000000), '₹1,00,00,000.00'); // 1 Crore
    assert.equal(formatINR(-50000), '-₹500.00');
  });

  it('verifies that dashboard summary totals match exact stored transactions', async () => {
    // Add transactions:
    // Income: 50,000.00 + 20,000.00 = 70,000.00
    // Expenses: 15,000.00 + 5,000.00 = 20,000.00
    // Net: 50,000.00
    await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .set('x-csrf-token', userCsrf)
      .send({
        type: 'income',
        category: 'Salary',
        amount: 50000,
        description: 'Salary',
        date: '2026-10-01'
      });

    await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .set('x-csrf-token', userCsrf)
      .send({
        type: 'income',
        category: 'Freelance',
        amount: 20000,
        description: 'Side gig',
        date: '2026-10-02'
      });

    await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .set('x-csrf-token', userCsrf)
      .send({
        type: 'expense',
        category: 'Rent',
        amount: 15000,
        description: 'Rent',
        date: '2026-10-03'
      });

    await req
      .post('/api/transactions')
      .set('Cookie', userCookie)
      .set('x-csrf-token', userCsrf)
      .send({
        type: 'expense',
        category: 'Food',
        amount: 5000,
        description: 'Groceries',
        date: '2026-10-04'
      });

    const summaryRes = await req
      .get('/api/dashboard/summary')
      .set('Cookie', userCookie);

    assert.equal(summaryRes.status, 200);
    const { summary } = summaryRes.body.data;

    assert.equal(summary.totalIncome, 70000);
    assert.equal(summary.totalIncomePaise, 7000000);
    assert.equal(summary.totalExpense, 20000);
    assert.equal(summary.totalExpensePaise, 2000000);
    assert.equal(summary.netCashFlow, 50000);
    assert.equal(summary.netCashFlowPaise, 5000000);
    assert.equal(summary.totalTransactions, 4);
    assert.equal(summary.incomeCount, 2);
    assert.equal(summary.expenseCount, 2);
  });

  it('calculates category breakdown percentages accurately', async () => {
    const catRes = await req
      .get('/api/reports/categories')
      .set('Cookie', userCookie);

    assert.equal(catRes.status, 200);
    const categories = catRes.body.data;
    
    // Total expenses = 20,000 (Rent 15,000 = 75%, Food 5,000 = 25%)
    const rent = categories.find(c => c.category === 'Rent');
    const food = categories.find(c => c.category === 'Food');

    assert.ok(rent);
    assert.ok(food);
    assert.equal(rent.total, 15000);
    assert.equal(rent.percentage, 75);
    assert.equal(food.total, 5000);
    assert.equal(food.percentage, 25);
  });
});
