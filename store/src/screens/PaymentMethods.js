import React, { useContext, useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import CheckoutSteps from "../components/Checksteps";
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo, cart: { paymentMethod } } = state;
  const [paymentMethodName, setPaymentMethod] = useState(paymentMethod || "MoMo");

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin");
    }
  }, [userInfo, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    ctxDispatch({ type: "SAVE_PAYMENT_METHODS", payload: paymentMethodName });
    localStorage.setItem("paymentMethod", paymentMethodName);
    if (userInfo.isAdmin || userInfo.isSeller) {
      navigate("/reportReview");
    } else {
      navigate("/placeorder");
    }
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Payment Method - Rightlamps</title>
      </Helmet>
      
      <div className="mb-5">
        <CheckoutSteps step1 step2 step3 />
      </div>

      <Row className="justify-content-center">
        <Col md={8} lg={5}>
          <div className="text-center mb-5">
             <h1 className="text-gradient">Payment Method</h1>
             <p className="text-muted">How would you like to pay for your order?</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
             <Card.Body>
               <Form onSubmit={submitHandler}>
                 <div className="mb-4">
                   {(userInfo.isAdmin || userInfo.isSeller) ? (
                     <div className="d-flex flex-column gap-3">
                        <PaymentCard 
                          id="MoMo pay"
                          label="MoMo Pay"
                          icon="fas fa-mobile-alt"
                          current={paymentMethodName}
                          onChange={setPaymentMethod}
                        />
                        <PaymentCard 
                          id="Cash"
                          label="Cash Payment"
                          icon="fas fa-money-bill-wave"
                          current={paymentMethodName}
                          onChange={setPaymentMethod}
                        />
                        <PaymentCard 
                          id="Loss"
                          label="Loss / Damaged"
                          icon="fas fa-exclamation-triangle"
                          current={paymentMethodName}
                          onChange={setPaymentMethod}
                        />
                        <PaymentCard 
                          id="Depts"
                          label="Credit (Ideni)"
                          icon="fas fa-hand-holding-usd"
                          current={paymentMethodName}
                          onChange={setPaymentMethod}
                        />
                     </div>
                   ) : (
                     <div className="d-flex flex-column gap-3">
                        <PaymentCard 
                          id="Paypal"
                          label="PayPal / Credit Card"
                          icon="fab fa-paypal"
                          current={paymentMethodName}
                          onChange={setPaymentMethod}
                        />
                        <PaymentCard 
                          id="MoMo"
                          label="MTN Mobile Money"
                          icon="fas fa-mobile-alt"
                          current={paymentMethodName}
                          onChange={setPaymentMethod}
                        />
                     </div>
                   )}
                 </div>

                 <div className="d-grid mt-5">
                   <Button variant="primary" size="lg" type="submit" className="rounded-pill py-3 fw-bold shadow-sm">
                     Preview Order
                   </Button>
                 </div>
               </Form>
             </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function PaymentCard({ id, label, icon, current, onChange }) {
  const active = current === id;
  return (
    <div 
      className={`p-3 rounded-3 border-2 d-flex align-items-center cursor-pointer transition-all ${active ? 'border-primary bg-primary bg-opacity-10' : 'border-light bg-light opacity-75'}`}
      onClick={() => onChange(id)}
      style={{ cursor: 'pointer' }}
    >
      <div className={`me-3 fs-4 ${active ? 'text-primary' : 'text-muted'}`}>
        <i className={icon}></i>
      </div>
      <div className="flex-grow-1 fw-bold">{label}</div>
      <Form.Check
        type="radio"
        id={id}
        name="paymentMethod"
        checked={active}
        onChange={() => onChange(id)}
        className="ms-2"
      />
    </div>
  );
}
