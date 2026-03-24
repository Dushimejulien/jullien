import React, { useContext, useState } from "react";
import { Container, Row, Col, Card, Form, Button, InputGroup } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/Checksteps";
import { toast } from "react-toastify";

export default function Kora() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart } = state;
  
  const [comments, setComments] = useState("Paid");
  const [soldAt, setSoldAt] = useState(cart.report.soldAt || 0);
  const [givenTo, setgivenTo] = useState(cart.report.givenTo || "");
  const [real, setReal] = useState(cart.report.real || 0);
  const [depts, setDepts] = useState(cart.report.depts || 0);
  const [ibyangiritse, setIbyangiritse] = useState(cart.report.ibyangiritse || 0);

  const submitHandler = (e) => {
    e.preventDefault();
    if (cart.cartItems[0].countInStock < real) {
      toast.error("Ingano yibicuruzwa mwinjije iruta ibiri muri stock");
      return;
    }

    ctxDispatch({
      type: "REPORT",
      payload: { soldAt, givenTo, real, depts, ibyangiritse, comments },
    });

    localStorage.setItem(
      "report",
      JSON.stringify({ soldAt, givenTo, depts, ibyangiritse, real, comments })
    );
    navigate("/payment");
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Create Report - Rightlamps</title>
      </Helmet>
      
      <div className="text-center mb-5">
        <h1 className="text-gradient">Create Daily Report</h1>
        <p className="text-muted">Enter today's sales and inventory data</p>
      </div>

      <div className="mb-5">
        <CheckoutSteps step1 step2 />
      </div>

      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
             <Card.Body>
               <h4 className="mb-4 fw-bold">Daily Inventory Data</h4>
               <Form onSubmit={submitHandler}>
                 <Row className="mb-3">
                   <Col md={6}>
                     <Form.Group controlId="realQuantity">
                       <Form.Label className="small fw-bold">Real Quantity Sold</Form.Label>
                       <Form.Control
                         type="number"
                         value={real}
                         className="bg-light border-0 py-2"
                         onChange={(e) => setReal(Number(e.target.value))}
                         placeholder="0"
                         required
                       />
                     </Form.Group>
                   </Col>
                   <Col md={6}>
                     <Form.Group controlId="soldPrice">
                       <Form.Label className="small fw-bold">Actual Sold Price</Form.Label>
                       <Form.Control
                         type="number"
                         value={soldAt}
                         className="bg-light border-0 py-2"
                         onChange={(e) => setSoldAt(Number(e.target.value))}
                         placeholder="0"
                         required
                       />
                     </Form.Group>
                   </Col>
                 </Row>

                 <Row className="mb-3">
                   <Col md={6}>
                     <Form.Group controlId="debts">
                       <Form.Label className="small fw-bold">Debts (Ideni)</Form.Label>
                       <Form.Control
                         type="number"
                         value={depts}
                         className="bg-light border-0 py-2"
                         onChange={(e) => setDepts(Number(e.target.value))}
                         placeholder="0"
                       />
                     </Form.Group>
                   </Col>
                   <Col md={6}>
                     <Form.Group controlId="damaged">
                       <Form.Label className="small fw-bold">Damaged items</Form.Label>
                       <Form.Control
                         type="number"
                         value={ibyangiritse}
                         className="bg-light border-0 py-2"
                         onChange={(e) => setIbyangiritse(Number(e.target.value))}
                         placeholder="0"
                       />
                     </Form.Group>
                   </Col>
                 </Row>

                 <Form.Group className="mb-3" controlId="givenTo">
                   <Form.Label className="small fw-bold">Debtor Name (Izina ryuhawe ideni)</Form.Label>
                   <Form.Control
                     type="text"
                     value={givenTo}
                     className="bg-light border-0 py-2"
                     onChange={(e) => setgivenTo(e.target.value)}
                     placeholder="Enter name if applicable"
                   />
                 </Form.Group>

                 <Form.Group className="mb-4" controlId="comments">
                   <Form.Label className="small fw-bold">Technical Comments</Form.Label>
                   <Form.Control
                     as="textarea"
                     rows={3}
                     value={comments}
                     className="bg-light border-0"
                     onChange={(e) => setComments(e.target.value)}
                     placeholder="Additional notes..."
                   />
                 </Form.Group>

                 <div className="d-grid gap-2">
                   <Button variant="primary" size="lg" type="submit" className="rounded-pill py-3 fw-bold shadow-sm">
                     Confirm & Continue
                   </Button>
                   <Button variant="outline-secondary" className="rounded-pill" onClick={() => navigate("/cart")}>
                     Back to Stock
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
