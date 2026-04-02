import React, { useState, useEffect } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import axios from 'axios';

const UpdateReportModal = ({ show, onHide, reportId }) => {
  const [reportData, setReportData] = useState({
    // Initialize with empty or default values for your fields
    // For example:
    reportItems: [],
    ibyangiritse: 0,
    soldAt: 0,
    depts: 0,
    real: 0,
    comments: '',
    igice: 0,
    givenTo: '',
    paymentMethod: '',
    status: 'PAID',
    sales: 0,
    costs: 0,
    taxPrice: 0,
    netProfit: 0,
    grossProfit: 0,
    user: '',
    isPaid: false,
    inStock: 0,
    paidAt: '',
  });

  useEffect(() => {
    // Fetch the report data by ID when the modal is shown
    if (show) {
      axios
        .get(`/api/report/update/${reportId}`)
        .then((response) => {
          setReportData(response.data);
        })
        .catch((error) => {
          console.error('Error fetching report data:', error);
        });
    }
  }, [show, reportId]);

  const handleUpdate = () => {
    axios
      .put(`/api/reports/update/${reportId}`, reportData)
      .then((response) => {
        console.log('Report updated:', response.data);
        onHide();
      })
      .catch((error) => {
        console.error('Error updating report:', error);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReportData({ ...reportData, [name]: value });
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Render form fields here */}
          {/* For example: */}
          <Form.Group controlId="formBasicSales">
            <Form.Label>Sales</Form.Label>
            <Form.Control
              type="number"
              name="sales"
              value={reportData.sales}
              onChange={handleChange}
            />
          </Form.Group>
          {/* Add other fields as needed */}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleUpdate}>
          Update
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateReportModal;
