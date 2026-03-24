import React, { useContext, useEffect, useReducer, useState } from "react";
import { Row, Col, Button, Card, Container, Badge, Form, Spinner } from "react-bootstrap";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Store } from "../Store";
import { Helmet } from "react-helmet-async";
import MessageBox from "../components/MessageBox";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        reports: action.payload.report,
        countReport: action.payload.countReport,
        pages: action.payload.pages,
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

function SearchDept() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const depts = sp.get("depts") || "1"; // Default to show debts > 0
  const page = sp.get("page") || 1;
  const query = sp.get("query") || "all";

  const { state } = useContext(Store);
  const { userInfo } = state;

  const [{ loading, error, reports, pages, countReport }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
    reports: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(
          `/api/report/search?page=${page}&query=${query}&depts=${depts}`,
          { headers: { Authorization: `Bearer ${userInfo.token}` } }
        );
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: err.message });
      }
    };
    fetchData();
  }, [page, query, depts, userInfo]);

  return (
    <Container className="py-5">
      <Helmet>
        <title>Debt Recovery - Rightlamps</title>
      </Helmet>
      
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h1 className="text-gradient">Outstanding Liabilities</h1>
          <p className="text-muted small uppercase ls-wide fw-bold">Audit History of Unpaid Transactions ({countReport || 0})</p>
        </div>
        <Button variant="outline-danger" className="rounded-pill" onClick={() => navigate('/admin/report')}>
           Full Ledger
        </Button>
      </div>

      <Row>
        <Col lg={12}>
           {loading ? (
             <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
           ) : error ? (
             <MessageBox variant="danger">{error}</MessageBox>
           ) : (
             <>
               <Card className="border-0 shadow-sm bg-card overflow-hidden mb-4">
                 <div className="table-responsive">
                   <Table hover className="mb-0 admin-table align-middle">
                     <thead className="bg-light">
                       <tr className="small text-uppercase ls-wide text-muted">
                         <th className="ps-4">Date</th>
                         <th>Reconciled Items</th>
                         <th className="text-end">Balance Due</th>
                         <th className="text-end">Method</th>
                         <th className="text-center">Action</th>
                       </tr>
                     </thead>
                     <tbody>
                       {reports.map((report) => (
                         <tr key={report._id}>
                           <td className="ps-4">
                              <div className="fw-bold fs-6">{new Date(report.createdAt).toLocaleDateString()}</div>
                              <div className="small text-muted">ID: {report._id.substring(0,8)}</div>
                           </td>
                           <td>
                             <div className="small text-truncate" style={{ maxWidth: '250px' }}>
                               {report.reportItems.map(i => i.name).join(', ')}
                             </div>
                           </td>
                           <td className="text-end">
                             <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger px-3 py-2">
                               {(report.depts || 0).toLocaleString()} RWF
                             </Badge>
                           </td>
                           <td className="text-end small font-monospace">{report.paymentMethod}</td>
                           <td className="text-center">
                             <Button variant="primary" size="sm" className="rounded-pill px-3" onClick={() => navigate(`/report/${report._id}`)}>
                               Reconcile
                             </Button>
                           </td>
                         </tr>
                       ))}
                       {reports.length === 0 && (
                         <tr><td colSpan="5" className="text-center py-5 text-muted">No outstanding debts found in the system.</td></tr>
                       )}
                     </tbody>
                   </Table>
                 </div>
               </Card>
               {/* Pagination would go here if needed, keeping it simple as per original */}
             </>
           )}
        </Col>
      </Row>
    </Container>
  );
}

// Internal table for cleaner code
function Table({ children, ...props }) {
  return <table className={`table ${props.className}`}>{children}</table>;
}

export default SearchDept;
