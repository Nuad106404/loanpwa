import React, { useState, useEffect, useRef } from 'react';
import { saveIdVerification } from '../../../services/loanService';
import toast from 'react-hot-toast';

interface IdVerificationData {
  idCardFront: File | null;
  idCardBack: File | null;
  selfieWithId: File | null;
  signature: string;
}

interface IdVerificationFormProps {
  data: IdVerificationData;
  updateData: (data: Partial<IdVerificationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const IdVerificationForm: React.FC<IdVerificationFormProps> = ({ data, updateData, onNext, onPrev }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<IdVerificationData>(data);
  const [errors, setErrors] = useState<Partial<Record<keyof IdVerificationData, string>>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isDrawing, setIsDrawing] = useState(false);
  const [cleared, setCleared] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Initialize canvas on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Get canvas context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Set canvas styles
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';
    
    canvasCtxRef.current = ctx;
    
    // If there's signature data already, draw it on the canvas
    if (formData.signature) {
      const img = new Image();
      img.src = formData.signature;
      img.onload = () => {
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setCleared(false);
        }
      };
    }
    
    // Handle window resize
    const handleResize = () => {
      if (!canvas || !ctx) return;
      
      // Save current canvas content
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Update canvas dimensions
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      
      // Restore canvas properties
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#000';
      
      // Restore canvas content
      ctx.putImageData(imageData, 0, 0);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [formData.signature]);
  
  // Update local form state when parent data changes
  useEffect(() => {
    setFormData(data);
    
    // Make sure we don't lose previews when component re-renders due to parent data changes
    const previews: Record<string, string> = {};
    
    if (data.idCardFront instanceof File) {
      previews.idCardFront = URL.createObjectURL(data.idCardFront);
    }
    
    if (data.idCardBack instanceof File) {
      previews.idCardBack = URL.createObjectURL(data.idCardBack);
    }
    
    if (data.selfieWithId instanceof File) {
      previews.selfieWithId = URL.createObjectURL(data.selfieWithId);
    }
    
    if (Object.keys(previews).length > 0) {
      setPreviewUrls(prev => {
        // Revoke old object URLs to prevent memory leaks
        Object.values(prev).forEach(url => URL.revokeObjectURL(url));
        return { ...prev, ...previews };
      });
    }
  }, [data]);
  
  // Generate preview URLs for uploaded files
  useEffect(() => {
    const previews: Record<string, string> = {};
    
    if (formData.idCardFront) {
      previews.idCardFront = URL.createObjectURL(formData.idCardFront);
    }
    
    if (formData.idCardBack) {
      previews.idCardBack = URL.createObjectURL(formData.idCardBack);
    }
    
    if (formData.selfieWithId) {
      previews.selfieWithId = URL.createObjectURL(formData.selfieWithId);
    }
    
    setPreviewUrls(prev => {
      // Revoke old object URLs to prevent memory leaks
      Object.values(prev).forEach(url => URL.revokeObjectURL(url));
      return previews;
    });
    
    // Cleanup function to revoke object URLs
    return () => {
      Object.values(previews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [formData.idCardFront, formData.idCardBack, formData.selfieWithId]);
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [name]: 'File size must be less than 5MB'
        }));
        return;
      }
      
      // Check file type (only images allowed)
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          [name]: 'Only image files are allowed'
        }));
        return;
      }
      
      // Create a copy of the file to ensure it persists
      const fileCopy = new File([file], file.name, { type: file.type });
      
      // Update form data with new file
      setFormData(prev => ({
        ...prev,
        [name]: fileCopy
      }));
      
      // Clear error for this field
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof IdVerificationData];
        return newErrors;
      });
    }
  };
  
  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setCleared(false);
    
    const ctx = canvasCtxRef.current;
    if (!ctx) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Get coordinates based on event type
    let x: number, y: number;
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const ctx = canvasCtxRef.current;
    if (!ctx) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    
    // Get coordinates based on event type
    let x: number, y: number;
    if ('touches' in e) {
      // Touch event
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
      e.preventDefault(); // Prevent scrolling on touch devices
    } else {
      // Mouse event
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };
  
  const stopDrawing = () => {
    setIsDrawing(false);
    
    const ctx = canvasCtxRef.current;
    if (!ctx) return;
    
    ctx.closePath();
    
    // Save signature as data URL
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signatureDataUrl = canvas.toDataURL('image/png');
    
    // Update local form data with signature while preserving other fields
    setFormData(prev => ({
      ...prev,
      signature: signatureDataUrl
    }));
    
    // Don't update parent data yet - we'll do this on form submission
    // to avoid losing the uploaded files
    setCleared(false);
    
    // Clear error for signature
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.signature;
      return newErrors;
    });
  };
  
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvasCtxRef.current;
    
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCleared(true);
    
    setFormData(prev => ({
      ...prev,
      signature: ''
    }));
  };
  
  // Validate form before submission
  const validateForm = () => {
    const newErrors: Partial<Record<keyof IdVerificationData, string>> = {};
    
    if (!formData.idCardFront) {
      newErrors.idCardFront = 'Front side of ID card is required';
    }
    
    if (!formData.idCardBack) {
      newErrors.idCardBack = 'Back side of ID card is required';
    }
    
    if (!formData.selfieWithId) {
      newErrors.selfieWithId = 'Selfie with ID card is required';
    }
    
    if (!formData.signature || cleared) {
      newErrors.signature = 'Signature is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Show loading toast
        const loadingToast = toast.loading('Uploading verification documents...');
        
        // Get phone number from localStorage or personal info step
        const phone = localStorage.getItem('phoneNumber') || '';
        
        // Save all uploaded files and signature to parent component and backend
        const updatedData = {
          idCardFront: formData.idCardFront,
          idCardBack: formData.idCardBack,
          selfieWithId: formData.selfieWithId,
          signature: formData.signature
        };
        
        // Store signature in localStorage for use in other components
        if (formData.signature) {
          // Clean the signature URL before storing
          let cleanSignature = formData.signature;
          
          // Fix duplicate signature path issue if it's not a data URL
          if (!cleanSignature.startsWith('data:image/')) {
            cleanSignature = cleanSignature.replace(/signature\/signature\//g, 'signature/');
            cleanSignature = cleanSignature.replace(/signature\/_signature\//g, '_signature/');
          }
          
          localStorage.setItem('userSignature', cleanSignature);
        }

        // Send to backend
        const response = await saveIdVerification(updatedData, phone);
        
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        
        if (response.status === 'success') {
          // Show success message
          toast.success('ID verification documents saved successfully!');
          
          // Update parent component's data and proceed to next step
          updateData(updatedData);
          onNext();
        } else {
          // Show error message
          toast.error(response.message || 'ไม่สามารถบันทึกเอกสารยืนยันตัวตนได้');
        }
      } catch (error) {
        console.error('Error saving ID verification documents:', error);
        toast.error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Scroll to the first error
      const firstErrorField = document.querySelector('.error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto py-6">
      <h2 className="text-2xl font-semibold mb-6">ID Verification</h2>
      <p className="text-gray-600 mb-8">
        กรุณาอัปโหลดรูปถ่ายบัตรประชาชนและรูปเซลฟี่ที่ชัดเจนเพื่อยืนยันตัวตนของคุณ
      </p>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ID Card Front */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บัตรประจำตัวประชาชน (หน้า) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 border-2 rounded-lg border-gray-300 p-2">
              {previewUrls.idCardFront ? (
                <div className="relative">
                  <img 
                    src={previewUrls.idCardFront} 
                    alt="ID Card Front" 
                    className="w-full h-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, idCardFront: null }));
                      setPreviewUrls(prev => {
                        const newUrls = { ...prev };
                        if (newUrls.idCardFront) {
                          URL.revokeObjectURL(newUrls.idCardFront);
                          delete newUrls.idCardFront;
                        }
                        return newUrls;
                      });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <label htmlFor="idCardFront" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>อัปโหลดบัตรประจำตัวประชาชนด้านหน้า</span>
                      <input 
                        id="idCardFront" 
                        name="idCardFront" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF สูงสุด 5MB</p>
                </div>
              )}
            </div>
            {errors.idCardFront && <p className="mt-1 text-sm text-red-500 error">{errors.idCardFront}</p>}
          </div>
          
          {/* ID Card Back */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              บัตรประจำตัวประชาชน (หลัง) <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 border-2 rounded-lg border-gray-300 p-2">
              {previewUrls.idCardBack ? (
                <div className="relative">
                  <img 
                    src={previewUrls.idCardBack} 
                    alt="ID Card Back" 
                    className="w-full h-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, idCardBack: null }));
                      setPreviewUrls(prev => {
                        const newUrls = { ...prev };
                        if (newUrls.idCardBack) {
                          URL.revokeObjectURL(newUrls.idCardBack);
                          delete newUrls.idCardBack;
                        }
                        return newUrls;
                      });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <label htmlFor="idCardBack" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>อัปโหลดบัตรประจำตัวประชาชนด้านหลัง</span>
                      <input 
                        id="idCardBack" 
                        name="idCardBack" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF สูงสุด 5MB</p>
                </div>
              )}
            </div>
            {errors.idCardBack && <p className="mt-1 text-sm text-red-500 error">{errors.idCardBack}</p>}
          </div>
          
          {/* Selfie with ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รูปเซลฟี่พร้อมบัตรประจำตัวประชาชน <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 border-2 rounded-lg border-gray-300 p-2">
              {previewUrls.selfieWithId ? (
                <div className="relative">
                  <img 
                    src={previewUrls.selfieWithId} 
                    alt="Selfie with ID Card" 
                    className="w-full h-auto rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, selfieWithId: null }));
                      setPreviewUrls(prev => {
                        const newUrls = { ...prev };
                        if (newUrls.selfieWithId) {
                          URL.revokeObjectURL(newUrls.selfieWithId);
                          delete newUrls.selfieWithId;
                        }
                        return newUrls;
                      });
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <label htmlFor="selfieWithId" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>อัปโหลดรูปเซลฟี่ขณะถือบัตรประจำตัวประชาชน</span>
                      <input 
                        id="selfieWithId" 
                        name="selfieWithId" 
                        type="file" 
                        className="sr-only" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF สูงสุด 5MB</p>
                </div>
              )}
            </div>
            {errors.selfieWithId && <p className="mt-1 text-sm text-red-500 error">{errors.selfieWithId}</p>}
          </div>
          
          {/* Digital Signature */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ลายเซ็นดิจิทัล <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <div 
                className="border-2 rounded-lg border-gray-300 bg-white overflow-hidden"
                style={{ touchAction: 'none' }} // Prevent scroll on touch devices
              >
                <canvas 
                  ref={canvasRef}
                  className="w-full h-48 cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-4 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                >
                  ล้าง
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">กรุณาเซ็นชื่อในกรอบด้านบน</p>
            </div>
            {errors.signature && <p className="mt-1 text-sm text-red-500 error">{errors.signature}</p>}
          </div>
        </div>
        
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={onPrev}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-300"
          >
            ย้อนกลับ
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                กำลังอัปโหลด...
              </>
            ) : (
              'ดำเนินการต่อ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default IdVerificationForm;
