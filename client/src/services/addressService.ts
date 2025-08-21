import { useEffect, useState } from 'react';

// Types for Thai address data
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
  DISTRICT_CODE: string;
  SUB_DISTRICT_CODE: string;
  ZIPCODE: string;
}

// Cache for loaded data to avoid multiple fetches
let provincesCache: Province[] | null = null;
let districtsCache: District[] | null = null;
let subDistrictsCache: SubDistrict[] | null = null;
let zipCodesCache: ZipCode[] | null = null;

// Load provinces from the JSON file
export const loadProvinces = async (): Promise<Province[]> => {
  if (provincesCache) return provincesCache;
  
  try {
    const response = await fetch('/Thailand-Address/provinces.json');
    const data = await response.json();
    provincesCache = data;
    return data;
  } catch (error) {
    console.error('Error loading provinces:', error);
    return [];
  }
};

// Load districts from the JSON file
export const loadDistricts = async (): Promise<District[]> => {
  if (districtsCache) return districtsCache;
  
  try {
    const response = await fetch('/Thailand-Address/districts.json');
    const data = await response.json();
    districtsCache = data;
    return data;
  } catch (error) {
    console.error('Error loading districts:', error);
    return [];
  }
};

// Load subdistricts from the JSON file
export const loadSubDistricts = async (): Promise<SubDistrict[]> => {
  if (subDistrictsCache) return subDistrictsCache;
  
  try {
    const response = await fetch('/Thailand-Address/subDistricts.json');
    const data = await response.json();
    subDistrictsCache = data;
    return data;
  } catch (error) {
    console.error('Error loading subdistricts:', error);
    return [];
  }
};

// Load zipcodes from the JSON file
export const loadZipCodes = async (): Promise<ZipCode[]> => {
  if (zipCodesCache) return zipCodesCache;
  
  try {
    const response = await fetch('/Thailand-Address/zipcodes.json');
    const data = await response.json();
    zipCodesCache = data;
    return data;
  } catch (error) {
    console.error('Error loading zipcodes:', error);
    return [];
  }
};

// Get districts by province ID
export const getDistrictsByProvinceId = async (provinceId: number): Promise<District[]> => {
  const districts = await loadDistricts();
  return districts.filter(district => district.PROVINCE_ID === provinceId);
};

// Get subdistricts by district ID
export const getSubDistrictsByDistrictId = async (districtId: number): Promise<SubDistrict[]> => {
  const subDistricts = await loadSubDistricts();
  return subDistricts.filter(subDistrict => subDistrict.DISTRICT_ID === districtId);
};

// Get all subdistricts for searching
export const getAllSubDistricts = async (): Promise<SubDistrict[]> => {
  return await loadSubDistricts();
};

// Get district by ID
export const getDistrictById = async (districtId: number): Promise<District | null> => {
  const districts = await loadDistricts();
  return districts.find(district => district.DISTRICT_ID === districtId) || null;
};

// Get province by ID
export const getProvinceById = async (provinceId: number): Promise<Province | null> => {
  const provinces = await loadProvinces();
  return provinces.find(province => province.PROVINCE_ID === provinceId) || null;
};

// Cache for zip codes to improve performance
let zipCodeCache: Record<string, string> = {};

// Get zipcode by looking up the subdistrict directly
export const getZipCodeByIds = async (
  districtId: string | number,
  subDistrictId: string | number
): Promise<string> => {
  try {
    // Create a cache key
    const cacheKey = `id_${districtId}_${subDistrictId}`;
    
    // Check if we have this zipcode in cache
    if (zipCodeCache[cacheKey]) {
      return zipCodeCache[cacheKey];
    }
    
    // Get all zipcodes
    const zipCodes = await loadZipCodes();
    
    // We need to convert the ID to the CODE format for lookup
    // First get the subdistrict to find its code
    const subDistricts = await loadSubDistricts();
    const subDistrict = subDistricts.find(sd => sd.SUB_DISTRICT_ID === Number(subDistrictId));
    
    if (!subDistrict) {
      console.error('Subdistrict not found:', subDistrictId);
      return '';
    }
    
    // Now look up using the SUB_DISTRICT_CODE which is in the zipcode data
    const zipCodeRecord = zipCodes.find(zipCode => 
      zipCode.SUB_DISTRICT_CODE === subDistrict.SUB_DISTRICT_CODE
    );
    
    // If found, use it
    if (zipCodeRecord) {
      const result = zipCodeRecord.ZIPCODE;
      zipCodeCache[cacheKey] = result;
      return result;
    }
    
    // If direct code match fails, try to find any zipcode for this subdistrict
    const altMatch = zipCodes.find(zipCode => {
      // Get the first few digits of the subdistrict code which may match the district code
      if (subDistrict.SUB_DISTRICT_CODE && zipCode.DISTRICT_CODE) {
        return zipCode.DISTRICT_CODE.startsWith(subDistrict.SUB_DISTRICT_CODE.substring(0, 4));
      }
      return false;
    });
    
    const result = altMatch ? altMatch.ZIPCODE : '';
    
    // Store in cache for future use
    zipCodeCache[cacheKey] = result;
    
    return result;
  } catch (error) {
    console.error('Error getting zipcode by IDs:', error);
    return '';
  }
};

// Get zipcode by district code and subdistrict code (original method kept for compatibility)
export const getZipCodeByDistrictAndSubDistrict = async (
  districtCode: string,
  subDistrictCode: string
): Promise<string> => {
  try {
    // Create a cache key
    const cacheKey = `${districtCode}_${subDistrictCode}`;
    
    // Check if we have this zipcode in cache
    if (zipCodeCache[cacheKey]) {
      return zipCodeCache[cacheKey];
    }
    
    const zipCodes = await loadZipCodes();
    const zipCodeRecord = zipCodes.find(
      (zipCode) =>
        zipCode.DISTRICT_CODE === districtCode &&
        zipCode.SUB_DISTRICT_CODE === subDistrictCode
    );
    
    const result = zipCodeRecord ? zipCodeRecord.ZIPCODE : '';
    
    // Store in cache for future use
    zipCodeCache[cacheKey] = result;
    
    return result;
  } catch (error) {
    console.error('Error getting zipcode:', error);
    return '';
  }
};

// Hook for loading address data
export const useThailandAddressData = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [subDistricts, setSubDistricts] = useState<SubDistrict[]>([]);
  const [allSubDistricts, setAllSubDistricts] = useState<SubDistrict[]>([]); // For direct subdistrict selection
  const [allDistricts, setAllDistricts] = useState<District[]>([]); // Cache all districts
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedSubDistrict, setSelectedSubDistrict] = useState<SubDistrict | null>(null);
  const [zipCode, setZipCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredSubDistricts, setFilteredSubDistricts] = useState<SubDistrict[]>([]);
  
  // Reset search query when component unmounts or when user navigates away
  useEffect(() => {
    return () => {
      setSearchQuery('');
      setFilteredSubDistricts([]);
    };
  }, []);

  // Load all provinces and subdistricts on initial render
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load all data in parallel for better performance
        const [provincesData, districtsData, subDistrictsData] = await Promise.all([
          loadProvinces(),
          loadDistricts(),
          getAllSubDistricts()
        ]);
        
        setProvinces(provincesData);
        setAllDistricts(districtsData);
        
        // Sort subdistricts by name for easier browsing
        const sortedSubdistricts = [...subDistrictsData].sort((a, b) => 
          a.SUB_DISTRICT_NAME.localeCompare(b.SUB_DISTRICT_NAME)
        );
        
        setAllSubDistricts(sortedSubdistricts);
        
        // Show more initial results for better user experience
        setFilteredSubDistricts(sortedSubdistricts.slice(0, 200));
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      return;
    }

    const loadDistrictsForProvince = async () => {
      try {
        setLoading(true);
        const data = await getDistrictsByProvinceId(selectedProvince.PROVINCE_ID);
        setDistricts(data);
      } catch (error) {
        console.error('Error loading districts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDistrictsForProvince();
  }, [selectedProvince]);

  // Load subdistricts when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setSubDistricts([]);
      setSelectedSubDistrict(null);
      return;
    }

    const loadSubDistrictsForDistrict = async () => {
      try {
        setLoading(true);
        const data = await getSubDistrictsByDistrictId(selectedDistrict.DISTRICT_ID);
        setSubDistricts(data);
      } catch (error) {
        console.error('Error loading subdistricts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubDistrictsForDistrict();
  }, [selectedDistrict]);

  // Load zipcode when subdistrict changes
  useEffect(() => {
    if (!selectedDistrict || !selectedSubDistrict) {
      setZipCode('');
      return;
    }

    const loadZipCodeForSubDistrict = async () => {
      try {
        setLoading(true);
        const zipcode = await getZipCodeByDistrictAndSubDistrict(
          selectedDistrict.DISTRICT_CODE,
          selectedSubDistrict.SUB_DISTRICT_CODE
        );
        setZipCode(zipcode);
      } catch (error) {
        console.error('Error loading zipcode:', error);
      } finally {
        setLoading(false);
      }
    };

    loadZipCodeForSubDistrict();
  }, [selectedDistrict, selectedSubDistrict]);

  // Set province by ID
  const setProvinceById = async (provinceId: number) => {
    const provinces = await loadProvinces();
    const province = provinces.find(p => p.PROVINCE_ID === provinceId);
    if (province) {
      setSelectedProvince(province);
    }
  };

  // Set district by ID
  const setDistrictById = async (districtId: number) => {
    if (!selectedProvince) return;
    
    const districts = await getDistrictsByProvinceId(selectedProvince.PROVINCE_ID);
    const district = districts.find(d => d.DISTRICT_ID === districtId);
    if (district) {
      setSelectedDistrict(district);
    }
  };

  // Set subdistrict by ID
  const setSubDistrictById = async (subDistrictId: number) => {
    if (!selectedDistrict) return;
    
    const subDistricts = await getSubDistrictsByDistrictId(selectedDistrict.DISTRICT_ID);
    const subDistrict = subDistricts.find(sd => sd.SUB_DISTRICT_ID === subDistrictId);
    if (subDistrict) {
      setSelectedSubDistrict(subDistrict);
    }
  };

  // Filter subdistricts by search query with enhanced information
  useEffect(() => {
    const updateFilteredSubdistricts = async () => {
      setLoading(true);
      try {
        if (searchQuery.trim() === '') {
          // Show more results when there's no query, but still limit to avoid performance issues
          setFilteredSubDistricts(allSubDistricts.slice(0, 200));
        } else {
          // Get filtered list based on both subdistrict and district name matches
          // This allows users to search by either subdistrict or district name
          let filtered = allSubDistricts.filter(subDistrict => {
            const query = searchQuery.toLowerCase();
            
            // Match on subdistrict name
            const nameMatch = subDistrict.SUB_DISTRICT_NAME.toLowerCase().includes(query);
            
            // Match on district name
            let districtMatch = false;
            const district = allDistricts.find(d => d.DISTRICT_ID === subDistrict.DISTRICT_ID);
            if (district) {
              districtMatch = district.DISTRICT_NAME.toLowerCase().includes(query);
            }
            
            return nameMatch || districtMatch;
          });
          
          // If we have too many results, limit them
          if (filtered.length > 200) {
            filtered = filtered.slice(0, 200);
          }
          
          // Use cached data instead of loading again
          const allZipCodes = await loadZipCodes();
          
          // Enhance the filtered subdistricts with province and district names
          const enhancedFiltered = await Promise.all(filtered.map(async (subDistrict) => {
            // Find the corresponding district from our cached allDistricts
            const district = allDistricts.find(d => d.DISTRICT_ID === subDistrict.DISTRICT_ID);
            
            // Find the corresponding province from our cached provinces
            const province = provinces.find(p => p.PROVINCE_ID === subDistrict.PROVINCE_ID);
            
            // Get the zipcode directly from zipcode data - match on SUB_DISTRICT_CODE
            const zipCodeRecord = allZipCodes.find(z => 
              z.SUB_DISTRICT_CODE === subDistrict.SUB_DISTRICT_CODE
            );
            
            // Log what we found for debugging
            if (zipCodeRecord) {
            }
            
            return {
              ...subDistrict,
              DISTRICT_NAME: district ? district.DISTRICT_NAME : '',
              PROVINCE_NAME: province ? province.PROVINCE_NAME : '',
              ZIP_CODE: zipCodeRecord ? zipCodeRecord.ZIPCODE : ''
            };
          }));
          
          setFilteredSubDistricts(enhancedFiltered);
        }
      } catch (error) {
        console.error('Error enhancing subdistrict results:', error);
      } finally {
        setLoading(false);
      }
    };
    
    updateFilteredSubdistricts();
  }, [searchQuery, allSubDistricts]);

  // Set address details by subdistrict (reverse lookup)
  const setAddressBySubDistrict = async (subDistrictId: number) => {
    try {
      setLoading(true);
      
      // Find the selected subdistrict
      const subDistrict = allSubDistricts.find(sd => sd.SUB_DISTRICT_ID === subDistrictId);
      if (!subDistrict) return;
      
      // Set selected subdistrict
      setSelectedSubDistrict(subDistrict);
      
      // Get district info
      const district = await getDistrictById(subDistrict.DISTRICT_ID);
      if (district) {
        setSelectedDistrict(district);
        setDistricts([district]);
      }
      
      // Get province info
      const province = await getProvinceById(subDistrict.PROVINCE_ID);
      if (province) {
        setSelectedProvince(province);
        
        // Load other districts in this province for the dropdown
        const districtsInProvince = await getDistrictsByProvinceId(province.PROVINCE_ID);
        setDistricts(districtsInProvince);
      }
      
      // Load all zip codes to find a direct match
      const allZipCodes = await loadZipCodes();
      
      // We need the subdistrict code for lookup
      const zipCodeRecord = allZipCodes.find(z => 
        z.SUB_DISTRICT_CODE === subDistrict.SUB_DISTRICT_CODE
      );
      
      if (zipCodeRecord) {
        setZipCode(zipCodeRecord.ZIPCODE);
      } else {
        // Fallback to ID-based lookup
        const zipById = await getZipCodeByIds(
          subDistrict.DISTRICT_ID,
          subDistrict.SUB_DISTRICT_ID
        );
        
        if (zipById) {
          setZipCode(zipById);
        } else if (district) {
          // Fallback to code-based lookup
          const zip = await getZipCodeByDistrictAndSubDistrict(
            district.DISTRICT_CODE,
            subDistrict.SUB_DISTRICT_CODE
          );
          
          if (zip) {
            setZipCode(zip);
          } else {
            console.error('No zipcode found for this combination');
          }
        }
      }
    } catch (error) {
      console.error('Error setting address by subdistrict:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    provinces,
    districts,
    subDistricts,
    filteredSubDistricts,
    selectedProvince,
    selectedDistrict,
    selectedSubDistrict,
    zipCode,
    loading,
    searchQuery,
    setSearchQuery,
    setSelectedProvince,
    setSelectedDistrict,
    setSelectedSubDistrict,
    setProvinceById,
    setDistrictById,
    setSubDistrictById,
    setAddressBySubDistrict,
    // Include total counts for debugging/display
    totalSubDistricts: allSubDistricts.length,
    totalProvinces: provinces.length,
    totalDistricts: allDistricts.length
  };
};
