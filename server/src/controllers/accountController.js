import Account from '../models/Account.js';

export const getAccounts = async (req, res) => {
  try {
    const accounts = await Account.find({ 
      user: req.user._id,
      isActive: true 
    }).sort('-createdAt');

    res.json({
      success: true,
      count: accounts.length,
      data: accounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAccount = async (req, res) => {
  try {
    const { name, type, currency, balance, institution } = req.body;

    const account = await Account.create({
      user: req.user._id,
      name,
      type,
      currency: currency || req.user.currency,
      balance: balance || 0,
      institution
    });

    res.status(201).json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isActive: false },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ message: 'Account not found' });
    }

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};