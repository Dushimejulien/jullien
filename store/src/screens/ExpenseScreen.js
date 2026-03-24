import axios from "axios";
import React, { useContext, useState } from "react";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getError } from "../utils";
import { Store } from "../Store";
import { Helmet } from "react-helmet-async";

export default function ExpenseScreen() {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();
  const { dispatch: ctxDispatch } = useContext(Store);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/expense", {
        amount: amount,
        reason: reason,
      });
      ctxDispatch({ type: "EXPENSE", payload: data });
      localStorage.setItem("expense", JSON.stringify(data));
      toast.success("Expense recorded successfully");
      navigate("/admin/expenses");
    } catch (err) {
      toast.error(getError(err));
    }
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Record Expense - Rightlamps</title>
      </Helmet>
      
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <div className="text-center mb-5">
             <h1 className="text-gradient">Record Expense</h1>
             <p className="text-muted">Log business costs to keep financial reports accurate</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
             <Card.Body>
               <Form onSubmit={submitHandler}>
                 <Form.Group className="mb-4" controlId="reason">
                   <Form.Label className="small fw-bold">Expense Description</Form.Label>
                   <Form.Control
                     value={reason}
                     className="bg-light border-0 py-2"
                     onChange={(e) => setReason(e.target.value)}
                     placeholder="e.g., Electricity bill, Packaging materials..."
                     required
                   />
                 </Form.Group>

                 <Form.Group className="mb-4" controlId="amount">
                   <Form.Label className="small fw-bold">Amount (RWF)</Form.Label>
                   <Form.Control
                    type="number"
                    value={amount}
                    className="bg-light border-0 py-2"
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    required
                   />
                 </Form.Group>

                 <div className="d-grid gap-2">
                   <Button variant="primary" size="lg" type="submit" className="rounded-pill py-3 fw-bold shadow-sm">
                     Save Expense
                   </Button>
                   <Button variant="outline-secondary" className="rounded-pill" onClick={() => navigate("/admin/dashboard")}>
                     Back to Dashboard
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
