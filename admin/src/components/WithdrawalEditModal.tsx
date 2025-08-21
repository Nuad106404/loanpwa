import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface WithdrawalEditModalProps {
  withdrawal: any;
  onClose: () => void;
  onUpdate: (withdrawalId: string, updates: any) => void;
}

const WithdrawalEditModal: React.FC<WithdrawalEditModalProps> = ({
  withdrawal,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    amount: withdrawal.amount || 0,
    status: withdrawal.status || 'รอการอนุมัติ',
    bankAccount: {
      bankName: withdrawal.bankAccount?.bankName || '',
      accountNumber: withdrawal.bankAccount?.accountNumber || '',
      accountName: withdrawal.bankAccount?.accountName || ''
    },
    failureReason: withdrawal.failureReason || '',
    rejectionReason: withdrawal.rejectionReason || '',
    transactionId: withdrawal.transactionId || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFormData({
      amount: withdrawal.amount || 0,
      status: withdrawal.status || 'รอการอนุมัติ',
      bankAccount: {
        bankName: withdrawal.bankAccount?.bankName || '',
        accountNumber: withdrawal.bankAccount?.accountNumber || '',
        accountName: withdrawal.bankAccount?.accountName || ''
      },
      failureReason: withdrawal.failureReason || '',
      rejectionReason: withdrawal.rejectionReason || '',
      transactionId: withdrawal.transactionId || ''
    });
  }, [withdrawal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdate(withdrawal._id, formData);
      onClose();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBankAccountChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankAccount: {
        ...prev.bankAccount,
        [field]: value
      }
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      แก้ไขการถอนเงิน
                    </h3>
                    <button 
                      type="button" 
                      className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">ปิด</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {/* Amount */}
                    <div>
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        จำนวนเงิน (฿)
                      </label>
                      <input
                        type="number"
                        id="amount"
                        min="0"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    {/* Status */}
                    <div>
                      <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                        สถานะ
                      </label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="รอการอนุมัติ">รอดำเนินการ</option>
                        <option value="อนุมัติแล้ว">อนุมัติแล้ว</option>
                        <option value="ปฏิเสธ">ปฏิเสธ</option>
                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                        <option value="ล้มเหลว">ล้มเหลว</option>
                      </select>
                    </div>

                    {/* Bank Name */}
                    <div>
                      <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                        ชื่อธนาคาร
                      </label>
                      <input
                        type="text"
                        id="bankName"
                        value={formData.bankAccount.bankName}
                        onChange={(e) => handleBankAccountChange('bankName', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    {/* Account Number */}
                    <div>
                      <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                        หมายเลขบัญชี
                      </label>
                      <input
                        type="text"
                        id="accountNumber"
                        value={formData.bankAccount.accountNumber}
                        onChange={(e) => handleBankAccountChange('accountNumber', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        pattern="[0-9]{10,15}"
                        placeholder="ระบุหมายเลขบัญชี 10-15 หลัก"
                        required
                      />
                    </div>

                    {/* Account Name */}
                    <div>
                      <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                        ชื่อบัญชี
                      </label>
                      <input
                        type="text"
                        id="accountName"
                        value={formData.bankAccount.accountName}
                        onChange={(e) => handleBankAccountChange('accountName', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>

                    {/* Transaction ID */}
                    <div>
                      <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700">
                        รหัสธุรกรรม (ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        id="transactionId"
                        value={formData.transactionId}
                        onChange={(e) => handleInputChange('transactionId', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="ระบุรหัสธุรกรรมหากมี"
                      />
                    </div>

                    {/* Failure Reason (only show if status is failed) */}
                    {formData.status === 'ล้มเหลว' && (
                      <div>
                        <label htmlFor="failureReason" className="block text-sm font-medium text-gray-700">
                          เหตุผลที่ล้มเหลว
                        </label>
                        <textarea
                          id="failureReason"
                          rows={3}
                          value={formData.failureReason}
                          onChange={(e) => handleInputChange('failureReason', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="ระบุเหตุผลที่ล้มเหลว..."
                        />
                      </div>
                    )}

                    {/* Rejection Reason (only show if status is rejected) */}
                    {formData.status === 'ปฏิเสธ' && (
                      <div>
                        <label htmlFor="rejectionReason" className="block text-sm font-medium text-gray-700">
                          เหตุผลที่ปฏิเสธ
                        </label>
                        <textarea
                          id="rejectionReason"
                          rows={3}
                          value={formData.rejectionReason}
                          onChange={(e) => handleInputChange('rejectionReason', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="ระบุเหตุผลที่ปฏิเสธ..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    กำลังอัปเดต...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    อัปเดตการถอนเงิน
                  </>
                )}
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={onClose}
                disabled={isSubmitting}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalEditModal;
