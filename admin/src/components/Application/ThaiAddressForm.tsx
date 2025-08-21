import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, MapPin, X } from 'lucide-react';
import { searchAddresses, findAddressByZipCode } from '../../../../client/src/utils/thaiAddressData';

interface ThaiAddressFormProps {
  onAddressChange: (address: {
    homeNumber: string;
    subdistrict: string;
    district: string;
    province: string;
    zipCode: string;
  }) => void;
  errors?: {
    homeNumber?: string;
    subdistrict?: string;
    district?: string;
    province?: string;
    zipCode?: string;
  };
  homeNumber?: string;
  subdistrict?: string;
  district?: string;
  province?: string;
  zipCode?: string;
}

interface AddressSuggestion {
  subDistrict: string;
  district: string;
  province: string;
  zipCode: string;
}

const ThaiAddressForm: React.FC<ThaiAddressFormProps> = ({ onAddressChange, errors, homeNumber: initialHomeNumber, subdistrict: initialSubdistrict, district: initialDistrict, province: initialProvince, zipCode: initialZipCode }) => {
  // Debug initial values
  
  const [homeNumber, setHomeNumber] = useState(initialHomeNumber || '');
  const [subdistrict, setSubdistrict] = useState(initialSubdistrict || '');
  const [district, setDistrict] = useState(initialDistrict || '');
  const [province, setProvince] = useState(initialProvince || '');
  const [zipCode, setZipCode] = useState(initialZipCode || '');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update form fields when props change
  useEffect(() => {
    if (initialHomeNumber) setHomeNumber(initialHomeNumber);
    if (initialSubdistrict) setSubdistrict(initialSubdistrict);
    if (initialDistrict) setDistrict(initialDistrict);
    if (initialProvince) setProvince(initialProvince);
    if (initialZipCode) setZipCode(initialZipCode);
  }, [initialHomeNumber, initialSubdistrict, initialDistrict, initialProvince, initialZipCode]);

  const handleChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    field: string
  ) => {
    setter(value);
    const address = {
      homeNumber,
      subdistrict,
      district,
      province,
      zipCode,
      [field]: value
    };
    onAddressChange(address);
  };

  const handleSubdistrictChange = (value: string) => {
    setSubdistrict(value);
    if (value.length >= 2) {
      const results = searchAddresses(value);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleZipCodeChange = (value: string) => {
    setZipCode(value);
    if (value.length === 5) {
      const address = findAddressByZipCode(value);
      if (address) {
        setSubdistrict(address.subDistrict);
        setDistrict(address.district);
        setProvince(address.province);
        onAddressChange({
          homeNumber,
          subdistrict: address.subDistrict,
          district: address.district,
          province: address.province,
          zipCode: value
        });
      }
    }
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    setSubdistrict(suggestion.subDistrict);
    setDistrict(suggestion.district);
    setProvince(suggestion.province);
    setZipCode(suggestion.zipCode);
    setSuggestions([]);
    onAddressChange({
      homeNumber,
      subdistrict: suggestion.subDistrict,
      district: suggestion.district,
      province: suggestion.province,
      zipCode: suggestion.zipCode
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="homeNumber" className="block text-lg font-medium text-gray-700 mb-2">
            บ้านเลขที่
          </label>
          <input
            type="text"
            id="homeNumber"
            value={homeNumber}
            onChange={(e) => handleChange(e.target.value, setHomeNumber, 'homeNumber')}
            className="w-full min-h-[44px] px-4 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter home/flat number"
          />
          {errors?.homeNumber && (
            <p className="mt-2 text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-1" />
              {errors.homeNumber}
            </p>
          )}
        </div>

        <div className="relative">
          <label htmlFor="subdistrict" className="block text-lg font-medium text-gray-700 mb-2">
            ตำบล
          </label>
          <div className="relative">
            <input
              type="text"
              id="subdistrict"
              value={subdistrict}
              onChange={(e) => handleSubdistrictChange(e.target.value)}
              className="w-full min-h-[44px] px-4 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter subdistrict"
              autoComplete="off"
            />
            {subdistrict && (
              <button
                type="button"
                onClick={() => {
                  setSubdistrict('');
                  setSuggestions([]);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-lg border border-gray-200 max-h-60 overflow-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-2"
                >
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">{suggestion.subDistrict}</div>
                    <div className="text-sm text-gray-500">
                      {suggestion.district}, {suggestion.province} {suggestion.zipCode}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {errors?.subdistrict && (
            <p className="mt-2 text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-1" />
              {errors.subdistrict}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="district" className="block text-lg font-medium text-gray-700 mb-2">
            อำเภอ
          </label>
          <input
            type="text"
            id="district"
            value={district}
            onChange={(e) => handleChange(e.target.value, setDistrict, 'district')}
            className="w-full min-h-[44px] px-4 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter district"
          />
          {errors?.district && (
            <p className="mt-2 text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-1" />
              {errors.district}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="province" className="block text-lg font-medium text-gray-700 mb-2">
            จังหวัด
          </label>
          <input
            type="text"
            id="province"
            value={province}
            onChange={(e) => handleChange(e.target.value, setProvince, 'province')}
            className="w-full min-h-[44px] px-4 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter province"
          />
          {errors?.province && (
            <p className="mt-2 text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-1" />
              {errors.province}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="zipCode" className="block text-lg font-medium text-gray-700 mb-2">
            รหัสไปรษณีย์
          </label>
          <input
            type="text"
            id="zipCode"
            value={zipCode}
            onChange={(e) => handleZipCodeChange(e.target.value)}
            className="w-full min-h-[44px] px-4 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter ZIP code"
            maxLength={5}
            pattern="[0-9]*"
          />
          {errors?.zipCode && (
            <p className="mt-2 text-red-600 flex items-center">
              <AlertCircle className="w-5 h-5 mr-1" />
              {errors.zipCode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThaiAddressForm;