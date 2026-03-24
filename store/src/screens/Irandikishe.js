import React, { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Form, Container, Button, Row, Col, Card } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Axios from "axios";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";

export default function Iyandikishe() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get("redirect");
  const redirect = redirectInUrl ? redirectInUrl : "/";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const { data } = await Axios.post("/api/users/signin", {
        email,
        password,
      });
      ctxDispatch({ type: "USER_SIGNIN", payload: data });
      localStorage.setItem("userInfo", JSON.stringify(data));
      navigate(redirect || "/");
    } catch (err) {
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    if (userInfo) {
      navigate(redirect);
    }
  }, [navigate, redirect, userInfo]);

  return (
    <Container className="py-5">
      <Helmet>
        <title>Sign In - Rightlamps</title>
      </Helmet>
      
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <div className="text-center mb-5">
             <h1 className="text-gradient">Welcome Back</h1>
             <p className="text-muted">Sign in to manage your inventory and orders</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
             <Card.Body>
               <Form onSubmit={submitHandler}>
                 <Form.Group className="mb-4" controlId="email">
                   <Form.Label className="small fw-bold">Email Address</Form.Label>
                   <Form.Control
                     type="email"
                     className="bg-light border-0 py-2"
                     required
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="name@example.com"
                   />
                 </Form.Group>

                 <Form.Group className="mb-4" controlId="password">
                   <Form.Label className="small fw-bold">Password</Form.Label>
                   <Form.Control
                     type="password"
                     className="bg-light border-0 py-2"
                     required
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••"
                   />
                 </Form.Group>

                 <div className="d-grid mb-4">
                   <Button type="submit" variant="primary" size="lg" className="rounded-pill py-2 fw-bold shadow-sm">
                     Sign In
                   </Button>
                 </div>

                 <div className="text-center small">
                   New to Rightlamps?{" "}
                   <Link to={`/signup?redirect=${redirect}`} className="text-primary text-decoration-none fw-bold">
                     Create an account
                   </Link>
                 </div>
               </Form>
             </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
