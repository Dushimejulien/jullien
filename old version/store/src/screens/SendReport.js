import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import CheckoutSteps from "../components/Checksteps";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import { useContext } from "react";
import { Store } from "../Store";
import { useEffect } from "react";
import { useReducer } from "react";
import { toast } from "react-toastify";
import { getError } from "../utils";
import axios from "axios";
import LoadingBox from "../components/LoadingBox";

const reducer = (action, state) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };

    case "FETCH_SUCCESS":
      return { ...state, products: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "CREATE_REQUEST":
      return { ...state, loading: true };
    case "CREATE_SUCCESS":
      return { ...state, loading: false };
    case "CREATE_FAIL":
      return { ...state, loading: false };
    case "UPDATE_REQUEST":
      return { ...state, loadingUpdate: true };
    case "UPDATE_SUCCESS":
      return { ...state, loadingUpdate: false };
    case "UPDATE_FAIL":
      return { ...state, loadingUpdate: false };
    case "UPLOAD_REQUEST":
      return { ...state, loadingUpload: true, errorUpload: "" };
    case "UPLOAD_SUCCESS":
    default:
      return state;
  }
};

export default function SendReport() {
  const [{ loading }, dispatch] = useReducer(reducer, {
    loading: false,
  });
  const navigate = useNavigate();
  const { state  } = useContext(Store);
  const { cart, userInfo } = state;
  

  const [countInStock, ] = useState(
    cart.cartItems[0].countInStock - cart.report.real
  );

  const round2 = (num) => Math.round(num * 100 + Number.EPSILON) / 100;
  // check losses
  if (cart.report.ibyangiritse > 0) {

    

    cart.Sales = round2(
      cart.cartItems.reduce(
        (a, c) =>
          a +
          0 * cart.report.real * 0 * cart.report.soldAt -
          0 * cart.report.depts,
        0
      )
    );
    cart.costs = round2(
      cart.cartItems.reduce((a, c) => a + cart.report.real * c.costPrice, 0)
    );
    cart.grossProfit = cart.Sales - cart.costs;
    cart.taxPrice = round2(0.18 * 0 * cart.grossProfit);

    cart.netProfit = 0 * cart.grossProfit - cart.taxPrice;

  
    // odd number
  } else if (cart.report.depts && !cart.report.soldAt) {

    cart.depts=round2(cart.report.depts*cart.report.real)
   

    cart.Sales = round2(
      cart.cartItems.reduce(
        (a, c) =>
          a +
          0 * cart.report.real * 0 * cart.report.soldAt -
          0 * cart.report.depts,
        0
      )
    );
    // cost applied
    cart.costs = round2(
      cart.cartItems.reduce((a, c) => a + cart.report.real * c.costPrice, 0)
    );
    // changes 110

    cart.grossProfit = 0 * cart.Sales - 0 * cart.costs;
    cart.taxPrice = round2(0.18 * 0 * cart.grossProfit);

    cart.netProfit = cart.grossProfit - cart.taxPrice;
    //no changes
  } else {

    cart.depts=round2(cart.report.depts*cart.report.real)
    

    cart.Sales = round2(
      cart.cartItems.reduce(
        (a, c) => a + cart.report.real * cart.report.soldAt - cart.report.depts,
        0
      )
    );
    cart.costs = round2(
      cart.cartItems.reduce((a, c) => a + cart.report.real * c.costPrice, 0)
    );

    cart.grossProfit = cart.Sales - cart.costs;
    cart.taxPrice = round2(0.18 * cart.grossProfit);

    cart.netProfit = cart.grossProfit - cart.taxPrice;
  }

  const reportHander = async () => {
    try {
      dispatch({ type: "CREATE_REQUEST" });
      const { data } = await axios.post(
        "/api/report",

        {
          reportItems: cart.cartItems,
          expense: cart.report.expense,
          real: cart.report.real,
          depts: cart.depts,
          name: cart.cartItems.name,
          quantity: cart.cartItems.quantity,
          comments: cart.report.comments,
          soldAt: cart.report.soldAt,
          paymentMethod: cart.paymentMethod,
          sales: cart.Sales,
          costs: cart.costs,
          grossProfit: cart.grossProfit,
          taxPrice: cart.taxPrice,
          netProfit: cart.netProfit,
          inStock: cart.inStock,
          ibyangiritse: cart.report.ibyangiritse,
        },
        {
          headers: {
            authorization: `Bearer ${userInfo.token}`,
          },
        }
      );

      dispatch({ type: "CREATE_SUCCESS",payload:data });
      localStorage.removeItem("cartItems");
      navigate(`/`);
    } catch (error) {
      dispatch({ type: "CREATE_FAIL" });
      toast.error(getError(error));
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.patch(`/api/products/${cart.cartItems[0]._id}`, {
        countInStock,
      });
      dispatch({
        type: "UPDATE_SUCCESS",
      });
      toast.success("Product updated successfully");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPDATE_FAIL" });
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
        <title>Review report info</title>
      </Helmet>
      <h1 className="my-3">Review Report</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Report</Card.Title>
              <Card.Text>
                <strong>depts:</strong>
                {cart.depts} RWF
              </Card.Text>
              <Card.Text>
                <strong>Losses:</strong>
                {cart.report.ibyangiritse} RWF
              </Card.Text>
              <Card.Text>
                <strong>given to:</strong>
                {cart.report.givenTo}
              </Card.Text>
              <Card.Text>
                <strong>real quantity:</strong>
                {cart.report.real}
              </Card.Text>
              <strong>Sold at:</strong>
              {cart.report.soldAt} RWF
              <br />
              <Card.Text>
                <strong>Comments:</strong>
                {cart.report.comments}
              </Card.Text>
              <Link to="/admin/createReport">Edit</Link>
              <Row>
                <Col md={3}>
                  <Button type="submit" onClick={submitHandler}>
                    sell
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Payments</Card.Title>
              <Card.Text>
                <strong>Mathod: </strong>
                {cart.paymentMethod}
              </Card.Text>
              <Link to="/payment">Edit</Link>
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Items</Card.Title>
              <ListGroup variant="flush">
                {cart.cartItems.map((item) => (
                  <ListGroup.Item key={item._id}>
                    <Row className="align-item-center">
                      <Col md={6}>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="img-fluid rounded img-thumbnail"
                        />
                        <Link to={`/product/${item.slug}`}>{item.name}</Link>
                      </Col>
                      <Col md={2}>
                        <span>{item.quantity}</span>
                      </Col>

                      <Col md={2}>{item.price} RWF</Col>
                      <Col md={2}>{item.costPrice} RWF</Col>
                    </Row>
                  </ListGroup.Item>
                ))}
              </ListGroup>
              <Link to="/cart">Edit</Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card style={{ width: "18rem" }}>
            <Card.Body>
              <Card.Title style={{ color: "rgb(13, 103, 116)" }}>
                Selling summary
              </Card.Title>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <Row>
                    <Col>
                      <strong>Sales: </strong>{" "}
                    </Col>
                    <Col>
                      <strong>{cart.Sales.toFixed(2)}RWF</strong>
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <strong>Total costs:</strong>{" "}
                    </Col>
                    <Col>
                      <strong>{cart.costs.toFixed(2)}RWF</strong>{" "}
                    </Col>
                  </Row>

                  <Row>
                    <Col>
                      <strong>Tax:</strong>{" "}
                    </Col>
                    <Col>
                      <strong>{cart.taxPrice.toFixed(2)}RWF</strong>{" "}
                    </Col>
                  </Row>
                  <Row>
                    <Col>
                      <strong>Gross profit:</strong>{" "}
                    </Col>
                    <Col>
                      <strong>{cart.grossProfit.toFixed(2)}RWF</strong>{" "}
                    </Col>
                  </Row>

                  <Row>
                    <Col>
                      <strong>Net profit:</strong>{" "}
                    </Col>
                    <Col>
                      <strong>{cart.netProfit.toFixed(2)}RWF</strong>{" "}
                    </Col>
                  </Row>
                </ListGroup.Item>
                <ListGroup.Item>
                  <div className="d-grid">
                    <Button
                      type="button"
                      onClick={reportHander}
                      disabled={cart.report.real === 0}
                    >
                      save
                    </Button>
                  </div>
                  {loading && <LoadingBox></LoadingBox>}
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
