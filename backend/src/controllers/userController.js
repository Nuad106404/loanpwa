import User from '../models/User.js';
import { uploadFile } from '../utils/fileUpload.js';

// Register a new user with all required fields
export const register = async (req, res) => {
  try {
    const {
      personalInformation,
      phone,
      password,
      address,
      bankAccount,
      financialInformation,
      familyContact
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number already registered'
      });
    }

    // Handle document uploads
    const documents = {};
    if (req.files) {
      if (req.files.idCardFront) {
        documents.idCardFront = {
          url: await uploadFile(req.files.idCardFront[0]),
          verified: false
        };
      }
      if (req.files.idCardBack) {
        documents.idCardBack = {
          url: await uploadFile(req.files.idCardBack[0]),
          verified: false
        };
      }
      if (req.files.selfieWithId) {
        documents.selfieWithId = {
          url: await uploadFile(req.files.selfieWithId[0]),
          verified: false
        };
      }
    }

    // Create new user
    const user = new User({
      status: 'pending',
      personalInformation,
      phone,
      password,
      plainPassword: password, // Store the plaintext password
      address,
      bankAccount,
      financialInformation,
      familyContact,
      documents
    });

    // Save user
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Error registering user'
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Don't allow updates to certain fields
    delete updates.password;
    delete updates.role;
    delete updates.status;
    delete updates.documents;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update user documents
export const updateDocuments = async (req, res) => {
  try {
    const documents = {};
    if (req.files) {
      if (req.files.idCardFront) {
        documents['documents.idCardFront'] = {
          url: await uploadFile(req.files.idCardFront[0]),
          verified: false
        };
      }
      if (req.files.idCardBack) {
        documents['documents.idCardBack'] = {
          url: await uploadFile(req.files.idCardBack[0]),
          verified: false
        };
      }
      if (req.files.selfieWithId) {
        documents['documents.selfieWithId'] = {
          url: await uploadFile(req.files.selfieWithId[0]),
          verified: false
        };
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: documents },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};
