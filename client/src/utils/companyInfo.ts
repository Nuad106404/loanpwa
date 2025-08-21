// Company information from environment variables

export const companyInfo = {
  // Use environment variables with fallbacks
  nameThai: import.meta.env.VITE_COMPANY_NAME_TH || 'ไทยโลน',
  nameEnglish: import.meta.env.VITE_COMPANY_NAME_EN || 'Thai Loan',
  addressThai: import.meta.env.VITE_COMPANY_ADDRESS_TH || 'กรุงเทพมหานคร',
  addressEnglish: import.meta.env.VITE_COMPANY_ADDRESS_EN || 'Bangkok',
  logoUrl: import.meta.env.VITE_COMPANY_LOGO || 'https://i.postimg.cc/JzYgYXRd/stamp.png'
};
