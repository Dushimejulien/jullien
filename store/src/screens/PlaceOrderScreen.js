import React, { useContext, useEffect, useReducer } from "react";
import { Col, Row, ListGroup, Card, Button, Container, Image, Badge } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import CheckoutSteps from "../components/Checksteps";
import { Link, useNavigate } from "react-router-dom";
import { Store } from "../Store";
import { toast } from "react-toastify";
import { getError } from "../utils";
import Axios from "axios";
import LoadingBox from "../components/LoadingBox";

const reducer = (state, action) => {
  switch (action.type) {
    case "CREATE_REQUEST":
      return { ...state, loading: true };
    case "CREATE_SUCCESS":
      return { ...state, loading: false };
    case "CREATE_FAIL":
      return { ...state, loading: false };
    default:
      return state;
  }
};

export default function PlaceOrderScreen() {
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { cart, userInfo } = state;
  const navigate = useNavigate();
  const [{ loading }, dispatch] = useReducer(reducer, {
    loading: false,
  });

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;
  cart.itemsPrice = round2(cart.cartItems.reduce((a, c) => a + c.quantity * c.price, 0));
  cart.shippingPrice = cart.itemsPrice > 5000 ? round2(0) : round2(500); 
  cart.taxPrice = round2(0.18 * cart.itemsPrice);
  cart.totalPrice = cart.itemsPrice + cart.shippingPrice + cart.taxPrice;

  const payOrder = async () => {
    try {
      await Axios.post('/api/orders/submitPayment',
        { amount: cart.totalPrice, phone: cart.shippingAddress.phone },
        { headers: { authorization: `Bearer ${state.userInfo.token}` } }
      );
      window.alert(`Payment request sent to ${cart.shippingAddress.phone}. Follow the prompts on your phone.`);
    } catch (error) {
      toast.error(getError(error));
    }
  };

  const placeOrderHandler = async () => {
    try {
      dispatch({ type: "CREATE_REQUEST" });
      const { data } = await Axios.post(
        "/api/orders",
        {
          orderItems: cart.cartItems,
          shippingAddress: cart.shippingAddress,
          paymentMethod: cart.paymentMethod,
          itemsPrice: cart.itemsPrice,
          shippingPrice: cart.shippingPrice,
          taxPrice: cart.taxPrice,
          totalPrice: cart.totalPrice,
        },
        { headers: { authorization: `Bearer ${userInfo.token}` } }
      );
      ctxDispatch({ type: "CART_CLEAR" });
      dispatch({ type: "CREATE_SUCCESS" });
      localStorage.removeItem("cartItems");
      navigate(`/order/${data.order._id}`);
    } catch (err) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(err));
    }
  };

  useEffect(() => {
    if (!cart.paymentMethod) {
      navigate("/payment");
    }
  }, [cart, navigate]);

  const formatCurrency = (val) => `${(val || 0).toLocaleString()} RWF`;

  return (
    <Container className="py-4">
      <CheckoutSteps step1 step2 step3 step4 />
      <Helmet>
        <title>Place Order - Rightlamps</title>
      </Helmet>
      
      <div className="mb-4">
        <h1 className="mb-1 text-gradient">Review Your Order</h1>
        <p className="text-muted">Final step before confirming your purchase</p>
      </div>

      <Row>
        <Col md={8}>
          <Card className="border-0 shadow-sm mb-4 overflow-hidden">
            <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span><i className="fas fa-truck me-2 text-primary"></i>Shipping Details</span>
              <Link to="/shipping" className="text-decoration-none small">Edit</Link>
            </Card.Header>
            <Card.Body>
              <div className="row">
                <Col sm={6} className="mb-3">
                  <div className="text-muted small">Recipient</div>
                  <div className="fw-bold">{cart.shippingAddress.fullName}</div>
                </Col>
                <Col sm={6} className="mb-3">
                  <div className="text-muted small">Location</div>
                  <div className="fw-bold">
                    {cart.shippingAddress.address}, {cart.shippingAddress.city}, {cart.shippingAddress.country}
                  </div>
                </Col>
                <Col sm={6}>
                  <div className="text-muted small">Phone</div>
                  <div className="fw-bold">{cart.shippingAddress.phone}</div>
                </Col>
              </div>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 overflow-hidden">
            <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span><i className="fas fa-credit-card me-2 text-primary"></i>Payment Method</span>
              <Link to="/payment" className="text-decoration-none small">Edit</Link>
            </Card.Header>
            <Card.Body>
              <Badge bg="info" className="px-3 py-2 fs-6">{cart.paymentMethod}</Badge>
            </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 overflow-hidden">
            <Card.Header className="bg-white fw-bold py-3 d-flex justify-content-between align-items-center">
              <span><i className="fas fa-shopping-bag me-2 text-primary"></i>Order Items</span>
              <Link to="/cart" className="text-decoration-none small">Edit</Link>
            </Card.Header>
            <ListGroup variant="flush">
              {cart.cartItems.map((item) => (
                <ListGroup.Item key={item._id} className="py-3 bg-transparent">
                  <Row className="align-items-center">
                    <Col md={6} className="d-flex align-items-center">
                      <Image
                        src={item.image}
                        alt={item.name}
                        rounded
                        className="me-3 p-1 bg-light"
                        style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                      />
                      <Link to={`/product/${item.slug}`} className="text-decoration-none fw-bold">{item.name}</Link>
                    </Col>
                    <Col md={3} className="text-md-center">
                      <span className="text-muted">Qty:</span> <strong>{item.quantity}</strong>
                    </Col>
                    <Col md={3} className="text-md-end">
                      <strong>{formatCurrency(item.price)}</strong>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="border-0 shadow-lg bg-dark text-white sticky-top" style={{ top: '100px' }}>
            <Card.Body className="p-4">
              <h4 className="mb-4 border-bottom border-secondary pb-3">Order Summary</h4>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between px-0 bg-transparent text-white border-0 py-1">
                  <span className="opacity-75">Items Subtotal</span>
                  <span>{formatCurrency(cart.itemsPrice)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0 bg-transparent text-white border-0 py-1">
                  <span className="opacity-75">Shipping</span>
                  <span>{formatCurrency(cart.shippingPrice)}</span>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between px-0 bg-transparent text-white border-0 py-1">
                  <span className="opacity-75">Tax (18%)</span>
                  <span>{formatCurrency(cart.taxPrice)}</span>
                </ListGroup.Item>
                <hr className="my-3 border-secondary" />
                <ListGroup.Item className="d-flex justify-content-between px-0 bg-transparent text-white border-0 align-items-center">
                  <span className="fs-5">Order Total</span>
                  <span className="fs-3 fw-bold text-primary">{formatCurrency(cart.totalPrice)}</span>
                </ListGroup.Item>
              </ListGroup>

              <div className="d-grid gap-3 mt-4">
                <Button
                  type="button"
                  size="lg"
                  variant="outline-info"
                  className="rounded-pill fw-bold"
                  onClick={payOrder}
                  disabled={cart.cartItems.length === 0}
                >
                  <i className="fas fa-mobile-alt me-2"></i>Pay via MoMo
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="primary"
                  className="rounded-pill fw-bold py-3 shadow"
                  onClick={placeOrderHandler}
                  disabled={cart.cartItems.length === 0 || loading}
                >
                  {loading ? "Processing..." : "Confirm & Place Order"}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
