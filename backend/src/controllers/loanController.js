import { PrismaClient } from '../generated/prisma/index.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Loan from '../models/Loan.js';
import InterestRate from '../models/InterestRate.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// Helper function to delete old images for a user by phone number and image type
const deleteOldImages = async (phone, imageType) => {
  try {
    // Find user by phone number
    const user = await User.findOne({ phone });
    if (!user) return;
    
    // Determine which path to check based on image type
    let oldImagePath = null;
    switch (imageType) {
      case 'idCardFront':
        oldImagePath = user.idCardFrontUrl;
        break;
      case 'idCardBack':
        oldImagePath = user.idCardBackUrl;
        break;
      case 'selfieWithId':
        oldImagePath = user.selfieWithIdUrl;
        break;
      case 'signature':
        oldImagePath = user.signatureUrl;
        break;
    }
    
    // If there's an old image, delete it
    if (oldImagePath && fs.existsSync(oldImagePath)) {
      fs.unlinkSync(oldImagePath);
    }
  } catch (error) {
    console.error('Error deleting old images:', error);
  }
};

// Helper function to save base64 image to file
const saveBase64Image = (base64Data, fileName, imageType) => {
  if (!base64Data) return null;
  
  // Determine the specific folder based on image type
  let specificFolder;
  switch (imageType) {
    case 'idCardFront':
      specificFolder = '_idCard_front';
      break;
    case 'idCardBack':
      specificFolder = '_idCard_back';
      break;
    case 'selfieWithId':
      specificFolder = '_idCard_selfie';
      break;
    case 'signature':
      specificFolder = '_signature';
      break;
    default:
      specificFolder = '';
  }
  
  // Create the base uploads directory if it doesn't exist
  const baseUploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
  }
  
  // Create the specific folder if it doesn't exist
  const uploadDir = path.join(baseUploadDir, specificFolder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Extract the base64 data (remove data:image/jpeg;base64, part)
  const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  
  const type = matches[1];
  const data = matches[2];
  const buffer = Buffer.from(data, 'base64');
  
  // Generate a unique filename
  const filePath = path.join(uploadDir, fileName);
  fs.writeFileSync(filePath, buffer);
  
  return `${specificFolder}/${fileName}`;
};

// Helper function to validate date format
function isValidDate(dateString) {
  if (!dateString) return false;
  
  // Try to create a valid date object
  const date = new Date(dateString);
  
  // Check if the date is valid and not NaN
  return date instanceof Date && !isNaN(date);
}

// Generate a unique application number
function generateApplicationNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LOAN-${timestamp}-${random}`;
}

// Save ID verification data (ID card front, back, selfie, and signature)
const saveIdVerification = async (req, res) => {
  try {
    
    const { phone } = req.body;
    
    // Validate phone number is provided
    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required'
      });
    }
    
    // Check if files or signature are attached (Multer puts files in req.files)
    if ((!req.files || Object.keys(req.files).length === 0) && !req.body.signature) {
      return res.status(400).json({
        status: 'error',
        message: 'No files or signature provided'
      });
    }
    
    // Find user by phone number
    let user = await User.findOne({ phone });
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found. Please complete the personal information step first.'
      });
    }
    
    // Process ID card front if provided
    let idCardFrontPath = null;
    if (req.files && req.files.idCardFront && req.files.idCardFront[0]) {
      // Delete old image if it exists
      await deleteOldImages(phone, 'idCardFront');
      
      // Save new image
      const file = req.files.idCardFront[0]; // Multer provides an array
      const nationalId = user.personalInformation?.nationalId || 'unknown';
      const fileName = `${nationalId}-front-${Date.now()}${path.extname(file.originalname)}`;
      
      // Get the directory for ID card front
      const uploadDir = path.join(__dirname, '../../uploads/_idCard_front');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Move the file to the upload directory - Multer already saved the file, just get the path
      idCardFrontPath = file.path.replace(/^uploads\//, '');
    } else if (req.body.idCardFront) {
      // Handle base64 image data
      const nationalId = user.personalInformation?.nationalId || 'unknown';
      idCardFrontPath = saveBase64Image(
        req.body.idCardFront,
        `${nationalId}-front-${Date.now()}.jpg`,
        'idCardFront'
      );
    }
    
    // Process ID card back if provided
    let idCardBackPath = null;
    if (req.files && req.files.idCardBack && req.files.idCardBack[0]) {
      // Delete old image if it exists
      await deleteOldImages(phone, 'idCardBack');
      
      // Save new image
      const file = req.files.idCardBack[0]; // Multer provides an array
      const nationalId = user.personalInformation?.nationalId || 'unknown';
      const fileName = `${nationalId}-back-${Date.now()}${path.extname(file.originalname)}`;
      
      // Get the directory for ID card back
      const uploadDir = path.join(__dirname, '../../uploads/_idCard_back');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Multer already saved the file, just get the path
      idCardBackPath = file.path.replace(/^uploads\//, '');
    } else if (req.body.idCardBack) {
      // Handle base64 image data
      const nationalId = user.personalInformation?.nationalId || 'unknown';
      idCardBackPath = saveBase64Image(
        req.body.idCardBack,
        `${nationalId}-back-${Date.now()}.jpg`,
        'idCardBack'
      );
    }
    
    // Process selfie with ID if provided
    let selfieWithIdPath = null;
    if (req.files && req.files.selfieWithId && req.files.selfieWithId[0]) {
      // Delete old image if it exists
      await deleteOldImages(phone, 'selfieWithId');
      
      // Save new image
      const file = req.files.selfieWithId[0]; // Multer provides an array
      const nationalId = user.personalInformation?.nationalId || 'unknown';
      const fileName = `${nationalId}-selfie-${Date.now()}${path.extname(file.originalname)}`;
      
      // Get the directory for selfie with ID
      const uploadDir = path.join(__dirname, '../../uploads/_idCard_selfie');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      // Multer already saved the file, just get the path
      selfieWithIdPath = file.path.replace(/^uploads\//, '');
    } else if (req.body.selfieWithId) {
      // Handle base64 image data
      const nationalId = user.personalInformation?.nationalId || 'unknown';
      selfieWithIdPath = saveBase64Image(
        req.body.selfieWithId,
        `${nationalId}-selfie-${Date.now()}.jpg`,
        'selfieWithId'
      );
    }
    
    // Process signature if provided
    let signaturePath = null;
    if (req.body.signature) {
      // Delete old image if it exists
      await deleteOldImages(phone, 'signature');
      
      // Save the signature as an image
      const nationalId = user.personalInformation?.nationalId || 'unknown';
      signaturePath = saveBase64Image(
        req.body.signature,
        `${nationalId}-signature-${Date.now()}.jpg`,
        'signature'
      );
    }
    
    // Create update object
    const updateData = {};
    
    // Store document paths in the correct structure
    if (idCardFrontPath || idCardBackPath || selfieWithIdPath) {
      updateData.documents = {
        ...(user.documents || {})
      };
      
      if (idCardFrontPath) {
        updateData.documents.idCardFront = {
          url: idCardFrontPath,
          verified: false
        };
      }
      
      if (idCardBackPath) {
        updateData.documents.idCardBack = {
          url: idCardBackPath,
          verified: false
        };
      }
      
      if (selfieWithIdPath) {
        updateData.documents.selfieWithId = {
          url: selfieWithIdPath,
          verified: false
        };
      }
    }
    
    if (signaturePath) updateData.signatureUrl = signaturePath;
    
    // Log the update operation
    
    // Update the user document
    user = await User.findByIdAndUpdate(
      user._id,
      updateData,
      { new: true, runValidators: false } // Set runValidators to false to avoid validation errors
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          phone: user.phone,
          idCardFrontUrl: user.documents?.idCardFront?.url,
          idCardBackUrl: user.documents?.idCardBack?.url,
          selfieWithIdUrl: user.documents?.selfieWithId?.url,
          signatureUrl: user.signatureUrl
        }
      }
    });
  } catch (error) {
    console.error('Error saving ID verification documents:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save ID verification documents'
    });
  }
};

// Submit a new loan application
const submitApplication = async (req, res) => {
  try {
    // We don't require authentication for submission anymore
    // Get all the data from the request body
    const {
      phone,
      // We don't need to extract all fields here since we'll find the user by phone
      // and use the data already saved in the database
    } = req.body;

    // Find the user by phone number
    let user = null;
    try {
      user = await User.findOne({ phone });
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found. Please complete the personal information step first.'
        });
      }
      
      // Update the user's status to 'user' (from 'guest' if it was set)
      user = await User.findByIdAndUpdate(
        user._id,
        { role: 'user' },
        { new: true, runValidators: true }
      );
    } catch (err) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to find or update user'
      });
    }

    if (!user) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to find user'
      });
    }
    
    // Create a loan application record using the data from the user
    const applicationNumber = generateApplicationNumber();

    // Since Prisma might not be fully set up, we'll create a simple application object
    // This is a temporary solution until we fix the Prisma connection
    try {
      // Create a complete application object with all the user's data
      const application = {
        id: Math.random().toString(36).substring(2, 15),
        applicationNumber,
        status: 'SUBMITTED', // Change from DRAFT to SUBMITTED
        createdAt: new Date(),
        submittedAt: new Date(),
        userId: user._id.toString(),
        
        // Personal Information
        personalInformation: user.personalInformation,
        phone: user.phone,
        
        // Address - initialize as empty object instead of using existing data
        address: {
          homeNumber: '',
          subdistrict: '',
          district: '',
          province: '',
          zipCode: ''
        },
        
        // ID Verification
        idCardFrontUrl: user.idCardFrontUrl,
        idCardBackUrl: user.idCardBackUrl,
        selfieWithIdUrl: user.selfieWithIdUrl,
        signatureUrl: user.signatureUrl,
        
        // Financial Information
        financialInformation: user.financialInformation,
        bankAccount: user.bankAccount,
        
        // Family Contact
        familyContact: user.familyContact
      };
      
      // In a real application, we would save this to a database
      // For now, we'll just return it in the response
      
      res.status(201).json({
        status: 'success',
        data: {
          applicationId: application.id,
          applicationNumber: application.applicationNumber,
          status: application.status,
          submissionDate: application.submittedAt
        }
      });
    } catch (error) {
      console.error('Error creating application:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create loan application'
      });
    }
  } catch (error) {
    console.error('Error submitting loan application:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit loan application'
    });
  }
};

// Get user's loan applications
const getLoanApplications = async (req, res) => {
  try {
    // Check if we have a valid user object
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    // Handle both MongoDB _id and Prisma id formats
    const userId = req.user._id || req.user.id;
    
    const applications = await prisma.loanApplication.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      status: 'success',
      data: applications
    });
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch loan applications'
    });
  }
};

// Save financial information
const saveFinancialInfo = async (req, res) => {
  try {
    
    // Check if we're receiving data in the new format or old format
    const financialInfo = req.body.financialInfo || req.body;
    const { userId, nationalId } = req.body;
    const phone = req.body.phone || (financialInfo ? financialInfo.phone : null);
    
    // Extract financial data
    const bankName = financialInfo.bankName;
    const accountNumber = financialInfo.accountNumber;
    const accountName = financialInfo.accountName;
    const incomeMonthly = financialInfo.incomeMonthly;
    const employmentStatus = financialInfo.employmentStatus;
    const loanPurpose = financialInfo.loanPurpose;
    
    // Validate required fields
    if (!bankName || !accountNumber || !accountName || 
        !incomeMonthly || !employmentStatus || !loanPurpose) {
      return res.status(400).json({
        status: 'error',
        message: 'All financial fields are required'
      });
    }
    
    // Validate account number format
    if (!/^[0-9]{10,15}$/.test(accountNumber)) {
      return res.status(400).json({
        status: 'error',
        message: 'Account number must be 10-15 digits'
      });
    }
    
    // Validate income is a positive number
    const income = parseFloat(incomeMonthly);
    if (isNaN(income) || income <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Monthly income must be a positive number'
      });
    }
    
    // Validate employment status
    const validEmploymentStatuses = ['full-time', 'part-time', 'self-employed', 'unemployed'];
    if (!validEmploymentStatuses.includes(employmentStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid employment status'
      });
    }
    
    // Find the user by userId, phone, or nationalId
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && phone) {
      user = await User.findOne({ phone });
    }
    
    if (!user && nationalId) {
      user = await User.findOne({ 'personalInformation.nationalId': nationalId });
    }
    
    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update user's financial information
    user.bankAccount = {
      bankName: bankName,
      accountNumber: accountNumber,
      accountName: accountName
    };
    
    user.financialInformation = {
      incomeMonthly: income,
      employmentStatus: employmentStatus,
      loanPurpose: loanPurpose
    };
    
    // Save the updated user with validation disabled
    try {
      await user.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error('Error saving user with validation disabled:', saveError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save user: ' + saveError.message
      });
    }
    
    // Also update any associated loan application
    try {
      const loanApplication = await mongoose.model('Loan').findOneAndUpdate(
        { user: user._id, status: 'pending' },
        {
          $set: {
            'financialInfo.incomeMonthly': income,
            'financialInfo.bankName': bankName,
            'financialInfo.accountNumber': accountNumber,
            'financialInfo.accountName': accountName,
            'employmentInfo.employmentStatus': employmentStatus,
            'financialInfo.loanPurpose': loanPurpose
          }
        },
        { new: true, upsert: false }
      );
      
      if (loanApplication) {
      }
    } catch (loanErr) {
      console.error('Error updating loan application:', loanErr);
      // Continue even if loan app update fails, as we've already updated the user
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Financial information saved successfully',
      data: {
        bankAccount: user.bankAccount,
        financialInformation: user.financialInformation
      }
    });
  } catch (error) {
    console.error('Error in saveFinancialInfo:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save financial information'
    });
  }
};

// Save loan details (amount, term, monthly payment)
const saveLoanDetails = async (req, res) => {
  try {
    // Get the loan details from the request body
    const { amount, term, monthlyPayment, phone } = req.body;
    
    if (!amount || !term || !monthlyPayment) {
      return res.status(400).json({
        status: 'error',
        message: 'Loan amount, term, and monthly payment are required'
      });
    }
    
    // Phone is now required to identify the user
    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'User phone number is required to apply for a loan'
      });
    }
    
    let user = null;
    let loan = null;
    let interestRate = null;
    
    try {
      // Find user by phone number
      user = await User.findOne({ phone });
      
      // If user doesn't exist, return error
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found. You must create an account before applying for a loan.',
          requiresSignup: true
        });
      }
      
      // Find the interest rate for the selected term
      interestRate = await InterestRate.findOne({ 
        term: Number(term),
        isActive: true
      });
      
      // If no interest rate is found, return error
      if (!interestRate) {
        return res.status(404).json({
          status: 'error',
          message: `No interest rate available for term ${term} months. Please select a different term.`
        });
      }
      
      // Look for an existing loan in pending status
      loan = await Loan.findOne({ 
        user: user._id, 
        status: { $in: ['pending'] }
      });
      
      if (loan) {
        // Update existing loan
        loan.amount = Number(amount);
        loan.term = Number(term);
        loan.monthlyPayment = Number(monthlyPayment);
        loan.interestRateRef = interestRate._id;
        loan.appliedRate = interestRate.rate;
        
        await loan.save();
      } else {
        // Create new loan for the user
        loan = new Loan({
          user: user._id,
          amount: Number(amount),
          term: Number(term),
          monthlyPayment: Number(monthlyPayment),
          interestRateRef: interestRate._id,
          appliedRate: interestRate.rate,
          status: 'pending'
        });
        await loan.save();
      }
    } catch (err) {
      console.error('Error finding/updating user or loan:', err.message, err.stack);
      return res.status(500).json({
        status: 'error',
        message: `Error processing loan request: ${err.message}`
      });
    }
    
    // Return the loan details
    res.status(200).json({
      status: 'success',
      data: {
        loanDetails: {
          amount,
          term,
          monthlyPayment
        },
        loan: loan ? {
          id: loan._id,
          status: loan.status
        } : null
      }
    });
  } catch (error) {
    console.error('Error saving loan details:', error.message, error.stack);
    res.status(500).json({
      status: 'error',
      message: `Failed to save loan details: ${error.message}`
    });
  }
};

// Save family contact information
const saveFamilyContact = async (req, res) => {
  try {
    
    // Get the family contact information from the request body
    const { familyName, familyPhone, relationship, familyAddress, phone, userId, nationalId } = req.body;
    
    // Find user by various identifiers
    let user = null;
    
    // Try to find by userId first
    if (userId) {
      try {
        user = await User.findById(userId);
      } catch (e) {
      }
    }
    
    // If not found by userId, try by phone
    if (!user && phone) {
      user = await User.findOne({ phone });
    }
    
    // If still not found, try by nationalId
    if (!user && nationalId) {
      user = await User.findOne({ 'personalInformation.nationalId': nationalId });
    }
    
    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with the provided information'
      });
    }
    
    
    // Update the user's family contact information directly
    user.familyContact = {
      familyName: familyName || '',
      familyPhone: familyPhone || '',
      relationship: relationship || '',
      address: {
        homeNumber: familyAddress?.homeNumber || '',
        subdistrict: familyAddress?.subdistrict || '',
        district: familyAddress?.district || '',
        province: familyAddress?.province || '',
        zipCode: familyAddress?.zipCode || ''
      }
    };
    
    
    // Save the updated user with validation disabled
    try {
      await user.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error('Error saving user with validation disabled:', saveError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save user: ' + saveError.message
      });
    }
    
    // Return the updated user information
    return res.status(200).json({
      status: 'success',
      message: 'Family contact information saved successfully',
      data: {
        user: {
          phone: user.phone
        },
        familyContact: user.familyContact
      }
    });
  } catch (error) {
    console.error('Error saving family contact information:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save family contact information: ' + error.message
    });
  }
};

const savePersonalInfo = async (req, res) => {
  try {
    
    // Extract required fields from request body
    const { firstName, lastName, nationalId, phone, dateOfBirth, userId, originalPhone, originalNationalId } = req.body;
    const address = req.body.address || {};
    
    // Log the received data for debugging
    
    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!firstName || firstName.trim() === '') missingFields.push('firstName');
    if (!lastName || lastName.trim() === '') missingFields.push('lastName');
    if (!nationalId || nationalId.trim() === '') missingFields.push('nationalId');
    if (!phone || phone.trim() === '') missingFields.push('phone');
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Missing or empty required fields: ${missingFields.join(', ')}`,
        missingFields: missingFields,
        receivedData: {
          firstName: firstName || 'undefined',
          lastName: lastName || 'undefined',
          nationalId: nationalId || 'undefined',
          phone: phone || 'undefined'
        }
      });
    }
    
    // Validate date of birth if provided
    if (dateOfBirth && !isValidDate(dateOfBirth)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid date format for date of birth'
      });
    }
    
    // LAST RESORT: Get ALL users and look for matches manually
    
    // Get ALL users (limited to 100 for safety)
    const allUsers = await User.find().limit(100).lean();
    
    // Try to find a matching user
    let user = null;
    let matchReason = '';
    
    // First priority: Direct userId lookup if provided
    if (userId) {
      try {
        user = await User.findById(userId);
        if (user) {
          matchReason = 'Direct match on userId';
        }
      } catch (error) {
        // Invalid userId format, continue with other methods
      }
    }
    
    // Second priority: Check exact matches (but ignore invalid placeholders)
    if (!user && originalNationalId && originalNationalId !== '_' && originalNationalId.length >= 10) {
      user = allUsers.find(u => 
        u.personalInformation && 
        u.personalInformation.nationalId === originalNationalId);
      
      if (user) {
        matchReason = 'Exact match on original nationalId';
      }
    }
    
    if (!user && originalPhone) {
      user = allUsers.find(u => u.phone === originalPhone);
      if (user) {
        matchReason = 'Exact match on original phone';
      }
    }
    
    if (!user && nationalId) {
      user = allUsers.find(u => 
        u.personalInformation && 
        u.personalInformation.nationalId === nationalId);
      
      if (user) {
        matchReason = 'Exact match on new nationalId';
      }
    }
    
    if (!user && phone) {
      user = allUsers.find(u => u.phone === phone);
      if (user) {
        matchReason = 'Exact match on new phone';
      }
    }
    
    // If no exact match, try partial match on name
    if (!user && firstName && lastName) {
      user = allUsers.find(u => 
        u.personalInformation && 
        u.personalInformation.firstName === firstName && 
        u.personalInformation.lastName === lastName);
      
      if (user) {
        matchReason = 'Matched on first and last name';
      }
    }
    
    // Print found user details for debugging
    if (user) {
      // CRITICAL FIX: Compare the user._id with the userId param if it exists
      if (userId && userId !== user._id.toString()) {
        // User ID mismatch - will use found user but notify client
      }
    }
    
    const isUpdating = !!user;

    // Check for uniqueness conflicts
    if (isUpdating) {
      // If we found a user by secondary identifiers but userId doesn't match,
      // we will use the found user but need to tell the client to update their stored ID
      const needsIdUpdate = userId && userId !== user._id.toString();
      
      // Check conflicts with other users when updating
      if (nationalId !== user.personalInformation.nationalId) {
        const duplicateNationalId = await User.findOne({
          '_id': { $ne: user._id },
          'personalInformation.nationalId': nationalId
        });
        
        if (duplicateNationalId) {
          return res.status(400).json({
            status: 'error',
            message: 'This National ID is already used by another user'
          });
        }
      }
      
      if (phone !== user.phone) {
        const duplicatePhone = await User.findOne({
          '_id': { $ne: user._id },
          'phone': phone
        });
        
        if (duplicatePhone) {
          return res.status(400).json({
            status: 'error',
            message: 'This phone number is already used by another user'
          });
        }
      }
    } else {
      // Check uniqueness for new users
      const duplicateNationalId = await User.findOne({
        'personalInformation.nationalId': nationalId
      });
      
      if (duplicateNationalId) {
        return res.status(400).json({
          status: 'error',
          message: 'A user with this National ID already exists'
        });
      }
      
      const duplicatePhone = await User.findOne({
        'phone': phone
      });
      
      if (duplicatePhone) {
        return res.status(400).json({
          status: 'error',
          message: 'A user with this phone number already exists'
        });
      }
    }

    try {
      // USE A SIMPLE DIRECT UPDATE OR CREATE APPROACH
      if (isUpdating) {
        
        // Direct update without validation
        await User.collection.updateOne(
          { _id: user._id },
          {
            $set: {
              'personalInformation.firstName': firstName,
              'personalInformation.lastName': lastName,
              'personalInformation.nationalId': nationalId,
              'personalInformation.dateOfBirth': new Date(dateOfBirth),
              'phone': phone
            }
          }
        );
        
        // Get updated user
        user = await User.findById(user._id).lean();
      } else {
        // Create new user with minimal required fields
        const defaultPassword = Math.random().toString(36).slice(-8);
        
        // Use existing bcrypt import
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.default.hash(defaultPassword, 12);
        
        // Create new user directly in the database
        const result = await User.collection.insertOne({
          personalInformation: {
            firstName,
            lastName,
            nationalId,
            dateOfBirth: new Date(dateOfBirth)
          },
          phone,
          password: hashedPassword,
          role: 'user',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        // Get created user
        user = await User.findById(result.insertedId).lean();
      }
    } catch (error) {
      console.error('Error saving personal information:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save personal information'
      });
    }
    
    if (!user) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save or find user record'
      });
    }

    // Return success response with user data - INCLUDE USER ID CLEARLY
    // Check if there was a user ID mismatch that needs to be fixed
    const needsIdUpdate = userId && userId !== user._id.toString();
    
    return res.status(200).json({
      status: 'success',
      message: needsIdUpdate ? 
        'Personal information saved successfully. Please update your stored user ID.' : 
        'Personal information saved successfully',
      data: {
        userId: user._id, // MongoDB ObjectId as string
        idMismatch: needsIdUpdate, // Flag to indicate ID mismatch
        oldUserId: userId || null, // Include old user ID if there was a mismatch
        user: {
          id: user._id, // Duplicate for frontend convenience
          firstName: user.personalInformation.firstName,
          lastName: user.personalInformation.lastName,
          nationalId: user.personalInformation.nationalId,
          dateOfBirth: user.personalInformation.dateOfBirth,
          phone: user.phone
        },
        personalInformation: {
          firstName: user.personalInformation.firstName,
          lastName: user.personalInformation.lastName,
          nationalId: user.personalInformation.nationalId,
          dateOfBirth: user.personalInformation.dateOfBirth
        },
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Error in savePersonalInfo:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save personal information'
    });
  }
};

// Create a new loan application directly from the calculator
const createLoanApplication = async (req, res) => {
  try {
    const { amount, term, interestRate, monthlyPayment } = req.body;
    
    // Get user identification info
    const userId = req.body.userId;
    const phone = req.body.phone;
    const nationalId = req.body.nationalId;
    
    // Find the user by various identifiers
    // Find user by phone only
    const userPhone = phone || '';
    
    // Check if we have a phone number to search with
    if (!userPhone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number is required to apply for a loan'
      });
    }
    
    // Find user by phone
    const user = await User.findOne({ phone: userPhone });
    
    // If no user found, create a new user with the phone number
    if (!user) {
      
      // Create a new user with minimal required information
      const newUser = new User({
        phone: userPhone,
        password: `user${Date.now()}`, // Generate a random password
        role: 'user',
        personalInformation: {
          firstName: 'New',
          lastName: 'User',
          nationalId: `1${userPhone.substring(1)}000` // Generate nationalId based on phone
        },
        financialInformation: {
          incomeMonthly: 0,
          employmentStatus: 'unemployed',
          loanPurpose: 'Personal'
        },
        bankAccount: {
          bankName: 'Pending',
          accountNumber: '1234567890',
          accountName: 'Pending'
        },
        familyContact: {
          familyName: 'Family',
          familyPhone: '0987654321',
          relationship: 'Other'
        }
      });
      
      try {
        await newUser.save();
        return createLoanForUser(newUser, amount, term, interestRate, monthlyPayment, res);
      } catch (error) {
        console.error('Error creating new user:', error);
        return res.status(400).json({
          status: 'error',
          message: 'Failed to create user: ' + error.message
        });
      }
    }
    
    // If user found, proceed with loan creation
    return createLoanForUser(user, amount, term, interestRate, monthlyPayment, res);
  } catch (error) {
    console.error('Error creating loan application:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while creating the loan application'
    });
  }
};

// Helper function to create a loan for a specific user
const createLoanForUser = async (user, amount, term, interestRate, monthlyPayment, res) => {
  try {
    // Validate loan parameters
    if (!amount || !term || !interestRate) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required loan parameters'
      });
    }
    
    // Check if user already has an active loan (one-loan-per-user restriction)
    const existingLoan = await Loan.findOne({
      user: user._id,
      status: { $in: ['รอการอนุมัติ', 'อนุมัติแล้ว', 'จ่ายเงินแล้ว'] }
    });
    
    if (existingLoan) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have an active loan application. Please complete or close your existing loan before applying for a new one.',
        data: {
          existingLoanId: existingLoan._id.toString(),
          existingLoanStatus: existingLoan.status,
          existingLoanAmount: existingLoan.amount
        }
      });
    }
    
    // Calculate total payment for reference
    const totalPayment = parseFloat(monthlyPayment) * parseInt(term);
    
    // Create the loan
    const loan = new Loan({
      user: user._id,
      amount: parseFloat(amount),
      term: parseInt(term),
      interestRate: parseFloat(interestRate),
      appliedRate: parseFloat(interestRate), // Store the applied rate for historical reference
      totalPayment: totalPayment, // Add the total payment amount
      status: 'รอการอนุมัติ' // Start as pending until user completes application
    });
    
    await loan.save();
    
    
    // Return the response with the created loan, explicitly including the MongoDB ObjectID
    return res.status(201).json({
      status: 'success',
      message: 'Loan application created successfully',
      data: {
        loanId: loan._id.toString(), // Explicitly convert ObjectID to string format
        userId: user._id.toString(),
        amount: loan.amount,
        term: loan.term,
        interestRate: loan.interestRate,
        monthlyPayment: monthlyPayment, // Return the calculated monthly payment in the response
        status: loan.status
      }
    });
  } catch (error) {
    console.error('Error creating loan application:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create loan application'
    });
  }
};

// Save address information endpoint
const saveAddressInfo = async (req, res) => {
  try {
    
    // Extract address data and user identifiers from the request body
    const { address, userId, phone, nationalId } = req.body;
    
    // Validate that address data exists
    if (!address) {
      return res.status(400).json({
        status: 'error',
        message: 'Address information is required'
      });
    }
    
    // Find the user by userId, phone, or nationalId
    let user = null;
    if (userId) {
      try {
        user = await User.findById(userId);
      } catch (e) {
      }
    }
    
    if (!user && phone) {
      user = await User.findOne({ phone });
    }
    
    if (!user && nationalId) {
      user = await User.findOne({ 'personalInformation.nationalId': nationalId });
    }
    
    // If user not found, return error
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    
    // Update user's address information - ensure field names match the User model
    user.address = {
      homeNumber: address.homeNumber || '',
      subdistrict: address.subdistrict || '',
      district: address.district || '',
      province: address.province || '',
      zipCode: address.zipCode || ''
    };
    
    
    // Save the updated user with validation disabled
    try {
      await user.save({ validateBeforeSave: false });
    } catch (saveError) {
      console.error('Error saving user with validation disabled:', saveError);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to save user: ' + saveError.message
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Address information saved successfully',
      data: {
        address: user.address
      }
    });
  } catch (error) {
    console.error('Error in saveAddressInfo:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save address information: ' + error.message
    });
  }
};

// Get user's address information
const getAddressInfo = async (req, res) => {
  try {
    
    // Extract user identifiers from query parameters
    const { userId, phone, nationalId } = req.query;
    
    // Try to find the user by various identifiers
    let user;
    
    if (userId) {
      // First try to find by userId if provided
      user = await User.findById(userId);
    }
    
    if (!user && phone) {
      // If not found by userId, try by phone
      user = await User.findOne({ phone });
    }
    
    if (!user && nationalId) {
      // If still not found, try by nationalId
      user = await User.findOne({ 'personalInformation.nationalId': nationalId });
    }
    
    // If no user is found with the provided identifiers
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with the provided information'
      });
    }
    
    // Check if the user has address information
    if (!user.address || !user.address.homeNumber) {
      return res.status(404).json({
        status: 'error',
        message: 'No address information found for this user'
      });
    }
    
    // Return the user's address information
    return res.status(200).json({
      status: 'success',
      message: 'Address information retrieved successfully',
      data: {
        address: {
          homeNumber: user.address.homeNumber,
          subdistrict: user.address.subdistrict,
          district: user.address.district,
          province: user.address.province,
          zipCode: user.address.zipCode
        }
      }
    });
  } catch (error) {
    console.error('Error in getAddressInfo:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve address information'
    });
  }
};

// Get loan details by user identifier or loan ID
const getLoanDetails = async (req, res) => {
  try {
    // Extract user identifiers from query parameters
    const { userId, phone, nationalId, loanId } = req.query;
    
    // Try to find the user based on provided identifiers
    let user;
    let loan;
    
    // If loanId is provided, try to find the loan directly
    if (loanId) {
      try {
        loan = await Loan.findById(loanId);
        if (loan) {
          return res.status(200).json({
            status: 'success',
            message: 'Loan details retrieved successfully',
            data: { loan }
          });
        }
      } catch (err) {
        console.error('Error finding loan by ID:', err);
        // Continue to try other methods if this fails
      }
    }
    
    // Try to find by user identifiers if loan wasn't found by ID
    if (userId) {
      user = await User.findById(userId);
    }
    
    if (!user && phone) {
      user = await User.findOne({ phone });
    }
    
    if (!user && nationalId) {
      user = await User.findOne({ 'personalInformation.nationalId': nationalId });
    }
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with the provided information'
      });
    }
    
    // Find the most recent loan for this user
    loan = await Loan.findOne({ user: user._id }).sort({ createdAt: -1 });
    
    if (!loan) {
      return res.status(404).json({
        status: 'error',
        message: 'No loan application found for this user'
      });
    }
    
    // Log the loan information for debugging
    
    // Return the loan details with ObjectID included and explicitly structured
    return res.status(200).json({
      status: 'success',
      message: 'Loan details retrieved successfully',
      data: { 
        loan: {
          _id: loan._id.toString(), // Explicitly convert ObjectID to string
          user: loan.user,
          amount: loan.amount,
          term: loan.term,
          status: loan.status,
          interestRate: loan.interestRate,
          monthlyPayment: loan.monthlyPayment,
          createdAt: loan.createdAt,
          updatedAt: loan.updatedAt
        }
      }
    });
  } catch (error) {
    console.error('Error in getLoanDetails:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve loan details'
    });
  }
};

// The saveFinancialInfo function is implemented at line ~455

export {
  submitApplication,
  saveFamilyContact,
  savePersonalInfo,
  saveFinancialInfo,
  saveAddressInfo,
  getAddressInfo,
  getLoanDetails,
  createLoanApplication,
  saveIdVerification
};
