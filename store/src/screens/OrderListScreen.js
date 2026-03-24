import axios from "axios";
import React, { useContext, useEffect, useReducer, useState, useMemo } from "react";
import { Table, Button, Container, Badge, Card, Row, Col } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { getError } from "../utils";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST": return { ...state, loading: true };
    case "FETCH_SUCCESS": return { ...state, orders: action.payload, loading: false };
    case "FETCH_FAIL":    return { ...state, loading: false, error: action.payload };
    case "DELETE_REQUEST": return { ...state, loadingDelete: true, successDelete: false };
    case "DELETE_SUCCESS": return { ...state, loadingDelete: false, successDelete: true };
    case "DELETE_FAIL":    return { ...state, loadingDelete: false };
    case "DELETE_RESET":   return { ...state, loadingDelete: false, successDelete: false };
    default: return state;
  }
};

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

export default function OrderListScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loading, error, orders = [], loadingDelete, successDelete }, dispatch] = useReducer(reducer, {
    loading: true, error: "",
  });
  const [activePeriod, setActivePeriod] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: "FETCH_REQUEST" });
        const { data } = await axios.get(`/api/orders`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({ type: "FETCH_FAIL", payload: getError(err) });
      }
    };
    if (successDelete) dispatch({ type: "DELETE_RESET" });
    fetchData();
  }, [userInfo, successDelete]);

  const deleteHandler = async (order) => {
    if (window.confirm("Are you sure to delete this order?")) {
      try {
        dispatch({ type: "DELETE_REQUEST" });
        await axios.delete(`/api/orders/${order._id}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        toast.success("Order deleted successfully");
        dispatch({ type: "DELETE_SUCCESS" });
      } catch (err) {
        toast.error(getError(err));
        dispatch({ type: "DELETE_FAIL" });
      }
    }
  };

  const filtered = useMemo(() => {
    const start = getPeriodStart(activePeriod);
    if (!start || !Array.isArray(orders)) return orders || [];
    return orders.filter((o) => new Date(o.createdAt) >= start);
  }, [orders, activePeriod]);

  const periodRevenue = filtered.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const periodPaid    = filtered.filter(o => o.isPaid).length;
  const fmt = (v) => `${(v || 0).toLocaleString()} RWF`;

  return (
    <Container className="py-4">
      <Helmet>
        <title>Order Management - Rightlamps</title>
      </Helmet>

      <div className="mb-3">
        <h1 className="text-gradient mb-1">Order Management</h1>
        <p className="text-muted">{filtered.length} orders in selected period</p>
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
            style={{ background: "linear-gradient(135deg,#1a73e8,#0d47a1)" }}>
            <div className="small opacity-75 mb-1">Period Revenue</div>
            <div className="fs-4 fw-bold">{fmt(periodRevenue)}</div>
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#27ae60,#145a32)" }}>
            <div className="small opacity-75 mb-1">Paid Orders</div>
            <div className="fs-4 fw-bold">{periodPaid}</div>
          </div>
        </Col>
        <Col xs={6} md={4}>
          <div className="rounded-3 p-3 shadow-sm text-white text-center"
            style={{ background: "linear-gradient(135deg,#f39200,#b36800)" }}>
            <div className="small opacity-75 mb-1">Pending Orders</div>
            <div className="fs-4 fw-bold">{filtered.length - periodPaid}</div>
          </div>
        </Col>
      </Row>

      {loadingDelete && <LoadingBox />}
      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden bg-card">
          <Table responsive hover className="mb-0 admin-table align-middle">
            <thead className="bg-light">
              <tr>
                <th className="ps-4">ID</th>
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>TOTAL</th>
                <th>PAID</th>
                <th>DELIVERED</th>
                <th className="text-end pe-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-5 text-muted">No orders found for this period.</td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order._id}>
                    <td className="ps-4 text-muted small">{order._id.substring(0, 10)}...</td>
                    <td className="fw-bold">{order.user ? order.user.name : "Deleted User"}</td>
                    <td>{order.createdAt.substring(0, 10)}</td>
                    <td className="fw-bold text-primary">{order.totalPrice.toLocaleString()} RWF</td>
                    <td>
                      {order.isPaid ? (
                        <Badge bg="success" className="px-3">{order.paidAt.substring(0, 10)}</Badge>
                      ) : (
                        <Badge bg="danger" className="px-3">Pending</Badge>
                      )}
                    </td>
                    <td>
                      {order.isDelivered ? (
                        <Badge bg="success" className="px-3">{order.deliveredAt.substring(0, 10)}</Badge>
                      ) : (
                        <Badge bg="warning" className="text-dark px-3">On Process</Badge>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="outline-primary" size="sm" className="rounded-pill px-3"
                          onClick={() => navigate(`/order/${order._id}`)}>Details</Button>
                        <Button variant="outline-danger" size="sm" className="rounded-pill px-3"
                          onClick={() => deleteHandler(order)}>
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
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
}
