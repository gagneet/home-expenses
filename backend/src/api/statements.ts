// backend/src/api/statements.ts (continued)
    // Build query
    const query: any = {};
    
    // Add date range conditions
    if (startDate || endDate) {
      query.date = {};
      
      if (startDate) {
        query.date.$gte = startDate;
      }
      
      if (endDate) {
        query.date.$lte = endDate;
      }
    }
    
    // Add category filters
    if (category) {
      query['category.name'] = category;
      
      if (subcategory) {
        query['category.subcategory'] = subcategory;
      }
    }
    
    // Get statements for this user to filter transactions
    const statements = await StatementModel.find({ userId });
    const statementIds = statements.map(s => s.id);
    
    query.statementId = { $in: statementIds };
    
    // Execute query with pagination
    const transactions = await TransactionModel.find(query)
      .sort({ date: -1 })
      .skip(offset)
      .limit(limit);
    
    // Get total count for pagination
    const totalCount = await TransactionModel.countDocuments(query);
    
    res.status(200).json({
      transactions,
      pagination: {
        total: totalCount,
        offset,
        limit
      }
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: error.message || 'Error fetching transactions' });
  }
});

/**
 * Get monthly trends
 * GET /api/statements/trends
 */
router.get('/trends', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const months = parseInt(req.query.months as string) || 12;
    const category = req.query.category as string;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    
    // Get statements for this user
    const statements = await StatementModel.find({
      userId,
      'statementPeriod.start': { $gte: startDate },
      'statementPeriod.end': { $lte: endDate }
    }).populate('transactions');
    
    // Generate trends data
    const trends = [];
    
    // Initialize with empty data for each month
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      trends.push({
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        income: 0,
        expenses: 0,
        savings: 0
      });
    }
    
    // Aggregate transaction data by month
    for (const statement of statements) {
      for (const transaction of statement.transactions) {
        const transactionDate = new Date(transaction.date);
        const month = transactionDate.toLocaleString('default', { month: 'short' });
        const year = transactionDate.getFullYear();
        
        // Skip if doesn't match category filter
        if (category && transaction.category?.name !== category) {
          continue;
        }
        
        // Find matching month in trends data
        const monthData = trends.find(t => t.month === month && t.year === year);
        
        if (monthData) {
          if (transaction.amount > 0) {
            monthData.income += transaction.amount;
          } else {
            monthData.expenses += Math.abs(transaction.amount);
          }
          
          monthData.savings = monthData.income - monthData.expenses;
        }
      }
    }
    
    // Sort chronologically
    trends.sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`);
      const dateB = new Date(`${b.month} 1, ${b.year}`);
      return dateA.getTime() - dateB.getTime();
    });
    
    res.status(200).json(trends);
  } catch (error: any) {
    console.error('Error generating trends:', error);
    res.status(500).json({ message: error.message || 'Error generating monthly trends' });
  }
});

export default router;