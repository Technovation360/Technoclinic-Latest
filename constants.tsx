
import { Doctor, Cabin, Assistant, Tenant, VerificationStatus } from './types';

export const SPECIALIZATIONS = [
  "General Physician", "Pediatrician", "Gynaecologist", "Cardiologist", 
  "Dermatologist", "Orthopedic", "ENT Specialist", "Ophthalmologist", 
  "Dentist", "Psychiatrist", "Neurologist", "Urologist", "Oncologist",
  "Endocrinologist", "Gastroenterologist", "Pulmonologist", "Rheumatologist",
  "Nephrologist", "Hematologist", "Surgeon"
];

export const INITIAL_DOCTORS: Doctor[] = [
  { id: 'doc-1', name: 'Dr. Sarah Wilson', specialization: 'General Physician', mobile: '9876543210', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-2', name: 'Dr. James Miller', specialization: 'Cardiologist', mobile: '9876543211', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-3', name: 'Dr. Anita Desai', specialization: 'Pediatrician', mobile: '9876543212', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-4', name: 'Dr. Robert Chen', specialization: 'Orthopedic', mobile: '9876543213', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-5', name: 'Dr. Elena Rossi', specialization: 'Dermatologist', mobile: '9876543214', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-6', name: 'Dr. David Kumar', specialization: 'Neurologist', mobile: '9876543215', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-7', name: 'Dr. Sophia Chang', specialization: 'Gynaecologist', mobile: '9876543216', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-8', name: 'Dr. Michael Brown', specialization: 'ENT Specialist', mobile: '9876543217', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-9', name: 'Dr. Emily White', specialization: 'Psychiatrist', mobile: '9876543218', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'doc-10', name: 'Dr. Arjun Gupta', specialization: 'Ophthalmologist', mobile: '9876543219', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' }
];

export const INITIAL_ASSISTANTS: Assistant[] = [
  { id: 'asst-1', name: 'Mark Thompson', mobile: '9000000001', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-2', name: 'Sarah Parker', mobile: '9000000002', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-3', name: 'Kevin Lee', mobile: '9000000003', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-4', name: 'Priya Sharma', mobile: '9000000004', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-5', name: 'John Smith', mobile: '9000000005', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-6', name: 'Linda Garcia', mobile: '9000000006', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-7', name: 'Ahmed Khan', mobile: '9000000007', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-8', name: 'Rachel Green', mobile: '9000000008', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-9', name: 'Vikram Singh', mobile: '9000000009', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' },
  { id: 'asst-10', name: 'Maria Lopez', mobile: '9000000010', verificationStatus: VerificationStatus.VERIFIED, createdAt: Date.now(), source: 'Command Center' }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'techno-health-center',
    name: 'Techno Health Center',
    address: '123 Medical Hub',
    phone: '+91 9876543210',
    email: 'contact@technohealth.in',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    specialties: ['General Physician'],
    operationTimings: [],
    isTokenBased: true,
    isAppointmentBased: false,
    createdAt: Date.now(),
    allowMediaAccess: true
  },
  {
    id: 'metro-care-clinic',
    name: 'Metro Care Clinic',
    address: '45 Skyway Towers',
    phone: '+91 9876543000',
    email: 'admin@metrocare.in',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    specialties: ['Cardiology', 'Pediatrics'],
    operationTimings: [],
    isTokenBased: true,
    isAppointmentBased: true,
    createdAt: Date.now(),
    allowMediaAccess: true
  },
  {
    id: 'city-wellness-hub',
    name: 'City Wellness Hub',
    address: '88 Green Park Road',
    phone: '+91 9876543111',
    email: 'info@citywellness.in',
    city: 'Delhi',
    state: 'Delhi',
    pincode: '110001',
    specialties: ['Dermatology', 'Psychiatry'],
    operationTimings: [],
    isTokenBased: true,
    isAppointmentBased: false,
    createdAt: Date.now(),
    allowMediaAccess: true
  }
];

export const DEFAULT_TENANT: Tenant = INITIAL_TENANTS[0];

export const INITIAL_VIDEOS: string[] = [
  'https://www.youtube.com/watch?v=9No-FiE9ywg',
  'https://www.youtube.com/watch?v=LXb3EKWsInQ'
];

export const INITIAL_CABINS: Cabin[] = [
  { id: 'cab-1', name: 'Cabin 101' },
  { id: 'cab-2', name: 'Cabin 102' },
  { id: 'cab-3', name: 'Cabin 103' },
  { id: 'cab-4', name: 'Cabin 104' }
];

export const APP_STORAGE_KEY = 'meditoken_state_v1';
export const STORAGE_KEY_TENANTS = 'technoclinic_registered_tenants';
export const STORAGE_KEY_DOCTORS = 'technoclinic_global_doctors';
export const STORAGE_KEY_ASSISTANTS = 'technoclinic_global_assistants';
export const STORAGE_KEY_MAPPINGS = 'technoclinic_doctor_mappings';
export const STORAGE_KEY_ASSISTANT_MAPPINGS = 'technoclinic_assistant_mappings';
export const STORAGE_KEY_MEDIA = 'technoclinic_global_media';
export const STORAGE_KEY_ADVERTISERS = 'technoclinic_advertisers';

export const SUPER_ADMIN_CREDS = {
  user: 'superadmin',
  pass: 'super123'
};
