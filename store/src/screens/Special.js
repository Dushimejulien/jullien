import React, { useContext, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "../Store";
import { getError } from "../utils";
import { Container, Form, Button, Card, Row, Col, Spinner } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { toast } from "react-toastify";

const reducer = (state, action) => {
  switch (action.type) {
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

export default function Special() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loadingUpdate, loadingUpload }, dispatch] = useReducer(reducer, {
    loadingUpdate: false,
    loadingUpload: false,
  });

  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!image) return toast.error("Please upload an image reference");
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.post(`/api/special`, { name, image, description }, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: "UPDATE_SUCCESS" });
      toast.success("Special request submitted successfully");
      navigate("/");
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
      toast.success("Image reference uploaded");
      setImage(data.secure_url);
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPLOAD_FAIL", payload: getError(err) });
    }
  };

  return (
    <Container className="py-5">
      <Helmet>
        <title>Special Request - Rightlamps</title>
      </Helmet>
      
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <div className="text-center mb-5">
             <h1 className="text-gradient">Special Order Request</h1>
             <p className="text-muted">Can't find what you're looking for? Tell us about the product you need.</p>
          </div>

          <Card className="border-0 shadow-lg bg-card rounded-xl overflow-hidden mb-4">
             <Card.Body className="p-4 p-md-5">
               <Form onSubmit={submitHandler}>
                 <Row className="gy-4">
                   <Col md={12}>
                     <Form.Group controlId="name">
                       <Form.Label className="small fw-bold">Product Name / Identifier</Form.Label>
                       <Form.Control
                         className="border-0 bg-light p-3"
                         placeholder="e.g. Industrial Vintage Chandelier"
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                         required
                       />
                     </Form.Group>
                   </Col>

                   <Col md={12}>
                     <Form.Group controlId="imageFile">
                       <Form.Label className="small fw-bold">Reference Image (Required)</Form.Label>
                       <div className="upload-container rounded-3 p-4 text-center border-2 border-dashed">
                          {image ? (
                            <div className="position-relative d-inline-block">
                               <img src={image} alt="Ref" className="img-thumbnail" style={{ maxHeight: '200px' }} />
                               <Button variant="danger" size="sm" className="position-absolute top-0 end-0 rounded-circle" onClick={() => setImage("")}>
                                 <i className="fas fa-times"></i>
                               </Button>
                            </div>
                          ) : (
                            <>
                               <i className="fas fa-cloud-upload-alt fs-1 text-primary mb-2"></i>
                               <div className="text-muted small mb-3">Upload a photo of the product</div>
                               <Form.Control type="file" className="d-none" id="fileInput" onChange={uploadFileHandler} />
                               <Button variant="outline-primary" className="rounded-pill px-4" onClick={() => document.getElementById('fileInput').click()} disabled={loadingUpload}>
                                  {loadingUpload ? <Spinner size="sm" /> : 'Select Image'}
                               </Button>
                            </>
                          )}
                       </div>
                     </Form.Group>
                   </Col>

                   <Col md={12}>
                     <Form.Group controlId="description">
                       <Form.Label className="small fw-bold">Detailed Description</Form.Label>
                       <Form.Control
                         as="textarea"
                         rows={4}
                         className="border-0 bg-light p-3"
                         placeholder="Provide size, material, or any specific requirements..."
                         value={description}
                         onChange={(e) => setDescription(e.target.value)}
                         required
                       />
                     </Form.Group>
                   </Col>

                   <Col md={12} className="pt-3">
                     <div className="d-grid">
                       <Button 
                         variant="primary" 
                         size="lg" 
                         type="submit" 
                         className="rounded-pill py-3 fw-bold shadow-sm"
                         disabled={loadingUpdate}
                       >
                         {loadingUpdate ? 'Submitting Request...' : 'Send Commission Request'}
                       </Button>
                     </div>
                   </Col>
                 </Row>
               </Form>
             </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
