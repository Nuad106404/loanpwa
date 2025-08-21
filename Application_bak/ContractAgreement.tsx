import React from 'react';

interface ContractAgreementProps {
  contractNumber?: string;
  contractDate?: string;
  borrowerName?: string;
  loanAmount?: number;
  interestRate?: number;
  term?: number;
  monthlyPayment?: number;
  startDate?: string;
  endDate?: string;
  signature?: any;
  onClose?: () => void;
}

/**
 * ContractAgreement component displays a formal loan contract with terms and conditions.
 * Used for final loan review and signing.
 */
const ContractAgreement: React.FC<ContractAgreementProps> = ({
  contractNumber = 'LN-2024-00001',
  contractDate = new Date().toLocaleDateString(),
  borrowerName = 'Borrower Name',
  loanAmount = 10000,
  interestRate = 2.90,
  term = 12,
  monthlyPayment = 889,
  startDate = new Date().toLocaleDateString(),
  endDate = new Date(new Date().setMonth(new Date().getMonth() + 12)).toLocaleDateString(),
  signature,
  onClose
}) => {
  return (
    <div className="bg-white p-8 border border-gray-300 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">LOAN CONTRACT AGREEMENT</h1>
        <p className="text-sm text-gray-500">Contract No: {contractNumber}</p>
        <p className="text-sm text-gray-500">Date: {contractDate}</p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">1. PARTIES</h2>
        <p className="mb-3">
          This Loan Contract Agreement ("Agreement") is entered into between <strong>Loan Service Company Ltd.</strong>, 
          with its principal place of business at 123 Main Street, Bangkok, Thailand 10110, hereinafter 
          referred to as the "LENDER"
        </p>
        <p className="mb-3">
          And
        </p>
        <p className="mb-3">
          <strong>{borrowerName}</strong>, hereinafter referred to as the "BORROWER".
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">2. LOAN DETAILS</h2>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="py-2 font-semibold">Loan Amount:</td>
              <td className="py-2">{loanAmount.toLocaleString()} THB</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Interest Rate:</td>
              <td className="py-2">{interestRate}% per annum</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Loan Term:</td>
              <td className="py-2">{term} months</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Monthly Payment:</td>
              <td className="py-2">{monthlyPayment.toLocaleString()} THB</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Loan Start Date:</td>
              <td className="py-2">{startDate}</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 font-semibold">Loan End Date:</td>
              <td className="py-2">{endDate}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">3. REPAYMENT TERMS</h2>
        <p className="mb-3">
          The BORROWER agrees to repay the loan amount plus interest in {term} equal monthly installments 
          of {monthlyPayment.toLocaleString()} THB due on the same day of each month following the Loan Start Date.
        </p>
        <p className="mb-3">
          Payments shall be made via bank transfer to the LENDER's designated account or through the 
          provided payment platform on the mobile application.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">4. PREPAYMENT</h2>
        <p className="mb-3">
          The BORROWER may prepay the loan in full or in part at any time without penalty. Any partial 
          prepayment shall be applied first to accrued interest and then to principal.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">5. DEFAULT</h2>
        <p className="mb-3">
          If the BORROWER fails to make any payment within 10 days after the due date, the loan will be 
          considered in default. A late fee of 2% of the monthly payment amount will be charged for each 
          payment that is late.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">6. GOVERNING LAW</h2>
        <p className="mb-3">
          This Agreement shall be governed by and construed in accordance with the laws of Thailand.
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold border-b pb-2 mb-3">7. SIGNATURES</h2>
        <div className="flex flex-col md:flex-row justify-between mt-6">
          <div className="mb-6 md:mb-0">
            <p className="font-semibold mb-3">LENDER:</p>
            <div className="h-20 w-48 border-b border-black flex items-end justify-center">
              <p className="text-sm">Authorized Signature</p>
            </div>
            <p className="mt-2 text-sm">Loan Service Company Ltd.</p>
          </div>
          <div>
            <p className="font-semibold mb-3">BORROWER:</p>
            <div className="h-20 w-48 border-b border-black flex items-end justify-center">
              {signature ? (
                <img src={signature} alt="Borrower Signature" className="h-16 w-auto" />
              ) : (
                <p className="text-sm">Signature required</p>
              )}
            </div>
            <p className="mt-2 text-sm">{borrowerName}</p>
          </div>
        </div>
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

export default ContractAgreement;
