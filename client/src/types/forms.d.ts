// Type declarations for form components
declare module '*/AddressInfoForm' {
  interface AddressData {
    street: string;
    city: string;
    province: string;
    zipCode: string;
    country: string;
  }

  interface AddressInfoFormProps {
    data: AddressData;
    onChange: (data: Partial<AddressData>) => void;
  }
  
  const AddressInfoForm: React.FC<AddressInfoFormProps>;
  export default AddressInfoForm;
}

declare module '*/LoanDetailsForm' {
  interface LoanData {
    amount: number;
    term: number;
    purpose: string;
    monthlyPayment: number;
  }

  interface LoanDetailsFormProps {
    data: LoanData;
    onChange: (data: Partial<LoanData>) => void;
  }
  
  const LoanDetailsForm: React.FC<LoanDetailsFormProps>;
  export default LoanDetailsForm;
}

declare module '*/FinancialInfoForm' {
  interface FinancialData {
    employmentStatus: string;
    monthlyIncome: string;
    occupation: string;
    employer: string;
    bankName: string;
    accountNumber: string;
    accountHolderName?: string;
  }

  interface FinancialInfoFormProps {
    data: FinancialData;
    onChange: (data: Partial<FinancialData>) => void;
  }
  
  const FinancialInfoForm: React.FC<FinancialInfoFormProps>;
  export default FinancialInfoForm;
}

declare module '*/PersonalInfoForm' {
  interface PersonalData {
    firstName: string;
    lastName: string;
    phone: string;
    nationalId: string;
    birthDate: string;
  }

  interface PersonalInfoFormProps {
    data: PersonalData;
    onChange: (data: Partial<PersonalData>) => void;
  }
  
  const PersonalInfoForm: React.FC<PersonalInfoFormProps>;
  export default PersonalInfoForm;
}
