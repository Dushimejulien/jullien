import axios from "axios";
import React, { useContext, useEffect, useReducer } from "react";
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Row, Col, ListGroup, Card, Button, Container, Badge, Image } from "react-bootstrap";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { getError } from "../utils";
import { toast } from "react-toastify";

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, order: action.payload, error: "" };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "PAY_REQUEST":
      return { ...state, loadingPay: true };
    case "PAY_SUCCESS":
      return { ...state, loadingPay: false, successPay: true };
    case "PAY_FAIL":
      return { ...state, loadingPay: false };
    case "PAY_RESET":
      return { ...state, loadingPay: false, successPay: false };
    case "DELIVER_REQUEST":
      return { ...state, loadingDeliver: true };
    case "DELIVER_SUCCESS":
      return { ...state, loadingDeliver: false, successDeliver: true };
    case "DELIVER_FAIL":
      return { ...state, loadingDeliver: false };
    case "DELIVER_RESET":
      return { ...state, loadingDeliver: false, successDeliver: false };
    default:
      return state;
  }
}

export default function OrderScreen() {
  const { state } = useContext(Store);
  const { userInfo } = state;

  const params = useParams();
  const { id: orderId } = params;
  const navigate = useNavigate();

  const [{ loading, error, order, successPay, loadingPay, loadingDeliver, successDeliver }, dispatch] = useReducer(reducer, {
    loading: true,
    order: {},
    error: "",
    successPay: false,
    loadingPay: false,
  });

  const [{ isPending }, paypalDispatch] = usePayPalScriptReducer();

  function createOrder(data, actions) {
    return actions.order.create({
      purchase_units: [{ amount: { value: order.totalPrice } }],
    }).then((orderID) => orderID);
  }

  function onApprove(data, actions) {
    return actions.order.capture().then(async function(details) {
      try {
        dispatch({ type: "PAY_REQUEST" });
        const { data } = await axios.put(`/api/orders/${order._id}/pay`, details, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "PAY_SUCCESS", payload: data });
        toast.success("Order is paid");
      } catch (err) {
        dispatch({ type: "PAY_FAIL", payload: getError(err) });
        toast.error(getError(err));
      }
    });
  }

  function onError(err) {
    toast.error(getError(err));
  }

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/orders/${orderId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };

    if (!userInfo) {
      return navigate("/signin");
    }
    if (!order._id || successPay || successDeliver || (order._id && order._id !== orderId)) {
      fetchOrder();
      if (successPay) dispatch({ type: "PAY_RESET" });
      if (successDeliver) dispatch({ type: "DELIVER_RESET" });
    } else if (!order.isPaid) {
      const loadPayPalScript = async () => {
        const { data: clientId } = await axios.get("/api/keys/paypal", {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });
        paypalDispatch({
          type: "resetOptions",
          value: { "client-id": clientId, currency: "USD" },
        });
        paypalDispatch({ type: "setLoadingStatus", value: "pending" });
      };
      loadPayPalScript();
    }
  }, [order, userInfo, orderId, navigate, paypalDispatch, successPay, successDeliver]);

  async function deliverOrderHandler() {
    try {
      dispatch({ type: "DELIVER_REQUEST" });
      const { data } = await axios.put(`/api/orders/${order._id}/deliver`, {}, {
        headers: { authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: "DELIVER_SUCCESS", payload: data });
      toast.success("Order is delivered");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "DELIVER_FAIL" });
    }
  }

  return loading ? (
    <LoadingBox />
  ) : error ? (
    <MessageBox variant="danger">{error}</MessageBox>
  ) : (
    <Container className="py-4">
      <Helmet>
        <title>Order Details - Rightlamps</title>
      </Helmet>
      
      <div className="mb-4">
        <h1 className="text-gradient h2 mb-1">Order #{orderId.substring(0, 8)}...</h1>
        <p className="text-muted">Confirmed on {new Date(order.createdAt).toLocaleDateString()}</p>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4 bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-shipping-fast me-2 text-primary"></i>Shipping Details</h5>
             </Card.Header>
             <Card.Body>
               <div className="mb-3">
                 <div className="fw-bold fs-6">{order.shippingAddress.fullName}</div>
                 <div className="text-muted">
                   {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
                   {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                 </div>
               </div>
               {order.isDelivered ? (
                 <Alert variant="success" className="border-0 bg-success bg-opacity-10 text-success py-2 px-3 m-0">
                   <i className="fas fa-check-circle me-2"></i> Delivered on {new Date(order.deliveredAt).toLocaleString()}
                 </Alert>
               ) : (
                 <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger py-2 px-3 m-0">
                   <i className="fas fa-clock me-2"></i> Shipment Pending
                 </Alert>
               )}
             </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-wallet me-2 text-primary"></i>Payment Status</h5>
             </Card.Header>
             <Card.Body>
               <div className="mb-3">
                 <div className="fw-bold small text-uppercase text-muted ls-wide mb-1">Method</div>
                 <div className="fs-6">{order.paymentMethod}</div>
               </div>
               {order.isPaid ? (
                 <Alert variant="success" className="border-0 bg-success bg-opacity-10 text-success py-2 px-3 m-0">
                   <i className="fas fa-check-circle me-2"></i> Paid on {new Date(order.paidAt).toLocaleString()}
                 </Alert>
               ) : (
                 <Alert variant="danger" className="border-0 bg-danger bg-opacity-10 text-danger py-2 px-3 m-0">
                   <i className="fas fa-exclamation-triangle me-2"></i> Payment Pending
                 </Alert>
               )}
             </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm mb-4 bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-shopping-bag me-2 text-primary"></i>Ordered Items</h5>
             </Card.Header>
             <Card.Body className="p-0">
               <ListGroup variant="flush">
                 {order.orderItems.map((item) => (
                   <ListGroup.Item key={item._id} className="bg-transparent border-bottom p-3">
                     <Row className="align-items-center">
                       <Col md={7} className="d-flex align-items-center">
                         <Image
                           src={item.image}
                           alt={item.name}
                           rounded
                           className="me-3 bg-light p-1"
                           style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                         />
                         <div>
                           <Link to={`/product/${item.slug}`} className="fw-bold text-decoration-none text-body d-block">
                             {item.name}
                           </Link>
                           <div className="text-muted small">Quantity: {item.quantity}</div>
                         </div>
                       </Col>
                       <Col md={5} className="text-end fw-bold text-primary fs-6">
                         {item.price.toLocaleString()} RWF
                       </Col>
                     </Row>
                   </ListGroup.Item>
                 ))}
               </ListGroup>
             </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-card rounded-xl sticky-top overflow-hidden" style={{ top: '100px' }}>
            <Card.Header className="bg-primary text-white p-3">
              <h5 className="mb-0 fw-bold">Order Summary</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <SummaryItem label="Items" value={order.itemsPrice} />
                <SummaryItem label="Shipping" value={order.shippingPrice} />
                <SummaryItem label="Tax" value={order.taxPrice} />
                <ListGroup.Item className="bg-transparent px-0 pt-3 border-top-0">
                  <Row className="fw-bold fs-5">
                    <Col>Total</Col>
                    <Col className="text-end text-primary">{order.totalPrice.toLocaleString()} RWF</Col>
                  </Row>
                </ListGroup.Item>

                {!order.isPaid && (
                  <ListGroup.Item className="bg-transparent px-0 border-0 mt-3">
                    {isPending ? (
                      <LoadingBox />
                    ) : (
                      <PayPalButtons
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                      />
                    )}
                    {loadingPay && <LoadingBox />}
                  </ListGroup.Item>
                )}

                {userInfo.isAdmin && order.isPaid && !order.isDelivered && (
                  <ListGroup.Item className="bg-transparent px-0 border-0 mt-3">
                    {loadingDeliver && <LoadingBox />}
                    <div className="d-grid">
                      <Button type="button" variant="primary" className="rounded-pill py-3 fw-bold shadow-sm" onClick={deliverOrderHandler}>
                        Mark as Delivered
                      </Button>
                    </div>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function SummaryItem({ label, value }) {
  return (
    <ListGroup.Item className="bg-transparent px-0 border-0 py-2 d-flex justify-content-between align-items-center">
      <div className="text-muted small text-uppercase ls-wide">{label}</div>
      <div className="fw-semibold">{value.toLocaleString()} RWF</div>
    </ListGroup.Item>
  );
}

function Alert({ variant, children, className }) {
  return (
    <div className={`alert alert-${variant} rounded-3 ${className}`}>
      {children}
    </div>
  );
}
