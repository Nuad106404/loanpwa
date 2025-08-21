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
export const isValidPhone = (phone: string): boolean => {
  // Allow formats: (123) 456-7890, 123-456-7890, 1234567890
  const regex = /^(\+?1\s?)?(\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}$/;
  return regex.test(phone);
};

/**
 * Validates a US ZIP code
 * @param zipCode - The ZIP code to validate
 * @returns True if valid, false otherwise
 */
export const isValidZipCode = (zipCode: string): boolean => {
  // Allow 5-digit or 9-digit (ZIP+4) formats
  const regex = /^\d{5}(-\d{4})?$/;
  return regex.test(zipCode);
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