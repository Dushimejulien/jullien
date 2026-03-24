import React, { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Store } from "../Store";
import CheckoutSteps from "../components/Checksteps";

export default function ShippingAddress() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo, cart: { shippingAddress } } = state;

  const [fullName, setFullName] = useState(shippingAddress.fullName || "");
  const [address, setAddress] = useState(shippingAddress.address || "");
  const [city, setCity] = useState(shippingAddress.city || "");
  const [phone, setPhone] = useState(shippingAddress.Phone || "");
  const [country, setCountry] = useState(shippingAddress.country || "");

  useEffect(() => {
    if (!userInfo) {
      navigate("/signin?redirect=/shipping");
    }
  }, [userInfo, navigate]);

  const submitHandler = (e) => {
    e.preventDefault();
    ctxDispatch({
      type: "SAVE_SHIPPING_ADDRESS",
      payload: { fullName, address, city, phone, country },
    });
    localStorage.setItem(
      "shippingAddress",
      JSON.stringify({ fullName, address, city, phone, country })
    );
    navigate("/payment");
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Shipping Address - Rightlamps</title>
      </Helmet>
      
      <div className="mb-5">
        <CheckoutSteps step1 step2 />
      </div>

      <Row className="justify-content-center">
        <Col md={10} lg={6}>
          <div className="text-center mb-5">
             <h1 className="text-gradient">Shipping Details</h1>
             <p className="text-muted">Where should we send your order?</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
             <Card.Body>
               <Form onSubmit={submitHandler}>
                 <Form.Group className="mb-3" controlId="fullName">
                   <Form.Label className="small fw-bold">Full Name</Form.Label>
                   <Form.Control
                     value={fullName}
                     className="bg-light border-0 py-2"
                     onChange={(e) => setFullName(e.target.value)}
                     placeholder="John Doe"
                     required
                   />
                 </Form.Group>

                 <Form.Group className="mb-3" controlId="address">
                   <Form.Label className="small fw-bold">Detailed Address</Form.Label>
                   <Form.Control
                     value={address}
                     className="bg-light border-0 py-2"
                     onChange={(e) => setAddress(e.target.value)}
                     placeholder="Street name, house number..."
                     required
                   />
                 </Form.Group>

                 <Row className="mb-3">
                   <Col md={6}>
                     <Form.Group controlId="city">
                        <Form.Label className="small fw-bold">City</Form.Label>
                        <Form.Control
                          value={city}
                          className="bg-light border-0 py-2"
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Kigali"
                          required
                        />
                      </Form.Group>
                   </Col>
                   <Col md={6}>
                      <Form.Group controlId="country">
                        <Form.Label className="small fw-bold">Country</Form.Label>
                        <Form.Control
                          value={country}
                          className="bg-light border-0 py-2"
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="Rwanda"
                          required
                        />
                      </Form.Group>
                   </Col>
                 </Row>

                 <Form.Group className="mb-4" controlId="phone">
                    <Form.Label className="small fw-bold">Phone Number</Form.Label>
                    <Form.Control
                      value={phone}
                      className="bg-light border-0 py-2"
                      placeholder="0780 000 000"
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </Form.Group>

                 <div className="d-grid">
                   <Button variant="primary" size="lg" type="submit" className="rounded-pill py-3 fw-bold shadow-sm">
                     Proceed to Payment
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
