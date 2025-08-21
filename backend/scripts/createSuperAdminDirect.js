import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Define Admin schema directly to avoid import issues
const adminSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'superadmin'], default: 'admin' },
  permissions: {
    manageUsers: { type: Boolean, default: true },
    manageLoans: { type: Boolean, default: true }
  },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Create the model
const Admin = mongoose.model('Admin', adminSchema);

const createSuperAdmin = async () => {
  try {
    // Try multiple connection strings
    const connectionStrings = [
      'mongodb+srv://saiaungnyunt001:106404Rin@loan.cjzbexw.mongodb.net/'
    ];

    let connected = false;
    for (const connectionString of connectionStrings) {
      try {
        await mongoose.connect(connectionString);
        connected = true;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!connected) {
      process.exit(1);
    }

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      process.exit(0);
    }

    // Create super admin user
    const superAdminData = {
      firstName: 'Super',
      lastName: 'Admin',
      phone: '0000000000',
      email: 'superadmin@loanapp.com',
      password: 'SuperAdmin123!',
      role: 'superadmin',
      permissions: {
        manageUsers: true,
        manageLoans: true
      }
    };

    const superAdmin = new Admin(superAdminData);
    await superAdmin.save();


  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    if (error.code === 11000) {
    }
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
createSuperAdmin();
