import React from 'react';

interface LoanAgreementProps {
  onClose?: () => void;
  contractNumber?: string;
  contractDate?: string;
  borrowerName?: string;
  loanAmount?: number;
  startDate?: string;
  endDate?: string;
  signature?: any;
}

/**
 * LoanAgreement component displays the legal terms and conditions for the loan.
 * This component is used in both loan application flow and user profile for reviewing the terms.
 */
const LoanAgreement: React.FC<LoanAgreementProps> = ({ onClose }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-h-[80vh] overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Loan Agreement Terms</h2>
      
      <div className="prose max-w-none">
        <h3 className="text-xl font-semibold mb-3">1. Parties</h3>
        <p className="mb-4">
          This Loan Agreement (hereinafter referred to as "Agreement") is made and entered into by and between 
          Loan Service Provider (hereinafter referred to as "Lender") and the individual accepting these 
          terms (hereinafter referred to as "Borrower").
        </p>

        <h3 className="text-xl font-semibold mb-3">2. Loan Amount and Terms</h3>
        <p className="mb-4">
          The Lender agrees to lend the Borrower the amount requested and approved through the application 
          process, subject to the terms and conditions outlined in this Agreement. The loan term, interest rate, 
          and repayment schedule will be as specified in the loan approval notification.
        </p>

        <h3 className="text-xl font-semibold mb-3">3. Repayment</h3>
        <p className="mb-4">
          3.1 The Borrower agrees to repay the loan amount plus interest in accordance with the repayment 
          schedule provided.
        </p>
        <p className="mb-4">
          3.2 Payments shall be made on the due date specified in the repayment schedule.
        </p>
        <p className="mb-4">
          3.3 Early repayment is permitted without additional fees or penalties.
        </p>

        <h3 className="text-xl font-semibold mb-3">4. Default</h3>
        <p className="mb-4">
          4.1 If the Borrower fails to make any payment when due, the loan will be considered in default.
        </p>
        <p className="mb-4">
          4.2 In the event of default, the Lender reserves the right to:
          <ul className="list-disc pl-6 mb-4">
            <li>Charge a late payment fee as specified in the loan terms</li>
            <li>Report the default to credit bureaus</li>
            <li>Pursue legal action to recover the outstanding amount</li>
          </ul>
        </p>

        <h3 className="text-xl font-semibold mb-3">5. Privacy</h3>
        <p className="mb-4">
          The Lender will collect, use, and store the Borrower's personal information in accordance with 
          the Privacy Policy. The Borrower acknowledges and agrees to the collection, use, and storage of 
          their personal information for purposes related to this loan agreement.
        </p>

        <h3 className="text-xl font-semibold mb-3">6. Governing Law</h3>
        <p className="mb-4">
          This Agreement shall be governed by and construed in accordance with the laws of Thailand.
        </p>

        <h3 className="text-xl font-semibold mb-3">7. Amendment</h3>
        <p className="mb-4">
          This Agreement may only be amended in writing and signed by both parties.
        </p>

        <h3 className="text-xl font-semibold mb-3">8. Entire Agreement</h3>
        <p className="mb-4">
          This Agreement constitutes the entire agreement between the parties with respect to the loan and 
          supersedes all prior agreements, understandings, or negotiations.
        </p>
      </div>

      {onClose && (
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      )}
    </div>
  );
};

export default LoanAgreement;
