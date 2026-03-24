import React, { useState, useEffect, useContext } from 'react';
import { Card, Container, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import axios from 'axios';
import { Store } from '../Store';

const MonthlyExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { state } = useContext(Store);
  const { userInfo } = state;

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

  return (
    <Container className="py-4">
      <div className="mb-4">
        <h1 className="text-gradient">Expense Archives</h1>
        <p className="text-muted text-uppercase small ls-wide">Monthly Financial Outflow Summary</p>
      </div>

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
              {expenses.map((expense) => (
                <tr key={`${expense._id.year}-${expense._id.month}`}>
                  <td className="ps-4">
                     <div className="fw-bold fs-6">
                       {getMonthName(expense._id.month)} {expense._id.year}
                     </div>
                     <div className="text-muted small">Tax Deductible Activity</div>
                  </td>
                  <td className="text-end pe-4">
                    <Badge bg="danger" className="bg-opacity-10 text-danger border border-danger fs-6 px-3 py-2">
                       {expense.totalAmount.toLocaleString()} RWF
                    </Badge>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan="2" className="text-center py-5 text-muted">
                    No historical expense data found for this period.
                  </td>
                </tr>
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
