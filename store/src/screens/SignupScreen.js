import React, { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Form, Container, Button, Row, Col, Card } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Axios from "axios";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";

export default function SignupScreen() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirectInUrl = new URLSearchParams(search).get("redirect");
  const redirect = redirectInUrl ? redirectInUrl : "/";
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const { data } = await Axios.post("/api/users/signup", {
        email,
        password,
        name,
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
        <title>Sign Up - Rightlamps</title>
      </Helmet>
      
      <Row className="justify-content-center">
        <Col md={6} lg={4}>
          <div className="text-center mb-5">
             <h1 className="text-gradient">Join Rightlamps</h1>
             <p className="text-muted">Create your account to start shopping</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
             <Card.Body>
               <Form onSubmit={submitHandler}>
                 <Form.Group className="mb-3" controlId="name">
                   <Form.Label className="small fw-bold">Full Name</Form.Label>
                   <Form.Control 
                      className="bg-light border-0 py-2" 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="John Doe"
                      required
                   />
                 </Form.Group>

                 <Form.Group className="mb-3" controlId="email">
                   <Form.Label className="small fw-bold">Email Address</Form.Label>
                   <Form.Control
                     type="email"
                     className="bg-light border-0 py-2"
                     required
                     onChange={(e) => setEmail(e.target.value)}
                     placeholder="name@example.com"
                   />
                 </Form.Group>

                 <Form.Group className="mb-3" controlId="password">
                   <Form.Label className="small fw-bold">Password</Form.Label>
                   <Form.Control
                     type="password"
                     className="bg-light border-0 py-2"
                     required
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="••••••••"
                   />
                 </Form.Group>

                 <Form.Group className="mb-4" controlId="confirmpassword">
                   <Form.Label className="small fw-bold">Confirm Password</Form.Label>
                   <Form.Control
                     type="password"
                     className="bg-light border-0 py-2"
                     required
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     placeholder="••••••••"
                   />
                 </Form.Group>

                 <div className="d-grid mb-4">
                   <Button type="submit" variant="primary" size="lg" className="rounded-pill py-2 fw-bold shadow-sm">
                     Create Account
                   </Button>
                 </div>

                 <div className="text-center small">
                   Already have an account?{" "}
                   <Link to={`/signin?redirect=${redirect}`} className="text-primary text-decoration-none fw-bold">
                     Sign In
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
