// Vendor image map — matches stall_name to a local asset
import bismillah   from './vendors/bismillah_biryani.png';
import sriLakshmi  from './vendors/sri_lakshmi_dhaba.png';
import mandakini   from './vendors/mandakini_restaurant.png';
import zamzam      from './vendors/zamzam_restaurant.png';
import senapathi   from './vendors/senapathi_hotel.png';
import prasad      from './vendors/prasad_fastfoods.png';

export const VENDOR_IMAGES = {
  'Bismillah Biryani':           bismillah,
  'Sri Lakshmi Mourya Dhaba':    sriLakshmi,
  'Mandakini Restaurant':        mandakini,
  'Zam Zam Family Restaurant':   zamzam,
  'Senapathi Military Hotel':    senapathi,
  'Prasad Fast Foods & Biryanis': prasad,
};

export const getVendorImage = (stallName) =>
  VENDOR_IMAGES[stallName] || null;
