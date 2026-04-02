import axios from "axios";
import React, { useContext, useEffect, useState, useMemo } from "react";
import { Card, Table, Container, Badge, Spinner, Alert, Button, Row, Col } from "react-bootstrap";
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

// Period toggle helper — client-side filter since /api/expense returns all records
const PERIODS = [
  { key: "all",       label: "📋 All Time" },
  { key: "daily",     label: "📅 Today" },
  { key: "weekly",    label: "📆 This Week" },
  { key: "monthly",   label: "🗓 This Month" },
  { key: "quarterly", label: "📊 This Quarter" },
  { key: "yearly",    label: "🗃 This Year" },
];

const getPeriodStart = (period) => {
  const now = new Date();
  switch (period) {
    case "daily":     { const s = new Date(now); s.setHours(0,0,0,0); return s; }
    case "weekly":    { const s = new Date(now); s.setDate(now.getDate()-now.getDay()); s.setHours(0,0,0,0); return s; }
    case "monthly":   return new Date(now.getFullYear(), now.getMonth(), 1);
    case "quarterly": return new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1);
    case "yearly":    return new Date(now.getFullYear(), 0, 1);
    default:          return null;
  }
};

function SeeReport() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePeriod, setActivePeriod] = useState("all");
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [deleting, setDeleting] = useState(false);

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

  const filtered = useMemo(() => {
    const start = getPeriodStart(activePeriod);
    if (!start) return data;
    return data.filter((e) => new Date(e.createdAt) >= start);
  }, [data, activePeriod]);

  const totalFiltered = filtered.reduce((sum, e) => sum + (e.amount || 0), 0);
  const fmt = (v) => `${(v || 0).toLocaleString()} RWF`;
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedExpenses(filtered.map(x => x._id));
    } else {
      setSelectedExpenses([]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedExpenses.includes(id)) {
      setSelectedExpenses(selectedExpenses.filter(x => x !== id));
    } else {
      setSelectedExpenses([...selectedExpenses, id]);
    }
  };

  const deleteSelectedHandler = async () => {
    if (window.confirm("Are you sure you want to delete selected expenses?")) {
      try {
        setDeleting(true);
        await axios.delete('/api/expense', {
          data: { expenseIds: selectedExpenses },
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setData(data.filter(x => !selectedExpenses.includes(x._id)));
        setSelectedExpenses([]);
        alert("Expenses deleted successfully");
      } catch (err) {
        alert("Failed to delete expenses");
      } finally {
        setDeleting(false);
      }
    }
  };

  return (
    <Container className="py-4">
      <Helmet>
        <title>Expense History - Rightlamps</title>
      </Helmet>

      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h1 className="text-gradient">Expense Ledger</h1>
          <p className="text-muted small fw-bold mb-0 ls-wide">
            {filtered.length} of {data.length} records
          </p>
        </div>
        <div className="d-flex gap-2">
          {userInfo.isAdmin && selectedExpenses.length > 0 && (
            <Button variant="danger" className="rounded-pill px-4" onClick={deleteSelectedHandler} disabled={deleting}>
              <i className="fas fa-trash-alt me-2"></i> {deleting ? 'Deleting...' : `Delete ${selectedExpenses.length}`}
            </Button>
          )}
          <Button variant="primary" className="rounded-pill px-4" onClick={() => navigate("/admin/create")}>
            <i className="fas fa-plus me-2"></i> New Entry
          </Button>
        </div>
      </div>

      {/* Period toggle */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            variant={activePeriod === p.key ? "primary" : "outline-secondary"}
            className="rounded-pill fw-bold px-4"
            onClick={() => setActivePeriod(p.key)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Period total card */}
      <Row className="mb-4">
        <Col md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#e74c3c,#922b21)" }}>
            <div className="small opacity-75 mb-1">Period Expenditure</div>
            <div className="fs-4 fw-bold">{fmt(totalFiltered)}</div>
          </div>
        </Col>
        <Col md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#f39200,#b36800)" }}>
            <div className="small opacity-75 mb-1">Transactions</div>
            <div className="fs-4 fw-bold">{filtered.length}</div>
          </div>
        </Col>
        <Col md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#1a73e8,#0d47a1)" }}>
            <div className="small opacity-75 mb-1">Avg. per Transaction</div>
            <div className="fs-4 fw-bold">{fmt(filtered.length ? Math.round(totalFiltered / filtered.length) : 0)}</div>
          </div>
        </Col>
      </Row>

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
                  {userInfo.isAdmin && (
                    <th className="ps-4" style={{ width: '40px' }}>
                      <input 
                        type="checkbox" 
                        onChange={toggleSelectAll} 
                        checked={filtered.length > 0 && selectedExpenses.length === filtered.length}
                      />
                    </th>
                  )}
                  <th className={userInfo.isAdmin ? "" : "ps-4"}>Timestamp</th>
                  <th>Description / Reason</th>
                  <th className="text-end pe-4">Amount Settled</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={userInfo.isAdmin ? "4" : "3"} className="text-center py-5 text-muted">No expense records for this period.</td></tr>
                ) : (
                  filtered.map((expense) => (
                    <tr key={expense._id} className={selectedExpenses.includes(expense._id) ? "bg-light" : ""}>
                      {userInfo.isAdmin && (
                        <td className="ps-4">
                          <input 
                            type="checkbox" 
                            checked={selectedExpenses.includes(expense._id)}
                            onChange={() => toggleSelect(expense._id)}
                          />
                        </td>
                      )}
                      <td className={userInfo.isAdmin ? "" : "ps-4"}>
                        <div className="fw-bold fs-6">{fmtDate(expense.createdAt)}</div>
                        <div className="small text-muted">Verified Transaction</div>
                      </td>
                      <td>
                        <div className="fs-6">{expense.reason}</div>
                        <div className="small text-muted">Category: Operational</div>
                      </td>
                      <td className="text-end pe-4">
                        <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger fs-6 px-3 py-2">
                          {fmt(expense.amount)}
                        </Badge>
                      </td>
                    </tr>
                  ))
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
