import React, { useContext } from "react";
import { Row, Col, ListGroup, Button, Card, Container, Image, Badge } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Store } from "../Store.js";
import MessageBox from "../components/MessageBox.js";
import axios from "axios";

export default function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);

  const {
    userInfo,
    cart: { cartItems },
  } = state;

  const updateCartHandler = async (item, quantity) => {
    const { data } = await axios.get(`/api/products/${item._id}`);
    if (data.countInStock < quantity) {
      window.alert("Sorry, Product is out of stock");
      return;
    }
    ctxDispatch({
      type: "CART_ADD_ITEM",
      payload: { ...item, quantity },
    });
  };

  const removeItemHandler = (item) => {
    ctxDispatch({ type: "CART_REMOVE_ITEM", payload: item });
  };

  const checkoutHandler = () => {
    if (userInfo?.isAdmin || userInfo?.isSeller) {
      navigate("/signin?redirect=/admin/createReport");
    } else {
      navigate("/signin?redirect=/shipping");
    }
  };

  const formatCurrency = (val) => `${(val || 0).toLocaleString()} RWF`;

  return (
    <Container className="py-4">
      <Helmet>
        <title>Shopping Cart - Rightlamps</title>
      </Helmet>
      
      <div className="mb-4">
        <h1 className="mb-1 text-gradient">Your Shopping Cart</h1>
        <p className="text-muted">Review items and proceed to checkout</p>
      </div>

      <Row>
        <Col lg={8}>
          {cartItems.length === 0 ? (
            <MessageBox variant="info">
              Your cart is empty. <Link to="/" className="fw-bold">Go shopping</Link>
            </MessageBox>
          ) : (
            <div className="d-flex flex-column gap-3">
              {cartItems.map((item) => (
                <Card key={item._id} className="border-0 shadow-sm overflow-hidden">
                  <Card.Body className="p-3">
                    <Row className="align-items-center">
                      <Col xs={3} md={2}>
                        <Image
                          src={item.image}
                          alt={item.name}
                          fluid
                          rounded
                          className="bg-light p-1"
                        />
                      </Col>
                      <Col xs={9} md={4}>
                        <Link to={`/product/${item.slug}`} className="text-decoration-none fw-bold fs-5 d-block text-truncate">
                          {item.name}
                        </Link>
                        <div className="text-muted small mb-1">{item.category}</div>
                        <div className="text-primary fw-bold d-md-none">{formatCurrency(item.price)}</div>
                      </Col>
                      <Col xs={6} md={3} className="mt-3 mt-md-0 d-flex align-items-center justify-content-center">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="rounded-circle"
                          onClick={() => updateCartHandler(item, item.quantity - 1)}
                          disabled={item.quantity === 1}
                        >
                          <i className="fas fa-minus"></i>
                        </Button>
                        <span className="mx-3 fw-bold fs-5">{item.quantity}</span>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          className="rounded-circle"
                          onClick={() => updateCartHandler(item, item.quantity + 1)}
                          disabled={item.quantity === item.countInStock}
                        >
                          <i className="fas fa-plus"></i>
                        </Button>
                      </Col>
                      <Col xs={6} md={2} className="mt-3 mt-md-0 d-none d-md-block text-end">
                        <div className="fw-bold">{formatCurrency(item.price)}</div>
                      </Col>
                      <Col xs={12} md={1} className="mt-3 mt-md-0 text-end">
                        <Button
                          onClick={() => removeItemHandler(item)}
                          variant="link"
                          className="text-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-lg mt-4 mt-lg-0 sticky-top" style={{ top: '100px', zIndex: 1 }}>
            <Card.Body className="p-4">
              <h4 className="mb-4 d-flex justify-content-between align-items-center">
                Order Summary
                <Badge bg="primary" pill>{cartItems.reduce((a, c) => a + c.quantity, 0)} items</Badge>
              </h4>
              
              <ListGroup variant="flush" className="mb-4">
                <ListGroup.Item className="d-flex justify-content-between px-0 bg-transparent border-0">
                  <span className="text-muted">Subtotal</span>
                  <span className="fw-bold">
                    {formatCurrency(cartItems.reduce((a, c) => a + c.price * c.quantity, 0))}
                  </span>
                </ListGroup.Item>
                {userInfo && (userInfo.isAdmin || userInfo.isSeller) && (
                  <ListGroup.Item className="d-flex justify-content-between px-0 bg-transparent border-info border-opacity-10">
                    <span className="text-muted small">Total Cost (Admin)</span>
                    <span className="text-info small">
                      {formatCurrency(cartItems.reduce((a, c) => a + c.costPrice * c.quantity, 0))}
                    </span>
                  </ListGroup.Item>
                )}
                <hr className="my-2" />
                <ListGroup.Item className="d-flex justify-content-between px-0 bg-transparent border-0">
                  <span className="fs-4 fw-bold">Total</span>
                  <span className="fs-4 fw-bold text-primary">
                    {formatCurrency(cartItems.reduce((a, c) => a + c.price * c.quantity, 0))}
                  </span>
                </ListGroup.Item>
              </ListGroup>

              <div className="d-grid gap-2">
                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="rounded-pill py-3 fw-bold"
                  onClick={checkoutHandler}
                  disabled={cartItems.length === 0}
                >
                  Proceed to Checkout
                  <i className="fas fa-arrow-right ms-2"></i>
                </Button>
                <Button
                  variant="outline-secondary"
                  className="rounded-pill"
                  onClick={() => navigate("/")}
                >
                  Continue Shopping
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
