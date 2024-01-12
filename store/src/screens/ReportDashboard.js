import React, { useContext, useEffect, useReducer } from "react";
import Chart from "react-google-charts";
import axios from "axios";
import { Store } from "../Store";
import { getError } from "../utils";
import LoadingBox from "../components/LoadingBox";
import MessageBox from "../components/MessageBox";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Card from "react-bootstrap/Card";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        summary: action.payload,
        loading: false,
      };
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
  const { userInfo } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get("/api/report/summary", {
          headers: { Authorization: `Bearer ${userInfo.token}` },
        });
        console.log(data);
        dispatch({ type: "FETCH_SUCCESS", payload: data });
      } catch (err) {
        dispatch({
          type: "FETCH_FAIL",
          payload: getError(err),
        });
      }
    };
    fetchData();
  }, [userInfo]);

  return (
    <div>
      <h1>Report Dashboard</h1>
      {loading ? (
        <LoadingBox />
      ) : error ? (
        <MessageBox variant="danger">{error}</MessageBox>
      ) : (
        <>
          <Row>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.users && summary.users[0]
                      ? summary.users[0].numUsers
                      : 0}
                  </Card.Title>
                  <Card.Text> Users</Card.Text>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.users[0]
                      ? summary.orders[0].depts.toFixed(2)
                      : 0}{" "}
                    Rwf
                  </Card.Title>
                  <Card.Text> depts</Card.Text>
                </Card.Body>
              </Card>
              
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.users[0]
                      ? summary.orders[0].numOrders
                      : 0}
                  </Card.Title>
                  <Card.Text> total quantity sold</Card.Text>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.users[0]
                      ? summary.orders[0].totalCosts
                      : 0}{" "}
                    Rwf
                  </Card.Title>
                  <Card.Text> total Costs</Card.Text>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.users[0]
                      ? summary.orders[0].taxPrice.toFixed(2)
                      : 0}{" "}
                    Rwf
                  </Card.Title>
                  <Card.Text> tax Price</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.users[0]
                      ? summary.orders[0].totalSales.toFixed(2)
                      : 0}{" "}
                    Rwf
                  </Card.Title>
                  <Card.Text> total Sales</Card.Text>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.orders && summary.users[0]
                      ? summary.orders[0].grossProfit.toFixed(2)
                      : 0}{" "}
                    Rwf
                  </Card.Title>
                  <Card.Text> Gross profit</Card.Text>
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <Card.Title>
                    {summary.orders[0].grossProfit.toFixed(2) -
                      summary.orders[0].taxPrice.toFixed(2)}
                    Rwf
                  </Card.Title>
                  <Card.Text> net Profit</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
           <Row>
            <Col md={4}></Col>
          </Row>
          
          <div className="my-3">
            <h2>yearly Sales</h2>
            {!summary.yearlyOrders ? (
              <MessageBox>No Sale</MessageBox>
            ) : (
              <>
                {summary.yearlyOrders.map((item) => {
                  return (
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Body>{item.sales} Rwf</Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  );
                })}
                <Chart
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ["Date", "Sales"],
                    ...summary.yearlyOrders.map((x) => [x._id, x.sales]),
                  ]}
                ></Chart>
                
                
              </>
            )}
          </div>
          <div className="my-3">
            <h2>yearly gross profit</h2>
            {!summary.yearlyOrders ? (
              <MessageBox>No gross profit</MessageBox>
            ) : (
              <>
                {summary.yearlyOrders.map((item) => {
                  return (
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Body>{item.grossProfit} Rwf</Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  );
                })}
                <Chart
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ["Date", "grossProfit"],
                    ...summary.yearlyOrders.map((x) => [x._id, x.grossProfit]),
                  ]}
                ></Chart>
                
                
              </>
            )}
          </div>
          <div className="my-3">
            <h2>Monthy Sales</h2>
            {!summary.monthlyOrders ? (
              <MessageBox>No Sale</MessageBox>
            ) : (
              <>
                {summary.monthlyOrders.map((item) => {
                  return (
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Body>{item.sales} Rwf</Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  );
                })}
                <Chart
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ["Date", "Sales"],
                    ...summary.monthlyOrders.map((x) => [x._id, x.sales]),
                  ]}
                ></Chart>
                
                
              </>
            )}
          </div>
          <div className="my-3">
            <h2>Monthy gross proft</h2>
            {!summary.monthlyOrders ? (
              <MessageBox>No profit</MessageBox>
            ) : (
              <>
                {summary.monthlyOrders.map((item) => {
                  return (
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Body>{item.grossProfit} Rwf</Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  );
                })}
                <Chart
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ["Date", "Sales"],
                    ...summary.monthlyOrders.map((x) => [x._id, x.grossProfit]),
                  ]}
                ></Chart>
                
                
              </>
            )}
          </div>
          <div className="my-3">
            <h2>Dairly Sales</h2>
            {summary.dailyOrders.length === 0 ? (
              <MessageBox>No Sale</MessageBox>
            ) : (
              <>
                {summary.dailyOrders.map((item) => {
                  return (
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Body>{item.sales} Rwf</Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  );
                })}
                <Chart
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ["Date", "Sales"],
                    ...summary.dailyOrders.map((x) => [x._id, x.sales]),
                  ]}
                ></Chart>
                
                
              </>
            )}
          </div>
          <div className="my-3">
            <h2>Dairly gross profit</h2>
            {summary.dailyOrders.length === 0 ? (
              <MessageBox>No gross profit</MessageBox>
            ) : (
              <>
                {summary.dailyOrders.map((item) => {
                  return (
                    <Row>
                      <Col md={6}>
                        <Card>
                          <Card.Body>{item.grossProfit} Rwf</Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  );
                })}
                <Chart
                  width="100%"
                  height="400px"
                  chartType="AreaChart"
                  loader={<div>Loading Chart...</div>}
                  data={[
                    ["Date", "Sales"],
                    ...summary.dailyOrders.map((x) => [x._id, x.grossProfit]),
                  ]}
                ></Chart>
                
                
              </>
            )}
          </div>
          <div className="my-3">
            <h2>Categories</h2>
            {summary.productCategories.length === 0 ? (
              <MessageBox>No Category</MessageBox>
            ) : (
              <Chart
                width="100%"
                height="400px"
                chartType="PieChart"
                loader={<div>Loading Chart...</div>}
                data={[
                  ["Category", "Products"],
                  ...summary.productCategories.map((x) => [x._id, x.count]),
                ]}
              ></Chart>
            )}
          </div>
        </>
      )}
    </div>
  );
}
// const monthlyOrders = summary.dailyOrders.reduce((acc, x) => {
//   const [year, month] = x._id.split("-");
//   const key = `${year}-${month}`;
//   if (acc[key]) {
//     acc[key].sales += x.sales;
//   } else {
//     acc[key] = { _id: key, sales: x.sales };
//   }
//   return acc;
// }, {});

// const monthlyOrderData = Object.values(monthlyOrders).map((x) => [x._id, x.sales]);

// <Chart
//   width="100%"
//   height="400px"
//   chartType="AreaChart"
//   loader={<div>Loading Chart...</div>}
//   data={[["Date", "Sales"], ...monthlyOrderData]}
// ></Chart>
