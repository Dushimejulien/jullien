import axios from "axios";
import React, { useContext, useEffect, useReducer, useState } from "react";
import { Form, Button, Container, Row, Col, Card } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { getError } from "../utils";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
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

export default function UserEditScreen() {
  const [{ loading, error, loadingUpdate }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });

  const { state } = useContext(Store);
  const { userInfo } = state;

  const params = useParams();
  const { id: userId } = params;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeller, setIsSeller] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setName(data.name);
        setEmail(data.email);
        setIsAdmin(data.isAdmin);
        setIsSeller(data.isSeller);
        dispatch({ type: "FETCH_SUCCESS" });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [userId, userInfo]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.put(
        `/api/users/${userId}`,
        { _id: userId, name, email, isAdmin, isSeller },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      dispatch({ type: "UPDATE_SUCCESS" });
      toast.success("User updated successfully");
      navigate("/admin/users");
    } catch (error) {
      toast.error(getError(error));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Edit User - Rightlamps</title>
      </Helmet>
      
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <div className="text-center mb-5">
            <h1 className="text-gradient">Edit User</h1>
            <p className="text-muted">Manage user permissions and account details</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
            {loading ? (
              <LoadingBox />
            ) : error ? (
              <MessageBox variant="danger">{error}</MessageBox>
            ) : (
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-4" controlId="name">
                  <Form.Label className="fw-bold fs-6">Full Name</Form.Label>
                  <Form.Control
                    value={name}
                    className="py-2 px-3 border-0 bg-light"
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="email">
                  <Form.Label className="fw-bold fs-6">Email Address</Form.Label>
                  <Form.Control
                    value={email}
                    type="email"
                    className="py-2 px-3 border-0 bg-light"
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled
                  />
                  <Form.Text className="text-muted small px-1">Email cannot be changed by administrator.</Form.Text>
                </Form.Group>

                <div className="bg-light p-3 rounded-3 mb-4 border">
                  <h6 className="mb-3 fw-bold">User Roles</h6>
                  <Form.Check
                    className="mb-2"
                    type="switch"
                    id="isAdmin"
                    label="Administrator Access"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                  />
                  <Form.Check
                    type="switch"
                    id="isSeller"
                    label="Seller / Inventory Manager"
                    checked={isSeller}
                    onChange={(e) => setIsSeller(e.target.checked)}
                  />
                </div>

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    className="rounded-pill py-3 fw-bold shadow-sm"
                    disabled={loadingUpdate}
                  >
                    {loadingUpdate ? "Updating..." : "Save User Changes"}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="rounded-pill"
                    onClick={() => navigate("/admin/users")}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
