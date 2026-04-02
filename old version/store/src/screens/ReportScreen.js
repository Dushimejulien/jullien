import axios from "axios";
import React, { useEffect, useContext, useReducer, useState } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Card from "react-bootstrap/Card";
import ListGroup from "react-bootstrap/ListGroup";
import {  useNavigate, useParams } from "react-router-dom";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { getError } from "../utils";
import { Link } from "react-router-dom";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { toast } from "react-toastify";

function reducer(state, action) {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true, error: "" };
    case "FETCH_SUCCESS":
      return { ...state, loading: false, report: action.payload, error: "" };
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
}

export default function ReportScreen() {
  const { state } = useContext(Store);
  const [igice, setIgice] = useState();
  const { userInfo } = state;
  const params = useParams();
  const { id: reportId } = params;
  const navigate = useNavigate();

  const [{ report }, dispatch] = useReducer(reducer, {
    loading: true,
    report: {},
    error: "",
  });

  useEffect(() => {
    const fetchReport = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/report/${reportId}`, {
          headers: { authorization: `Bearer ${userInfo.token}` },
        });

        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (error) {
        dispatch({ type: "FETCH_FAIL", payload: getError(error) });
      }
    };
    if (!userInfo) {
      return navigate("/login");
    }
    if (!report._id || (report._id && report._id !== reportId)) {
      fetchReport();
    }
  }, [report, navigate, userInfo, reportId]);
  const navigateButton = () => {
    navigate("/admin/report");
  };
  

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.put(
        `/api/report/${reportId}`,
        {
          _id: reportId,
          name: report.name,
          ibyangiritse: report.ibyangiritse,
          igice: report.igice,
          depts: report.depts,
          soldAt: report.soldAt,
          comments: report.comments,
          paymentMethod: report.paymentMethod,
          sales: report.sales,
          reportItems: report.reportItems,
          costs: report.costs,
          taxPrice: report.taxPrice,
          grossProfit: report.grossProfit,
          netProfit: report.netProfit,
        },
        {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        }
      );
      dispatch({
        type: "UPDATE_SUCCESS",
      });
      toast.success("depts paid");
      navigate("/admin/report");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "Payment failed" });
    }
  };
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this report?")) {
      try {
        await axios.delete(`/api/report/delete/${reportId}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("Report deleted");
        navigate("/admin/report");
      } catch (error) {
        toast.error(getError(error));
      }
    }
  };
  const handleUpdate = async () => {
    try {
      const response = await axios.put(
        `/api/report/given/${reportId}`,
        {
          _id: reportId,
          igice,
          name: report.name,
          ibyangiritse: report.ibyangiritse,
          depts: report.depts,
          soldAt: report.soldAt,
          comments: report.comments,
          paymentMethod: report.paymentMethod,
          sales: report.sales,
          reportItems: report.reportItems,
          costs: report.costs,
          taxPrice: report.taxPrice,
          grossProfit: report.grossProfit,
          netProfit: report.netProfit,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userInfo.token}`,
          },
        }
      );
      console.log(response);

      if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        console.log(data.report);
      } else {
        console.error("Failed to update report");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1 className="my-3">Report {reportId}</h1>
      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Report</Card.Title>

              <Card.Text>
                <strong>depts:</strong>
                {report.depts}
              </Card.Text>
              <Card.Text>
                <strong>losses:</strong>
                {report.ibyangiritse}
              </Card.Text>
              <Card.Text>
                <strong>Sold at:</strong>
                {report.soldAt}
                <br />
              </Card.Text>
              <Card.Text>
                <strong>Comments:</strong>
                {report.comments}
              </Card.Text>
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Payments</Card.Title>
              <Card.Text>
                <strong>Mathod: </strong>
                {report.paymentMethod}
              </Card.Text>
              {report.paymentMethod === "Cash" ||
              report.paymentMethod === "MoMo" ? (
                <h4 style={{ color: "green" }}>Paid</h4>
              ) : (
                <MessageBox variant="danger">Not Paid</MessageBox>
              )}
            </Card.Body>
          </Card>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Items</Card.Title>
              <ListGroup variant="flush">
                {report.reportItems &&
                  report.reportItems.map((item) => (
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
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>Report Summary</Card.Title>
              <ListGroup variant="flush">
                <Row>
                  <Col>Sales</Col>
                  <Col>{report.sales}RWF</Col>
                </Row>
                <Row>
                  <Col>Ayishyuwe</Col>
                  <Col>{report.igice}RWF</Col>
                </Row>
                <Row>
                  <Col>
                    <strong>Total costs:</strong>{" "}
                  </Col>
                  <Col>
                    <strong>{report.costs}RWF</strong>{" "}
                  </Col>
                </Row>

                <Row>
                  <Col>
                    <strong>Tax:</strong>{" "}
                  </Col>
                  <Col>
                    <strong>{report.taxPrice}RWF</strong>{" "}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <strong>Gross profit:</strong>{" "}
                  </Col>
                  <Col>
                    <strong>{report.grossProfit} RWF</strong>{" "}
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <strong>Net profit:</strong>{" "}
                  </Col>
                  <Col>
                    <strong>{report.netProfit} RWF</strong>{" "}
                  </Col>
                </Row>
              </ListGroup>
            </Card.Body>
          </Card>
          {report.depts > 0 && (
            <Button
              onClick={submitHandler}
              style={{ marginRight: "5rem" }}
              type="button"
            >
              Paid
            </Button>
          )}
          {report.igice !== report.depts && (
            <Form onSubmit={handleUpdate}>
              <Form.Group controlId="igice">
                <Form.Control
                  type="number"
                  placeholder="inter paid amount"
                  value={igice}
                  onChange={(e) => setIgice(e.target.value)}
                />
                <Button type="submit">Igice</Button>
              </Form.Group>
            </Form>
          )}

          <Button type="button" style={{ marginTop: "10px" }}  onClick={navigateButton}>
            Back
          </Button>
          
          <Button type="button" style={{ marginLeft: "10px" }} onClick={()=>navigate(`/update/${reportId}`)}>
            Update
          </Button>
          <Button
        type="button"
        variant="danger"
        onClick={handleDelete}
        style={{ marginLeft: "10px" }}
      >
        Delete
      </Button>
        </Col>
      </Row>
    </div>
  );
}
