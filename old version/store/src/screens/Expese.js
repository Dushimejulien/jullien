import axios from "axios";
import React, { useContext, useState } from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getError } from "../utils";
import { Store } from "../Store";

export default function Expense() {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  const {  dispatch: ctxDispatch } = useContext(Store);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      const data = await axios.post("/api/expense", {
        amount: amount,
        reason: reason,
      });
      ctxDispatch({ type: "EXPENSE", payload: data });
      localStorage.setItem("expense", JSON.stringify(data));
      navigate("/");
    } catch (err) {
      toast.error(getError(err));
    }
  };
  return (
    <div>
      <Form onSubmit={submitHandler}>
        <Form.Group className="mb-3" controlId="slug">
          <Form.Label>reason</Form.Label>
          <Form.Control
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="name">
          <Form.Label>amount</Form.Label>
          <Form.Control
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Submit
        </Button>
      </Form>
    </div>
  );
}
