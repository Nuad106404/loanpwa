import { useState, useEffect, useCallback } from 'react';

// Define interfaces for Thai address data
export interface Province {
  PROVINCE_ID: number;
  PROVINCE_CODE: string;
  PROVINCE_NAME: string;
  GEO_ID: number;
}

export interface District {
  DISTRICT_ID: number;
  DISTRICT_CODE: string;
  DISTRICT_NAME: string;
  GEO_ID: number;
  PROVINCE_ID: number;
}

export interface SubDistrict {
  SUB_DISTRICT_ID: number;
  SUB_DISTRICT_CODE: string;
  SUB_DISTRICT_NAME: string;
  DISTRICT_ID: number;
  PROVINCE_ID: number;
  GEO_ID: number;
}

export interface ZipCode {
  ZIPCODE_ID: number;
  SUB_DISTRICT_CODE: string;
  PROVINCE_ID: string;
  DISTRICT_ID: string;
  SUB_DISTRICT_ID: string;
  ZIPCODE: string;
}

interface ThailandAddressData {
  filteredSubDistricts: SubDistrict[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  selectedSubDistrict: SubDistrict | null;
  selectedDistrict: District | null;
  selectedProvince: Province | null;
  zipCode: string;
  setAddressBySubDistrict: (subDistrictId: number) => Promise<void>;
  // Expose the raw data arrays
  districts: District[];
  provinces: Province[];
  zipCodes: ZipCode[];
}

export const useThailandAddressData = (): ThailandAddressData => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [zipCodes, setZipCodes] = useState<ZipCode[]>([]);
  
  const [filteredSubDistricts, setFilteredSubDistricts] = useState<SubDistrict[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<SubDistrict | null>(null);
  const [zipCode, setZipCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load all address data on component mount
  useEffect(() => {
    const loadAddressData = async () => {
      setLoading(true);
      try {
        // Load provinces - use the correct path to the public folder
        const provincesResponse = await fetch('/Thailand-Address/provinces.json');
        const provincesData = await provincesResponse.json();
        setProvinces(provincesData);

        // Load districts
        const districtsResponse = await fetch('/Thailand-Address/districts.json');
        const districtsData = await districtsResponse.json();
        setDistricts(districtsData);

        // Load subdistricts
        const subDistrictsResponse = await fetch('/Thailand-Address/subDistricts.json');
        const subDistrictsData = await subDistrictsResponse.json();
        setSubDistricts(subDistrictsData);

        // Load zipcodes
        const zipCodesResponse = await fetch('/Thailand-Address/zipcodes.json');
        const zipCodesData = await zipCodesResponse.json();
        setZipCodes(zipCodesData);
      } catch (error) {
        console.error('Error loading address data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAddressData();
  }, []);

  // Filter subdistricts based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSubDistricts([]);
      return;
    }

    setLoading(true);
    const normalizedQuery = searchQuery.toLowerCase();
    
    const filtered = subDistricts.filter(sd => 
      sd.SUB_DISTRICT_NAME.toLowerCase().includes(normalizedQuery)
    ).slice(0, 10); // Limit to 10 results for performance
    
    setFilteredSubDistricts(filtered);
    setLoading(false);
  }, [searchQuery, subDistricts]);

  // Set address data based on selected subdistrict
  const setAddressBySubDistrict = useCallback(async (subDistrictId: number) => {
    setLoading(true);
    try {
      // Find the selected subdistrict
      const subDistrict = subDistricts.find(sd => sd.SUB_DISTRICT_ID === subDistrictId);
      if (!subDistrict) {
        console.error('Subdistrict not found for ID:', subDistrictId);
        throw new Error('Subdistrict not found');
      }
      setSelectedSubDistrict(subDistrict);

      // Find the district for this subdistrict
      const district = districts.find(d => d.DISTRICT_ID === subDistrict.DISTRICT_ID);
      if (!district) {
        console.error('District not found for ID:', subDistrict.DISTRICT_ID);
        throw new Error('District not found');
      }
      setSelectedDistrict(district);

      // Find the province for this district
      const province = provinces.find(p => p.PROVINCE_ID === district.PROVINCE_ID);
      if (!province) {
        console.error('Province not found for ID:', district.PROVINCE_ID);
        throw new Error('Province not found');
      }
      setSelectedProvince(province);

      // Find the zipcode for this subdistrict
      const zipCodeEntry = zipCodes.find(z => 
        z.SUB_DISTRICT_ID === subDistrictId.toString() || 
        z.SUB_DISTRICT_CODE === subDistrict.SUB_DISTRICT_CODE
      );
      
      if (zipCodeEntry) {
        setZipCode(zipCodeEntry.ZIPCODE);
      } else {
        // Try to find by district if subdistrict match fails
        const districtZipCode = zipCodes.find(z => z.DISTRICT_ID === district.DISTRICT_ID.toString());
        setZipCode(districtZipCode?.ZIPCODE || '');
      }

      // Update the search query to show the selected subdistrict name
      setSearchQuery(subDistrict.SUB_DISTRICT_NAME);
    } catch (error) {
      console.error('Error setting address by subdistrict:', error);
    } finally {
      setLoading(false);
    }
  }, [districts, provinces, subDistricts, zipCodes]);

  return {
    filteredSubDistricts,
    selectedProvince,
    selectedDistrict,
    selectedSubDistrict,
    zipCode,
    loading,
    searchQuery,
    setSearchQuery,
    setAddressBySubDistrict,
    // Expose the raw data arrays
    districts,
    provinces,
    zipCodes
  };
};
