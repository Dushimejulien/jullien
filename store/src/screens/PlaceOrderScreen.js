import React, { useContext, useEffect, useReducer, useState } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import ListGroup from "react-bootstrap/ListGroup";
import { Helmet } from "react-helmet-async";
import Card from "react-bootstrap/Card";
import CheckoutSteps from "../components/Checksteps";
import { Link, useNavigate } from "react-router-dom";
import { Store } from "../Store";
import Button from "react-bootstrap/esm/Button";
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

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100; // 123.2345 => 123.23
  cart.itemsPrice = round2(
    cart.cartItems.reduce((a, c) => a + c.quantity * c.price, 0)
  );
  cart.shippingPrice = cart.itemsPrice > 100 ? round2(0) : round2(10);
  cart.taxPrice = round2(0.18 * cart.itemsPrice);
  cart.totalPrice = cart.itemsPrice + cart.shippingPrice + cart.taxPrice;

  const payOrder=async()=>{
    try {
      const pay = await Axios.post('/api/orders/submitPayment',
      {amount:cart.totalPrice,phone:cart.shippingAddress.phone},
      {headers:{authorization:`Bearer ${state.userInfo.token}`}})
      console.log(pay)
      window.alert(`Check your mobile phone number added on shipping aggress, If you see no request dial ${"*182*7*1#"}... cose the window to continue`)
    } catch (error) {
      console.log(getError(error));
      toast.error("Internal server error")
    }
  }

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
          sellingPrice: cart.sellingPrice,
        },
        {
          headers: {
            authorization: `Bearer ${userInfo.token}`,
          },
        }
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
  return (
    <div>
      <CheckoutSteps step1 step2 step3 step4></CheckoutSteps>
      <Helmet>
        <title>Gutumiza Ibicuruzwa</title>
      </Helmet>
      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Tumiza</Card.Title>
              <Card.Text>
                <strong>Izina:</strong>
                {cart.shippingAddress.fullName}
                <br />
                <strong>Aho muri:</strong>
                {cart.shippingAddress.address},{cart.shippingAddress.city},
                {cart.shippingAddress.phone},{cart.shippingAddress.country}
              </Card.Text>
              <Link to="/shipping">Vugurura</Link>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Ubwishyu</Card.Title>
              <Card.Text>
                <strong>Uburyo:</strong>
                {cart.paymentMethod}
              </Card.Text>
              <Link to="/payment">Vugurura</Link>
            </Card.Body>
          </Card>

          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Ibicuruzwa</Card.Title>
              <ListGroup variant="flush">
                {cart.cartItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-items-center">
                      <Col md={6}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rounded img-thumbnail"
                        ></img>{" "}
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </Col>
                      <Col md={3}>
                        <span>{item.quantity}</span>
                      </Col>
                      <Col md={3}>RWF{item.price}</Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Link to="/cart">Edit</Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card.Body>
            <Card.Title>Order Summary</Card.Title>
            <ListGroup variant="flush">
              <ListGroup.Item>
                <Row>
                  <Col>Items</Col>
                  <Col>{cart.itemsPrice.toFixed(2)}RWF</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Shipping</Col>
                  <Col>{cart.shippingPrice.toFixed(2)}RWF</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>Tax</Col>
                  <Col>{cart.taxPrice.toFixed(2)}RWF</Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
                <Row>
                  <Col>
                    <strong> Order Total</strong>
                  </Col>
                  <Col>
                    <strong>{cart.totalPrice.toFixed(2)}RWF</strong>
                  </Col>
                </Row>
              </ListGroup.Item>
              <ListGroup.Item>
              <div className="d-grid">
                  <Button
                    type="button"
                    onClick={payOrder}
                    disabled={cart.cartItems.length === 0}
                  >
                    Pay your order
                  </Button>
                </div>
              </ListGroup.Item>
              <ListGroup.Item>
                <div className="d-grid">
                  <Button
                    type="button"
                    onClick={placeOrderHandler}
                    disabled={cart.cartItems.length === 0}
                  >
                    Place Order
                  </Button>
                </div>
                {loading && <LoadingBox></LoadingBox>}
              </ListGroup.Item>
            </ListGroup>
          </Card.Body>
        </Col>
      </Row>
    </div>
  );
}
