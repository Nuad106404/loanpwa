import React, { useState } from 'react';
import { ArrowDownRight, AlertCircle, Building2 } from 'lucide-react';
import { z } from 'zod';

interface WithdrawalFormProps {
  availableBalance: number;
  onWithdraw: (amount: number, bankAccount: string) => Promise<void>;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

const withdrawalSchema = z.object({
  amount: z.number()
    .positive("จำนวนเงินต้องมากกว่า 0")
    .max(1000000, "จำนวนเงินเกินขีดจำกัดสูงสุด")
});

const WithdrawalForm: React.FC<WithdrawalFormProps> = ({ 
  availableBalance, 
  onWithdraw,
  bankDetails = {
    bankName: "ธนาคารกรุงเทพ",
    accountNumber: "1234567890",
    accountName: "นายสมชาย ใสใจ"
  }
}) => {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const validatedData = withdrawalSchema.parse({
        amount: Number(amount)
      });

      if (validatedData.amount > availableBalance) {
        throw new Error("จำนวนเงินที่ถอนเกินยอดคงเหลือ");
      }

      setIsSubmitting(true);
      await onWithdraw(validatedData.amount, bankDetails.accountNumber);
      setAmount('');
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("เกิดข้อผิดพลาดที่ไม่คาดคิด");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-center space-x-2 mb-4 md:mb-6">
        <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">ถอนเงิน</h2>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-3">
          <Building2 className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">รายละเอียดบัญชีธนาคาร</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">ชื่อธนาคาร</span>
            <span className="text-sm font-medium text-gray-900">{bankDetails.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">เลขที่บัญชี</span>
            <span className="text-sm font-medium text-gray-900">
              ****{bankDetails.accountNumber.slice(-4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">ชื่อเจ้าของบัญชี</span>
            <span className="text-sm font-medium text-gray-900">{bankDetails.accountName}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            จำนวนเงินที่ถอน
          </label>
          <div className="relative">
            <span className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-7 md:pl-8 pr-3 md:pr-4 py-2 text-base md:text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
              max={availableBalance}
              required
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            ยอดคงเหลือ: ฿{availableBalance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {error && (
          <div className="flex items-start space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-2 px-4 text-base md:text-lg rounded-lg text-white font-medium ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? 'กำลังดำเนินการ...' : 'ถอนเงิน'}
        </button>
      </form>
    </div>
  );
};

export default WithdrawalForm;