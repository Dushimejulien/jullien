import React, { useContext, useEffect, useReducer, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Store } from "../Store";
import { getError } from "../utils";
import { Container, Form, Button, Row, Col, Card, Alert } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { toast } from "react-toastify";

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
    case "UPLOAD_REQUEST":
      return { ...state, loadingUpload: true, errorUpload: "" };
    case "UPLOAD_SUCCESS":
      return { ...state, loadingUpload: false, errorUpload: "" };
    case "UPLOAD_FAIL":
      return { ...state, loadingUpload: false, errorUpload: action.payload };
    default:
      return state;
  }
};

export default function ProductEditScreen() {
  const navigate = useNavigate();
  const params = useParams();
  const { id: productId } = params;

  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loading, error, loadingUpdate, loadingUpload }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [category, setCategory] = useState("");
  const [countInStock, setCountInStock] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/products/${productId}`);
        setName(data.name);
        setSlug(data.slug);
        setPrice(data.price);
        setCostPrice(data.costPrice);
        setImage(data.image);
        setCategory(data.category);
        setCountInStock(data.countInStock);
        setBrand(data.brand);
        setDescription(data.description);
        dispatch({ type: "FETCH_SUCCESS" });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [productId]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.put(
        `/api/products/${productId}`,
        { _id: productId, name, slug, price, costPrice, image, category, brand, countInStock, description },
        { headers: { Authorization: `Bearer ${userInfo.token}` } }
      );
      dispatch({ type: "UPDATE_SUCCESS" });
      toast.success("Product updated successfully");
      navigate("/admin/products");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    const bodyFormData = new FormData();
    bodyFormData.append("file", file);
    try {
      dispatch({ type: "UPLOAD_REQUEST" });
      const { data } = await axios.post("/api/upload", bodyFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
          authorization: `Bearer ${userInfo.token}`,
        },
      });
      dispatch({ type: "UPLOAD_SUCCESS" });
      toast.success("Image uploaded successfully");
      setImage(data.secure_url);
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPLOAD_FAIL", payload: getError(err) });
    }
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Edit Product - Rightlamps</title>
      </Helmet>
      
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <div className="text-center mb-5">
            <h1 className="text-gradient">Edit Product</h1>
            <p className="text-muted">Update product information and stock details</p>
          </div>

          <Card className="border-0 shadow-lg p-4 bg-card rounded-xl">
            {loading ? (
              <LoadingBox />
            ) : error ? (
              <MessageBox variant="danger">{error}</MessageBox>
            ) : (
              <Form onSubmit={submitHandler}>
                <Form.Group className="mb-4" controlId="name">
                  <Form.Label className="fw-bold fs-6">Product Name</Form.Label>
                  <Form.Control
                    value={name}
                    className="py-2 px-3 border-0 bg-light"
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="slug">
                  <Form.Label className="fw-bold fs-6">Slug (URL identifier)</Form.Label>
                  <Form.Control
                    value={slug}
                    className="py-2 px-3 border-0 bg-light"
                    onChange={(e) => setSlug(e.target.value)}
                    required
                  />
                </Form.Group>

                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group controlId="costPrice">
                      <Form.Label className="fw-bold fs-6">Cost (RWF)</Form.Label>
                      <Form.Control
                        type="number"
                        value={costPrice}
                        className="py-2 px-3 border-0 bg-light"
                        onChange={(e) => setCostPrice(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="price">
                      <Form.Label className="fw-bold fs-6">Retail Price (RWF)</Form.Label>
                      <Form.Control
                        type="number"
                        value={price}
                        className="py-2 px-3 border-0 bg-light"
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <div className="mb-4 p-3 bg-light rounded-3 border">
                  <Form.Group controlId="imageFile">
                    <Form.Label className="fw-bold fs-6">Product Image</Form.Label>
                    <div className="d-flex align-items-center gap-3">
                      {image && (
                        <Card className="border-0 shadow-sm" style={{ width: '60px', height: '60px' }}>
                           <Card.Img variant="top" src={image} style={{ height: '100%', objectFit: 'contain' }} />
                        </Card>
                      )}
                      <Form.Control type="file" className="border-0 bg-transparent" onChange={uploadFileHandler} />
                    </div>
                    {loadingUpload && <div className="mt-2 small text-primary"><i className="fas fa-spinner fa-spin me-2"></i>Uploading...</div>}
                  </Form.Group>
                </div>

                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group controlId="category">
                      <Form.Label className="fw-bold fs-6">Category</Form.Label>
                      <Form.Control
                        value={category}
                        className="py-2 px-3 border-0 bg-light"
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group controlId="brand">
                      <Form.Label className="fw-bold fs-6">Brand</Form.Label>
                      <Form.Control
                        value={brand}
                        className="py-2 px-3 border-0 bg-light"
                        onChange={(e) => setBrand(e.target.value)}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4" controlId="countInStock">
                  <Form.Label className="fw-bold fs-6">Current Stock</Form.Label>
                  <Form.Control
                    type="number"
                    value={countInStock}
                    className="py-2 px-3 border-0 bg-light"
                    onChange={(e) => setCountInStock(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-4" controlId="description">
                  <Form.Label className="fw-bold fs-6">Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={description}
                    className="py-2 px-3 border-0 bg-light"
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    size="lg" 
                    type="submit" 
                    className="rounded-pill py-3 fw-bold shadow-sm"
                    disabled={loadingUpdate}
                  >
                    {loadingUpdate ? "Updating..." : "Save Product Changes"}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    className="rounded-pill"
                    onClick={() => navigate("/admin/products")}
                  >
                    Back to Inventory
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
