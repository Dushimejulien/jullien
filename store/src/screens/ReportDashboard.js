import React, { useContext, useEffect, useReducer, useState } from "react";
import Chart from "react-google-charts";
import axios from "axios";
import { Store } from "../Store";
import { getError } from "../utils";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_SUMMARY_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUMMARY_SUCCESS":
      return {
        ...state,
        summary: action.payload,
        loading: false,
      };
    case "FETCH_SUMMARY_FAIL":
      return { ...state, loading: false, error: action.payload };
    case "FETCH_REPORTS_REQUEST":
      return { ...state, loadingReports: true };
    case "FETCH_REPORTS_SUCCESS":
      return {
        ...state,
        reports: action.payload.reports,
        page: action.payload.page,
        pages: action.payload.pages,
        loadingReports: false,
      };
    case "FETCH_REPORTS_FAIL":
      return { ...state, loadingReports: false, errorReports: action.payload };
    case "SET_PAGE":
      return { ...state, page: action.payload };
    default:
      return state;
  }
};

export default function DashboardScreen() {
  const [
    { loading, summary, error, loadingReports, reports, page, pages, errorReports },
    dispatch,
  ] = useReducer(reducer, {
    loading: true,
    error: "",
    loadingReports: true,
    reports: [],
    page: 1,
    pages: 1,
    summary: {},
  });

  const { state } = useContext(Store);
  const { userInfo } = state;
  const [period, setPeriod] = useState("daily");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        dispatch({ type: "FETCH_SUMMARY_REQUEST" });
        const { data } = await axios.get("/api/report/summary", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_SUMMARY_SUCCESS", payload: data });
      } catch (err) {
        dispatch({
          type: "FETCH_SUMMARY_FAIL",
          payload: getError(err),
        });
      }
    };
    fetchSummary();
  }, [userInfo]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        dispatch({ type: "FETCH_REPORTS_REQUEST" });
        const { data } = await axios.get(`/api/report/all?page=${page}`, {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        dispatch({ type: "FETCH_REPORTS_SUCCESS", payload: data });
      } catch (err) {
        dispatch({
          type: "FETCH_REPORTS_FAIL",
          payload: getError(err),
        });
      }
    };
    fetchReports();
  }, [userInfo, page]);

  const getChartData = (type) => {
    if (!summary || !summary[`${period}Orders`]) return [["Date", type]];
    return [
      ["Date", type],
      ...summary[`${period}Orders`].map((x) => [x._id, x[type === "Sales" ? "sales" : "grossProfit"]]),
    ];
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1>Report Dashboard</h1>
        <ButtonGroup>
          {["daily", "weekly", "monthly", "yearly"].map((p) => (
            <Button
              key={p}
              variant={period === p ? "primary" : "outline-primary"}
              onClick={() => setPeriod(p)}
              className="text-capitalize"
            >
              {p}
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <Row>
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>
                    {summary.users && summary.users[0] ? summary.users[0].numUsers : 0}
                  </Card.Title>
                  <Card.Text>Users</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.orders[0] ? summary.orders[0].totalSales.toFixed(2) : 0} Rwf
                  </Card.Title>
                  <Card.Text>Total Sales</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.orders[0] ? summary.orders[0].grossProfit.toFixed(2) : 0} Rwf
                  </Card.Title>
                  <Card.Text>Gross Profit</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="mb-3">
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.orders[0] ? summary.orders[0].depts.toFixed(2) : 0} Rwf
                  </Card.Title>
                  <Card.Text>Debts</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <div className="my-3">
                <h2 className="text-capitalize">{period} Sales</h2>
                {summary[`${period}Orders`] && summary[`${period}Orders`].length === 0 ? (
                  <MessageBox>No Sales for this period</MessageBox>
                ) : (
                  <Chart
                    width="100%"
                    height="300px"
                    chartType="AreaChart"
                    loader={<div>Loading Chart...</div>}
                    data={getChartData("Sales")}
                  ></Chart>
                )}
              </div>
            </Col>
            <Col md={6}>
              <div className="my-3">
                <h2 className="text-capitalize">{period} Gross Profit</h2>
                {summary[`${period}Orders`] && summary[`${period}Orders`].length === 0 ? (
                  <MessageBox>No Profit for this period</MessageBox>
                ) : (
                  <Chart
                    width="100%"
                    height="300px"
                    chartType="AreaChart"
                    loader={<div>Loading Chart...</div>}
                    data={getChartData("Gross Profit")}
                  ></Chart>
                )}
              </div>
            </Col>
          </Row>

          <div className="my-4">
            <h2>Categories</h2>
            {summary.productCategories && summary.productCategories.length === 0 ? (
              <MessageBox>No Category</MessageBox>
            ) : (
              <Chart
                width="100%"
                height="300px"
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={[
                  ["Category", "Products"],
                  ...(summary.productCategories || []).map((x) => [x._id, x.count]),
                ]}
              ></Chart>
            )}
          </div>

          <div className="my-4">
            <h2>Recent Transactions</h2>
            {loadingReports ? (
              <LoadingBox />
            ) : errorReports ? (
              <MessageBox variant="danger">{errorReports}</MessageBox>
            ) : (
              <>
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>DATE</th>
                      <th>COSTOMER/GIVEN TO</th>
                      <th>SALES</th>
                      <th>COSTS</th>
                      <th>GROSS PROFIT</th>
                      <th>DEBTS</th>
                      <th>PAYMENT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report._id}>
                        <td>{new Date(report.createdAt).toLocaleDateString()}</td>
                        <td>{report.givenTo || "N/A"}</td>
                        <td>{report.sales.toFixed(2)}</td>
                        <td>{report.costs.toFixed(2)}</td>
                        <td>{report.grossProfit.toFixed(2)}</td>
                        <td>{report.depts.toFixed(2)}</td>
                        <td>{report.paymentMethod}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <Pagination>
                  {[...Array(pages).keys()].map((x) => (
                    <Pagination.Item
                      key={x + 1}
                      active={x + 1 === page}
                      onClick={() => dispatch({ type: "SET_PAGE", payload: x + 1 })}
                    >
                      {x + 1}
                    </Pagination.Item>
                  ))}
                </Pagination>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
