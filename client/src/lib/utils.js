import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount, currency = 'EUR') => {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    // Fallback if Intl fails
    return `${amount.toFixed(2)} ${currency}`;
  }
};

export const formatDate = (date) => {
  try {
    // Create date object first
    const dateObj = new Date(date);
    
    // Check if valid date
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    // Use toLocaleDateString for formatting
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    // Fallback to simple format
    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0];
  }
};
