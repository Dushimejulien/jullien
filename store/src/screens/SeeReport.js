import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { Card, Table, Container, Badge, Spinner, Alert, Button } from "react-bootstrap";
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

function SeeReport() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await axios.get("/api/expense", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setData(result.data);
      } catch (err) {
        setError("Failed to fetch expenses");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userInfo]);

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString() + ' RWF';
  };

  return (
    <Container className="py-4">
      <Helmet>
        <title>Expense History - Rightlamps</title>
      </Helmet>
      
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-gradient">Expense Ledger</h1>
          <p className="text-muted small ls-wide uppercase fw-bold">Detailed Operational Outflow ({data.length} Records)</p>
        </div>
        <Button variant="primary" className="rounded-pill px-4" onClick={() => navigate('/admin/create')}>
          <i className="fas fa-plus me-2"></i> New Entry
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : error ? (
        <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden bg-card">
          <div className="table-responsive">
            <Table hover className="mb-0 admin-table align-middle">
              <thead className="bg-light">
                <tr className="small text-uppercase ls-wide text-muted">
                  <th className="ps-4">Timestamp</th>
                  <th>Description / Reason</th>
                  <th className="text-end pe-4">Amout Settle</th>
                </tr>
              </thead>
              <tbody>
                {data.map((expense) => (
                  <tr key={expense._id}>
                    <td className="ps-4">
                      <div className="fw-bold fs-6">
                        {new Date(expense.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="small text-muted">Verified Transaction</div>
                    </td>
                    <td>
                      <div className="fs-6">{expense.reason}</div>
                      <div className="small text-muted">Category: Operational</div>
                    </td>
                    <td className="text-end pe-4">
                      <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger fs-6 px-3 py-2">
                        {formatCurrency(expense.amount)}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-5 text-muted italic">
                      No recognized expense records are currently indexed in the ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>
      )}
    </Container>
  );
}

export default SeeReport;
