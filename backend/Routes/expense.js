import express from"express";
import expressAsyncHandler from"express-async-handler";
import { isAdmin, isAuth, suAdmin, isSellerOrAdmin } from"../utils.js";
import Expense from"../models/expense.js";

const expenseRouter = express.Router();

expenseRouter.post(
  "/",

  expressAsyncHandler(async (req, res) => {
    const newReport = await Expense.create(req.body);
    const report = await newReport.save();
    res.status(201).send({ message: "new expense generated", report });
  })
);



expenseRouter.delete(
  '/:id?',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    try {
      // Handle bulk delete
      if (!req.params.id) {
        const { expenseIds } = req.body;
        
        if (!expenseIds || !Array.isArray(expenseIds) || expenseIds.length === 0) {
          return res.status(400).send({ message: "Expense IDs array is required" });
        }
        
        const result = await Expense.deleteMany({
          _id: { $in: expenseIds }
        });
        
        if (result.deletedCount > 0) {
          return res.send({
            message: `${result.deletedCount} expense(s) successfully deleted`,
            deletedCount: result.deletedCount
          });
        } else {
          return res.status(404).send({ message: "No expenses found with the provided IDs" });
        }
      }
      
      // Handle single delete
      const expense = await Expense.findByIdAndDelete(req.params.id);
      if (expense) {
        res.send({ message: "Expense successfully deleted" });
      } else {
        res.status(404).send({ message: "Expense not found" });
      }
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: "Server error", error: error.message });
    }
  })
);





expenseRouter.get('/month', async (req, res) => {
  try {
    
    const expensesByMonth = await Expense.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          totalAmount: { $sum: '$amount' },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    res.json(expensesByMonth);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});




expenseRouter.get(
  "/",
  isAuth,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const report = await Expense.find();
    res.send(report);
  })
);

expenseRouter.get(
  "/:id",
  isAuth,
  isSellerOrAdmin,
  expressAsyncHandler(async (req, res) => {
    const report = await Expense.findById(req.params.id);
    if (report) {
      res.send(report);
    } else {
      res.status(404).send({ message: "Report not found" });
    }
  })
);

export default expenseRouter;
