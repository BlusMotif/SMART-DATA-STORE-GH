/**
 * Tax Configuration for Paystack Payments
 * This tax is applied to all payments processed through Paystack
 */

// Tax rate as a decimal (2.5% = 0.025)
export const PAYSTACK_TAX_RATE = 0.025;

// Tax rate as a percentage for display
export const PAYSTACK_TAX_PERCENTAGE = 2.5;

/**
 * Calculate tax amount
 * @param subtotal - The base amount before tax
 * @returns The tax amount
 */
export function calculateTax(subtotal: number): number {
  return Math.round((subtotal * PAYSTACK_TAX_RATE) * 100) / 100;
}

/**
 * Calculate total amount including tax
 * @param subtotal - The base amount before tax
 * @returns Object with subtotal, tax, and total
 */
export function calculateTotalWithTax(subtotal: number): {
  subtotal: number;
  tax: number;
  total: number;
} {
  const tax = calculateTax(subtotal);
  const total = Math.round((subtotal + tax) * 100) / 100;
  return { subtotal, tax, total };
}
