import React, { useContext } from "react";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/esm/Row";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { Store } from "../Store.js";
import MessageBox from "../components/MessageBox.js";
import Card from "react-bootstrap/Card";
import axios from "axios";

export default function CartScreen() {
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);

  const {
    userInfo,
    cart: { cartItems },
  } = state;
  const updateCartHandler = async (item, quantity) => {
    const { data } = await axios(`/api/products/${item._id}`);
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
    if (userInfo) {
      if (userInfo.isAdmin === true || userInfo.isSeller === true) {
        navigate("/signin?redirect=/admin/createReport");
      }
    } else {
      navigate("/signin?redirect=/shipping");
    }
  };
  return (
    <div>
      <Helmet>
        <title>Shopping cart</title>
      </Helmet>
      <h1>Ibyo mwaguze</h1>
      {}
      {(userInfo && userInfo.isAdmin) || (userInfo && userInfo.isSeller) ? (
        <Row>
          <Col md={8}>
            {cartItems.length === 0 ? (
              <MessageBox>
                Ntimwahisemo ibyo mugura.{" "}
                <Link to="/">Hitamo ibyo ukeneye</Link>
              </MessageBox>
            ) : (
              <ListGroup>
                {cartItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-items-center">
                      <Col md={4}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rounded img-thumbnail"
                        ></img>{" "}
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </Col>
                      <Col md={3}>
                        <Button
                          variant="light"
                          onClick={() =>
                            updateCartHandler(item, item.quantity + 1)
                          }
                          disabled={item.quantity === item.countInStock}
                        >
                          <i className="fas fa-plus-circle btn_icon"></i>
                        </Button>{" "}
                        <span>{item.quantity}</span>{" "}
                        <Button
                          onClick={() =>
                            updateCartHandler(item, item.quantity - 1)
                          }
                          variant="light"
                          disabled={item.quantity === 1}
                        >
                          <i className="fas fa-minus-circle btn_icon"></i>
                        </Button>
                      </Col>
                      <Col md={3}>{item.price} RWF</Col>
                      <Col md={3}>{item.costPrice} RWF</Col>
                      <Col md={2}>
                        <Button
                          onClick={() => removeItemHandler(item)}
                          variant="light"
                        >
                          <i className="fas fa-trash btn_icon"></i>
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <h4>
                      <h3>
                        Ingano yibicuruzwa: (
                        {cartItems.reduce((a, c) => a + c.quantity, 0)} )
                      </h3>
                      {cartItems.reduce((a, c) => a + c.price * c.quantity, 0)}{" "}
                      RWF
                      <h3>Ikiranguzo:</h3>
                      {cartItems.reduce(
                        (a, c) => a + c.costPrice * c.quantity,
                        0
                      )}
                      {""}RWF
                    </h4>
                  </ListGroup.Item>
                  <div className="d-grid">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={checkoutHandler}
                      disabled={cartItems.length === 0}
                    >
                      Komeza ugure
                    </Button>
                  </div>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Row>
          <Col md={8}>
            {cartItems.length === 0 ? (
              <MessageBox>
                Ntimwahisemo ibyo mugura.{" "}
                <Link to="/">Hitamo ibyo ukeneye</Link>
              </MessageBox>
            ) : (
              <ListGroup>
                {cartItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-items-center">
                      <Col md={4}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rounded img-thumbnail"
                        ></img>{" "}
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </Col>
                      <Col md={3}>
                        <Button
                          variant="light"
                          onClick={() =>
                            updateCartHandler(item, item.quantity + 1)
                          }
                          disabled={item.quantity === 1}
                        >
                          <i className="fas fa-plus-circle btn_icon"></i>
                        </Button>{" "}
                        <span>{item.quantity}</span>{" "}
                        <Button
                          onClick={() =>
                            updateCartHandler(item, item.quantity - 1)
                          }
                          variant="light"
                          disabled={item.quantity === 1}
                        >
                          <i className="fas fa-minus-circle btn_icon"></i>
                        </Button>
                      </Col>
                      <Col md={3}>{item.price} RWF</Col>

                      <Col md={2}>
                        <Button
                          onClick={() => removeItemHandler(item)}
                          variant="light"
                        >
                          <i className="fas fa-trash btn_icon"></i>
                        </Button>
                      </Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Col>
          <Col md={4}>
            <Card>
              <Card.Body>
                <ListGroup variant="flush">
                  <ListGroup.Item>
                    <h3>
                      Ingano ({cartItems.reduce((a, c) => a + c.quantity, 0)}{" "}
                      Ibicuruzwa):
                      {cartItems.reduce(
                        (a, c) => a + c.price * c.quantity,
                        0
                      )}{" "}
                      RWF
                    </h3>
                  </ListGroup.Item>
                  <div className="d-grid">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={checkoutHandler}
                      disabled={cartItems.length === 0}
                    >
                      Komeza ugure
                    </Button>
                  </div>
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
}
