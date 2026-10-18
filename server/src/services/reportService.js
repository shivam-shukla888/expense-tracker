import { getDatabase } from '../db/database.js';
import { paiseToRupees, formatINR } from '../utils/currency.js';

export class ReportService {
  /**
   * Get dashboard summary with total income, total expenses, net balance,
   * transaction counts, and month-over-month comparison.
   */
  static getDashboardSummary(userId, startDate = null, endDate = null) {
    const db = getDatabase();

    // 1. Period Totals
    const periodConditions = ['user_id = ?'];
    const periodParams = [userId];

    if (startDate) {
      periodConditions.push('date >= ?');
      periodParams.push(startDate);
    }
    if (endDate) {
      periodConditions.push('date <= ?');
      periodParams.push(endDate);
    }

    const periodWhere = periodConditions.join(' AND ');

    const periodSummarySql = `
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END), 0) AS total_income_paise,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS total_expense_paise,
        COUNT(*) AS total_transactions,
        COUNT(CASE WHEN type = 'income' THEN 1 END) AS income_count,
        COUNT(CASE WHEN type = 'expense' THEN 1 END) AS expense_count
      FROM transactions
      WHERE ${periodWhere}
    `;

    const summaryRow = db.prepare(periodSummarySql).get(...periodParams);
    const totalIncomePaise = Number(summaryRow.total_income_paise);
    const totalExpensePaise = Number(summaryRow.total_expense_paise);
    const netCashFlowPaise = totalIncomePaise - totalExpensePaise;

    // 2. Current Month vs Previous Month Comparison
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = now.getMonth() + 1; // 1-12
    const currentMonthStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;

    const prevMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonthNum = prevMonthDate.getMonth() + 1;
    const prevMonthStr = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;

    const monthComparisonSql = `
      SELECT 
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', date) = ? AND type = 'income' THEN amount_paise ELSE 0 END), 0) AS cur_income,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', date) = ? AND type = 'expense' THEN amount_paise ELSE 0 END), 0) AS cur_expense,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', date) = ? AND type = 'income' THEN amount_paise ELSE 0 END), 0) AS prev_income,
        COALESCE(SUM(CASE WHEN strftime('%Y-%m', date) = ? AND type = 'expense' THEN amount_paise ELSE 0 END), 0) AS prev_expense
      FROM transactions
      WHERE user_id = ?
    `;

    const momRow = db.prepare(monthComparisonSql).get(
      currentMonthStr,
      currentMonthStr,
      prevMonthStr,
      prevMonthStr,
      userId
    );

    const curIncome = Number(momRow.cur_income);
    const curExpense = Number(momRow.cur_expense);
    const prevIncome = Number(momRow.prev_income);
    const prevExpense = Number(momRow.prev_expense);

    const calculateChange = (cur, prev) => {
      if (prev === 0) return cur > 0 ? 100 : 0;
      return Math.round(((cur - prev) / prev) * 1000) / 10; // 1 decimal place percentage
    };

    return {
      period: {
        startDate: startDate || 'All time',
        endDate: endDate || 'Present'
      },
      summary: {
        totalIncome: paiseToRupees(totalIncomePaise),
        totalIncomePaise,
        formattedIncome: formatINR(totalIncomePaise),

        totalExpense: paiseToRupees(totalExpensePaise),
        totalExpensePaise,
        formattedExpense: formatINR(totalExpensePaise),

        netCashFlow: paiseToRupees(netCashFlowPaise),
        netCashFlowPaise,
        formattedNetCashFlow: formatINR(netCashFlowPaise, true),

        totalTransactions: summaryRow.total_transactions,
        incomeCount: summaryRow.income_count,
        expenseCount: summaryRow.expense_count
      },
      monthOverMonth: {
        currentMonth: currentMonthStr,
        previousMonth: prevMonthStr,
        currentIncome: paiseToRupees(curIncome),
        previousIncome: paiseToRupees(prevIncome),
        incomeChangePercent: calculateChange(curIncome, prevIncome),
        currentExpense: paiseToRupees(curExpense),
        previousExpense: paiseToRupees(prevExpense),
        expenseChangePercent: calculateChange(curExpense, prevExpense)
      },
      disclaimer: 'Financial summaries reflect recorded transactions in this application and do not represent verified external bank balances.'
    };
  }

  /**
   * Monthly Income vs Expense report for trends and charts
   */
  static getMonthlyReport(userId, monthsBack = 6) {
    const db = getDatabase();

    const sql = `
      SELECT 
        strftime('%Y-%m', date) AS month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount_paise ELSE 0 END), 0) AS income_paise,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_paise ELSE 0 END), 0) AS expense_paise,
        COUNT(*) AS transaction_count
      FROM transactions
      WHERE user_id = ?
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month ASC
    `;

    const rows = db.prepare(sql).all(userId);

    // If fewer than monthsBack, let's format all available or take last monthsBack
    const recentRows = rows.slice(-monthsBack);

    return recentRows.map(row => {
      const incomePaise = Number(row.income_paise);
      const expensePaise = Number(row.expense_paise);
      const netPaise = incomePaise - expensePaise;

      // Format month label like "Oct 2026"
      const [year, month] = row.month.split('-');
      const dateObj = new Date(Number(year), Number(month) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      return {
        month: row.month,
        label: monthLabel,
        income: paiseToRupees(incomePaise),
        incomePaise,
        expense: paiseToRupees(expensePaise),
        expensePaise,
        netCashFlow: paiseToRupees(netPaise),
        netCashFlowPaise: netPaise,
        transactionCount: row.transaction_count
      };
    });
  }

  /**
   * Category-wise expense breakdown report
   */
  static getCategoryReport(userId, startDate = null, endDate = null) {
    const db = getDatabase();

    const conditions = ['user_id = ?', "type = 'expense'"];
    const params = [userId];

    if (startDate) {
      conditions.push('date >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('date <= ?');
      params.push(endDate);
    }

    const whereClause = conditions.join(' AND ');

    const sql = `
      SELECT 
        category,
        COALESCE(SUM(amount_paise), 0) AS total_paise,
        COUNT(*) AS count
      FROM transactions
      WHERE ${whereClause}
      GROUP BY category
      ORDER BY total_paise DESC
    `;

    const rows = db.prepare(sql).all(...params);

    const grandTotalPaise = rows.reduce((acc, r) => acc + Number(r.total_paise), 0);

    return rows.map(r => {
      const totalPaise = Number(r.total_paise);
      const percentage = grandTotalPaise > 0 
        ? Math.round((totalPaise / grandTotalPaise) * 1000) / 10 
        : 0;

      return {
        category: r.category,
        totalPaise,
        total: paiseToRupees(totalPaise),
        formattedTotal: formatINR(totalPaise),
        percentage,
        transactionCount: r.count
      };
    });
  }
}
