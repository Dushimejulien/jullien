import React, { useState, useEffect } from 'react';
import { Button, Form, Modal, Spinner, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getError } from '../utils';

const UpdateReportModal = ({ show, onHide, reportId }) => {
  const [reportData, setReportData] = useState({
    ibyangiritse: 0,
    soldAt: 0,
    depts: 0,
    real: 0,
    comments: '',
    paymentMethod: '',
    sales: 0,
    costs: 0,
    netProfit: 0,
  });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (show && reportId) {
      const fetchData = async () => {
        try {
          setLoading(true);
          const { data } = await axios.get(`/api/report/update/${reportId}`);
          setReportData(data);
        } catch (err) {
          toast.error(getError(err));
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [show, reportId]);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      await axios.put(`/api/reports/update/${reportId}`, reportData);
      toast.success('Audit report updated successfully');
      onHide();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReportData({ ...reportData, [name]: value });
  };

  return (
    <Modal show={show} onHide={onHide} centered size="lg" className="modern-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-gradient">Update Audit Entry</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2 px-4">
        <p className="text-muted small mb-4">Modify existing transaction records for reconciliation.</p>
        
        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
        ) : (
          <Form>
            <Row className="gy-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Actual Sales (Units)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="real" 
                    className="border-0 bg-light p-3 rounded-3"
                    value={reportData.real} 
                    onChange={handleChange} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Selling Price (RWF)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="soldAt" 
                    className="border-0 bg-light p-3 rounded-3"
                    value={reportData.soldAt} 
                    onChange={handleChange} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Outstanding Debt (RWF)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="depts" 
                    className="border-0 bg-light p-3 rounded-3 text-danger fw-bold"
                    value={reportData.depts} 
                    onChange={handleChange} 
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Losses / Damaged (Qty)</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="ibyangiritse" 
                    className="border-0 bg-light p-3 rounded-3 text-warning fw-bold"
                    value={reportData.ibyangiritse} 
                    onChange={handleChange} 
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="small fw-bold">Professional Remarks</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    name="comments" 
                    className="border-0 bg-light p-3 rounded-3"
                    placeholder="Enter reconciliation details..."
                    value={reportData.comments} 
                    onChange={handleChange} 
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        )}
      </Modal.Body>
      <Modal.Footer className="border-0 px-4 pb-4">
        <Button variant="light" className="rounded-pill px-4" onClick={onHide}>
          Discard
        </Button>
        <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={handleUpdate} disabled={updating}>
          {updating ? 'Saving Changes...' : 'Save Revisions'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default UpdateReportModal;
