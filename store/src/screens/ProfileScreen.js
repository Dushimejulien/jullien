import React, { useContext, useReducer, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import axios from "axios";
import LoadingBox from "../components/LoadingBox";

const reducer = (state, action) => {
  switch (action.type) {
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

export default function ProfileScreen() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;
  const [name, setName] = useState(userInfo.name);
  const [email, setEmail] = useState(userInfo.email);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [{ loadingUpdate }, dispatch] = useReducer(reducer, {
    loadingUpdate: false,
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
       toast.error("Passwords do not match");
       return;
    }
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      const { data } = await axios.put(
        "/api/users/profile",
        { name, email, password },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      dispatch({ type: "UPDATE_SUCCESS" });
      ctxDispatch({ type: "USER_SIGNIN", payload: data });
      localStorage.setItem("userInfo", JSON.stringify(data));
      toast.success("Profile updated successfully");
    } catch (err) {
      dispatch({ type: "UPDATE_FAIL" });
      toast.error(getError(err));
    }
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>User Profile - Rightlamps</title>
      </Helmet>
      
      <Row className="justify-content-center">
        <Col md={8} lg={5}>
          <div className="text-center mb-5">
             <h1 className="text-gradient">Your Profile</h1>
             <p className="text-muted">Manage your personal information and security</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
             <Card.Body>
               <Form onSubmit={submitHandler}>
                 <Form.Group className="mb-3" controlId="name">
                   <Form.Label className="small fw-bold">Full Name</Form.Label>
                   <Form.Control
                     value={name}
                     className="bg-light border-0 py-2"
                     onChange={(e) => setName(e.target.value)}
                     required
                   />
                 </Form.Group>

                 <Form.Group className="mb-3" controlId="email">
                   <Form.Label className="small fw-bold">Email Address</Form.Label>
                   <Form.Control
                     type="email"
                     value={email}
                     className="bg-light border-0 py-2"
                     onChange={(e) => setEmail(e.target.value)}
                     required
                   />
                 </Form.Group>

                 <hr className="my-4 opacity-50" />
                 <h6 className="mb-3 text-uppercase small ls-wide fw-bold opacity-75">Update Security</h6>

                 <Form.Group className="mb-3" controlId="password">
                   <Form.Label className="small fw-bold">New Password</Form.Label>
                   <Form.Control
                     type="password"
                     className="bg-light border-0 py-2"
                     autoComplete="new-password"
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="Leave blank to keep current"
                   />
                 </Form.Group>

                 <Form.Group className="mb-4" controlId="confirmPassword">
                   <Form.Label className="small fw-bold">Confirm New Password</Form.Label>
                   <Form.Control
                     type="password"
                     className="bg-light border-0 py-2"
                     onChange={(e) => setConfirmPassword(e.target.value)}
                     placeholder="••••••••"
                   />
                 </Form.Group>

                 <div className="d-grid">
                   <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    className="rounded-pill py-2 fw-bold shadow-sm"
                    disabled={loadingUpdate}
                   >
                     {loadingUpdate ? "Updating..." : "Update Profile"}
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
