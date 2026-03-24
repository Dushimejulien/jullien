import axios from "axios";
import React, { useContext, useEffect, useReducer } from "react";
import { Table, Button, Container, Badge, Card } from "react-bootstrap";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import { Store } from "../Store";
import { getError } from "../utils";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return { ...state, orders: action.payload, loading: false };
    case "FETCH_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "DELETE_REQUEST":
      return { ...state, loadingDelete: true, successDelete: false };
    case "DELETE_SUCCESS":
      return { ...state, loadingDelete: false, successDelete: true };
    case "DELETE_FAIL":
      return { ...state, loadingDelete: false };
    case "DELETE_RESET":
      return { ...state, loadingDelete: false, successDelete: false };
    default:
      return state;
  }
};

export default function OrderListScreen() {
  const navigate = useNavigate();
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [{ loading, error, orders, loadingDelete, successDelete }, dispatch] = useReducer(reducer, {
    loading: true,
    error: "",
  });

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
    if (successDelete) {
      dispatch({ type: "DELETE_RESET" });
    }
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

  return (
    <Container className="py-4">
      <Helmet>
        <title>Order Management - Rightlamps</title>
      </Helmet>
      
      <div className="mb-4">
        <h1 className="text-gradient mb-1">Order Management</h1>
        <p className="text-muted">Track and process customer orders</p>
      </div>

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
              {orders.map((order) => (
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
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        Details
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        className="rounded-pill px-3"
                        onClick={() => deleteHandler(order)}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </Container>
  );
}
