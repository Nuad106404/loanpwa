import React, { useState, useEffect, FormEvent } from 'react';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Plus, X, Percent, Lock } from 'lucide-react';
import { InterestRate, adminFetchInterestRates, adminCreateInterestRate, adminUpdateInterestRate, adminDeleteInterestRate } from '../services/interestRateService';
import { useAuth } from '../context/AuthContext';

// ApiResponse interface already defined in the service

const InterestRatesPage: React.FC = () => {
  const { user } = useAuth();
  const [rates, setRates] = useState<InterestRate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check if user is super admin
  const isSuperAdmin = user?.role === 'superadmin';
  
  // Add/Edit modal state
  const [showAddEditModal, setShowAddEditModal] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentRate, setCurrentRate] = useState<Partial<InterestRate>>({});
  
  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  const fetchRates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminFetchInterestRates();
      setRates(data);
    } catch (error) {
      console.error('Error fetching interest rates:', error);
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลอัตราดอกเบีย');
      toast.error('ไม่สามารถดึงข้อมูลอัตราดอกเบียได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAddRate = () => {
    setCurrentRate({ term: undefined, rate: undefined });
    setIsEditing(false);
    setShowAddEditModal(true);
  };

  const handleEditRate = (rate: InterestRate) => {
    setCurrentRate({
      _id: rate._id,
      term: rate.term,
      rate: rate.rate,
      isActive: rate.isActive
    });
    setIsEditing(true);
    setShowAddEditModal(true);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentRate._id) return;
    
    try {
      await adminDeleteInterestRate(currentRate._id);
      toast.success('ลบอัตราดอกเบียเรียบร้อยแล้ว');
      fetchRates();
    } catch (error: any) {
      console.error('Error deleting interest rate:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการลบอัตราดอกเบีย');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!currentRate.term) {
      toast.error('จำเป็นต้องระบุระยะเวลา');
      return;
    }
    
    // Allow rate to be 0
    if (currentRate.rate === undefined) {
      toast.error('จำเป็นต้องระบุอัตราดอกเบีย');
      return;
    }
    
    try {
      if (isEditing && currentRate._id) {
        // Update existing rate
        await adminUpdateInterestRate(currentRate._id, { 
          term: currentRate.term,
          rate: currentRate.rate,
          isActive: currentRate.isActive
        });
        toast.success('อัปเดตอัตราดอกเบียเรียบร้อยแล้ว');
      } else {
        // Create new rate
        await adminCreateInterestRate({ 
          term: currentRate.term, 
          rate: currentRate.rate,
          isActive: currentRate.isActive !== undefined ? currentRate.isActive : true
        });
        toast.success('เพิ่มอัตราดอกเบียเรียบร้อยแล้ว');
      }
      
      setShowAddEditModal(false);
      fetchRates();
    } catch (error: any) {
      console.error('Error saving interest rate:', error);
      toast.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกอัตราดอกเบีย');
    }
  };

  const formatRateDisplay = (rate: number) => {
    // Convert decimal rate (e.g., 0.0290) to percentage (e.g., 2.90%)
    return `${(rate * 100).toFixed(2)}%`;
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
            <Percent className="w-6 h-6 mr-2 text-blue-600" />
            {isSuperAdmin ? 'จัดการอัตราดอกเบี้ย' : 'ดูอัตราดอกเบี้ย'}
          </h1>
          {!isSuperAdmin && (
            <div className="flex items-center text-gray-500 text-sm">
              <Lock className="w-4 h-4 mr-1" />
              สิทธิ์อ่านอย่างเดียว
            </div>
          )}
          {isSuperAdmin && (
            <button 
              onClick={handleAddRate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มอัตราดอกเบี้ย
            </button>
          )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center p-4">{error}</div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ระยะเวลา (เดือน)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    อัตราดอกเบี้ย (%)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    การดำเนินการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rates.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      ไม่พบอัตราดอกเบี้ย เพิ่มอัตราดอกเบี้ยใหม่เพื่อเริ่มต้น
                    </td>
                  </tr>
                ) : (
                  rates.map((rate) => (
                    <tr key={rate._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {rate.term}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatRateDisplay(rate.rate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${rate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {rate.isActive ? 'ใช้งานอยู่' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isSuperAdmin ? (
                          <>
                            <button
                              onClick={() => handleEditRate(rate)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4 flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              แก้ไข
                            </button>
                            <button
                              onClick={() => {
                                setCurrentRate(rate);
                                handleDeleteClick();
                              }}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              ลบ
                            </button>
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm flex items-center">
                            <Lock className="w-4 h-4 mr-1" />
                            ดูอย่างเดียว
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Add/Edit Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">จัดการอัตราดอกเบีย</h1>
              <button 
                onClick={() => setShowAddEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-1">ระยะเวลา (เดือน)</label>
                <input
                  id="term"
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentRate.term || ''}
                  onChange={(e) => setCurrentRate({ ...currentRate, term: parseInt(e.target.value) })}
                  min={1}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">ระบุระยะเวลาเป็นเดือน</p>
              </div>
              
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">อัตราดอกเบี้ย (ทศนิยม)</label>
                <input
                  id="rate"
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={currentRate.rate !== undefined ? currentRate.rate : ''}
                  onChange={(e) => setCurrentRate({ ...currentRate, rate: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                  step="0.0001"
                  min="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">ตัวอย่าง: 0.0290 สำหรับ 2.90% หรือ 0 สำหรับ 0%</p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {isEditing ? 'อัปเดต' : 'เพิ่ม'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">ยืนยันการลบ</h2>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="py-4">
              <p>คุณแน่ใจหรือไม่ที่จะลบอัตราดอกเบี้ยนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                type="button" 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button 
                type="button" 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                ลบ
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default InterestRatesPage;
