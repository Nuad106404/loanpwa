import React, { useState, useEffect } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { createLoanApplication, getUserLoanDetails } from '../../services/loanService';
import { getCurrentUser } from '../../services/authService';
import { getAllInterestRates, calculateMonthlyPayment, InterestRate } from '../../services/interestRateService';

const LoanCalculator: React.FC = () => {
  const navigate = useNavigate();
  const [loanAmount, setLoanAmount] = useState(10000);
  const [loanTerm, setLoanTerm] = useState(6);
  const [monthlyPayment, setMonthlyPayment] = useState(1715);
  const [interestRates, setInterestRates] = useState<InterestRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  // Fetch interest rates when component mounts
  useEffect(() => {
    const fetchInterestRates = async () => {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await getAllInterestRates();
        
        if (response.status === 'success' && Array.isArray(response.data)) {
          setInterestRates(response.data);
        } else {
          setErrorMessage('ไม่สามารถดึงข้อมูลอัตราดอกเบี้ยได้');
          console.error('Error response:', response);
        }
      } catch (err) {
        setErrorMessage('An error occurred while fetching interest rates');
        console.error('Error fetching interest rates:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInterestRates();
  }, []);
  
  // Calculate the monthly payment when loan amount or term changes, or when interest rates are loaded
  useEffect(() => {
    if (interestRates.length === 0) return;
    
    // Find the interest rate for the selected term
    const interestRateObj = interestRates.find(rate => rate.term === loanTerm);
    
    if (interestRateObj) {
      // Calculate monthly payment with the interest rate from MongoDB
      const payment = calculateMonthlyPayment(loanAmount, loanTerm, interestRateObj.rate);
      setMonthlyPayment(payment);
    }
  }, [loanAmount, loanTerm, interestRates]);

  // Show error message if any
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  const handleIncrease = () => {
    if (loanAmount < 1000000) {
      setLoanAmount(prev => Math.min(1000000, prev + 1000));
    }
  };

  const handleDecrease = () => {
    if (loanAmount > 10000) {
      setLoanAmount(prev => Math.max(10000, prev - 1000));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setLoanAmount(value);
  };

  // Function to check for existing active loans
  const checkForExistingLoan = async (currentUser: any) => {
    try {
      const loanDetailsResponse = await getUserLoanDetails();
      
      if (loanDetailsResponse.status === 'success' && loanDetailsResponse.data?.loan) {
        const existingLoan = loanDetailsResponse.data.loan;
        const activeStatuses = ['pending', 'approved', 'disbursed'];
        
        if (activeStatuses.includes(existingLoan.status)) {
          return {
            hasActiveLoan: true,
            loanDetails: existingLoan
          };
        }
      }
      
      return { hasActiveLoan: false };
    } catch (error) {
      console.error('Error checking for existing loan:', error);
      return { hasActiveLoan: false };
    }
  };

  // Function to handle applying for a loan
  const handleApplyForLoan = async () => {
    try {
      setLoading(true);
      
      // Find the interest rate for the selected term
      const interestRateObj = interestRates.find(rate => rate.term === loanTerm);
      const interestRate = interestRateObj ? interestRateObj.rate : 0.03; // Default to 3% if not found
      
      // Check if user is logged in
      const currentUser = await getCurrentUser();
      
      // If user is logged in, check for existing active loans
      if (currentUser) {
        const existingLoanCheck = await checkForExistingLoan(currentUser);
        
        if (existingLoanCheck.hasActiveLoan) {
          const existingLoan = existingLoanCheck.loanDetails;
          
          // Show SweetAlert2 warning
          await Swal.fire({
            title: 'พบสินเชื่อที่มีอยู่แล้ว!',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p style="margin-bottom: 15px;">คุณมีใบสมัครสินเชื่อที่ยังดำเนินการอยู่แล้ว คุณสามารถมีสินเชื่อได้เพียงหนึ่งสัญญาเท่านั้น</p>
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                  <h4 style="margin: 0 0 10px 0; color: #007bff;">สินเชื่อปัจจุบันของคุณ:</h4>
                  <p style="margin: 5px 0;"><strong>จำนวนเงิน:</strong> ${existingLoan.amount?.toLocaleString() || 'N/A'}฿</p>
                  <p style="margin: 5px 0;"><strong>สถานะ:</strong> <span style="color: ${existingLoan.status === 'pending' ? '#ffc107' : existingLoan.status === 'approved' ? '#28a745' : '#17a2b8'}; font-weight: bold; text-transform: capitalize;">${existingLoan.status || 'N/A'}</span></p>
                  <p style="margin: 5px 0;"><strong>ระยะเวลา:</strong> ${existingLoan.term || 'N/A'} เดือน</p>
                </div>
                <p style="margin-top: 15px; color: #6c757d;">กรุณาชำระหรือปิดสินเชื่อที่มีอยู่ให้เสร็จสิ้นก่อนสมัครสินเชื่อใหม่</p>
              </div>
            `,
            icon: 'warning',
            confirmButtonText: 'เข้าใจแล้ว',
            confirmButtonColor: '#007bff',
            customClass: {
              popup: 'swal2-popup-custom',
              title: 'swal2-title-custom'
            }
          });
          
          setLoading(false);
          return; // Stop the loan application process
        }
      }
      
      // Store loan details in localStorage regardless of login status
      localStorage.setItem('loanDetails', JSON.stringify({
        amount: loanAmount,
        term: loanTerm,
        monthlyPayment: monthlyPayment,
        interestRate: interestRate
      }));
      
      if (!currentUser) {
        // User is not logged in, show message and redirect to auth page
        toast.success('Please login or register to continue with your loan application');
        
        // Redirect to auth page with message
        navigate('/auth', { 
          state: { 
            message: 'Login or register to continue with your loan application',
            returnTo: '/apply'
          } 
        });
        return;
      }
      
      // User is logged in, create loan application directly
      toast.loading('Creating your loan application...');
      
      // Call the API to create a loan application
      // Ensure we have a phone number - this is the primary identifier now
      const userPhone = currentUser.phone || localStorage.getItem('phoneNumber') || '';
      
      if (!userPhone) {
        toast.error('Phone number is required to apply for a loan');
        return;
      }
      
      const response = await createLoanApplication({
        amount: loanAmount,
        term: loanTerm,
        interestRate: interestRate,
        monthlyPayment: monthlyPayment,
        totalPayment: monthlyPayment * loanTerm,
        // Phone is now the primary identifier
        phone: userPhone
      });
      
      toast.dismiss();
      
      if (response.status === 'success') {
        toast.success('สร้างใบสมัครสินเชื่อเรียบร้อยแล้ว!');
        // Navigate to the application page to continue the process
        navigate('/apply');
      } else {
        // Check if this is an existing loan error with data
        if (response.data && response.data.existingLoanId) {
          // User already has an active loan - show detailed information
          Swal.fire({
            title: 'คุณมีสินเชื่อที่ยังดำเนินการอยู่',
            html: `
              <div style="text-align: left; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>รหัสสินเชื่อ:</strong> #${response.data.existingLoanId.slice(-5)}</p>
                <p style="margin: 5px 0;"><strong>จำนวนเงิน:</strong> ${response.data.existingLoanAmount?.toLocaleString() || 'N/A'}฿</p>
                <p style="margin: 5px 0;"><strong>สถานะ:</strong> <span style="color: ${response.data.existingLoanStatus === 'รอการอนุมัติ' ? '#ffc107' : response.data.existingLoanStatus === 'อนุมัติแล้ว' ? '#28a745' : '#17a2b8'}; font-weight: bold;">${response.data.existingLoanStatus || 'N/A'}</span></p>
                <br>
                <p style="color: #666; font-size: 14px;">กรุณาดำเนินการให้เสร็จสิ้นหรือปิดสินเชื่อปัจจุบันก่อนสมัครสินเชื่อใหม่</p>
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'ดูรายละเอียดสินเชื่อ',
            showCancelButton: true,
            cancelButtonText: 'ปิด',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d'
          }).then((result) => {
            if (result.isConfirmed) {
              // Navigate to wallet page to view existing loan
              navigate('/wallet');
            }
          });
        } else {
          // Show generic error message
          toast.error(response.message || 'ไม่สามารถสร้างใบสมัครสินเชื่อได้');
        }
      }
      
    } catch (error) {
      console.error('Error applying for loan:', error);
      toast.error('เกิดข้อผิดพลาดในการสมัครสินเชื่อ');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div id="loan-calculator" className="max-w-xl mx-auto p-8 bg-white rounded-3xl shadow-lg">
      <h1 className="text-3xl font-semibold text-center text-navy-900 mb-8">
        รายละเอียดสินเชื่อ
      </h1>
      
      <div className="space-y-8">
        {/* Loan Amount Section */}
        <div>
          <div className="text-xl text-gray-700 mb-4 flex justify-between items-baseline">
            <span>เลือกจำนวนเงินกู้</span>
            <span className="text-2xl font-semibold text-navy-900">{loanAmount.toLocaleString()}฿</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleDecrease}
              className="w-12 h-12 flex items-center justify-center bg-sky-400 text-white rounded-xl hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loanAmount <= 10000}
            >
              <Minus className="w-6 h-6" />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="range"
                min="10000"
                max="1000000"
                step="1000"
                value={loanAmount}
                onChange={handleSliderChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer 
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 
                          [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full 
                          [&::-webkit-slider-thumb]:bg-sky-400 [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200
                          [&::-webkit-slider-thumb]:hover:scale-110
                          [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 
                          [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-sky-400 
                          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer
                          [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:duration-200
                          [&::-moz-range-thumb]:hover:scale-110"
                style={{
                  background: `linear-gradient(to right, #38bdf8 ${((loanAmount - 10000) / (1000000 - 10000)) * 100}%, #e5e7eb ${((loanAmount - 10000) / (1000000 - 10000)) * 100}%)`
                }}
                disabled={loading}
              />
              
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>10,000฿</span>
                <span>1,000,000฿</span>
              </div>
            </div>
            
            <button
              onClick={handleIncrease}
              className="w-12 h-12 flex items-center justify-center bg-sky-400 text-white rounded-xl hover:bg-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loanAmount >= 1000000}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Loan Term Section */}
        <div>
          <div className="text-xl text-gray-700 mb-4">
            เลือกระยะเวลาสินเชื่อ
          </div>
          <select
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="w-full p-4 text-lg border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
            disabled={loading}
          >
            {interestRates.length > 0 ? (
              interestRates
                .filter(rate => rate.isActive)
                .sort((a, b) => a.term - b.term)
                .map(rate => (
                  <option key={rate._id} value={rate.term}>
                    {rate.term} เดือน (ดอกเบีย {(rate.rate * 100).toFixed(2)}%)
                  </option>
                ))
            ) : (
              <>
                <option value={6}>6 เดือน</option>
                <option value={12}>12 เดือน</option>
                <option value={24}>24 เดือน</option>
                <option value={36}>36 เดือน</option>
              </>
            )}
          </select>
        </div>

        {/* Monthly Installments */}
        <div className="bg-sky-50 p-6 rounded-xl">
          <div className="text-lg text-gray-700 mb-2">ผ่อนชำระรายเดือน</div>
          <div className="text-3xl font-bold text-navy-900">
            {monthlyPayment.toLocaleString()}฿ <span className="text-lg font-normal text-gray-600">ต่อเดือน</span>
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyForLoan}
          className="block w-full py-4 px-6 text-xl text-center text-white bg-sky-400 rounded-full hover:bg-sky-500 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
        >
          สมัครสินเชื่อ
        </button>

        {/* Contract Agreement */}
        <div className="bg-blue-50 p-6 rounded-xl">
          <h2 className="text-2xl font-semibold text-navy-900 mb-4">
            ข้อตกลงสัญญา
          </h2>
          <div className="text-gray-700 space-y-4 h-64 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <p>
              1. ต่อไปนี้จะเรียกในสัญญานี้ว่า "ลูกค้า" หรือ "ผู้ให้กู้ - ผู้กู้กับ
              บริษัท Lease It Thailand | บริษัท ลีส อิท จำกัด (มหาชน) ซึ่งเป็นบริษัทที่ได้รับอนุญาต
              จากรัฐมนตรีว่าการกระทรวงการคลังให้ประกอบธุรกิจหลักทรัพย์ประเภทธุรกิจ
              การให้กู้ยืมหลักทรัพย์ มีความประสงค์จะเข้าทำรายการให้กู้ยืมหลักทรัพย์
            </p>
            <p>
              คู่สัญญาแต่ละฝ่ายอาจทำหน้าที่เป็นผู้ให้กู้หรือผู้กู้เพื่อวัตถุประสงค์ดังต่อไปนี้:
            </p>
            <p>
              1.1 ผลบังคับใช้สัญญา หากข้อกำหนดหรือเงื่อนไขในสัญญาได้รับการอนุมัติสินเชื่อแล้ว สัญญามีผลบังคับใช้ทันที ซึ่งทางบริษัทดำเนินการอยู่ภายใต้การดูแลควบคุมโดยกระทรวงการคลังจึงจำเป็นต้องทำตามนโยบายอย่างเคร่งครัดตามทุกขั้นตอน ลูกค้าจะต้องชำระเงินต้น ดอกเบี้ย ค่าธรรมเนียมในการใช้วงเงินและค่าใช้จ่ายต่างๆ ที่จำเป็นต้องจ่ายให้แก่บริษัทตามข้อกำหนดนี้ ตามกำหนดวันชำระรายเดือนที่บริษัทและลูกค้าตกลงร่วมกัน กรณีที่เงินได้รับการอนุมัติแล้ว ลูกค้าไม่ดำเนินการถอนออกหรือไม่ทำการยกเลิกอย่างถูกต้อง จะมีผลเสียตามมา คือ ดอกเบี้ยยังเกิดขึ้นการผ่อนชำระยังดำเนินการต่อไปถึงแม้ไม่ได้ถอนและตัวลูกค้าจะติดแบล็คลิสสินเชื่อ การเรียกร้องให้ชำระหนี้ตลอดจนค่าธรรมเนียม ค่าใช้จ่ายในการดำเนินคดี และ ค่าทนายความในการดำเนินคดีบังคับให้ชำระหนี้คืนให้แก่ผู้ให้กู้ยืม เพื่อเป็นหลักฐานคู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญา จึงได้ลงลายมือชื่อและประทับตราบริษัท (ถ้ามี) ไว้ต่อหน้าพยานเป็นสำคัญ (ผู้กู้ยินยอมรับเงื่อนไขของบริษัท)
            </p>
            <p>
            กรณีวงเงินได้รับการอนุมัติแล้ว แต่ต้องการจะยกเลิกสัญญาส่วนนี้สามารถทำได้ การยกเลิกมี 2 วิธี ดังนี้
            </p>
            <p>
            1.2 ผลบังคับใช้สัญญา หากข้อกำหนดหรือเงื่อนไขในสัญญาได้รับการอนุมัติสินเชื่อแล้ว สัญญามีผลบังคับใช้ทันที ซึ่งทางบริษัทดำเนินการอยู่ภายใต้การดูแลควบคุมโดยกระทรวงการคลังจึงจำเป็นต้องทำตามนโยบายอย่างเคร่งครัดตามทุกขั้นตอน ลูกค้าจะต้องชำระเงินต้น ดอกเบี้ย ค่าธรรมเนียมในการใช้วงเงินและค่าใช้จ่ายต่างๆ ที่จำเป็นต้องจ่ายให้แก่บริษัทตามข้อกำหนดนี้ ตามกำหนดวันชำระรายเดือนที่บริษัทและลูกค้าตกลงร่วมกัน กรณีที่เงินได้รับการอนุมัติแล้ว ลูกค้าไม่ดำเนินการถอนออกหรือไม่ทำการยกเลิกอย่างถูกต้อง จะมีผลเสียตามมา คือ ดอกเบี้ยยังเกิดขึ้นการผ่อนชำระยังดำเนินการต่อไปถึงแม้ไม่ได้ถอนและตัวลูกค้าจะติดแบล็คลิสสินเชื่อ การเรียกร้องให้ชำระหนี้ตลอดจนค่าธรรมเนียม ค่าใช้จ่ายในการดำเนินคดี และ ค่าทนายความในการดำเนินคดีบังคับให้ชำระหนี้คืนให้แก่ผู้ให้กู้ยืม เพื่อเป็นหลักฐานคู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญา จึงได้ลงลายมือชื่อและประทับตราบริษัท (ถ้ามี) ไว้ต่อหน้าพยานเป็นสำคัญ (ผู้กู้ยินยอมรับเงื่อนไขของบริษัท)
            </p>
            <p>
            2. ผลบังคับใช้สัญญา หากข้อกำหนดหรือเงื่อนไขในสัญญาได้รับการอนุมัติสินเชื่อแล้ว สัญญามีผลบังคับใช้ทันที ซึ่งทางบริษัทดำเนินการอยู่ภายใต้การดูแลควบคุมโดยกระทรวงการคลังจึงจำเป็นต้องทำตามนโยบายอย่างเคร่งครัดตามทุกขั้นตอน ลูกค้าจะต้องชำระเงินต้น ดอกเบี้ย ค่าธรรมเนียมในการใช้วงเงินและค่าใช้จ่ายต่างๆ ที่จำเป็นต้องจ่ายให้แก่บริษัทตามข้อกำหนดนี้ ตามกำหนดวันชำระรายเดือนที่บริษัทและลูกค้าตกลงร่วมกัน กรณีที่เงินได้รับการอนุมัติแล้ว ลูกค้าไม่ดำเนินการถอนออกหรือไม่ทำการยกเลิกอย่างถูกต้อง จะมีผลเสียตามมา คือ ดอกเบี้ยยังเกิดขึ้นการผ่อนชำระยังดำเนินการต่อไปถึงแม้ไม่ได้ถอนและตัวลูกค้าจะติดแบล็คลิสสินเชื่อ การเรียกร้องให้ชำระหนี้ตลอดจนค่าธรรมเนียม ค่าใช้จ่ายในการดำเนินคดี และ ค่าทนายความในการดำเนินคดีบังคับให้ชำระหนี้คืนให้แก่ผู้ให้กู้ยืม เพื่อเป็นหลักฐานคู่สัญญาทั้งสองฝ่ายได้อ่านและเข้าใจข้อความในสัญญา จึงได้ลงลายมือชื่อและประทับตราบริษัท (ถ้ามี) ไว้ต่อหน้าพยานเป็นสำคัญ (ผู้กู้ยินยอมรับเงื่อนไขของบริษัท)
            </p>
            <p>
            3. ยกเลิกที่สำนักงาน การยกเลิกที่สำนักงานไม่เสียค่าใช้จ่ายใดๆ สิ่งที่ต้องเตรียมมาคือ สมุดบัญชีที่ลงทะเบียน บัตรประชาชนตัวจริง และตัวผู้กู้ต้องเข้ามาด้วยตนเอง การยกเลิกที่สำนักงาน หลังจากมาทำเอกสาร สามารถยกเลิกพันธะได้ที่สำนักงานภายในระยะเวลาที่กำหนด
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;