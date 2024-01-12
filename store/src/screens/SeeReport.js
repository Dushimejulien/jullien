import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/esm/Table";
import { Store } from "../Store";
function SeeReport() {
  const { state } = useContext(Store);
  const { userInfo } = state;
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const result = await axios.get("/api/expense", {
        headers: { Authorization: `Bearer ${userInfo.token}` },
      });
      setData(result.data);
    };
    fetchData();
  }, [userInfo]);

  return (
    <Card
      sm={6}
      md={3}
      style={{ width: "60rem" }}
      className="mt-5 d-flex justify-content-center"
    >
      <Card.Body>
        <Card.Title style={{ textAlign: "center", marginBottom: "1rem" }}>
          Expense
        </Card.Title>
        <Table>
          <thead>
            <th>Date</th>
            <th>Reason</th>
            <th>Amount</th>
          </thead>
          <tbody>
            {data &&
              data.map((expense) => (
                <tr key={expense._id}>
                  <td>{expense.createdAt.substring(0, 10)}</td>
                  <td>{expense.reason} </td>
                  <td>{expense.amount} RWF</td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}

export default SeeReport;
