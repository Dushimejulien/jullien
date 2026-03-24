import React, { useState, useEffect, useContext } from 'react';
import { Modal, Button, Form, Row, Col, ListGroup, InputGroup } from 'react-bootstrap';
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

export default function AdvancedReportModal({ show, onHide }) {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [step, setStep] = useState(0); 

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searching, setSearching] = useState(false);

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
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setSearching(true);
        try {
          const { data } = await axios.get(`/api/products/search?query=${query}`);
          setSearchResults(data.products || []);
        } catch (err) { console.error(getError(err)); } finally { setSearching(false); }
      } else { setSearchResults([]); }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Live total calculation for Igice
  useEffect(() => { setIgice(Number(real) * Number(soldAt)); }, [real, soldAt]);

  const selectProduct = (p) => {
    setSelectedProduct(p);
    setSoldAt(p.price || 0);
    setReal(0); setIbyangiritse(0); setDepts(0); setGivenTo(''); setComments('Paid'); setPaymentMethod('Cash'); setStep(1); setSearchResults([]); setQuery('');
  };

  const calculateTotals = () => {
    const qty = Number(real) || 0;
    const unitSoldPrice = Number(soldAt) || 0;
    const unitCostPrice = selectedProduct?.costPrice || 0;
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
        reportItems: [{ ...selectedProduct, quantity: Number(real), price: Number(soldAt), product: selectedProduct._id }],
        paymentMethod,
        sales: totals.sales, igice: igice, costs: totals.costs, taxPrice: totals.tax, grossProfit: totals.grossProfit, netProfit: totals.netProfit.toString(),
        soldAt: Number(soldAt), real: Number(real), depts: totals.debt, ibyangiritse: Number(ibyangiritse), givenTo: Number(depts) > 0 ? givenTo : "", comments: comments, isPaid: totals.debt === 0, user: userInfo._id
      };
      await axios.post('/api/report', reportData, { headers: { Authorization: `Bearer ${userInfo.token}` } });
      await axios.put(`/api/products/${selectedProduct._id}`, { ...selectedProduct, countInStock: selectedProduct.countInStock - Number(real) - Number(ibyangiritse), sold: (selectedProduct.sold || 0) + Number(real) }, { headers: { Authorization: `Bearer ${userInfo.token}` } });
      toast.success('Report archived successfully!');
      resetForm(); onHide();
    } catch (err) { toast.error(getError(err)); } finally { setLoading(false); }
  };

  const resetForm = () => { setSelectedProduct(null); setQuery(''); setStep(0); };

  return (
    <Modal show={show} onHide={onHide} size="md" centered contentClassName="border-0">
      <div style={modalStyle} className="p-4 shadow-lg rounded-3">
        <button type="button" className="btn-close btn-close-white float-end" onClick={onHide}></button>

        {step === 0 && (
          <div>
            <h2 className="fw-bold mb-4 fs-4 mt-3">Search Product</h2>
            <Form.Group className="mb-4">
              <label style={labelStyle}>Find a product to report</label>
              <InputGroup size="lg"><Form.Control placeholder="Type product name..." style={inputStyle} value={query} onChange={(e) => setQuery(e.target.value)} autoFocus /></InputGroup>
            </Form.Group>
            {searchResults.length > 0 && (
              <ListGroup className="shadow-sm border-0 mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map((p) => (
                  <ListGroup.Item key={p._id} action onClick={() => selectProduct(p)} className="d-flex justify-content-between align-items-center py-3 bg-dark bg-opacity-10 text-white border-0 border-bottom border-secondary">
                    <div><div className="fw-bold">{p.name}</div><div className="small text-muted">Stock: {p.countInStock}</div></div><div className="text-primary fw-bold">{p.price.toLocaleString()} RWF</div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        )}

        {step === 1 && selectedProduct && (
          <div>
            <h2 className="fw-bold mb-1 fs-4 mt-3">Daily Inventory Data</h2>
            <p className="text-muted small mb-4">{selectedProduct.name}</p>
            <Form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <Row className="mb-3"><Col md={6}><label style={labelStyle}>Real Quantity Sold</label><Form.Control type="number" style={inputStyle} value={real} onChange={(e) => setReal(e.target.value)} required /></Col><Col md={6}><label style={labelStyle}>Actual Sold Price</label><Form.Control type="number" style={inputStyle} value={soldAt} onChange={(e) => setSoldAt(e.target.value)} required /></Col></Row>
              <Row className="mb-3">
                <Col md={6}><label style={labelStyle}>Debt Amount (depts)</label><Form.Control type="number" style={inputStyle} value={depts} onChange={(e) => { const val = e.target.value; setDepts(val); if (Number(val) > 0) { setPaymentMethod('Debt'); } }} placeholder="0" /></Col>
                <Col md={6}><label style={labelStyle}>Payment Method</label><Form.Select style={inputStyle} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="Cash">Cash</option><option value="MoMo">MoMo</option><option value="Debt">Debt (Ideni)</option></Form.Select></Col>
              </Row>
              <Row className="mb-3">
                <Col md={Number(depts) > 0 ? 6 : 12}><label style={labelStyle}>Damaged items (ibyangiritse)</label><Form.Control type="number" style={inputStyle} value={ibyangiritse} onChange={(e) => setIbyangiritse(e.target.value)} /></Col>
                {Number(depts) > 0 && (
                  <Col md={6} className="animate__animated animate__fadeIn"><label style={labelStyle}>Customer Name (givenTo)</label><Form.Control placeholder="Izina rya nyir'ideni" style={inputStyle} value={givenTo} onChange={(e) => setGivenTo(e.target.value)} required /></Col>
                )}
              </Row>
              <Form.Group className="mb-4"><label style={labelStyle}>Technical Comments (comments)</label><Form.Control as="textarea" rows={2} style={inputStyle} value={comments} onChange={(e) => setComments(e.target.value)} /></Form.Group>
              <div className="bg-primary bg-opacity-10 p-3 rounded mb-4 d-flex justify-content-between align-items-center"><span className="small text-primary fw-bold">TOTAL SALE AMOUNT (IGICE)</span><span className="fw-bold">{igice.toLocaleString()} RWF</span></div>
              <div className="d-grid gap-2"><Button type="submit" style={orangeButtonStyle}>Confirm & Continue</Button><Button variant="link" style={secondaryButtonStyle} onClick={() => setStep(0)} className="text-decoration-none">Change Product</Button></div>
            </Form>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="fw-bold mb-4 fs-4 mt-3">Final Audit Review</h2>
            <div className="rounded p-4 mb-4" style={{ backgroundColor: '#101726' }}>
               <Row className="mb-3 text-muted small"><Col xs={7}>Outstanding Debt</Col><Col xs={5} className="text-end text-danger">{totals.debt.toLocaleString()} RWF</Col></Row>
               <Row className="mb-3 text-muted small"><Col xs={7}>Gross Revenue</Col><Col xs={5} className="text-end text-white fw-bold">{totals.sales.toLocaleString()} RWF</Col></Row>
               <Row className="mb-3 text-muted small"><Col xs={7}>Acquisition Costs</Col><Col xs={5} className="text-end text-white fw-bold">{totals.costs.toLocaleString()} RWF</Col></Row>
               <div className="d-flex justify-content-between align-items-center mt-3"><span className="fw-bold text-white small">NET OPERATING PROFIT</span><span className="fw-bold fs-4" style={{ color: totals.netProfit >= 0 ? '#27ae60' : '#e74c3c' }}>{Math.floor(totals.netProfit).toLocaleString()} RWF</span></div>
            </div>
            <div className="d-grid gap-2"><Button onClick={handleCommit} disabled={loading} style={orangeButtonStyle}>{loading ? 'Committing...' : 'Commit to Ledger'}</Button><Button variant="link" style={secondaryButtonStyle} onClick={() => setStep(1)} className="text-decoration-none mt-2">Modify Details</Button></div>
          </div>
        )}
      </div>
    </Modal>
  );
}
