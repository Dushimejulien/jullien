import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { getError } from '../utils';

export default function ExpenseModal({ show, onHide, onSuccess }) {
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/expense', { amount, reason });
      toast.success('Expense recorded');
      setReason('');
      setAmount('');
      if (onSuccess) onSuccess();
      onHide();
    } catch (err) {
      toast.error(getError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered border="0" className="modern-modal">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">New Expense</Modal.Title>
      </Modal.Header>
      <Form onSubmit={submitHandler}>
        <Modal.Body className="py-4">
          <Form.Group className="mb-3" controlId="reason">
            <Form.Label className="small fw-bold">Description</Form.Label>
            <Form.Control
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What was this for?"
              className="bg-light border-0 py-2"
              required
            />
          </Form.Group>
          <Form.Group className="mb-0" controlId="amount">
            <Form.Label className="small fw-bold">Amount (RWF)</Form.Label>
            <Form.Control
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="bg-light border-0 py-2"
              required
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <Button variant="outline-secondary" onClick={onHide} className="rounded-pill px-4">
            Cancel
          </Button>
          <Button variant="primary" type="submit" className="rounded-pill px-4" disabled={loading}>
            {loading ? 'Saving...' : 'Record Expense'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
