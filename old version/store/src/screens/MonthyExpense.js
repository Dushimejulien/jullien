import React, { useState, useEffect } from 'react';
import Card from 'react-bootstrap/Card';
import axios from 'axios';


const ExpensesByMonth = () => {
   
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  

  useEffect(() => {
    const fetchExpensesByMonth = async () => {
      try {
        const response = await axios.get('/api/expense/month');
        setExpenses(response.data);
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };

    fetchExpensesByMonth();
  }, []);

  // const handleDeleteExpense = async (expenseId) => {
  //   if (window.confirm('Are you sure to delete')) {
  //     try {
  //       await axios.delete(`/api/expense/${expenseId}`);
  //       console.log('Expense deleted');
  //       // After deleting, you may want to refresh the list of expenses or update the state to remove the deleted expense.
  //       setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense._id !== expenseId));
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }
  // };

  return (
    <div>
      <h1>Expenses by Month</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Card>
          <Card.Body>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Amount</th>
                  
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={`${expense._id.year}-${expense._id.month}`}>
                    <td>{`${expense._id.year}-${expense._id.month}`}</td>
                    <td>{expense.totalAmount.toFixed(2)} RWF</td>
                    {/* <td>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteExpense(expense._id)}
                      >
                        Delete
                      </Button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ExpensesByMonth;
