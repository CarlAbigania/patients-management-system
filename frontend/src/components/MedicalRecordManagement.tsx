import React, { useEffect, useState, useCallback } from 'react';
import { Button, Table, Modal, Form, Container, Row, Col, Alert, Card, Breadcrumb } from 'react-bootstrap';
import { MedicalRecord, Patient } from '../types'; // Assuming types.ts is in ../src

const API_URL = 'http://127.0.0.1:8000/api';

interface MedicalRecordManagementProps {
    patient: Patient;
    onBack: () => void; // Function to go back to patient list
}

const MedicalRecordManagement: React.FC<MedicalRecordManagementProps> = ({ patient, onBack }) => {
    const [records, setRecords] = useState<MedicalRecord[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<MedicalRecord | null>(null);
    const [formData, setFormData] = useState<{ visit_date: string; diagnosis: string; prescription: string }>({ visit_date: '', diagnosis: '', prescription: '' });
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const fetchRecords = useCallback(async () => {
        if (!patient || !patient.id) return;
        setError(null);
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/patients/${patient.id}/records`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setRecords(data);
        } catch (e) {
            console.error("Failed to fetch medical records:", e);
            setError(`Failed to load medical records for ${patient.first_name} ${patient.last_name}. Please ensure the backend is running.`);
        } finally {
            setIsLoading(false);
        }
    }, [patient]);

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleShowModal = (record?: MedicalRecord) => {
        setCurrentRecord(record || null);
        if (record) {
            // Format the date properly for the input field
            const visitDate = new Date(record.visit_date);
            const year = visitDate.getFullYear();
            const month = String(visitDate.getMonth() + 1).padStart(2, '0');
            const day = String(visitDate.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            setFormData({
                visit_date: formattedDate,
                diagnosis: record.diagnosis,
                prescription: record.prescription
            });
        } else {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            setFormData({
                visit_date: formattedDate,
                diagnosis: '',
                prescription: ''
            });
        }
        setShowModal(true);
        setError(null);
        setSuccessMessage(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentRecord(null);
        setFormData({ visit_date: '', diagnosis: '', prescription: '' });
        setError(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        if (!formData.visit_date || !formData.diagnosis || !formData.prescription) {
            setError("Visit Date, Diagnosis, and Prescription are required.");
            return;
        }
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(true);

        try {
            const method = currentRecord ? 'PUT' : 'POST';
            const url = currentRecord
                ? `${API_URL}/records/${currentRecord.id}`
                : `${API_URL}/records`;

            const recordData = {
                ...formData,
                patient_id: patient.id
            };

            console.log(`Attempting to ${currentRecord ? 'update' : 'create'} record:`, recordData);

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify(recordData),
            });

            console.log('Response status:', response.status);

            if (response.status === 404) {
                throw new Error('Record not found. It may have been deleted.');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                const errorMessages = errorData.errors
                    ? Object.values(errorData.errors).flat().join(' ')
                    : (errorData.message || `HTTP error! status: ${response.status}`);
                throw new Error(errorMessages);
            }

            const newRecord = await response.json();
            console.log('Response data:', newRecord);

            setSuccessMessage(currentRecord ? 'Medical record updated successfully!' : 'Medical record added successfully!');

            // Refresh the records list to ensure UI is in sync with backend
            console.log('Refreshing records list...');
            await fetchRecords();
            console.log('Records list refreshed');
            handleCloseModal();
        } catch (e: any) {
            console.error(`Failed to ${currentRecord ? 'update' : 'save'} medical record:`, e);
            setError(e.message || `Failed to ${currentRecord ? 'update' : 'save'} medical record.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id || !window.confirm('Are you sure you want to delete this medical record?')) {
            return;
        }
        setError(null);
        setSuccessMessage(null);
        try {
            console.log('Attempting to delete record:', id);

            const response = await fetch(`${API_URL}/records/${id}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                },
            });

            console.log('Delete response status:', response.status);

            if (response.status === 404) {
                throw new Error('Record not found. It may have been already deleted.');
            }

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || `Failed to delete record. Status: ${response.status}`);
            }

            setSuccessMessage('Medical record deleted successfully!');

            // Force a refresh of the records list to ensure UI is in sync with backend
            console.log('Refreshing records list...');
            await fetchRecords();
            console.log('Records list refreshed');
        } catch (e: any) {
            console.error("Failed to delete medical record:", e);
            setError(e.message || 'Failed to delete medical record. Please try again.');
            // Refresh the records list to ensure UI is in sync with backend
            console.log('Refreshing records list after error...');
            await fetchRecords();
            console.log('Records list refreshed after error');
        }
    };

    return (
        <Container fluid className="pt-4 px-4 bg-gradient-light min-vh-100 medical-records-container">
            <div className="max-w-7xl mx-auto">
                <Breadcrumb className="bg-transparent p-3 mb-4">
                    <Breadcrumb.Item onClick={onBack} href="#" className="text-primary d-flex align-items-center">
                        <i className="bi bi-arrow-left me-2"></i>Back to Patients
                    </Breadcrumb.Item>
                    <Breadcrumb.Item active className="d-flex align-items-center">
                        <i className="bi bi-journal-text me-2"></i>{patient.first_name} {patient.last_name} - Medical Records
                    </Breadcrumb.Item>
                </Breadcrumb>

                <Card className="mb-4 border-0 shadow-sm rounded-3">
                    <Card.Header className="bg-white border-0 py-3">
                        <Row className="align-items-center">
                            <Col>
                                <h4 className="mb-0 d-flex align-items-center text-dark">
                                    <i className="bi bi-journal-richtext me-3 text-primary"></i>
                                    Medical Records
                                    <span className="ms-3 badge bg-primary bg-opacity-10 text-primary rounded-pill">
                                        ID: {patient.id}
                                    </span>
                                </h4>
                            </Col>
                            <Col xs="auto">
                                <Button
                                    variant="primary"
                                    onClick={() => handleShowModal()}
                                    className="rounded-3 px-4 py-2 shadow-sm"
                                >
                                    <i className="bi bi-plus-lg me-2"></i>Add New Record
                                </Button>
                            </Col>
                        </Row>
                    </Card.Header>
                    <Card.Body className="p-0">
                        {error && (
                            <Alert variant="danger" onClose={() => setError(null)} dismissible className="m-4 rounded-3 shadow-sm">
                                <i className="bi bi-exclamation-triangle me-2"></i>{error}
                            </Alert>
                        )}
                        {successMessage && (
                            <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible className="m-4 rounded-3 shadow-sm">
                                <i className="bi bi-check-circle me-2"></i>{successMessage}
                            </Alert>
                        )}
                        {isLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : records.length > 0 ? (
                            <div className="table-responsive">
                                <Table hover className="mb-0 align-middle">
                                    <thead>
                                        <tr className="bg-light">
                                            <th className="border-0 py-3 px-4">Record ID</th>
                                            <th className="border-0 py-3 px-4">Visit Date</th>
                                            <th className="border-0 py-3 px-4">Diagnosis</th>
                                            <th className="border-0 py-3 px-4">Prescription</th>
                                            <th className="border-0 py-3 px-4 text-end">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {records.map((record) => (
                                            <tr key={record.id} className="border-bottom">
                                                <td className="px-4 py-3">
                                                    <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">
                                                        #{record.id}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="d-flex align-items-center">
                                                        <i className="bi bi-calendar3 me-2 text-muted"></i>
                                                        {new Date(record.visit_date).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-truncate" style={{ maxWidth: '250px' }} title={record.diagnosis}>
                                                        {record.diagnosis}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="text-truncate" style={{ maxWidth: '250px' }} title={record.prescription}>
                                                        {record.prescription}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-end">
                                                    <Button
                                                        variant="outline-primary"
                                                        size="sm"
                                                        className="me-2 rounded-3"
                                                        onClick={() => handleShowModal(record)}
                                                    >
                                                        <i className="bi bi-pencil me-1"></i>Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        className="rounded-3"
                                                        onClick={() => handleDelete(record.id)}
                                                    >
                                                        <i className="bi bi-trash me-1"></i>Delete
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <div className="mb-4">
                                    <i className="bi bi-journal-x display-1 text-primary opacity-25"></i>
                                </div>
                                <h4 className="text-muted mb-3">No Medical Records Found</h4>
                                <p className="text-muted mb-4">Start by adding a new medical record for this patient</p>
                                <Button
                                    variant="primary"
                                    onClick={() => handleShowModal()}
                                    className="rounded-3 px-4 py-2"
                                >
                                    <i className="bi bi-plus-lg me-2"></i>Add New Record
                                </Button>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
                <Modal.Header closeButton className="bg-white border-0">
                    <Modal.Title className="d-flex align-items-center text-dark">
                        <i className="bi bi-journal-text me-3 text-primary"></i>
                        {currentRecord ? 'Edit Medical Record' : 'Add New Medical Record'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {error && (
                        <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4 rounded-3">
                            <i className="bi bi-exclamation-triangle me-2"></i>{error}
                        </Alert>
                    )}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted fw-bold">Visit Date</Form.Label>
                            <Form.Control
                                type="date"
                                name="visit_date"
                                value={formData.visit_date}
                                onChange={handleChange}
                                required
                                className="form-control-lg rounded-3"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted fw-bold">Diagnosis</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="diagnosis"
                                value={formData.diagnosis}
                                onChange={handleChange}
                                placeholder="Enter diagnosis details"
                                required
                                className="form-control-lg rounded-3"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted fw-bold">Prescription</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="prescription"
                                value={formData.prescription}
                                onChange={handleChange}
                                placeholder="Enter prescription details"
                                required
                                className="form-control-lg rounded-3"
                            />
                        </Form.Group>
                        <div className="d-flex justify-content-end mt-4">
                            <Button
                                variant="outline-secondary"
                                onClick={handleCloseModal}
                                className="me-2 rounded-3"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={isSubmitting}
                                className="rounded-3"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Saving...
                                    </>
                                ) : (
                                    currentRecord ? 'Update Record' : 'Add Record'
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <style>
                {`
                    .medical-records-container .max-w-7xl {
                        max-width: 1280px;
                    }
                    .medical-records-container .bg-gradient-light {
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    }
                    .medical-records-container .table > :not(caption) > * > * {
                        padding: 1rem 1.5rem;
                    }
                    .medical-records-container .form-control:focus {
                        box-shadow: none;
                        border-color: #0d6efd;
                    }
                    .medical-records-container .btn-primary {
                        background-color: #0d6efd;
                        border: none;
                    }
                    .medical-records-container .btn-primary:hover {
                        background-color: #0b5ed7;
                    }
                    .medical-records-container .modal-content {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .medical-records-container .table tbody tr:hover {
                        background-color: rgba(13, 110, 253, 0.05);
                    }
                `}
            </style>
        </Container>
    );
};

export default MedicalRecordManagement;

