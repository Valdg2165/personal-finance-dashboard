// Simple rule-based categorization
export const autoCategories = async (transaction, categories) => {
  try {
    const description = (transaction.description || '').toLowerCase();
    const merchant = (transaction.merchant?.name || '').toLowerCase();
    const searchText = `${description} ${merchant}`;
    
    // Income keywords
    const incomeKeywords = ['salary', 'paycheck', 'payment received', 'refund', 'interest', 'dividend', 'bonus', 'wage'];
    
    // Expense category keywords (expanded for better accuracy)
    const categoryRules = {
      'Food & Dining': ['restaurant', 'cafe', 'mcdonald', 'burger', 'pizza', 'starbucks', 'uber eats', 'deliveroo', 'just eat', 'takeaway', 'dining', 'kfc', 'subway'],
      'Groceries': ['supermarket', 'grocery', 'carrefour', 'auchan', 'lidl', 'aldi', 'monoprix', 'leclerc', 'intermarche', 'market'],
      'Transportation': ['uber', 'taxi', 'metro', 'train', 'bus', 'parking', 'fuel', 'gas station', 'transport', 'petrol', 'toll', 'sncf', 'ratp'],
      'Shopping': ['amazon', 'ebay', 'shop', 'store', 'clothing', 'shoes', 'retail', 'fashion', 'zara', 'h&m'],
      'Entertainment': ['cinema', 'netflix', 'spotify', 'gaming', 'steam', 'playstation', 'theater', 'concert', 'movie', 'disney+', 'hulu'],
      'Utilities': ['electricity', 'water', 'internet', 'phone', 'mobile', 'telecom', 'gas', 'energy', 'orange', 'sfr', 'bouygues', 'free'],
      'Health & Fitness': ['pharmacy', 'gym', 'fitness', 'doctor', 'hospital', 'medical', 'dental', 'health', 'clinic'],
      'Housing': ['rent', 'mortgage', 'insurance home', 'property', 'real estate', 'landlord', 'tenant'],
      'Subscriptions': ['subscription', 'netflix', 'spotify', 'amazon prime', 'youtube premium', 'monthly fee', 'annual fee']
    };

    // Check for income with higher priority
    if (transaction.type === 'income') {
      const incomeCategory = categories.find(c => c.type === 'income' && c.name === 'Salary');
      return {
        category: incomeCategory?._id || null,
        confidence: 0.8
      };
    }

    // Check income keywords even for transactions marked as expense (in case of refunds)
    if (incomeKeywords.some(kw => searchText.includes(kw))) {
      const incomeCategory = categories.find(c => c.type === 'income' && 
        (c.name === 'Salary' || c.name === 'Other Income'));
      return {
        category: incomeCategory?._id || null,
        confidence: 0.75
      };
    }

    // Check expense categories with scoring for multiple matches
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [categoryName, keywords] of Object.entries(categoryRules)) {
      const matches = keywords.filter(kw => searchText.includes(kw));
      if (matches.length > 0) {
        const score = matches.length / keywords.length;
        if (score > bestScore) {
          bestScore = score;
          const category = categories.find(c => c.name === categoryName);
          if (category) {
            bestMatch = {
              category: category._id,
              confidence: Math.min(0.85, 0.7 + (score * 0.2)) // Cap at 0.85 for rule-based
            };
          }
        }
      }
    }

    if (bestMatch) {
      return bestMatch;
    }

    // Default to "Other Expense" or "Other Income" based on type
    const defaultCategory = transaction.type === 'income' 
      ? categories.find(c => c.name === 'Other Income' && c.type === 'income')
      : categories.find(c => c.name === 'Other Expense' && c.type === 'expense');
    
    return {
      category: defaultCategory?._id || null,
      confidence: 0.3
    };
  } catch (error) {
    console.error('Categorization error:', error);
    return {
      category: null,
      confidence: 0
    };
  }
};
