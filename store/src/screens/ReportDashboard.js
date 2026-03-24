import React, { useContext, useEffect, useReducer, useState } from "react";
import Chart from "react-google-charts";
import axios from "axios";
import { Store } from "../Store";
import { getError } from "../utils";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Row, Col, Card, Container, Badge, ListGroup, Spinner } from "react-bootstrap";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { 
        ...state, 
        summary: action.payload.summary, 
        expenses: action.payload.expenses,
        loading: false 
      };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default function ReportDashboard() {
  const [{ loading, summary, expenses, error }, dispatch] = useReducer(reducer, {
    loading: true,
    summary: {},
    expenses: [],
    error: "",
  });
  const { state } = useContext(Store);
  const { userInfo, cart: { mode } } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const [summaryRes, expenseRes] = await Promise.all([
          axios.get("/api/report/summary", {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          }),
          axios.get("/api/expense/month", {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          })
        ]);
        dispatch({ 
          type: "FETCH_SUCCESS", 
          payload: { 
            summary: summaryRes.data, 
            expenses: expenseRes.data 
          } 
        });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    fetchData();
  }, [userInfo]);

  const chartOptions = {
    backgroundColor: 'transparent',
    colors: mode === 'dark' ? ['#0ea5e9', '#6366f1', '#10b981', '#f43f5e'] : ['#6366f1', '#4f46e5', '#10b981', '#ef4444'],
    hAxis: { textStyle: { color: mode === 'dark' ? '#94a3b8' : '#64748b' }, gridlines: { color: 'transparent' } },
    vAxis: { textStyle: { color: mode === 'dark' ? '#94a3b8' : '#64748b' }, gridlines: { color: mode === 'dark' ? '#334155' : '#e2e8f0' } },
    legend: { textStyle: { color: mode === 'dark' ? '#f8fafc' : '#1e293b' } },
    chartArea: { width: '85%', height: '70%' },
  };

  if (loading) return <LoadingBox />;
  if (error) return <MessageBox variant="danger">{error}</MessageBox>;

  const stats = summary.orders[0] || {};
  
  // Calculate total operational expenses
  const totalOperationalExpenses = expenses.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const actualNetProfit = (stats.netProfit || 0) - totalOperationalExpenses;

  // Process trend data to include operational expenses
  const trendData = summary.monthlyOrders.map((m) => {
    const matchingExpense = expenses.find(e => 
      `${e._id.year}-${String(e._id.month).padStart(2, '0')}` === m._id
    );
    const expenseAmount = matchingExpense ? matchingExpense.totalAmount : 0;
    return {
      month: m._id,
      sales: m.sales,
      grossProfit: m.grossProfit,
      actualProfit: m.grossProfit * 0.82 - expenseAmount // Approximating net profit - actual expenses
    };
  });

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-gradient">Financial Intelligence</h1>
        <p className="text-muted">Comprehensive insight into actual business profitability after all expenses</p>
      </div>

      <Row className="mb-4">
        <MetricCard title="Total Sales" value={stats.totalSales} icon="fas fa-chart-line" color="primary" />
        <MetricCard title="Total Expenses" value={totalOperationalExpenses} icon="fas fa-receipt" color="warning" />
        <MetricCard title="Actual Net Profit" value={actualNetProfit} icon="fas fa-wallet" color="success" isHighLight />
        <MetricCard title="Outstanding Debts" value={stats.depts} icon="fas fa-exclamation-circle" color="danger" />
      </Row>

      <Row>
        <Col lg={8} className="mb-4">
           <Card className="border-0 shadow-sm bg-card p-3 h-100">
             <Card.Body>
               <h4 className="mb-4 fw-bold">Profitability Performance</h4>
               <Chart
                 width="100%"
                 height="350px"
                 chartType="ComboChart"
                 data={[
                   ["Month", "Sales", "Actual Profit"],
                   ...trendData.map((x) => [x.month, x.sales, x.actualProfit]),
                 ]}
                 options={{
                   ...chartOptions,
                   seriesType: 'bars',
                   series: { 1: { type: 'line', curveType: 'function' } },
                   vAxis: { ...chartOptions.vAxis, title: 'Amount (RWF)' }
                 }}
               />
             </Card.Body>
           </Card>
        </Col>
        <Col lg={4} className="mb-4">
          <Card className="border-0 shadow-sm bg-card p-3 h-100">
             <Card.Body>
               <h4 className="mb-4 fw-bold">Inventory & Assets</h4>
               <div className="text-center py-5">
                 <div className="display-5 fw-bold text-gradient mb-3">
                   {formatCurrency(stats.totalSales - stats.grossProfit)}
                 </div>
                 <div className="text-muted text-uppercase small ls-wide mb-4">Current Asset Valuation</div>
                 <hr className="my-4 opacity-10" />
                 <Chart
                   width="100%"
                   height="200px"
                   chartType="PieChart"
                   data={[
                     ["Category", "Volume"],
                     ...summary.productCategories.map((x) => [x._id, x.count]),
                   ]}
                   options={{ ...chartOptions, pieHole: 0.7, legend: 'none' }}
                 />
               </div>
             </Card.Body>
           </Card>
        </Col>
      </Row>

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
                   <div className={`p-3 rounded-xl ${actualNetProfit > 0 ? 'bg-success' : 'bg-danger'} bg-opacity-10 mt-2`}>
                      <div className="small text-muted mb-1">Final Bottom Line</div>
                      <div className={`fs-3 fw-bold ${actualNetProfit > 0 ? 'text-success' : 'text-danger'}`}>
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

function MetricCard({ title, value, icon, color, isHighLight }) {
  return (
    <Col md={3} className="mb-3">
      <Card className={`border-0 shadow-sm ${isHighLight ? 'bg-dark text-white' : 'bg-card'} h-100 overflow-hidden position-relative`}>
        {isHighLight && <div className="position-absolute top-0 end-0 p-2 opacity-50"><i className="fas fa-crown text-warning"></i></div>}
        <Card.Body className="p-4">
          <div className={`d-inline-flex p-3 rounded-circle bg-${color} bg-opacity-10 text-${color} mb-3`}>
            <i className={`${icon} fs-4`}></i>
          </div>
          <Card.Subtitle className={`${isHighLight ? 'text-white-50' : 'text-muted'} small text-uppercase fw-bold ls-wide mb-1`}>{title}</Card.Subtitle>
          <Card.Title className="fs-3 fw-bold mb-0">{(value || 0).toLocaleString()} <span className="small fw-normal opacity-50">RWF</span></Card.Title>
        </Card.Body>
      </Card>
    </Col>
  );
}

function StatItem({ label, value, suffix, isCurrency, color }) {
  return (
    <ListGroup.Item className="bg-transparent border-0 px-0 d-flex justify-content-between align-items-center py-2">
      <span className="text-muted small">{label}</span>
      <span className={`fw-bold ${color || ''}`}>
        {isCurrency ? formatCurrency(value) : `${value}${suffix || ''}`}
      </span>
    </ListGroup.Item>
  );
}

function formatCurrency(val) {
  return `${(val || 0).toLocaleString()} RWF`;
}
