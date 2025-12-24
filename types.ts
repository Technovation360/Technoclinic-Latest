
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  ASSISTANT = 'ASSISTANT',
  TOKEN_SCREEN = 'TOKEN_SCREEN',
  PATIENT = 'PATIENT'
}

export enum VerificationStatus {
  UNVERIFIED = 'UNVERIFIED',
  VERIFIED = 'VERIFIED',
  SUSPENDED = 'SUSPENDED'
}

export enum MappingStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export enum DoctorType {
  CONSULTING = 'CONSULTING',
  VISITING = 'VISITING',
  RESIDENT = 'RESIDENT'
}

export enum PatientStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface OperationTime {
  days: string;
  hours?: string; // Legacy support
  startTime?: string;
  endTime?: string;
  specialty: string;
}

// Global Doctor Entity (Central Registry)
export interface Doctor {
  id: string;
  name: string;
  mobile: string; // Global Unique Identifier
  email?: string;
  specialization: string;
  verificationStatus: VerificationStatus;
  createdAt: number;
  source: string; // "Command Center" or Clinic Name
}

// Global Assistant Entity (Central Registry)
export interface Assistant {
  id: string;
  name: string;
  mobile: string; // Global Unique Identifier
  email?: string;
  verificationStatus: VerificationStatus;
  createdAt: number;
  source: string; // "Command Center" or Clinic Name
}

// Clinic-specific Doctor Mapping (Many-to-Many)
export interface DoctorClinicMapping {
  id: string;
  doctorId: string;
  clinicId: string;
  doctorType: DoctorType;
  timings: OperationTime[];
  status: MappingStatus;
  createdAt: number;
}

// Clinic-specific Assistant Mapping (Many-to-Many)
export interface AssistantClinicMapping {
  id: string;
  assistantId: string;
  clinicId: string;
  timings: OperationTime[];
  status: MappingStatus;
  createdAt: number;
}

export interface Tenant {
  id: string; 
  name: string;
  address: string;
  phone?: string;
  email?: string;
  city: string;
  state: string;
  pincode: string;
  specialties: string[];
  operationTimings: OperationTime[];
  isTokenBased: boolean;
  isAppointmentBased: boolean;
  createdAt: number;
  allowMediaAccess?: boolean;
}

export interface Patient {
  id: string;
  tokenNumber: number;
  name: string;
  phone: string;
  status: PatientStatus;
  cabinId?: string;
  doctorId?: string;
  registeredAt: number;
}

export interface Cabin {
  id: string;
  name: string;
  currentDoctorId?: string;
  currentPatientId?: string;
}

// Added MediaAsset interface to fix export error in TokenScreen.tsx
export interface MediaAsset {
  id: string;
  url: string;
  assignedTenantIds: string[];
}

export interface ClinicState {
  tenant: Tenant;
  patients: Patient[];
  cabins: Cabin[];
  doctors: Doctor[];
  assistants: Assistant[];
  videoUrls: string[];
  lastTokenNumber: number;
}
