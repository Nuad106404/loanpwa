import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Get all admins (excluding superadmin making the request)
export const getAllAdmins = async (req, res) => {
  try {
    
    // Get all admins including the current superadmin
    const admins = await Admin.find({}).select('-password').sort({ createdAt: -1 });


    res.status(200).json({
      status: 'success',
      data: admins
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching admins'
    });
  }
};

// Get admin by ID
export const getAdminById = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid admin ID'
      });
    }

    const admin = await Admin.findById(adminId).select('-password');

    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: admin
    });
  } catch (error) {
    console.error('Get admin by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching admin'
    });
  }
};

// Create new admin
export const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, phone, email, password, role, permissions } = req.body;


    // Validation
    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'First name, last name, phone, and password are required'
      });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number must be 10 digits'
      });
    }

    // Check if admin with this phone already exists
    const existingAdmin = await Admin.findOne({ phone: cleanPhone });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'error',
        message: 'Admin with this phone number already exists'
      });
    }

    // Check if email is provided and unique
    if (email) {
      const existingEmailAdmin = await Admin.findOne({ email: email.toLowerCase() });
      if (existingEmailAdmin) {
        return res.status(400).json({
          status: 'error',
          message: 'Admin with this email already exists'
        });
      }
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate role
    const validRoles = ['admin', 'superadmin'];
    const adminRole = role || 'admin';
    if (!validRoles.includes(adminRole)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role. Must be admin or superadmin'
      });
    }

    // Create new admin
    const newAdmin = new Admin({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: cleanPhone,
      email: email ? email.toLowerCase().trim() : undefined,
      password,
      role: adminRole,
      permissions: permissions || {
        manageUsers: true,
        manageLoans: true
      }
    });

    await newAdmin.save();

    // Return admin data without password
    const adminData = await Admin.findById(newAdmin._id).select('-password');


    res.status(201).json({
      status: 'success',
      message: 'Admin created successfully',
      data: adminData
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while creating admin'
    });
  }
};

// Update admin
export const updateAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    const { firstName, lastName, phone, email, password, role, permissions } = req.body;


    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid admin ID'
      });
    }

    // Find the admin to update
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin not found'
      });
    }

    // Prevent superadmin from updating their own role to admin
    if (adminId === req.adminId.toString() && role && role !== 'superadmin') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot change your own role from superadmin'
      });
    }

    // Update fields if provided
    if (firstName) admin.firstName = firstName.trim();
    if (lastName) admin.lastName = lastName.trim();
    
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length !== 10) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number must be 10 digits'
        });
      }
      
      // Check if phone is already taken by another admin
      const existingAdmin = await Admin.findOne({ 
        phone: cleanPhone, 
        _id: { $ne: adminId } 
      });
      if (existingAdmin) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number already taken by another admin'
        });
      }
      
      admin.phone = cleanPhone;
    }

    if (email !== undefined) {
      if (email) {
        const cleanEmail = email.toLowerCase().trim();
        // Check if email is already taken by another admin
        const existingEmailAdmin = await Admin.findOne({ 
          email: cleanEmail, 
          _id: { $ne: adminId } 
        });
        if (existingEmailAdmin) {
          return res.status(400).json({
            status: 'error',
            message: 'Email already taken by another admin'
          });
        }
        admin.email = cleanEmail;
      } else {
        admin.email = undefined;
      }
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 6 characters long'
        });
      }
      admin.password = password; // Will be hashed by pre-save middleware
    }

    if (role) {
      const validRoles = ['admin', 'superadmin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid role. Must be admin or superadmin'
        });
      }
      admin.role = role;
    }

    if (permissions) {
      admin.permissions = {
        ...admin.permissions,
        ...permissions
      };
    }

    admin.updatedAt = new Date();
    await admin.save();

    // Return updated admin data without password
    const updatedAdmin = await Admin.findById(adminId).select('-password');


    res.status(200).json({
      status: 'success',
      message: 'Admin updated successfully',
      data: updatedAdmin
    });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while updating admin'
    });
  }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;


    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid admin ID'
      });
    }

    // Prevent superadmin from deleting themselves
    if (adminId === req.adminId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: 'You cannot delete your own account'
      });
    }

    // Find and delete the admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        status: 'error',
        message: 'Admin not found'
      });
    }

    await Admin.findByIdAndDelete(adminId);


    res.status(200).json({
      status: 'success',
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while deleting admin'
    });
  }
};

// Get admin statistics for super admin dashboard
export const getAdminStats = async (req, res) => {
  try {

    // Total admins count
    const totalAdmins = await Admin.countDocuments();

    // Active admins (logged in within last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeAdmins = await Admin.countDocuments({
      lastLogin: { $gte: thirtyDaysAgo }
    });

    // Admins by role
    const adminsByRole = await Admin.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent admin activities (last 10 logins)
    const recentActivity = await Admin.find({ lastLogin: { $exists: true } })
      .select('firstName lastName phone role lastLogin')
      .sort({ lastLogin: -1 })
      .limit(10);

    const stats = {
      totalAdmins,
      activeAdmins,
      adminsByRole: adminsByRole.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity
    };


    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error while fetching admin statistics'
    });
  }
};
