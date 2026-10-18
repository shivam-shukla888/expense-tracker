/**
 * Currency and Date Formatters for the Frontend
 */

export function formatINR(amount, includeSign = false) {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absNum);

  if (isNegative) return `-${formatted}`;
  if (includeSign && num > 0) return `+${formatted}`;
  return formatted;
}

export function formatDate(dateString) {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;

  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export const CATEGORY_COLORS = {
  // Income
  Salary: '#10b981',
  Freelance: '#06b6d4',
  Business: '#3b82f6',
  'Investment Returns': '#8b5cf6',
  // Expense
  Food: '#f97316',
  Transport: '#0284c7',
  Rent: '#6366f1',
  Shopping: '#ec4899',
  Bills: '#eab308',
  Healthcare: '#14b8a6',
  Education: '#a855f7',
  Entertainment: '#f43f5e',
  Other: '#64748b'
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || '#64748b';
}
