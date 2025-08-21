import InterestRate from '../models/InterestRate.js';

// Get all interest rates
export const getAllInterestRates = async (req, res) => {
  try {
    const interestRates = await InterestRate.find({}).sort({ term: 1 });
    
    res.status(200).json({
      status: 'success',
      data: interestRates
    });
  } catch (error) {
    console.error('Error fetching interest rates:', error.message, error.stack);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch interest rates: ${error.message}`
    });
  }
};

// Get interest rate by term
export const getInterestRateByTerm = async (req, res) => {
  try {
    const { term } = req.params;
    
    if (!term || isNaN(term)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid term parameter is required'
      });
    }
    
    const interestRate = await InterestRate.findOne({ term: Number(term) });
    
    if (!interestRate) {
      return res.status(404).json({
        status: 'error',
        message: `Interest rate for term ${term} not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: interestRate
    });
  } catch (error) {
    console.error('Error fetching interest rate:', error.message, error.stack);
    res.status(500).json({
      status: 'error',
      message: `Failed to fetch interest rate: ${error.message}`
    });
  }
};

// Create a new interest rate
export const createInterestRate = async (req, res) => {
  try {
    const { term, rate } = req.body;
    
    if (!term || isNaN(term) || !rate || isNaN(rate)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid term and rate are required'
      });
    }
    
    // Check if rate for this term already exists
    const existingRate = await InterestRate.findOne({ term: Number(term) });
    
    if (existingRate) {
      return res.status(400).json({
        status: 'error',
        message: `Interest rate for term ${term} already exists. Use update instead.`
      });
    }
    
    const newInterestRate = new InterestRate({
      term: Number(term),
      rate: Number(rate)
    });
    
    await newInterestRate.save();
    
    res.status(201).json({
      status: 'success',
      data: newInterestRate
    });
  } catch (error) {
    console.error('Error creating interest rate:', error.message, error.stack);
    res.status(500).json({
      status: 'error',
      message: `Failed to create interest rate: ${error.message}`
    });
  }
};

// Update an interest rate
export const updateInterestRate = async (req, res) => {
  try {
    const { term } = req.params;
    const { rate, isActive } = req.body;
    
    if (!term || isNaN(term)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid term parameter is required'
      });
    }
    
    if ((rate === undefined || isNaN(rate)) && isActive === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid rate or isActive status is required for update'
      });
    }
    
    const interestRate = await InterestRate.findOne({ term: Number(term) });
    
    if (!interestRate) {
      return res.status(404).json({
        status: 'error',
        message: `Interest rate for term ${term} not found`
      });
    }
    
    // Update fields if provided
    if (rate !== undefined && !isNaN(rate)) {
      interestRate.rate = Number(rate);
    }
    
    if (isActive !== undefined) {
      interestRate.isActive = Boolean(isActive);
    }
    
    await interestRate.save();
    
    res.status(200).json({
      status: 'success',
      data: interestRate
    });
  } catch (error) {
    console.error('Error updating interest rate:', error.message, error.stack);
    res.status(500).json({
      status: 'error',
      message: `Failed to update interest rate: ${error.message}`
    });
  }
};

// Delete an interest rate
export const deleteInterestRate = async (req, res) => {
  try {
    const { term } = req.params;
    
    if (!term || isNaN(term)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid term parameter is required'
      });
    }
    
    const interestRate = await InterestRate.findOne({ term: Number(term) });
    
    if (!interestRate) {
      return res.status(404).json({
        status: 'error',
        message: `Interest rate for term ${term} not found`
      });
    }
    
    // Check if this rate is being used by any active loans
    // This would require additional logic to check if any loans reference this rate
    
    await InterestRate.deleteOne({ term: Number(term) });
    
    res.status(200).json({
      status: 'success',
      message: `Interest rate for term ${term} has been deleted`
    });
  } catch (error) {
    console.error('Error deleting interest rate:', error.message, error.stack);
    res.status(500).json({
      status: 'error',
      message: `Failed to delete interest rate: ${error.message}`
    });
  }
};

// Seed initial interest rates
export const seedInterestRates = async (req, res) => {
  try {
    // Define the interest rates to seed
    const interestRates = [
      {
        term: 6,
        rate: 0.03, // 3% monthly interest
        isActive: true
      },
      {
        term: 12,
        rate: 0.025, // 2.5% monthly interest
        isActive: true
      },
      {
        term: 24,
        rate: 0.02, // 2% monthly interest
        isActive: true
      },
      {
        term: 36,
        rate: 0.018, // 1.8% monthly interest
        isActive: true
      }
    ];
    
    // Clear existing interest rates
    await InterestRate.deleteMany({});
    
    // Insert new interest rates
    const result = await InterestRate.insertMany(interestRates);
    
    return res.status(200).json({
      status: 'success',
      message: `Seeded ${result.length} interest rates successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error seeding interest rates:', error);
    return res.status(500).json({
      status: 'error',
      message: `Failed to seed interest rates: ${error.message}`
    });
  }
};
