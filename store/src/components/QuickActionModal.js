import React, { useState, useContext, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup } from 'react-bootstrap';
import axios from 'axios';
import { Store } from '../Store';
import { toast } from 'react-toastify';
import { getError } from '../utils';

// VERSION 7.0 - REFINED LAYOUT SYNC (DEPTS & PAYMENT METHOD ROW)
const modalStyle = { backgroundColor: '#1a2233', color: '#ffffff', borderRadius: '12px', border: 'none' };
const inputStyle = { backgroundColor: '#f8f9fa', border: '1px solid #ced4da', borderRadius: '6px', padding: '12px', color: '#333' };
const labelStyle = { color: '#9ba4b4', fontWeight: '600', fontSize: '0.85rem', marginBottom: '4px', display: 'block' };
const orangeButtonStyle = { backgroundColor: '#f39200', border: 'none', borderRadius: '30px', padding: '14px', fontWeight: 'bold', fontSize: '1.1rem' };
const secondaryButtonStyle = { backgroundColor: 'transparent', border: '1px solid #4a5568', borderRadius: '30px', color: '#9ba4b4', padding: '10px' };

export default function QuickActionModal({ show, onHide, product, onSuccess }) {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [step, setStep] = useState(1);

  // Core Model Fields as explicit state
  const [real, setReal] = useState(0);              
  const [soldAt, setSoldAt] = useState(0);          
  const [depts, setDepts] = useState(0);            
  const [ibyangiritse, setIbyangiritse] = useState(0); 
  const [givenTo, setGivenTo] = useState('');       
  const [comments, setComments] = useState('Paid'); 
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [igice, setIgice] = useState(0);            
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && show) {
      setReal(0);
      setSoldAt(product.price || 0);
      setDepts(0);
      setIbyangiritse(0);
      setGivenTo('');
      setComments('Paid');
      setPaymentMethod('Cash');
      setStep(1);
    }
  }, [product, show]);

  // Live total calculation for Igice
  useEffect(() => {
    setIgice(Number(real) * Number(soldAt));
  }, [real, soldAt]);

  const calculateTotals = () => {
    const qty = Number(real) || 0;
    const unitSoldPrice = Number(soldAt) || 0;
    const unitCostPrice = product?.costPrice || 0;
    const damageQty = Number(ibyangiritse) || 0;
    const totalDebt = Number(depts) || 0;

    const grossRevenueValue = (qty * unitSoldPrice) - totalDebt;
    const costsValue = (qty + damageQty) * unitCostPrice;
    const grossProfitValue = grossRevenueValue - costsValue;
    const taxValue = 0.18 * Math.max(0, grossProfitValue);
    const netProfitValue = grossProfitValue - taxValue;

    return { sales: grossRevenueValue, costs: costsValue, debt: totalDebt, grossProfit: grossProfitValue, tax: taxValue, netProfit: netProfitValue };
  };

  const totals = calculateTotals();

  const handleCommit = async () => {
    setLoading(true);
    try {
      const reportData = {
        reportItems: [{ ...product, quantity: Number(real), price: Number(soldAt), product: product._id }],
        paymentMethod,
        sales: totals.sales,
        igice: igice,
        costs: totals.costs,
        taxPrice: totals.tax,
        grossProfit: totals.grossProfit,
        netProfit: totals.netProfit.toString(),
        soldAt: Number(soldAt),
        real: Number(real),
        depts: totals.debt,
        ibyangiritse: Number(ibyangiritse),
        givenTo: Number(depts) > 0 ? givenTo : "",
        comments: comments,
        isPaid: totals.debt === 0,
        user: userInfo._id
      };

      await axios.post('/api/report', reportData, { headers: { Authorization: `Bearer ${userInfo.token}` } });
      await axios.put(`/api/products/${product._id}`, 
        { ...product, countInStock: product.countInStock - Number(real) - Number(ibyangiritse), sold: (product.sold || 0) + Number(real) },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      toast.success('Report successfully permanently archived!');
      onSuccess();
      onHide();
    } catch (err) { toast.error(getError(err)); } finally { setLoading(false); }
  };

  if (!product) return null;

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <div style={modalStyle} className="p-4 shadow-lg rounded-3">
        <button type="button" className="btn-close btn-close-white float-end" onClick={onHide}></button>
        {step === 1 ? (
          <div>
            <h2 className="fw-bold mb-4 fs-4 mt-3">Daily Inventory Data</h2>
            <p className="text-muted small mb-3">{product.name}</p>
            <Form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <Row className="mb-3">
                <Col md={6}>
                  <label style={labelStyle}>Real Quantity Sold</label>
                  <Form.Control type="number" style={inputStyle} value={real} onChange={(e) => setReal(e.target.value)} required />
                </Col>
                <Col md={6}>
                  <label style={labelStyle}>Actual Sold Price</label>
                  <Form.Control type="number" style={inputStyle} value={soldAt} onChange={(e) => setSoldAt(e.target.value)} required />
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <label style={labelStyle}>Debt Amount (depts)</label>
                  <Form.Control type="number" style={inputStyle} value={depts} onChange={(e) => {
                    const val = e.target.value;
                    setDepts(val);
                    if (Number(val) > 0) { setPaymentMethod('Debt'); }
                  }} placeholder="0" />
                </Col>
                <Col md={6}>
                  <label style={labelStyle}>Payment Method</label>
                  <Form.Select style={inputStyle} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="Cash">Cash</option><option value="MoMo">MoMo</option><option value="Debt">Debt (Ideni)</option>
                  </Form.Select>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={Number(depts) > 0 ? 6 : 12}>
                  <label style={labelStyle}>Damaged items (ibyangiritse)</label>
                  <Form.Control type="number" style={inputStyle} value={ibyangiritse} onChange={(e) => setIbyangiritse(e.target.value)} />
                </Col>
                {Number(depts) > 0 && (
                  <Col md={6} className="animate__animated animate__fadeIn">
                    <label style={labelStyle}>Customer Name (givenTo)</label>
                    <Form.Control placeholder="Izina rya nyir'ideni" style={inputStyle} value={givenTo} onChange={(e) => setGivenTo(e.target.value)} required />
                  </Col>
                )}
              </Row>
              <Form.Group className="mb-4">
                <label style={labelStyle}>Technical Comments (comments)</label>
                <Form.Control as="textarea" rows={2} style={inputStyle} value={comments} onChange={(e) => setComments(e.target.value)} />
              </Form.Group>
              <div className="bg-primary bg-opacity-10 p-3 rounded mb-4 d-flex justify-content-between align-items-center">
                 <span className="small text-primary fw-bold">TOTAL SALE AMOUNT (IGICE)</span>
                 <span className="fw-bold">{igice.toLocaleString()} RWF</span>
              </div>
              <div className="d-grid gap-2">
                <Button type="submit" style={orangeButtonStyle}>Confirm & Continue</Button>
                <Button variant="link" style={secondaryButtonStyle} onClick={onHide} className="text-decoration-none">Back to Stock</Button>
              </div>
            </Form>
          </div>
        ) : (
          <div>
            <h2 className="fw-bold mb-4 fs-4 mt-3">Final Audit Review</h2>
            <div className="rounded p-4 mb-4" style={{ backgroundColor: '#101726' }}>
               <Row className="mb-3 text-muted small"><Col xs={7}>Outstanding Debt</Col><Col xs={5} className="text-end text-danger">{totals.debt.toLocaleString()} RWF</Col></Row>
               <Row className="mb-3 text-muted small"><Col xs={7}>Gross Revenue</Col><Col xs={5} className="text-end text-white fw-bold">{totals.sales.toLocaleString()} RWF</Col></Row>
               <Row className="mb-3 text-muted small"><Col xs={7}>Acquisition Costs</Col><Col xs={5} className="text-end text-white fw-bold">{totals.costs.toLocaleString()} RWF</Col></Row>
               <hr style={{ borderColor: '#2d3748' }} />
               <div className="d-flex justify-content-between align-items-center mt-3"><span className="fw-bold text-white small">NET OPERATING PROFIT</span><span className="fw-bold fs-4" style={{ color: totals.netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>{Math.floor(totals.netProfit).toLocaleString()} RWF</span></div>
            </div>
            <div className="d-grid gap-2">
              <Button onClick={handleCommit} disabled={loading} style={orangeButtonStyle}>{loading ? 'Committing...' : 'Commit to Ledger'}</Button>
              <Button variant="link" style={secondaryButtonStyle} onClick={() => setStep(1)} className="text-decoration-none mt-2">Modify Details</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
