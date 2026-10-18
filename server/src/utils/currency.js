/**
 * Utility functions for precise monetary calculations using integer paise.
 * 1 INR = 100 paise.
 * Prevents floating-point precision issues (e.g., 0.1 + 0.2 !== 0.3).
 */

/**
 * Converts an INR amount (e.g. 150.50 or '150.50') to integer paise (15050).
 * Rounds to nearest integer paise to prevent floating-point anomalies.
 * @param {number|string} amount 
 * @returns {number} integer paise
 */
export function rupeesToPaise(amount) {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || !isFinite(num)) {
    throw new TypeError(`Invalid monetary amount: ${amount}`);
  }
  if (num < 0) {
    throw new RangeError(`Amount cannot be negative: ${amount}`);
  }
  return Math.round(num * 100);
}

/**
 * Converts integer paise to an INR number with 2 decimal places.
 * @param {number} paise 
 * @returns {number}
 */
export function paiseToRupees(paise) {
  if (typeof paise !== 'number' || !Number.isInteger(paise)) {
    throw new TypeError(`Paise must be an integer, got: ${paise}`);
  }
  return Math.round(paise) / 100;
}

/**
 * Formats integer paise into standard Indian Rupee currency string (₹XX,XX,XXX.XX).
 * Uses standard Indian numbering system (Lakhs and Crores).
 * @param {number} paise 
 * @param {boolean} includeSign 
 * @returns {string} e.g. "₹1,25,000.00"
 */
export function formatINR(paise, includeSign = false) {
  if (typeof paise !== 'number' || !Number.isInteger(paise)) {
    return '₹0.00';
  }
  const isNegative = paise < 0;
  const absRupees = Math.abs(paise) / 100;
  
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(absRupees);

  if (isNegative) {
    return `-${formatted}`;
  }
  if (includeSign && paise > 0) {
    return `+${formatted}`;
  }
  return formatted;
}
