import React, { useContext } from "react";
import { Row, Col, Container } from "react-bootstrap";
import { Store } from "../Store";

export default function CheckSteps(props) {
  const { state } = useContext(Store);
  const { userInfo } = state;
  
  const steps = [
    { label: "Sign In", active: props.step1 },
    { label: "Shipping", active: props.step2 },
    { label: "Payment", active: props.step3 },
    { 
      label: (userInfo?.isAdmin || userInfo?.isSeller) ? "Report" : "Place Order", 
      active: props.step4 
    },
  ];

  return (
    <Container className="mb-5 mt-3">
      <Row className="checkout-steps py-3 px-2 rounded-pill bg-light shadow-sm">
        {steps.map((step, index) => (
          <Col 
            key={index} 
            className={`text-center d-flex align-items-center justify-content-center ${step.active ? "active fw-bold text-primary" : "text-muted opacity-50"}`}
          >
            <div 
              className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${step.active ? "bg-primary text-white" : "bg-secondary text-white"}`}
              style={{ width: '24px', height: '24px', fontSize: '12px' }}
            >
              {index + 1}
            </div>
            <span className="d-none d-md-inline">{step.label}</span>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
