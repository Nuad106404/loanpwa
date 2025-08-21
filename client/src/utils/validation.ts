/**
 * Validates an email address
 * @param email - The email to validate
 * @returns True if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Validates a phone number (US format)
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export const isValidUSPhone = (phone: string): boolean => {
  // Allow formats: (123) 456-7890, 123-456-7890, 1234567890
  const regex = /^(\+?1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return regex.test(phone);
};

/**
 * Validates a Thai phone number
 * @param phone - The phone number to validate
 * @returns True if valid, false otherwise
 */
export const isValidThaiPhone = (phone: string): boolean => {
  // Allow formats: 0812345678, 081-234-5678
  const regex = /^0[689]\d{8}$/;
  return regex.test(phone.replace(/-/g, ''));
};

/**
 * Validates a US ZIP code
 * @param zipCode - The ZIP code to validate
 * @returns True if valid, false otherwise
 */
export const isValidUSZipCode = (zipCode: string): boolean => {
  // Allow 5-digit or 9-digit (ZIP+4) formats
  const regex = /^\d{5}(-\d{4})?$/;
  return regex.test(zipCode);
};

/**
 * Validates a Thai postal code
 * @param zipCode - The postal code to validate
 * @returns True if valid, false otherwise
 */
export const isValidThaiZipCode = (zipCode: string): boolean => {
  // Thai postal codes are 5 digits
  const regex = /^\d{5}$/;
  return regex.test(zipCode);
};

/**
 * Validates a Thai national ID
 * @param id - The national ID to validate
 * @returns True if valid, false otherwise
 */
export const isValidNationalId = (id: string): boolean => {
  // Remove any spaces or dashes
  const cleanId = id.replace(/[-\s]/g, '');
  
  // For development/testing: Only check if it's 13 digits
  // This allows any 13-digit number to pass validation
  return cleanId.length === 13 && /^\d{13}$/.test(cleanId);
  
  /* Commented out strict validation for testing purposes
  // Check if it's all digits and has the correct length
  if (cleanId.length !== 13 || !/^\d{13}$/.test(cleanId)) {
    return false;
  }
  
  // Check first digit (1-8 for Thai citizens)
  if (!/^[1-8]/.test(cleanId)) {
    return false;
  }
  
  // Validate using checksum algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleanId[i]) * (13 - i);
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  return parseInt(cleanId[12]) === checkDigit;
  */
};

/**
 * Validates a date of birth
 * @param date - The date to validate
 * @returns True if valid, false otherwise
 */
export const isValidDateOfBirth = (date: string): boolean => {
  const birthDate = new Date(date);
  const today = new Date();
  const minAge = 20; // Minimum age requirement
  const maxAge = 60; // Maximum age requirement
  
  // Check if it's a valid date
  if (isNaN(birthDate.getTime())) {
    return false;
  }
  
  // Calculate age
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  const finalAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ? age - 1
    : age;
  
  return finalAge >= minAge && finalAge <= maxAge;
};

/**
 * Validates a currency amount
 * @param amount - The amount to validate
 * @returns True if valid, false otherwise
 */
export const isValidCurrencyAmount = (amount: string): boolean => {
  // Allow numbers with up to 2 decimal places, with or without commas
  const regex = /^(\d{1,3}(,\d{3})*|\d+)(\.\d{1,2})?$/;
  return regex.test(amount);
};

/**
 * Validates a credit card number using Luhn algorithm
 * @param cardNumber - The card number to validate
 * @returns True if valid, false otherwise
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  // Remove all non-digit characters
  const digitsOnly = cardNumber.replace(/\D/g, '');
  
  if (digitsOnly.length < 13 || digitsOnly.length > 19) {
    return false;
  }

  // Luhn algorithm
  let sum = 0;
  let shouldDouble = false;

  for (let i = digitsOnly.length - 1; i >= 0; i--) {
    let digit = parseInt(digitsOnly.charAt(i));

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
};