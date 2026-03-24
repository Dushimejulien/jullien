import React, { useContext, useEffect, useReducer, useState } from "react";
import Chart from "react-google-charts";
import axios from "axios";
import { Store } from "../Store";
import { getError } from "../utils";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Row, Col, Card, Container, Button } from "react-bootstrap";
import ExpenseModal from "../components/ExpenseModal";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, summary: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
};

export default function DashboardScreen() {
  const [{ loading, summary, error }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });
  const { state } = useContext(Store);
  const { userInfo, cart: { mode } } = state;
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const fetchData = async () => {
    try {
      dispatch({ type: "FETCH_REQUEST" });
      const { data } = await axios.get("/api/orders/summary", {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      dispatch({ type: "FETCH_SUCCESS", payload: data });
    } catch (err) {
      dispatch({ type: "FETCH_FAIL", payload: getError(err) });
    }
  };

  useEffect(() => {
    fetchData();
  }, [userInfo]);

  const chartOptions = {
    backgroundColor: 'transparent',
    colors: mode === 'dark' ? ['#0ea5e9'] : ['#6366f1'],
    hAxis: { 
      textStyle: { color: mode === 'dark' ? '#94a3b8' : '#64748b' },
      gridlines: { color: 'transparent' }
    },
    vAxis: { 
      textStyle: { color: mode === 'dark' ? '#94a3b8' : '#64748b' },
      gridlines: { color: mode === 'dark' ? '#334155' : '#e2e8f0' }
    },
    legend: { textStyle: { color: mode === 'dark' ? '#f8fafc' : '#1e293b' } },
    chartArea: { width: '85%', height: '70%' },
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="text-gradient mb-1">Executive Dashboard</h1>
          <p className="text-muted small ls-wide uppercase fw-bold">System Overview & Quick Controls</p>
        </div>
        <div className="d-flex gap-2">
           <Button variant="primary" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => setShowExpenseModal(true)}>
             <i className="fas fa-plus me-2"></i> Record Expense
           </Button>
           <Button variant="outline-primary" className="rounded-pill px-4" onClick={fetchData}>
             <i className="fas fa-sync-alt"></i>
           </Button>
        </div>
      </div>

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <Row className="mb-4">
            <MetricCard title="Active Users" value={summary.users?.[0]?.numUsers || 0} icon="fas fa-users" color="primary" />
            <MetricCard title="Total Orders" value={summary.orders?.[0]?.numOrders || 0} icon="fas fa-shopping-basket" color="info" />
            <MetricCard title="Gross Revenue" value={(summary.orders?.[0]?.totalSales || 0).toLocaleString()} icon="fas fa-wallet" color="success" suffix="RWF" />
          </Row>

          <Row>
            <Col lg={8} className="mb-4">
              <Card className="border-0 shadow-sm bg-card p-3 h-100">
                <Card.Body>
                  <h5 className="mb-4 fw-bold">Revenue Velocity</h5>
                  {summary.dailyOrders.length === 0 ? (
                    <div className="text-center py-5 text-muted small">No recent transaction data available.</div>
                  ) : (
                    <Chart
                      width="100%"
                      height="350px"
                      chartType="AreaChart"
                      data={[
                        ["Date", "Sales"],
                        ...summary.dailyOrders.map((x) => [x._id, x.sales]),
                      ]}
                      options={chartOptions}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
            <Col lg={4} className="mb-4">
              <Card className="border-0 shadow-sm bg-card p-3 h-100">
                <Card.Body>
                  <h5 className="mb-4 fw-bold">Category Distribution</h5>
                  {summary.productCategories.length === 0 ? (
                    <div className="text-center py-5 text-muted small">Inventory is currently empty.</div>
                  ) : (
                    <Chart
                      width="100%"
                      height="350px"
                      chartType="PieChart"
                      data={[
                        ["Category", "Stock"],
                        ...summary.productCategories.map((x) => [x._id, x.count]),
                      ]}
                      options={{ ...chartOptions, pieHole: 0.5 }}
                    />
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <ExpenseModal 
            show={showExpenseModal} 
            onHide={() => setShowExpenseModal(false)}
            onSuccess={fetchData}
          />
        </>
      )}
    </Container>
  );
}

function MetricCard({ title, value, icon, color, suffix = "" }) {
  return (
    <Col md={4} className="mb-3">
      <Card className="border-0 shadow-sm bg-card h-100 overflow-hidden">
        <Card.Body className="p-4 position-relative">
          <div className="d-flex align-items-center mb-2">
            <div className={`p-2 rounded bg-${color} bg-opacity-10 text-${color} me-3`}>
              <i className={`${icon} fs-4`}></i>
            </div>
            <div className="text-muted small text-uppercase fw-bold ls-wide">{title}</div>
          </div>
          <div className="display-6 fw-bold mb-0">
            {value} <span className="fs-6 fw-normal opacity-50">{suffix}</span>
          </div>
          <div className="position-absolute bottom-0 start-0 w-100 bg-primary opacity-10" style={{ height: '4px' }}></div>
        </Card.Body>
      </Card>
    </Col>
  );
}
