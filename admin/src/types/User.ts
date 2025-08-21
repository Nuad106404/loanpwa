export type UserStatus = 'active' | 'inactive' | 'suspended';

export type LoanStatus = 'รอการอนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ' | 'จ่ายเงินแล้ว' | 'เสร็จสิ้น' | 'ผิดนัด';

export type TransactionStatus = 'รอการอนุมัติ' | 'อนุมัติแล้ว' | 'ปฏิเสธ' | 'เสร็จสิ้น' | 'ไม่ผ่าน' | 'ล้มเหลว';

export interface User {
  id: string;
  _id?: string;
  status: UserStatus;
  password?: string; // Added password field
  plainPassword?: string; // Added plaintext password field
  isOnline?: boolean; // User online status
  lastActive?: Date; // Last activity timestamp
  lastSeen?: string; // Last seen timestamp for activity tracking
  currentSocketId?: string; // Current active socket connection ID
  // Multi-layer detection fields
  hasActiveSocket?: boolean; // Has current active socket
  hasAnySocket?: boolean; // Has any socket in history
  socketCount?: number; // Number of socket connections
  activeSocketId?: string; // Active socket ID from multi-layer detection
  dbIsOnline?: boolean; // Database online status for comparison
  isReallyOnline?: boolean; // Final multi-layer online determination
  connectionDetails?: {
    activeSocket?: boolean;
    anySocket?: boolean;
    socketCount?: number;
    activeSocketId?: string;
    databaseOnline?: boolean;
  };
  personalInformation?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    nationalId: string;
  };
  phone: string;
  address: {
    homeNumber: string;
    subdistrict: string;
    district: string;
    province: string;
    zipCode: string;
  };
  bankAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  financialInformation: {
    incomeMonthly: number;
    employmentStatus: string;
    loanPurpose: string;
  };
  availableBalance?: number;
  approvedLoanAmount?: number;
  pendingWithdrawals?: number;
  mostRecentLoanId?: string;
  familyContact: {
    familyName: string;
    familyPhone: string;
    relationship: string;
    address?: {
      homeNumber?: string;
      subdistrict?: string;
      district?: string;
      province?: string;
      zipCode?: string;
    };
  };
  documents: {
    idCardFront: {
      url: string;
      verified: boolean;
    };
    idCardBack: {
      url: string;
      verified: boolean;
    };
    selfieWithId: {
      url: string;
      verified: boolean;
    };
  };
  signatureUrl?: string;
  loans?: number;
  totalBorrowed?: number;
  term?: number;
  monthlyPayment?: number;
  totalPayment?: number;
  loanStatus?: LoanStatus;
  createdAt: string;
  updatedAt: string;
}
