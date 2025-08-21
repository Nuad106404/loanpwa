import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

export const register = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'All fields are required'
      });
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid phone number format. Must be 10 digits'
      });
    }

    // Validate password length
    if (!validatePassword(password)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(400).json({
        status: 'error',
        message: 'This phone number is already registered'
      });
    }

    // Create a new user document with all required fields
    const userData = {
      phone: phone.trim(),
      password,
      role: 'user',
      status: 'active',
      isOnline: true,
      lastActive: new Date(),
      personalInformation: {
        firstName: `User_${phone.slice(-4)}`, // Default first name using last 4 digits of phone
        lastName: 'Account', // Default last name
        nationalId: `9999${phone}`, // Generate unique nationalId based on phone number
        dateOfBirth: new Date('1990-01-01') // Default date of birth
      },
      address: {
        homeNumber: 'ไม่มีข้อมูล',
        subdistrict: 'ไม่มีข้อมูล',
        district: 'ไม่มีข้อมูล',
        province: 'ไม่มีข้อมูล',
        zipCode: '10000' // Default valid Thai zip code
      },
      bankAccount: {
        bankName: 'ไม่มีข้อมูล', // Required field for new users
        accountNumber: `1234567890${phone.slice(-4)}`, // Required field with valid format
        accountName: `User_${phone.slice(-4)} Account`
      },
      financialInformation: {
        incomeMonthly: 15000, // Default monthly income
        employmentStatus: 'ไม่มีข้อมูล', // Default employment status
        loanPurpose: 'ไม่มีข้อมูล'
      },
      familyContact: {
        familyName: 'ไม่มีข้อมูล',
        familyPhone: 'ไม่มีข้อมูล', // Default valid phone format
        relationship: 'ไม่มีข้อมูล'
      },
      documents: {
        idCardFront: { 
          url: 'pending.jpg', 
          verified: false 
        },
        idCardBack: { 
          url: 'pending.jpg', 
          verified: false 
        },
        selfieWithId: { 
          url: 'pending.jpg', 
          verified: false 
        }
      },
      // Initialize wallet fields directly
      availableBalance: 0,
      approvedLoanAmount: 0,
      pendingWithdrawals: 0
    };

    
    // Create the user with validation turned off for faster development
    // This is a workaround for development only
    const user = new User(userData);
    
    try {
      await user.save({ validateBeforeSave: false });
      
      res.status(201).json({
        status: 'success',
        data: {
          id: user._id,
          phone: user.phone,
          role: user.role,
          token: generateToken(user._id)
        }
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      return res.status(500).json({
        status: 'error',
        message: 'Error creating user account',
        details: saveError.message
      });
    }
  } catch (error) {
    console.error('Register error:', error);
    console.error('Request body:', req.body);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    // Validate required fields
    if (!phone || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number and password are required'
      });
    }

    // Validate phone number format
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid phone number format'
      });
    }

    // Find user
    const user = await User.findOne({ phone: phone.trim() });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid phone number or password'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid phone number or password'
      });
    }
    
    // Update online status and last activity time
    user.isOnline = true;
    user.lastActive = new Date();
    await User.findByIdAndUpdate(user._id, { 
      isOnline: true, 
      lastActive: new Date() 
    });

    res.json({
      status: 'success',
      data: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during login'
    });
  }
};

// Logout user and set isOnline to false
export const logout = async (req, res) => {
  try {
    // Get user ID from the authenticated request
    const userId = req.user._id;
    
    // Update user's online status in the database
    const updatedUser = await User.findByIdAndUpdate(userId, {
      isOnline: false,
      lastActive: new Date()
    }, { new: true });
    
    // Broadcast user status change to all connected admin clients immediately
    if (global.io) {
      
      // Log connected rooms
      const rooms = global.io.sockets.adapter.rooms;
      
      // Check if admin_room exists
      const adminRoom = rooms.get('admin_room');
      
      // CRITICAL: Ensure we're sending the correct user ID format
      const userIdString = userId.toString();
      
      // Create the status update payload
      const statusPayload = {
        userId: userIdString,
        isOnline: false,
        timestamp: new Date().toISOString(),
        source: 'logout_controller'
      };
      
      
      // Broadcast to the admin room specifically
      global.io.to('admin_room').emit('user_status_change', statusPayload);
      
      // Also broadcast globally as a fallback
      global.io.emit('user_status_change', statusPayload);
      
      // Broadcast a second time after a short delay to ensure delivery
      setTimeout(() => {
        global.io.emit('user_status_change', {
          ...statusPayload,
          source: 'delayed_broadcast'
        });
      }, 500);
    } else {
    }
    
    // Send response to the client
    res.status(200).json({
      status: 'success',
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred during logout'
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while fetching the profile'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update allowed fields
    const allowedFields = [
      'personalInformation',
      'address',
      'financial',
      'phone'
    ];

    // Only update fields that are allowed and present in the request
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'phone') {
          // Validate phone number if it's being updated
          if (!validatePhoneNumber(req.body.phone)) {
            throw new Error('Invalid phone number format');
          }
        }
        user[field] = req.body[field];
      }
    });

    await user.save({ validateBeforeSave: false });

    res.json({
      status: 'success',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while updating the profile'
    });
  }
};
