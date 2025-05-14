import React, { useState } from 'react';
import './App.css';
import PatientManagement from './components/PatientManagement';
import MedicalRecordManagement from './components/MedicalRecordManagement';
import { Patient } from './types';
import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

function App() {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [viewMode, setViewMode] = useState<'patients' | 'records'>('patients');

  const handleViewRecords = (patient: Patient) => {
    setSelectedPatient(patient);
    setViewMode('records');
  };

  const handleBackToPatients = () => {
    setSelectedPatient(null);
    setViewMode('patients');
  };

  return (
    <div className="App">
      <Navbar bg="primary" variant="dark" expand="lg" className="mb-4 shadow-sm">
        <Container fluid>
          <Navbar.Brand href="#" onClick={handleBackToPatients} style={{cursor: 'pointer'}}>
            <i className="bi bi-hospital me-2"></i>Mapatay Clinic Records
          </Navbar.Brand>
        </Container>
      </Navbar>
      <Container fluid className="bg-light min-vh-100 p-3">
        {viewMode === 'patients' && <PatientManagement onViewRecords={handleViewRecords} />}
        {viewMode === 'records' && selectedPatient && (
          <MedicalRecordManagement patient={selectedPatient} onBack={handleBackToPatients} />
        )}
      </Container>
    </div>
  );
}

export default App;

