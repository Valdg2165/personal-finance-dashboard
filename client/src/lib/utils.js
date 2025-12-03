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

export const formatDate = (date, format = 'long') => {
  if (!date) return 'No date';
  
  try {
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date';
    }
    
    const formats = {
      short: { year: 'numeric', month: 'short', day: 'numeric' },
      long: { year: 'numeric', month: 'long', day: 'numeric' },
      monthYear: { year: 'numeric', month: 'short' },
      time: { hour: '2-digit', minute: '2-digit' },
      full: { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
    };
    
    return dateObj.toLocaleDateString('fr-FR', formats[format] || formats.long);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

export const formatRelativeTime = (date) => {
  if (!date) return 'Unknown';
  
  try {
    const now = new Date();
    const past = new Date(date);
    
    if (isNaN(past.getTime())) return 'Invalid date';
    
    const diffInMs = now - past;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch (error) {
    console.error('Relative time error:', error);
    return 'Unknown';
  }
};