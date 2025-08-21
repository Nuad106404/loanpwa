import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL)
  .catch(err => console.error('MongoDB connection error:', err));

// Thai names arrays
const thaiFirstNames = [
  'สมชาย', 'สมหญิง', 'วิชัย', 'วิภา', 'ประยุทธ', 'ประภา', 'อนุชา', 'อนุชิต',
  'นิรันดร', 'นิรมล', 'สุรชัย', 'สุรีย์', 'ธนาคาร', 'ธนพร', 'กิตติ', 'กิตติมา',
  'ชัยวัฒน์', 'ชัยรัตน์', 'พิชัย', 'พิมพ์', 'รัตนา', 'รัชนี', 'สมบัติ', 'สมบูรณ์',
  'วีระ', 'วีรวรรณ', 'ธีระ', 'ธีรดา', 'ปิยะ', 'ปิยดา', 'สุทธิ', 'สุทธิดา',
  'มานะ', 'มานิต', 'ชาญ', 'ชาลี', 'ศักดิ์', 'ศิริ', 'บุญ', 'บุญมี',
  'เกียรติ', 'เกศรา', 'ทรง', 'ทองใส', 'ปรีชา', 'ปรียา', 'สิทธิ', 'สิริกุล',
  'ชาคริต', 'ชาลินี', 'วัชระ', 'วัชรี'
];

const thaiLastNames = [
  'จันทร์', 'แสง', 'ทอง', 'เงิน', 'แก้ว', 'ใส', 'สุข', 'ดี',
  'มาลัย', 'วงศ์', 'ศรี', 'ทิพย์', 'รัตน์', 'พร', 'ชัย', 'วิชา',
  'สวัสดิ์', 'บุญ', 'เจริญ', 'รุ่งเรือง', 'มั่งมี', 'ร่ำรวย', 'สมบูรณ์', 'ปรีชา',
  'วิทยา', 'ศิลป์', 'กิจ', 'การ', 'ธุรกิจ', 'อุตสาห์', 'ขยัน', 'หมั่นเพียร',
  'อดทน', 'เสียสละ', 'มุ่งมั่น', 'ตั้งใจ', 'ใฝ่หา', 'แสวงหา', 'ค้นหา', 'พบ',
  'เจอ', 'ได้', 'รับ', 'ให้', 'แบ่งปัน', 'ช่วยเหลือ', 'สนับสนุน', 'ส่งเสริม'
];

const thaiProvinces = [
  'กรุงเทพมหานคร', 'เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน',
  'น่าน', 'พะเยา', 'แพร่', 'อุตรดิตถ์', 'ตาก', 'กำแพงเพชร', 'นครสวรรค์',
  'พิจิตร', 'พิษณุโลก', 'สุโขทัย', 'อุทัยธานี', 'ชัยนาท', 'ลพบุรี', 'สระบุรี',
  'สิงห์บุรี', 'อ่างทอง', 'พระนครศรีอยุธยา', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ',
  'นครนายก', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว', 'ชลบุรี', 'ระยอง',
  'จันทบุรี', 'ตราด', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'กาญจนบุรี', 'สุพรรณบุรี',
  'ราชบุรี', 'เลย', 'หนองคาย', 'หนองบัวลำภู', 'อุดรธานี', 'สกลนคร',
  'นครพนม', 'มุกดาหาร', 'ยโสธร', 'อำนาจเจริญ', 'ศรีสะเกษ', 'อุบลราชธานี',
  'บุรีรัมย์', 'สุรินทร์', 'ชัยภูมิ', 'ขอนแก่น', 'กาฬสินธุ์', 'มหาสารคาม',
  'ร้อยเอ็ด', 'นครราชสีมา', 'ลพบุรี', 'สระบุรี'
];

const bankNames = [
  'ธนาคารกรุงเทพ', 'ธนาคารกสิกรไทย', 'ธนาคารไทยพาณิชย์', 'ธนาคารกรุงไทย',
  'ธนาคารทหารไทยธนชาต', 'ธนาคารกรุงศรีอยุธยา', 'ธนาคารเกียรตินาคินภัทร',
  'ธนาคารซีไอเอ็มบี ไทย', 'ธนาคารยูโอบี', 'ธนาคารสแตนดาร์ดชาร์เตอร์ด'
];

const employmentStatuses = ['full-time', 'part-time', 'self-employed'];
const loanPurposes = [
  'เพื่อการศึกษา', 'เพื่อซื้อบ้าน', 'เพื่อซื้อรถ', 'เพื่อธุรกิจ', 'เพื่อการรักษาพยาบาล',
  'เพื่อการแต่งงาน', 'เพื่อการเดินทาง', 'เพื่อการลงทุน', 'เพื่อหนี้สิน', 'เพื่อฉุกเฉิน'
];

const relationships = ['บิดา', 'มารดา', 'พี่ชาย', 'พี่สาว', 'น้องชาย', 'น้องสาว', 'สามี', 'ภรรยา', 'ลูกชาย', 'ลูกสาว'];

// Function to generate random Thai national ID
function generateNationalId() {
  let id = '';
  for (let i = 0; i < 13; i++) {
    id += Math.floor(Math.random() * 10);
  }
  return id;
}

// Function to generate random phone number
function generatePhoneNumber() {
  const prefixes = ['08', '09', '06', '02'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  let number = prefix;
  for (let i = 0; i < 8; i++) {
    number += Math.floor(Math.random() * 10);
  }
  return number;
}

// Function to generate random bank account number
function generateAccountNumber() {
  let account = '';
  for (let i = 0; i < 12; i++) {
    account += Math.floor(Math.random() * 10);
  }
  return account;
}

// Function to generate random date of birth (age 20-60)
function generateDateOfBirth() {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - Math.floor(Math.random() * 40) - 20; // Age 20-60
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1; // Safe day range
  return new Date(birthYear, month - 1, day);
}

// Function to generate random income (15,000 - 100,000 THB)
function generateIncome() {
  return Math.floor(Math.random() * 85000) + 15000;
}

// Function to generate random zip code
function generateZipCode() {
  let zip = '';
  for (let i = 0; i < 5; i++) {
    zip += Math.floor(Math.random() * 10);
  }
  return zip;
}

// Function to get random array element
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Function to generate dummy users
function generateDummyUsers(count) {
  const users = [];
  const usedNationalIds = new Set();
  const usedPhones = new Set();

  for (let i = 0; i < count; i++) {
    let nationalId, phone;
    
    // Ensure unique national ID
    do {
      nationalId = generateNationalId();
    } while (usedNationalIds.has(nationalId));
    usedNationalIds.add(nationalId);

    // Ensure unique phone number
    do {
      phone = generatePhoneNumber();
    } while (usedPhones.has(phone));
    usedPhones.add(phone);

    const firstName = getRandomElement(thaiFirstNames);
    const lastName = getRandomElement(thaiLastNames);
    const province = getRandomElement(thaiProvinces);
    
    const user = {
      status: Math.random() > 0.1 ? 'active' : 'inactive', // 90% active, 10% inactive
      personalInformation: {
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: generateDateOfBirth(),
        nationalId: nationalId
      },
      phone: phone,
      password: '123456', // Simple password for testing
      plainPassword: '123456',
      role: 'user',
      isOnline: Math.random() > 0.7, // 30% online
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
      address: {
        homeNumber: `${Math.floor(Math.random() * 999) + 1}/${Math.floor(Math.random() * 99) + 1}`,
        subdistrict: `ตำบล${getRandomElement(thaiFirstNames)}`,
        district: `อำเภอ${getRandomElement(thaiLastNames)}`,
        province: province,
        zipCode: generateZipCode()
      },
      bankAccount: {
        bankName: getRandomElement(bankNames),
        accountNumber: generateAccountNumber(),
        accountName: `${firstName} ${lastName}`
      },
      financialInformation: {
        incomeMonthly: generateIncome(),
        employmentStatus: getRandomElement(employmentStatuses),
        loanPurpose: getRandomElement(loanPurposes)
      },
      availableBalance: Math.floor(Math.random() * 1000000), // 0-50,000 THB
      approvedLoanAmount: Math.floor(Math.random() * 100000), // 0-100,000 THB
      pendingWithdrawals: Math.floor(Math.random() * 10000), // 0-10,000 THB
      familyContact: {
        familyName: `${getRandomElement(thaiFirstNames)} ${getRandomElement(thaiLastNames)}`,
        familyPhone: generatePhoneNumber(),
        relationship: getRandomElement(relationships),
        address: {
          homeNumber: `${Math.floor(Math.random() * 999) + 1}`,
          subdistrict: `ตำบล${getRandomElement(thaiFirstNames)}`,
          district: `อำเภอ${getRandomElement(thaiLastNames)}`,
          province: getRandomElement(thaiProvinces),
          zipCode: generateZipCode()
        }
      },
      documents: {
        idCardFront: {
          url: null,
          verified: false
        },
        idCardBack: {
          url: null,
          verified: false
        },
        selfieWithId: {
          url: null,
          verified: false
        }
      }
    };

    users.push(user);
  }

  return users;
}

// Function to seed the database
async function seedUsers() {
  try {
    
    // Generate 100 dummy users
    const dummyUsers = generateDummyUsers(100);
    
    // Clear existing users (optional - comment out if you want to keep existing users)
    // await User.deleteMany({ role: 'user' });
    
    // Insert users in batches to avoid validation conflicts
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < dummyUsers.length; i += batchSize) {
      const batch = dummyUsers.slice(i, i + batchSize);
      
      try {
        const result = await User.insertMany(batch, { 
          ordered: false, // Continue inserting even if some fail
          validateBeforeSave: false // Skip validation for faster insertion
        });
        insertedCount += result.length;
      } catch (error) {
        // Count successful insertions even with some failures
        if (error.insertedDocs) {
          insertedCount += error.insertedDocs.length;
        }
      }
    }
    
    
    // Display some statistics
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ role: 'user', status: 'active' });
    const onlineUsers = await User.countDocuments({ role: 'user', isOnline: true });
    
    
    // Close the connection
    mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

// Run the seeder
seedUsers();
