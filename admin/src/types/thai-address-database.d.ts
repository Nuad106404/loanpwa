declare module 'thai-address-database' {
  export interface AddressData {
    district: string;
    amphoe: string;
    province: string;
    zipcode: string;
  }
  
  export function searchAddressByDistrict(query: string): AddressData[];
  export function searchAddressByAmphoe(query: string): AddressData[];
  export function searchAddressByProvince(query: string): AddressData[];
  export function searchAddressByZipcode(query: string): AddressData[];
}
