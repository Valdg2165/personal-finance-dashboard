// Simple rule-based categorization
export const autoCategories = async (transaction, categories) => {
  const description = transaction.description.toLowerCase();
  const merchant = transaction.merchant?.name?.toLowerCase() || '';
  
  // Income keywords
  const incomeKeywords = ['salary', 'paycheck', 'payment received', 'refund', 'interest'];
  
  // Expense category keywords
  const categoryRules = {
    'Food & Dining': ['restaurant', 'cafe', 'mcdonald', 'burger', 'pizza', 'starbucks', 'uber eats', 'deliveroo'],
    'Groceries': ['supermarket', 'grocery', 'carrefour', 'auchan', 'lidl', 'aldi', 'monoprix'],
    'Transportation': ['uber', 'taxi', 'metro', 'train', 'bus', 'parking', 'fuel', 'gas station'],
    'Shopping': ['amazon', 'ebay', 'shop', 'store', 'clothing', 'shoes'],
    'Entertainment': ['cinema', 'netflix', 'spotify', 'gaming', 'steam', 'playstation'],
    'Utilities': ['electricity', 'water', 'internet', 'phone', 'mobile'],
    'Health & Fitness': ['pharmacy', 'gym', 'fitness', 'doctor', 'hospital'],
    'Housing': ['rent', 'mortgage', 'insurance home'],
    'Subscriptions': ['subscription', 'netflix', 'spotify', 'amazon prime', 'youtube premium']
  };

  // Check for income
  if (transaction.type === 'income' || incomeKeywords.some(kw => description.includes(kw) || merchant.includes(kw))) {
    const incomeCategory = categories.find(c => c.type === 'income' && c.name === 'Salary');
    return {
      category: incomeCategory?._id,
      confidence: 0.7
    };
  }

  // Check expense categories
  for (const [categoryName, keywords] of Object.entries(categoryRules)) {
    if (keywords.some(kw => description.includes(kw) || merchant.includes(kw))) {
      const category = categories.find(c => c.name === categoryName);
      return {
        category: category?._id,
        confidence: 0.8
      };
    }
  }

  // Default to "Other Expense"
  const defaultCategory = categories.find(c => c.name === 'Other Expense');
  return {
    category: defaultCategory?._id,
    confidence: 0.3
  };
};
