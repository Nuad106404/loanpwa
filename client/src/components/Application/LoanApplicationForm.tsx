import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getUserProfile } from '../../services/userService';

// Step components
import PersonalInfoForm from '../Application/Forms/PersonalInfoForm';
import IdVerificationForm from '../Application/Forms/IdVerificationForm';
import AddressInfoForm from '../Application/Forms/AddressInfoForm';
import FinancialInfoForm from '../Application/Forms/FinancialInfoForm';
import FamilyContactForm from '../Application/Forms/FamilyContactForm';
import ReviewForm from '../Application/Forms/ReviewForm';
import LoanAgreement from '../Application/Forms/LoanAgreement';
import SuccessMessage from '../Application/Forms/SuccessMessage';
import ProgressBar from '../Application/Forms/ProgressBar';

// Types
export interface LoanApplicationData {
  // Step 1: Personal Information
  personalInfo: {
    firstName: string;
    lastName: string;
    nationalId: string;
    phone: string;
    dateOfBirth: string;
  };
  // Step 2: ID Verification
  idVerification: {
    idCardFront: File | null;
    idCardBack: File | null;
    selfieWithId: File | null;
    signature: string;
  };
  // Step 3: Address
  address: {
    homeNumber: string;
    subdistrict: string;
    district: string;
    province: string;
    zipCode: string;
  };
  // Step 4: Financial Information
  financialInfo: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
    monthlyIncome: number;
    employmentStatus: 'full-time' | 'part-time' | 'self-employed' | 'unemployed';
    loanPurpose: string;
  };
  // Step 5: Family Contact
  familyContact: {
    name: string;
    phone: string;
    relationship: string;
    address: {
      homeNumber: string;
      subdistrict: string;
      district: string;
      province: string;
      zipCode: string;
    };
  };
  // Step 6: Review & Submit
  loanDetails?: {
    amount: number;
    term: number;
    monthlyPayment: number;
    interestRate: number;
  };
  applicationId?: string;
  mongoDbId?: string; // Added to store the actual MongoDB ObjectID
  applicationStatus?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
}

const LoanApplicationForm: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Initialize currentStep from localStorage if available, otherwise start at step 1
  const [currentStep, setCurrentStep] = useState<number>(() => {
    const savedStep = localStorage.getItem('loanApplicationStep');
    return savedStep ? parseInt(savedStep, 10) : 1;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [mongoDbId, setMongoDbId] = useState<string>('');
  
  // State for signature handling
  const [signatureFromServer, setSignatureFromServer] = useState<string>('');
  const [isLoadingSignature, setIsLoadingSignature] = useState<boolean>(false);
  
  // Fetch signature from server when component mounts or when moving to step 8
  useEffect(() => {
    // Only fetch signature when on step 8 (agreement)
    if (currentStep === 8) {
      const fetchUserSignature = async () => {
        setIsLoadingSignature(true);
        try {
          const response = await getUserProfile();
          if (response.status === 'success' && response.data) {
            if (response.data.signatureUrl) {
              // Clean the signature URL before saving to state and localStorage
              let cleanUrl = response.data.signatureUrl;
              
              // Fix duplicate signature path issue
              cleanUrl = cleanUrl.replace(/signature\/signature\//g, 'signature/');
              cleanUrl = cleanUrl.replace(/signature\/_signature\//g, '_signature/');
              
              setSignatureFromServer(cleanUrl);
              // Also update localStorage for consistency
              localStorage.setItem('userSignature', cleanUrl);
            }
          }
        } catch (error) {
          console.error('Error fetching user signature:', error);
        } finally {
          setIsLoadingSignature(false);
        }
      };
      
      fetchUserSignature();
    }
  }, [currentStep]);
  const [formData, setFormData] = useState<LoanApplicationData>({
    personalInfo: {
      firstName: user?.personalInformation?.firstName || '',
      lastName: user?.personalInformation?.lastName || '',
      nationalId: user?.personalInformation?.nationalId || '',
      phone: user?.phone || '',
      dateOfBirth: user?.personalInformation?.dateOfBirth ? 
        new Date(user.personalInformation.dateOfBirth).toISOString().split('T')[0] : ''
    },
    idVerification: {
      idCardFront: null,
      idCardBack: null,
      selfieWithId: null,
      signature: ''
    },
    address: {
      homeNumber: user?.address?.homeNumber || '',
      subdistrict: user?.address?.subdistrict || '',
      district: user?.address?.district || '',
      province: user?.address?.province || '',
      zipCode: user?.address?.zipCode || ''
    },
    financialInfo: {
      bankName: user?.bankAccount?.bankName || '',
      accountNumber: user?.bankAccount?.accountNumber || '',
      accountHolderName: user?.bankAccount?.accountName || '',
      monthlyIncome: user?.financialInformation?.incomeMonthly ? 
        parseFloat(user.financialInformation.incomeMonthly) : 0,
      employmentStatus: (user?.financialInformation?.employmentStatus as any) || 'full-time',
      loanPurpose: user?.financialInformation?.loanPurpose || ''
    },
    familyContact: {
      name: user?.familyContact?.familyName || '',
      phone: user?.familyContact?.familyPhone || '',
      relationship: user?.familyContact?.relationship || '',
      address: {
        homeNumber: user?.familyContact?.address?.houseNumber || '',
        subdistrict: user?.familyContact?.address?.subdistrict || '',
        district: user?.familyContact?.address?.district || '',
        province: user?.familyContact?.address?.province || '',
        zipCode: user?.familyContact?.address?.zipCode || ''
      }
    }
  });

  // Load stored form data from localStorage on initial render
  useEffect(() => {
    try {
      const savedFormData = localStorage.getItem('loanApplicationData');
      
      if (savedFormData) {
        const parsedData = JSON.parse(savedFormData);
        // Don't load files from localStorage as they can't be serialized properly
        setFormData(() => ({
          ...parsedData,
          idVerification: {
            ...parsedData.idVerification,
            idCardFront: null,
            idCardBack: null,
            selfieWithId: null
          }
        }));
      }
      
      // Step is now initialized directly in the useState call
      // No need to set it again here
      
      // Load loan details from localStorage if available
      const loanDetails = localStorage.getItem('loanDetails');
      if (loanDetails) {
        const parsedLoanDetails = JSON.parse(loanDetails);
        setFormData(prevFormData => ({
          ...prevFormData,
          loanDetails: parsedLoanDetails
        }));
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, []);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    try {
      // Create a copy of form data without file objects for localStorage
      const formDataForStorage = {
        ...formData,
        idVerification: {
          ...formData.idVerification,
          idCardFront: null,
          idCardBack: null,
          selfieWithId: null
        }
      };
      localStorage.setItem('loanApplicationData', JSON.stringify(formDataForStorage));
      localStorage.setItem('loanApplicationStep', currentStep.toString());
    } catch (error) {
      console.error('Error saving form data:', error);
    }
  }, [formData, currentStep]);

  // Function to handle going to the next step
  const handleNextStep = () => {
    if (currentStep < 7) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      // Save the updated step to localStorage immediately
      localStorage.setItem('loanApplicationStep', nextStep.toString());
      window.scrollTo(0, 0);
    }
  };

  // Function to handle going to the previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      // Save the updated step to localStorage immediately
      localStorage.setItem('loanApplicationStep', prevStep.toString());
      window.scrollTo(0, 0);
    }
  };

  // Function to handle going to a specific step (used in progress bar)
  const handleGoToStep = (step: number) => {
    if (step >= 1 && step <= 6) {
      setCurrentStep(step);
      // Save the updated step to localStorage immediately
      localStorage.setItem('loanApplicationStep', step.toString());
      window.scrollTo(0, 0);
    }
  };

  // Function to update form data from child components
  const updateFormData = (step: keyof LoanApplicationData, data: Record<string, any>) => {
    setFormData(prevData => {
      // Make sure the step exists and is an object before trying to spread it
      const currentStepData = prevData[step] || {};
      
      return {
        ...prevData,
        [step]: {
          ...currentStepData,
          ...data
        }
      };
    });
  };

  // Function to handle final submission of the loan application
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // For real API submission, call the actual API
      // For now, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check for stored MongoDB ID in localStorage
      const storedMongoDbId = localStorage.getItem('mongoDbLoanId');
      
      // First priority: Use a stored MongoDB ID from localStorage if available
      // Second priority: Use the MongoDB ID from state if available
      // Last resort: Generate a fake ID
      const applicationId = storedMongoDbId || mongoDbId || `LOAN-${Math.floor(Math.random() * 1000000)}`;
      
      
      // Ensure the ID is saved in localStorage regardless of source
      localStorage.setItem('mongoDbLoanId', applicationId);
      localStorage.setItem('currentApplicationId', applicationId);
      
      // Update the form data with the application ID
      setFormData(prev => {
        const updatedData = {
          ...prev,
          applicationId,
          mongoDbId: applicationId, // Ensure mongoDbId is set properly
          applicationStatus: 'PENDING_REVIEW' as 'PENDING_REVIEW'
        };
        
        return updatedData;
      });
      
      // Clear unnecessary localStorage data but keep our IDs
      localStorage.removeItem('loanApplicationData');
      localStorage.removeItem('loanDetails');
      // Don't remove loanApplicationStep until the user navigates away from success page
      
      setIsComplete(true);
      setMongoDbId(applicationId); // Ensure state is updated with the ID
      
      // Add a delay to ensure state updates have propagated before moving to the next step
      setTimeout(() => {
        setCurrentStep(8); // Move to success page (step 8 after agreement)
        toast.success('Loan application submitted successfully!');
      }, 200);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('ไม่สามารถส่งใบสมัครสินเชื่อได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PersonalInfoForm 
            data={formData.personalInfo}
            updateData={(data) => updateFormData('personalInfo', data)}
            onNext={handleNextStep}
          />
        );
      case 2:
        return (
          <IdVerificationForm
            data={formData.idVerification}
            updateData={(data) => updateFormData('idVerification', data)}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        );
      case 3:
        return (
          <AddressInfoForm
            data={formData.address}
            updateData={(data) => updateFormData('address', data)}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        );
      case 4:
        return (
          <FinancialInfoForm
            data={formData.financialInfo}
            updateData={(data) => updateFormData('financialInfo', data)}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        );
      case 5:
        return (
          <FamilyContactForm
            data={formData.familyContact}
            updateData={(data) => updateFormData('familyContact', data)}
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        );
      case 6:
        return (
          <ReviewForm
            data={formData}
            onSubmit={async () => {
              setIsSubmitting(true);
              try {
                // Attempt to retrieve MongoDB ID before submission
                if (mongoDbId) {
                  // Update local state
                  setMongoDbId(mongoDbId);
                  
                  // Store in localStorage for redundancy
                  localStorage.setItem('mongoDbLoanId', mongoDbId);
                }
              } catch (error) {
                console.error('Error retrieving MongoDB ID before submission:', error);
              } finally {
                setIsSubmitting(false);
                // Move to the loan agreement step
                setCurrentStep(8);
              }
            }}
            onPrev={handlePrevStep}
            isSubmitting={isSubmitting}
            onLoanIdUpdate={(id) => {
              setMongoDbId(id);
              localStorage.setItem('mongoDbLoanId', id);
            }}
          />
        );
      case 8:
        // Show Thai loan agreement with extracted MongoDB ID
        const loanId = localStorage.getItem('mongoDbLoanId') || mongoDbId || '';
        
        // Log signature data for debugging
        
        // Store any signature we have in localStorage for redundancy
        if (formData.idVerification.signature && !localStorage.getItem('userSignature')) {
          // Clean the signature URL before storing
          let cleanSignature = formData.idVerification.signature;
          
          // Fix duplicate signature path issue
          cleanSignature = cleanSignature.replace(/signature\/signature\//g, 'signature/');
          cleanSignature = cleanSignature.replace(/signature\/_signature\//g, '_signature/');
          
          localStorage.setItem('userSignature', cleanSignature);
        }
        
        // First try server signature, then localStorage, then form data
        let signatureData = signatureFromServer || localStorage.getItem('userSignature') || formData.idVerification.signature || '';
        
        // Ensure the signature is in the correct format
        if (signatureData && !signatureData.startsWith('data:image/') && !signatureData.startsWith('http')) {
          // If it's not a data URL or absolute URL, it might need proper formatting
          
          // If it's a relative path, ensure it has the proper structure
          if (!signatureData.includes('/uploads/')) {
            signatureData = `/uploads/signature/${signatureData}`;
          }
        }
        
        
        // Show loading spinner while fetching signature
        if (isLoadingSignature) {
          return (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="ml-3">กำลังโหลดข้อมูลลายเซ็น...</p>
            </div>
          );
        }
        
        return (
          <LoanAgreement
            contractNumber={loanId.slice(-5)} // Use last 5 digits of MongoDB ID as contract number
            contractDate={new Date().toISOString().split('T')[0]}
            borrowerName={formData.personalInfo.firstName + ' ' + formData.personalInfo.lastName}
            loanAmount={formData.loanDetails?.amount || 10000}
            interestRate={formData.loanDetails?.interestRate || 0.03}
            term={formData.loanDetails?.term || 6}
            signature={signatureData}
            onClose={() => {
              // Proceed to success page
              handleSubmit();
            }}
          />
        );
        
      case 9:
        // Direct access to localStorage for guaranteed access to the ID
        const storedMongoId = localStorage.getItem('mongoDbLoanId') || '';
        const backupId = localStorage.getItem('currentApplicationId') || '';
        
        // We get the ID from multiple sources to be extra safe
        // Priority: 1. MongoDB ID from localStorage, 2. MongoDB ID from state, 3. Application ID from state, 4. Backup ID
        const finalApplicationId = storedMongoId || mongoDbId || formData.mongoDbId || formData.applicationId || backupId;
        
        
        return (
          <SuccessMessage
            applicationId={finalApplicationId}
            onGoToWallet={() => {
              // Clean up the stored application ID when navigating away
              localStorage.removeItem('currentApplicationId');
              localStorage.removeItem('mongoDbLoanId');
              navigate('/wallet');
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      {!isComplete && (
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={6} 
          onStepClick={handleGoToStep} 
        />
      )}
      
      <div className="mt-8">
        {renderStep()}
      </div>
    </div>
  );
};

export default LoanApplicationForm;
