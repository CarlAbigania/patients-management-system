import React, { useEffect, useState } from 'react';
import { Button, Table, Modal, Form, Container, Row, Col, Alert, Card } from 'react-bootstrap';
import { Patient } from '../types'; // Assuming types.ts is in ../src

const API_URL = 'http://127.0.0.1:8000/api'; // Assuming backend runs on port 8000

interface PatientManagementProps {
    onViewRecords: (patient: Patient) => void;
}

const PatientManagement: React.FC<PatientManagementProps> = ({ onViewRecords }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPatient, setCurrentPatient] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<{ first_name: string; last_name: string }>({ first_name: '', last_name: '' });
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/patients`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setPatients(data);
        } catch (e) {
            console.error("Failed to fetch patients:", e);
            setError('Failed to load patients. Please ensure the backend server is running and accessible.');
        }
    };

    const handleShowModal = (patient?: Patient) => {
        setCurrentPatient(patient || null);
        setFormData(patient ? { first_name: patient.first_name, last_name: patient.last_name } : { first_name: '', last_name: '' });
        setShowModal(true);
        setError(null);
        setSuccessMessage(null);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentPatient(null);
        setFormData({ first_name: '', last_name: '' });
        setError(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.first_name || !formData.last_name) {
            setError("First name and last name are required.");
            return;
        }
        setError(null);
        setSuccessMessage(null);

        try {
            const method = currentPatient ? 'PUT' : 'POST';
            const url = currentPatient ? `${API_URL}/patients/${currentPatient.id}` : `${API_URL}/patients`;
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                const errorMessages = errorData.errors ? Object.values(errorData.errors).flat().join(' ') : (errorData.message || `HTTP error! status: ${response.status}`);
                throw new Error(errorMessages);
            }
            setSuccessMessage(currentPatient ? 'Patient updated successfully!' : 'Patient added successfully!');
            fetchPatients();
            handleCloseModal();
        } catch (e: any) {
            console.error("Failed to save patient:", e);
            setError(e.message || 'Failed to save patient.');
        }
    };

    const handleDelete = async (id?: number) => {
        if (!id || !window.confirm('Are you sure you want to delete this patient?')) {
            return;
        }
        setError(null);
        setSuccessMessage(null);
        try {
            const response = await fetch(`${API_URL}/patients/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok && response.status !== 204) { // 204 No Content is a success for DELETE
                 const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            setSuccessMessage('Patient deleted successfully!');
            fetchPatients();
        } catch (e: any) {
            console.error("Failed to delete patient:", e);
            setError(e.message || 'Failed to delete patient.');
        }
    };

    return (
        <Container fluid className="pt-4 px-4 bg-gradient-light min-vh-100 patient-management-container">
            <div className="max-w-7xl mx-auto">
                <Row className="mb-4 align-items-center">
                    <Col>
                        <h2 className="text-dark mb-0 d-flex align-items-center">
                            <i className="bi bi-people-fill me-3 text-primary"></i>
                            Patient Management
                        </h2>
                    </Col>
                    <Col className="text-end">
                        <Button
                            variant="primary"
                            onClick={() => handleShowModal()}
                            className="rounded-3 px-4 py-2 shadow-sm"
                        >
                            <i className="bi bi-person-plus-fill me-2"></i>Add New Patient
                        </Button>
                    </Col>
                </Row>

                {error && (
                    <Alert variant="danger" onClose={() => setError(null)} dismissible className="mb-4 rounded-3 shadow-sm">
                        <i className="bi bi-exclamation-triangle me-2"></i>{error}
                    </Alert>
                )}
                {successMessage && (
                    <Alert variant="success" onClose={() => setSuccessMessage(null)} dismissible className="mb-4 rounded-3 shadow-sm">
                        <i className="bi bi-check-circle me-2"></i>{successMessage}
                    </Alert>
                )}

                <Card className="border-0 shadow-sm rounded-3">
                    <Card.Body className="p-0">
                        <div className="table-responsive">
                            <Table hover className="mb-0 align-middle">
                                <thead>
                                    <tr className="bg-light">
                                        <th className="border-0 py-3 px-4">ID</th>
                                        <th className="border-0 py-3 px-4">First Name</th>
                                        <th className="border-0 py-3 px-4">Last Name</th>
                                        <th className="border-0 py-3 px-4 text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {patients.length > 0 ? patients.map((patient) => (
                                        <tr key={patient.id} className="border-bottom">
                                            <td className="px-4 py-3">
                                                <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">
                                                    #{patient.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-person me-2 text-muted"></i>
                                                    {patient.first_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="d-flex align-items-center">
                                                    <i className="bi bi-person me-2 text-muted"></i>
                                                    {patient.last_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-end">
                                                <Button
                                                    variant="outline-info"
                                                    size="sm"
                                                    className="me-2 rounded-3"
                                                    onClick={() => onViewRecords(patient)}
                                                >
                                                    <i className="bi bi-journal-text me-1"></i>View Records
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    className="me-2 rounded-3"
                                                    onClick={() => handleShowModal(patient)}
                                                >
                                                    <i className="bi bi-pencil me-1"></i>Edit
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    className="rounded-3"
                                                    onClick={() => handleDelete(patient.id)}
                                                >
                                                    <i className="bi bi-trash me-1"></i>Delete
                                                </Button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="text-center py-5">
                                                <div className="mb-4">
                                                    <i className="bi bi-people display-1 text-primary opacity-25"></i>
                                                </div>
                                                <h4 className="text-muted mb-3">No Patients Found</h4>
                                                <p className="text-muted mb-4">Start by adding a new patient to your system</p>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => handleShowModal()}
                                                    className="rounded-3 px-4 py-2"
                                                >
                                                    <i className="bi bi-person-plus-fill me-2"></i>Add New Patient
                                                </Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Card.Body>
                </Card>
            </div>

            <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
                <Modal.Header closeButton className="bg-white border-0">
                    <Modal.Title className="d-flex align-items-center text-dark">
                        <i className="bi bi-person me-3 text-primary"></i>
                        {currentPatient ? 'Edit Patient Information' : 'Add New Patient'}
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
                            <Form.Label className="text-muted fw-bold">First Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Enter first name"
                                required
                                className="form-control-lg rounded-3"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label className="text-muted fw-bold">Last Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Enter last name"
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
                                className="rounded-3"
                            >
                                {currentPatient ? (
                                    <>
                                        <i className="bi bi-save me-2"></i>Save Changes
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-plus-circle me-2"></i>Add Patient
                                    </>
                                )}
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            <style>
                {`
                    .patient-management-container .max-w-7xl {
                        max-width: 1280px;
                    }
                    .patient-management-container .bg-gradient-light {
                        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    }
                    .patient-management-container .table > :not(caption) > * > * {
                        padding: 1rem 1.5rem;
                    }
                    .patient-management-container .form-control:focus {
                        box-shadow: none;
                        border-color: #0d6efd;
                    }
                    .patient-management-container .btn-primary {
                        background-color: #0d6efd;
                        border: none;
                    }
                    .patient-management-container .btn-primary:hover {
                        background-color: #0b5ed7;
                    }
                    .patient-management-container .modal-content {
                        border: none;
                        border-radius: 0.5rem;
                    }
                    .patient-management-container .table tbody tr:hover {
                        background-color: rgba(13, 110, 253, 0.05);
                    }
                `}
            </style>
        </Container>
    );
};

export default PatientManagement;

