export interface Patient {
  id?: number;
  first_name: string;
  last_name: string;
  created_at?: string;
  updated_at?: string;
}

export interface MedicalRecord {
  id?: number;
  patient_id: number;
  visit_date: string;
  diagnosis: string;
  prescription: string;
  created_at?: string;
  updated_at?: string;
  patient?: Patient; // Optional: for displaying patient info with record
}

