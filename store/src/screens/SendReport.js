import React, { useState, useContext, useEffect, useReducer } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/Checksteps";
import { Row, Col, Card, Button, ListGroup, Container, Image, Badge } from "react-bootstrap";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import axios from "axios";
import LoadingBox from "../components/LoadingBox";

const reducer = (state, action) => {
  switch (action.type) {
    case "CREATE_REQUEST":
      return { ...state, loading: true };
    case "CREATE_SUCCESS":
      return { ...state, loading: false };
    case "CREATE_FAIL":
      return { ...state, loading: false };
    case "UPDATE_REQUEST":
      return { ...state, loadingUpdate: true };
    case "UPDATE_SUCCESS":
      return { ...state, loadingUpdate: false };
    case "UPDATE_FAIL":
      return { ...state, loadingUpdate: false };
    default:
      return state;
  }
};

export default function SendReport() {
  const [{ loading, loadingUpdate }, dispatch] = useReducer(reducer, {
    loading: false,
    loadingUpdate: false,
  });
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { cart, userInfo } = state;
  
  const [countInStock] = useState(
    cart.cartItems[0] ? cart.cartItems[0].countInStock - cart.report.real : 0
  );

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;

  // Sync calculations with the original logic but cleaner
  const calculateTotals = () => {
    let sales = 0, costs = 0, depts = 0, losses = cart.report.ibyangiritse || 0;
    
    if (losses > 0) {
      sales = 0;
      costs = round2(cart.cartItems.reduce((a, c) => a + cart.report.real * c.costPrice, 0));
    } else if (cart.report.depts && !cart.report.soldAt) {
      depts = round2(cart.report.depts * cart.report.real);
      sales = 0;
      costs = round2(cart.cartItems.reduce((a, c) => a + cart.report.real * c.costPrice, 0));
    } else {
      depts = round2(cart.report.depts * cart.report.real);
      sales = round2(cart.cartItems.reduce((a, c) => a + cart.report.real * cart.report.soldAt - cart.report.depts, 0));
      costs = round2(cart.cartItems.reduce((a, c) => a + cart.report.real * c.costPrice, 0));
    }

    const grossProfit = sales - costs;
    const taxPrice = round2(0.18 * Math.max(0, grossProfit));
    const netProfit = grossProfit - taxPrice;

    return { sales, costs, depts, grossProfit, taxPrice, netProfit, losses };
  };

  const totals = calculateTotals();
  
  // Attach totals to cart for the handler (matching original pattern)
  cart.Sales = totals.sales;
  cart.costs = totals.costs;
  cart.depts = totals.depts;
  cart.grossProfit = totals.grossProfit;
  cart.taxPrice = totals.taxPrice;
  cart.netProfit = totals.netProfit;

  const reportHander = async () => {
    try {
      dispatch({ type: "CREATE_REQUEST" });
      await axios.post("/api/report", {
          reportItems: cart.cartItems,
          real: cart.report.real,
          depts: cart.depts,
          comments: cart.report.comments,
          soldAt: cart.report.soldAt,
          paymentMethod: cart.paymentMethod,
          sales: cart.Sales,
          costs: cart.costs,
          grossProfit: cart.grossProfit,
          taxPrice: cart.taxPrice,
          netProfit: cart.netProfit,
          ibyangiritse: cart.report.ibyangiritse,
        }, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({ type: "CREATE_SUCCESS" });
      localStorage.removeItem("cartItems");
      toast.success("Audit report submitted successfully");
      navigate(`/`);
    } catch (error) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(error));
    }
  };

  const stockUpdateHandler = async () => {
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.patch(`/api/products/${cart.cartItems[0]._id}`, { countInStock });
      dispatch({ type: "UPDATE_SUCCESS" });
      toast.success("Inventory stock adjusted");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  useEffect(() => {
    if (!cart.paymentMethod) navigate("/payment");
  }, [cart, navigate]);

  return (
    <Container className="py-5">
      <Helmet>
        <title>Audit Confirmation - Rightlamps</title>
      </Helmet>
      
      <div className="mb-5 text-center">
        <h1 className="text-gradient mb-1">Final Audit Review</h1>
        <p className="text-muted">Verify all transaction details before committing to ledger</p>
      </div>

      <div className="mb-5">
        <CheckoutSteps step1 step2 step3 step4 />
      </div>

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4 bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-file-invoice-dollar me-2 text-primary"></i>Transaction Details</h5>
             </Card.Header>
             <Card.Body>
               <Row className="gy-3">
                 <AuditField label="Outstanding Debt" value={totals.depts} suffix=" RWF" color="danger" />
                 <AuditField label="Inventory Losses" value={totals.losses} suffix=" RWF" color="warning" />
                 <AuditField label="Operational Quantity" value={cart.report.real} suffix=" Units" />
                 <AuditField label="Unit Selling Price" value={cart.report.soldAt} suffix=" RWF" />
                 <Col md={12}>
                    <div className="text-muted small text-uppercase ls-wide mb-1">Technical Remarks</div>
                    <div className="p-3 bg-light rounded-3 border-start border-4 border-primary italic">
                      {cart.report.comments || "No professional remarks provided."}
                    </div>
                 </Col>
               </Row>
               <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center">
                 <Link to="/admin/createReport" className="text-decoration-none">
                    <i className="fas fa-edit me-1"></i> Edit Entry
                 </Link>
                 <Button variant="primary" size="sm" className="rounded-pill px-4" onClick={stockUpdateHandler} disabled={loadingUpdate}>
                    {loadingUpdate ? 'Syncing...' : 'Sync Stock'}
                 </Button>
               </div>
             </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-wallet me-2 text-primary"></i>Settlement Method</h5>
             </Card.Header>
             <Card.Body className="d-flex justify-content-between align-items-center">
               <div className="fs-5 fw-bold">{cart.paymentMethod}</div>
               <Link to="/payment" className="text-decoration-none small">Modify</Link>
             </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-shopping-cart me-2 text-primary"></i>Reconciled Items</h5>
             </Card.Header>
             <Card.Body className="p-0">
               <ListGroup variant="flush">
                 {cart.cartItems.map((item) => (
                   <ListGroup.Item key={item._id} className="bg-transparent p-3 border-bottom">
                     <Row className="align-items-center">
                       <Col xs={3} sm={2}>
                         <Image src={item.image} alt={item.name} rounded className="bg-light p-1 w-100" />
                       </Col>
                       <Col xs={9} sm={5}>
                         <div className="fw-bold">{item.name}</div>
                         <div className="text-muted small">Qty: {item.quantity}</div>
                       </Col>
                       <Col xs={6} sm={3} className="text-end small">
                         <div className="text-muted">Market Price</div>
                         <div className="fw-bold">{item.price.toLocaleString()} RWF</div>
                       </Col>
                       <Col xs={6} sm={2} className="text-end small">
                         <div className="text-muted">Acq. Cost</div>
                         <div className="fw-bold text-muted">{item.costPrice.toLocaleString()} RWF</div>
                       </Col>
                     </Row>
                   </ListGroup.Item>
                 ))}
               </ListGroup>
               <div className="p-3 bg-light bg-opacity-50 text-center">
                 <Link to="/cart" className="text-decoration-none small">Modify Item List</Link>
               </div>
             </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-card rounded-xl sticky-top overflow-hidden" style={{ top: '100px' }}>
            <Card.Header className="bg-dark text-white p-3 border-0">
              <h5 className="mb-0 fw-bold">Performance Summary</h5>
            </Card.Header>
            <Card.Body className="p-4">
              <SummaryItem label="Gross Revenue" value={totals.sales} />
              <SummaryItem label="Acquisition Costs" value={totals.costs} />
              <SummaryItem label="Tax (EBR 18%)" value={totals.taxPrice} />
              <hr className="my-4 opacity-10" />
              <div className="d-flex justify-content-between align-items-center mb-4">
                 <span className="text-uppercase small ls-wide fw-bold opacity-75">Net Operating Profit</span>
                 <span className="h3 mb-0 fw-bold text-success">{(totals.netProfit).toLocaleString()} RWF</span>
              </div>
              <div className="d-grid">
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="rounded-pill py-3 fw-bold shadow-sm"
                  onClick={reportHander}
                  disabled={cart.report.real === 0 || loading}
                >
                  {loading ? 'Committing...' : 'Commit to Ledger'}
                </Button>
              </div>
              <div className="text-center mt-3 text-muted small">
                <i className="fas fa-shield-alt me-1"></i> Data will be permanently archived
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function AuditField({ label, value, suffix, color = "body" }) {
  return (
    <Col md={6}>
      <div className="text-muted small text-uppercase ls-wide mb-1">{label}</div>
      <div className={`fs-5 fw-bold text-${color}`}>{(value || 0).toLocaleString()} <span className="small fw-normal text-muted">{suffix}</span></div>
    </Col>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <span className="text-muted small">{label}</span>
      <span className="fw-bold">{(value || 0).toLocaleString()} RWF</span>
    </div>
  );
}
