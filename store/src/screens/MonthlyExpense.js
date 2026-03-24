import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Card, Container, Table, Spinner, Alert, Badge, Button, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { Store } from '../Store';

const PERIODS = [
  { key: "all",       label: "📋 All Time" },
  { key: "daily",     label: "📅 Today" },
  { key: "weekly",    label: "📆 This Week" },
  { key: "monthly",   label: "🗓 This Month" },
  { key: "quarterly", label: "📊 This Quarter" },
  { key: "yearly",    label: "🗃 This Year" },
];

const MonthlyExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [activePeriod, setActivePeriod] = useState("all");

  useEffect(() => {
    const fetchExpensesByMonth = async () => {
      try {
        const { data } = await axios.get('/api/expense/month', {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        setExpenses(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load monthly expenses');
        setLoading(false);
      }
    };
    fetchExpensesByMonth();
  }, [userInfo]);

  // Filter rows by selected period
  const filtered = useMemo(() => {
    if (activePeriod === "all") return expenses;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentQ = Math.floor(now.getMonth() / 3);

    return expenses.filter((e) => {
      const { year, month } = e._id;
      switch (activePeriod) {
        case "daily":
        case "weekly":
        case "monthly": return year === currentYear && month === currentMonth;
        case "quarterly": {
          const q = Math.floor((month - 1) / 3);
          return year === currentYear && q === currentQ;
        }
        case "yearly":  return year === currentYear;
        default:        return true;
      }
    });
  }, [expenses, activePeriod]);

  const periodTotal = filtered.reduce((sum, e) => sum + (e.totalAmount || 0), 0);
  const fmt = (v) => `${(v || 0).toLocaleString()} RWF`;

  return (
    <Container className="py-4">
      <div className="mb-3">
        <h1 className="text-gradient">Expense Archives</h1>
        <p className="text-muted text-uppercase small ls-wide">Monthly Financial Outflow Summary</p>
      </div>

      {/* Period toggles */}
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

      {/* Summary cards */}
      <Row className="mb-4 g-3">
        <Col xs={6} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#e74c3c,#922b21)" }}>
            <div className="small opacity-75 mb-1">Period Total</div>
            <div className="fs-4 fw-bold">{fmt(periodTotal)}</div>
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#1a73e8,#0d47a1)" }}>
            <div className="small opacity-75 mb-1">Months Shown</div>
            <div className="fs-4 fw-bold">{filtered.length}</div>
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#f39200,#b36800)" }}>
            <div className="small opacity-75 mb-1">Avg per Month</div>
            <div className="fs-4 fw-bold">{fmt(filtered.length ? Math.round(periodTotal / filtered.length) : 0)}</div>
          </div>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : error ? (
        <Alert variant="danger" className="border-0 shadow-sm">{error}</Alert>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden bg-card">
          <Table hover responsive className="mb-0 admin-table align-middle">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">MONTH / YEAR</th>
                <th className="text-end pe-4">TOTAL EXPENDITURE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="2" className="text-center py-5 text-muted">No expense data for this period.</td></tr>
              ) : (
                filtered.map((expense) => (
                  <tr key={`${expense._id.year}-${expense._id.month}`}>
                    <td className="ps-4">
                      <div className="fw-bold fs-6">{getMonthName(expense._id.month)} {expense._id.year}</div>
                      <div className="text-muted small">Tax Deductible Activity</div>
                    </td>
                    <td className="text-end pe-4">
                      <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger fs-6 px-3 py-2">
                        {expense.totalAmount.toLocaleString()} RWF
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      )}
    </Container>
  );
};

function getMonthName(monthNumber) {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('default', { month: 'long' });
}

export default MonthlyExpense;
