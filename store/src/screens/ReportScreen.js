import axios from "axios";
import React, { useEffect, useContext, useReducer, useState } from "react";
import { Col, Row, Card, ListGroup, Button, Form, Container, Badge, Image, Alert } from "react-bootstrap";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import MessageBox from "../components/MessageBox";
import LoadingBox from "../components/LoadingBox";
import { Store } from "../Store";
import { getError } from "../utils";
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
  const { userInfo } = state;
  const params = useParams();
  const { id: reportId } = params;
  const navigate = useNavigate();

  const [{ loading, error, report, loadingUpdate }, dispatch] = useReducer(reducer, {
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
      return navigate("/signin");
    }
    if (!report._id || (report._id && report._id !== reportId)) {
      fetchReport();
    }
  }, [report, navigate, userInfo, reportId]);

  const formatCurrency = (val) => `${(val || 0).toLocaleString()} RWF`;

  const debtPaidHandler = async () => {
    if (!window.confirm("Confirm payment of this debt?")) return;
    try {
      dispatch({ type: "UPDATE_REQUEST" });
      await axios.put(`/api/report/${reportId}`, { ...report, depts: 0 }, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: "UPDATE_SUCCESS" });
      toast.success("Debt marked as fully paid");
      navigate("/admin/report");
    } catch (err) {
      toast.error(getError(err));
      dispatch({ type: "UPDATE_FAIL" });
    }
  };

  const deleteHandler = async () => {
    if (!window.confirm("CRITICAL: Delete this report permanently?")) return;
    try {
      await axios.delete(`/api/report/delete/${reportId}`, {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      toast.success("Report removed from system");
      navigate("/admin/report");
    } catch (error) {
      toast.error(getError(error));
    }
  };

  if (loading) return <LoadingBox />;
  if (error) return <MessageBox variant="danger">{error}</MessageBox>;

  return (
    <Container className="py-4">
      <Helmet>
        <title>Report Analysis - Rightlamps</title>
      </Helmet>
      
      <div className="mb-4">
        <h1 className="text-gradient h2 mb-1 text-uppercase">Financial Audit</h1>
        <p className="text-muted small ls-wide">REFERENCE ID: {reportId}</p>
      </div>

      <Row>
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4 bg-card rounded-xl overflow-hidden">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-info-circle me-2 text-primary"></i>Operational Data</h5>
             </Card.Header>
             <Card.Body>
               <Row className="gy-4">
                 <Col sm={6}>
                   <div className="text-muted small text-uppercase ls-wide mb-1">Stock Impact (Sold)</div>
                   <div className="fs-4 fw-bold text-primary">{report.real} <span className="small fw-normal text-muted">Items</span></div>
                 </Col>
                 <Col sm={6}>
                   <div className="text-muted small text-uppercase ls-wide mb-1">Revenue Performance</div>
                   <div className="fs-4 fw-bold">{formatCurrency(report.soldAt)}</div>
                 </Col>
                 <Col sm={6}>
                   <div className="text-muted small text-uppercase ls-wide mb-1">Outstanding Debt</div>
                   {report.depts > 0 ? (
                     <Badge bg="danger" className="fs-6 px-3 py-2 bg-opacity-10 text-danger border border-danger">
                        {formatCurrency(report.depts)} Pending
                     </Badge>
                   ) : (
                     <Badge bg="success" className="fs-6 px-3 py-2 bg-opacity-10 text-success border border-success">
                        Full Settle
                     </Badge>
                   )}
                 </Col>
                 <Col sm={6}>
                   <div className="text-muted small text-uppercase ls-wide mb-1">Damaged/Loss Value</div>
                   <div className="fs-4 fw-bold text-warning">{formatCurrency(report.ibyangiritse)}</div>
                 </Col>
                 <Col sm={12}>
                   <div className="text-muted small text-uppercase ls-wide mb-1">Audit Comments</div>
                   <div className="p-3 bg-light rounded-3 border-start border-4 border-primary">
                     {report.comments || "No professional remarks provided for this audit entry."}
                   </div>
                 </Col>
               </Row>
             </Card.Body>
          </Card>

          <Card className="border-0 shadow-sm bg-card rounded-xl overflow-hidden mb-4">
             <Card.Header className="bg-transparent border-bottom p-3">
               <h5 className="mb-0 fw-bold"><i className="fas fa-layer-group me-2 text-primary"></i>Inventory Reconciliation</h5>
             </Card.Header>
             <Card.Body className="p-0">
               <ListGroup variant="flush">
                 {(report.reportItems || []).map((item) => (
                   <ListGroup.Item key={item._id} className="bg-transparent border-bottom p-3">
                     <Row className="align-items-center">
                       <Col md={7} className="d-flex align-items-center">
                         <Image src={item.image} alt={item.name} rounded className="me-3 bg-light p-1" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
                         <div>
                            <div className="fw-bold">{item.name}</div>
                            <div className="text-muted small">ID: {item._id.substring(0,8)}... | {item.category}</div>
                         </div>
                       </Col>
                       <Col md={2} className="text-center">
                         <div className="text-muted small">Qty</div>
                         <div className="fw-bold fs-5">{item.quantity}</div>
                       </Col>
                       <Col md={3} className="text-end">
                         <div className="text-muted small">Price/Unit</div>
                         <div className="fw-bold text-primary">{formatCurrency(item.price)}</div>
                       </Col>
                     </Row>
                   </ListGroup.Item>
                 ))}
               </ListGroup>
             </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="border-0 shadow-sm bg-dark text-white rounded-xl mb-4 overflow-hidden">
             <Card.Header className="bg-primary text-white border-bottom-0 p-3">
               <h5 className="mb-0 fw-bold">Financial Proof</h5>
             </Card.Header>
             <Card.Body className="p-4">
               <div className="d-flex justify-content-between mb-3 align-items-end">
                 <div className="text-muted small text-uppercase ls-wide">Gross Sales</div>
                 <div className="h4 mb-0 fw-bold">{formatCurrency(report.sales)}</div>
               </div>
               <div className="d-flex justify-content-between mb-3 text-info">
                 <div className="small text-uppercase ls-wide">Partial Payment</div>
                 <div className="fw-bold">{formatCurrency(report.igice)}</div>
               </div>
               <hr className="opacity-25" />
               <div className="d-flex justify-content-between mb-2 small text-muted">
                 <div>Asset Costs</div>
                 <div>{formatCurrency(report.costs)}</div>
               </div>
               <div className="d-flex justify-content-between mb-4 small text-muted">
                 <div>Tax Estimation</div>
                 <div>{formatCurrency(report.taxPrice)}</div>
               </div>
               <div className="p-3 rounded bg-white bg-opacity-10 d-flex justify-content-between align-items-center mt-4">
                 <div className="text-uppercase small ls-wide opacity-75">Net Profit ROI</div>
                 <div className="h3 mb-0 text-success fw-bold">{formatCurrency(report.netProfit)}</div>
               </div>
             </Card.Body>
          </Card>

          <div className="d-grid gap-3">
             {report.depts > 0 && (
               <Button variant="success" size="lg" className="rounded-pill py-3 fw-bold shadow-sm" onClick={debtPaidHandler} disabled={loadingUpdate}>
                 <i className="fas fa-check-double me-2"></i> Mark Debt as Paid
               </Button>
             )}
             <Button variant="primary" size="lg" className="rounded-pill py-3 fw-bold shadow-sm" onClick={() => navigate(`/update/${reportId}`)}>
                <i className="fas fa-edit me-2"></i> Edit Record
             </Button>
             <Button variant="outline-danger" className="rounded-pill py-2" onClick={deleteHandler}>
                <i className="fas fa-trash-alt me-2"></i> Delete Audit
             </Button>
             <Button variant="link" className="text-muted text-decoration-none" onClick={() => navigate("/admin/report")}>
                <i className="fas fa-arrow-left me-2"></i> Back to Reports List
             </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
