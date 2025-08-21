import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Admin schema (copy from your model)
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

// Compare password method
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);

const debugSuperAdmin = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect('mongodb://127.0.0.1:27017');
    console.log('✅ Connected to MongoDB');

    // Check if super admin exists
    console.log('🔍 Checking for existing super admin...');
    const existingSuperAdmin = await Admin.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin found:');
      console.log('   - ID:', existingSuperAdmin._id);
      console.log('   - Name:', existingSuperAdmin.firstName, existingSuperAdmin.lastName);
      console.log('   - Phone:', existingSuperAdmin.phone);
      console.log('   - Email:', existingSuperAdmin.email);
      console.log('   - Role:', existingSuperAdmin.role);
      
      // Test password comparison
      console.log('🔍 Testing password...');
      const isPasswordCorrect = await existingSuperAdmin.comparePassword('SuperAdmin123!');
      console.log('   - Password test result:', isPasswordCorrect ? '✅ CORRECT' : '❌ INCORRECT');
      
      if (!isPasswordCorrect) {
        console.log('🔧 Password is incorrect. Let\'s check the stored hash:');
        console.log('   - Stored hash:', existingSuperAdmin.password);
        
        // Try manual bcrypt comparison
        const manualCheck = await bcrypt.compare('SuperAdmin123!', existingSuperAdmin.password);
        console.log('   - Manual bcrypt check:', manualCheck ? '✅ CORRECT' : '❌ INCORRECT');
      }
    } else {
      console.log('❌ No super admin found');
      
      // Create super admin
      console.log('🔧 Creating super admin...');
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
      console.log('✅ Super admin created successfully');
      
      // Verify the created admin
      const newAdmin = await Admin.findOne({ role: 'superadmin' });
      const passwordTest = await newAdmin.comparePassword('SuperAdmin123!');
      console.log('✅ Password verification for new admin:', passwordTest ? 'CORRECT' : 'INCORRECT');
    }

    // Check all admins
    console.log('🔍 All admins in database:');
    const allAdmins = await Admin.find({});
    allAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. Phone: ${admin.phone}, Role: ${admin.role}, Name: ${admin.firstName} ${admin.lastName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 11000) {
      console.log('   - This is a duplicate key error (admin already exists)');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

debugSuperAdmin();
