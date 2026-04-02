import React, { useContext, useEffect, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Row, Col, ListGroup, Card, Badge, Button, Container, Image } from "react-bootstrap";
import Rating from "../components/Rating";
import { Helmet } from "react-helmet-async";
import LoadingBox from "../components/LoadingBox.js";
import MessageBox from "../components/MessageBox.js";
import { getError } from "../utils";
import { Store } from "../Store.js";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, product: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

const ProductScreen = () => {
  const navigate = useNavigate();
  const params = useParams();
  const { slug } = params;

  const [{ loading, error, product }, dispatch] = useReducer(reducer, {
    product: null,
    loading: true,
    error: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      dispatch({ type: "FETCH_REQUEST" });
      try {
        const result = await axios.get(`/api/products/slug/${slug}`);
        dispatch({ type: "FETCH_SUCCESS", payload: result.data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [slug]);

  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;

  const addToCartHandler = async () => {
    const existItem = cart.cartItems.find((x) => x._id === product._id);
    const quantity = existItem ? existItem.quantity + 1 : 1;
    const { data } = await axios.get(`/api/products/${product._id}`);
    
    if (data.countInStock < quantity) {
      window.alert("Sorry. Product is out of stock");
      return;
    }
    
    ctxDispatch({
      type: "CART_ADD_ITEM",
      payload: { ...product, quantity },
    });
    navigate("/cart");
  };

  if (loading) return <LoadingBox />;
  if (error) return <MessageBox variant="danger">{error}</MessageBox>;
  if (!product) return <MessageBox variant="warning">Product Not Found</MessageBox>;

  return (
    <Container className="py-5">
      <Row>
        <Col md={6}>
          <Image 
            className="img-large w-100 shadow-lg p-3 bg-white" 
            src={product.image} 
            alt={product.name} 
            fluid
            rounded
          />
        </Col>
        <Col md={6}>
          <div className="ms-md-4 mt-4 mt-md-0">
            <Helmet>
              <title>{product.name} - Rightlamps</title>
            </Helmet>
            <Badge bg="primary" className="mb-2 px-3 py-2">{product.category}</Badge>
            <h1 className="mb-3 display-5 fw-bold">{product.name}</h1>
            
            <div className="d-flex align-items-center mb-4">
              <Rating rating={product.rating} numReviews={product.numReviews} />
              <span className="ms-3 text-muted">({product.numReviews} review-yari)</span>
            </div>

            <Card className="border-0 shadow-sm mb-4 bg-light">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fs-4 text-muted">Price:</span>
                  <span className="fs-2 fw-bold text-primary">{product.price.toLocaleString()} RWF</span>
                </div>
                
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fs-5 text-muted">Stock Status:</span>
                  {product.countInStock > 0 ? (
                    <Badge bg="success" className="px-3 py-2">In Stock ({product.countInStock})</Badge>
                  ) : (
                    <Badge bg="danger" className="px-3 py-2">Sold Out</Badge>
                  )}
                </div>

                <div className="d-grid">
                  <Button 
                    onClick={addToCartHandler} 
                    variant="primary" 
                    size="lg"
                    disabled={product.countInStock === 0}
                    className="rounded-pill py-3 fw-bold shadow"
                  >
                    <i className="fas fa-shopping-cart me-2"></i>
                    Add to Cart
                  </Button>
                </div>
              </Card.Body>
            </Card>

            <div className="mb-4">
              <h4 className="border-bottom pb-2 mb-3">Description</h4>
              <p className="lead text-secondary">{product.description}</p>
            </div>

            {userInfo && (userInfo.isAdmin || userInfo.isSeller) && (
              <Card className="border-0 shadow-sm bg-info bg-opacity-10">
                <Card.Body>
                  <h5 className="mb-3">Admin Overviews</h5>
                  <div className="d-flex justify-content-between">
                    <span>Cost Price:</span>
                    <strong>{product.costPrice.toLocaleString()} RWF</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span>Potential Margin:</span>
                    <strong>{(product.price - product.costPrice).toLocaleString()} RWF</strong>
                  </div>
                  <div className="d-grid mt-3">
                    <Button 
                      variant="outline-info" 
                      onClick={() => navigate(`/admin/product/${product._id}`)}
                      className="rounded-pill"
                    >
                      <i className="fas fa-edit me-2"></i>
                      Edit Product Details
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductScreen;
