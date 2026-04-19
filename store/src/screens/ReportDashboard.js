import React, { useContext, useEffect, useReducer, useState, useCallback } from "react";
import Chart from "react-google-charts";
import axios from "axios";
import { Store } from "../Store";
import { getError } from "../utils";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Row, Col, Card, Container, ListGroup, Button, Form } from "react-bootstrap";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, summary: action.payload.summary, expenses: action.payload.expenses, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

// ── Period helpers ──────────────────────────────────────────────────
const getPeriodDates = (period, customRange = null) => {
  const now = new Date();
  let start;
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  if (period === "custom" && customRange?.start) {
    const endDate = customRange.end
      ? new Date(new Date(customRange.end).setHours(23, 59, 59, 999))
      : new Date(new Date(customRange.start).setHours(23, 59, 59, 999));
    return {
      startDate: new Date(customRange.start).toISOString(),
      endDate: endDate.toISOString(),
    };
  }

  switch (period) {
    case "daily":
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case "weekly":
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "quarterly":
      const q = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), q * 3, 1);
      break;
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      return null;
  }
  return { startDate: start.toISOString(), endDate: end.toISOString() };
};

const PERIODS = [
  { key: "all",       label: "All Time" },
  { key: "daily",     label: "Today" },
  { key: "weekly",    label: "This Week" },
  { key: "monthly",   label: "This Month" },
  { key: "quarterly", label: "This Quarter" },
  { key: "yearly",    label: "This Year" },
  { key: "custom",    label: "🔍 Custom Range" },
];

// ── Main Component ──────────────────────────────────────────────────
export default function ReportDashboard() {
  const [{ loading, summary, expenses, error }, dispatch] = useReducer(reducer, {
    loading: true,
    summary: {},
    expenses: [],
    error: "",
  });
  const { state } = useContext(Store);
  const { userInfo, cart: { mode } } = state;

  const [activePeriod, setActivePeriod] = useState("all");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  // Period-specific aggregates fetched from search endpoint
  const [periodStats, setPeriodStats] = useState({ sales: 0, netProfit: 0, depts: 0, count: 0 });

  // Fetch all-time summary (for charts) once
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const [summaryRes, expenseRes] = await Promise.all([
          axios.get("/api/report/summary", { headers: { Authorization: `Bearer ${userInfo.token}` } }),
          axios.get("/api/expense/month", { headers: { Authorization: `Bearer ${userInfo.token}` } }),
        ]);
        dispatch({ type: "FETCH_SUCCESS", payload: { summary: summaryRes.data, expenses: expenseRes.data } });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchSummary();
  }, [userInfo]);

  // Fetch period-scoped aggregates whenever activePeriod / customRange changes
  const fetchPeriodStats = useCallback(async () => {
    // Skip auto-fetch for custom mode until user explicitly applies
    if (activePeriod === "custom" && !customRange.start) return;
    try {
      const params = new URLSearchParams({ page: 1, limit: 9999 });
      const dates = getPeriodDates(activePeriod, customRange);
      if (dates) params.append("dateFilter", JSON.stringify(dates));

      const [reportRes, expRes] = await Promise.all([
        axios.get(`/api/report/search?${params}`, { headers: { Authorization: `Bearer ${userInfo.token}` } }),
        axios.get('/api/expense', { headers: { Authorization: `Bearer ${userInfo.token}` } })
      ]);

      const data = reportRes.data;
      const allExpenses = expRes.data || [];
      
      const periodExpenses = allExpenses.filter(e => {
        if (!dates) return true;
        const d = new Date(e.createdAt);
        return d >= new Date(dates.startDate) && d <= new Date(dates.endDate);
      });
      const totalPeriodExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

      const totals = (data.data || []).reduce(
        (acc, r) => ({
          sales: acc.sales + (r.sales || 0),
          grossProfit: acc.grossProfit + Number(r.grossProfit || 0),
          depts: acc.depts + (r.depts || 0),
          count: acc.count + 1,
        }),
        { sales: 0, grossProfit: 0, depts: 0, count: 0 }
      );
      
      setPeriodStats({
        sales: totals.sales,
        netProfit: totals.grossProfit - totalPeriodExpenses,
        depts: totals.depts,
        count: totals.count
      });
    } catch {
      // fail silently
    }
  }, [activePeriod, customRange, userInfo]);

  useEffect(() => { fetchPeriodStats(); }, [fetchPeriodStats]);

  const chartOptions = {
    backgroundColor: "transparent",
    colors: mode === "dark" ? ["#0ea5e9", "#6366f1", "#10b981", "#f43f5e"] : ["#6366f1", "#4f46e5", "#10b981", "#ef4444"],
    hAxis: { textStyle: { color: mode === "dark" ? "#94a3b8" : "#64748b" }, gridlines: { color: "transparent" } },
    vAxis: { textStyle: { color: mode === "dark" ? "#94a3b8" : "#64748b" }, gridlines: { color: mode === "dark" ? "#334155" : "#e2e8f0" } },
    legend: { textStyle: { color: mode === "dark" ? "#f8fafc" : "#1e293b" } },
    chartArea: { width: "85%", height: "70%" },
  };

  if (loading) return <LoadingBox />;
  if (error) return <MessageBox variant="danger">{error}</MessageBox>;

  const stats = summary.orders?.[0] || {};
  const totalOperationalExpenses = expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const actualNetProfit = (stats.grossProfit || 0) - totalOperationalExpenses;

  const trendData = (summary.monthlyOrders || []).map((m) => {
    const matchingExpense = expenses.find(
      (e) => `${e._id.year}-${String(e._id.month).padStart(2, "0")}` === m._id
    );
    const expenseAmount = matchingExpense ? matchingExpense.totalAmount : 0;
    return { month: m._id, sales: m.sales, actualProfit: m.grossProfit - expenseAmount };
  });

  return (
    <Container className="py-4">
      <div className="mb-3">
        <h1 className="text-gradient">Financial Intelligence</h1>
        <p className="text-muted">Business profitability overview after all expenses</p>
      </div>

      {/* ── Period Toggles ── */}
      <div className="d-flex flex-wrap gap-2 mb-3">
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

      {/* ── Custom Date Range Picker ── */}
      {activePeriod === "custom" && (
        <Card className="border-0 shadow-sm bg-card p-3 mb-4">
          <Row className="align-items-end g-3">
            <Col xs={12} md={4}>
              <Form.Label className="small fw-bold text-muted">Start Date</Form.Label>
              <Form.Control
                type="date"
                value={customRange.start}
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                className="rounded-3"
              />
            </Col>
            <Col xs={12} md={4}>
              <Form.Label className="small fw-bold text-muted">End Date</Form.Label>
              <Form.Control
                type="date"
                value={customRange.end}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                className="rounded-3"
              />
            </Col>
            <Col xs={12} md={4}>
              <Button
                variant="primary"
                className="w-100 rounded-pill fw-bold"
                onClick={() => fetchPeriodStats()}
                disabled={!customRange.start}
              >
                <i className="fas fa-filter me-2"></i> Apply Range
              </Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* ── Period Metric Cards ── */}
      <Row className="mb-4 g-3">
        <Col xs={6} md={3}>
          <MetricCard title="Period Sales" value={periodStats.sales} icon="fas fa-chart-line" color="primary" />
        </Col>
        <Col xs={6} md={3}>
          <MetricCard title="Period Net Profit" value={periodStats.netProfit} icon="fas fa-wallet" color="success" isHighLight />
        </Col>
        <Col xs={6} md={3}>
          <MetricCard title="Period Debts" value={periodStats.depts} icon="fas fa-exclamation-circle" color="danger" />
        </Col>
        <Col xs={6} md={3}>
          <MetricCard title="Period Transactions" value={periodStats.count} icon="fas fa-receipt" color="warning" isCounts />
        </Col>
      </Row>

      {/* ── All-Time Summary ── */}
      <div className="text-muted small fw-bold text-uppercase mb-2 ps-1">📊 All-Time Aggregates</div>
      <Row className="mb-4 g-3">
        <Col xs={6} md={3}><MetricCard title="Total Sales" value={stats.totalSales} icon="fas fa-chart-line" color="primary" /></Col>
        <Col xs={6} md={3}><MetricCard title="Total Expenses" value={totalOperationalExpenses} icon="fas fa-receipt" color="warning" /></Col>
        <Col xs={6} md={3}><MetricCard title="Actual Net Profit" value={actualNetProfit} icon="fas fa-wallet" color="success" isHighLight /></Col>
        <Col xs={6} md={3}><MetricCard title="Outstanding Debts" value={stats.depts} icon="fas fa-exclamation-circle" color="danger" /></Col>
      </Row>

      {/* ── Charts ── */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="border-0 shadow-sm bg-card p-3 h-100">
            <Card.Body>
              <h4 className="mb-4 fw-bold">Monthly Profitability</h4>
              <Chart
                width="100%"
                height="350px"
                chartType="ComboChart"
                data={[["Month", "Sales", "Actual Profit"], ...trendData.map((x) => [x.month, x.sales, x.actualProfit])]}
                options={{ ...chartOptions, seriesType: "bars", series: { 1: { type: "line", curveType: "function" } }, vAxis: { ...chartOptions.vAxis, title: "Amount (RWF)" } }}
              />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm bg-card p-3 h-100">
            <Card.Body>
              <h4 className="mb-4 fw-bold">Inventory & Assets</h4>
              <div className="text-center py-3">
                <div className="display-5 fw-bold text-gradient mb-3">
                  {formatCurrency(stats.totalSales - stats.grossProfit)}
                </div>
                <div className="text-muted text-uppercase small ls-wide mb-4">Current Asset Valuation</div>
                <hr className="my-4 opacity-10" />
                <Chart
                  width="100%"
                  height="200px"
                  chartType="PieChart"
                  data={[["Category", "Volume"], ...(summary.productCategories || []).map((x) => [x._id, x.count])]}
                  options={{ ...chartOptions, pieHole: 0.7, legend: "none" }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* ── Revenue Breakdown ── */}
      <Row>
        <Col md={12} className="mb-4">
          <Card className="border-0 shadow-sm bg-card p-4">
            <Row>
              <Col md={4} className="border-end">
                <h5 className="text-muted small uppercase fw-bold mb-3">Revenue Breakdown</h5>
                <ListGroup variant="flush">
                  <StatItem label="Gross Sales" value={stats.totalSales} isCurrency />
                  <StatItem label="Cost of Goods" value={stats.totalCosts} isCurrency />
                  <StatItem label="Tax Estimation (18%)" value={stats.taxPrice} isCurrency color="text-warning" />
                </ListGroup>
              </Col>
              <Col md={4} className="border-end px-md-4">
                <h5 className="text-muted small uppercase fw-bold mb-3">Operational Burden</h5>
                <ListGroup variant="flush">
                  <StatItem label="Monthly Expenses" value={totalOperationalExpenses} isCurrency color="text-danger" />
                  <StatItem label="Avg Expense Ratio" value={((totalOperationalExpenses / (stats.totalSales || 1)) * 100).toFixed(1)} suffix="%" />
                  <StatItem label="Transaction Volume" value={stats.numOrders} suffix=" Sales" />
                </ListGroup>
              </Col>
              <Col md={4} className="ps-md-4">
                <h5 className="text-muted small uppercase fw-bold mb-3">Performance Audit</h5>
                <div className={`p-3 rounded-xl ${actualNetProfit > 0 ? "bg-success" : "bg-danger"} bg-opacity-10 mt-2`}>
                  <div className="small text-muted mb-1">Final Bottom Line</div>
                  <div className={`fs-3 fw-bold ${actualNetProfit > 0 ? "text-success" : "text-danger"}`}>
                    {formatCurrency(actualNetProfit)}
                  </div>
                  <div className="small opacity-75 mt-1 border-top pt-2">
                    {actualNetProfit > 0 ? "Profit exceeds operational costs" : "Operating at a deficit"}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function MetricCard({ title, value, icon, color, isHighLight, isCounts }) {
  return (
    <Card className={`border-0 shadow-sm ${isHighLight ? "bg-dark text-white" : "bg-card"} h-100 overflow-hidden position-relative`}>
      {isHighLight && <div className="position-absolute top-0 end-0 p-2 opacity-50"><i className="fas fa-crown text-warning"></i></div>}
      <Card.Body className="p-4">
        <div className={`d-inline-flex p-3 rounded-circle bg-${color} bg-opacity-10 text-${color} mb-3`}>
          <i className={`${icon} fs-4`}></i>
        </div>
        <Card.Subtitle className={`${isHighLight ? "text-white-50" : "text-muted"} small text-uppercase fw-bold ls-wide mb-1`}>{title}</Card.Subtitle>
        <Card.Title className="fs-3 fw-bold mb-0">
          {isCounts ? (value || 0).toLocaleString() : `${(value || 0).toLocaleString()} `}
          {!isCounts && <span className="small fw-normal opacity-50">RWF</span>}
        </Card.Title>
      </Card.Body>
    </Card>
  );
}

function StatItem({ label, value, suffix, isCurrency, color }) {
  return (
    <ListGroup.Item className="bg-transparent border-0 px-0 d-flex justify-content-between align-items-center py-2">
      <span className="text-muted small">{label}</span>
      <span className={`fw-bold ${color || ""}`}>
        {isCurrency ? formatCurrency(value) : `${value}${suffix || ""}`}
      </span>
    </ListGroup.Item>
  );
}

function formatCurrency(val) {
  return `${(val || 0).toLocaleString()} RWF`;
}
