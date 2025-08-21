// We'll use dynamic fetching instead of static imports
let provinces: Province[] = [];
let districts: District[] = [];
let subDistricts: SubDistrict[] = [];
let zipcodes: ZipCode[] = [];

// Load data on initialization
const loadData = async () => {
  try {
    const [provincesRes, districtsRes, subDistrictsRes, zipcodesRes] = await Promise.all([
      fetch('/Thailand-Address/provinces.json'),
      fetch('/Thailand-Address/districts.json'),
      fetch('/Thailand-Address/subDistricts.json'),
      fetch('/Thailand-Address/zipcodes.json')
    ]);
    
    provinces = await provincesRes.json();
    districts = await districtsRes.json();
    subDistricts = await subDistrictsRes.json();
    zipcodes = await zipcodesRes.json();
    
  } catch (error) {
    console.error('Error loading Thailand address data:', error);
  }
};

// Start loading the data immediately
loadData();

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

export const getProvinces = (): Province[] => {
  return provinces;
};

export const getDistricts = (provinceId: number): District[] => {
  return districts.filter(district => district.PROVINCE_ID === provinceId);
};

export const getSubDistricts = (districtId: number): SubDistrict[] => {
  return subDistricts.filter(subDistrict => subDistrict.DISTRICT_ID === districtId);
};

export const getZipCode = (subDistrictCode: string): string | undefined => {
  const zipCodeEntry = zipcodes.find(zip => zip.SUB_DISTRICT_CODE === subDistrictCode);
  return zipCodeEntry?.ZIPCODE;
};

export const findAddressByZipCode = (zipCode: string) => {
  const zipCodeEntry = zipcodes.find(zip => zip.ZIPCODE === zipCode);
  if (!zipCodeEntry) return null;

  const subDistrict = subDistricts.find(sd => sd.SUB_DISTRICT_CODE === zipCodeEntry.SUB_DISTRICT_CODE);
  if (!subDistrict) return null;

  const district = districts.find(d => d.DISTRICT_ID === subDistrict.DISTRICT_ID);
  if (!district) return null;

  const province = provinces.find(p => p.PROVINCE_ID === subDistrict.PROVINCE_ID);
  if (!province) return null;

  return {
    subDistrict: subDistrict.SUB_DISTRICT_NAME,
    district: district.DISTRICT_NAME,
    province: province.PROVINCE_NAME,
    zipCode
  };
};

export const findAddressBySubDistrict = (subDistrictName: string) => {
  const subDistrict = subDistricts.find(sd => 
    sd.SUB_DISTRICT_NAME.toLowerCase().includes(subDistrictName.toLowerCase())
  );
  if (!subDistrict) return null;

  const district = districts.find(d => d.DISTRICT_ID === subDistrict.DISTRICT_ID);
  if (!district) return null;

  const province = provinces.find(p => p.PROVINCE_ID === subDistrict.PROVINCE_ID);
  if (!province) return null;

  const zipCodeEntry = zipcodes.find(zip => zip.SUB_DISTRICT_CODE === subDistrict.SUB_DISTRICT_CODE);
  if (!zipCodeEntry) return null;

  return {
    subDistrict: subDistrict.SUB_DISTRICT_NAME,
    district: district.DISTRICT_NAME,
    province: province.PROVINCE_NAME,
    zipCode: zipCodeEntry.ZIPCODE
  };
};

export const searchAddresses = (query: string) => {
  const results: Array<{
    subDistrict: string;
    district: string;
    province: string;
    zipCode: string;
  }> = [];

  const normalizedQuery = query.toLowerCase();

  subDistricts.forEach(sd => {
    if (sd.SUB_DISTRICT_NAME.toLowerCase().includes(normalizedQuery)) {
      const district = districts.find(d => d.DISTRICT_ID === sd.DISTRICT_ID);
      const province = provinces.find(p => p.PROVINCE_ID === sd.PROVINCE_ID);
      const zipCodeEntry = zipcodes.find(zip => zip.SUB_DISTRICT_CODE === sd.SUB_DISTRICT_CODE);

      if (district && province && zipCodeEntry) {
        results.push({
          subDistrict: sd.SUB_DISTRICT_NAME,
          district: district.DISTRICT_NAME,
          province: province.PROVINCE_NAME,
          zipCode: zipCodeEntry.ZIPCODE
        });
      }
    }
  });

  return results.slice(0, 10); // Limit to 10 results for performance
};
