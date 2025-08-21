import express, { query } from "express";
import expressAsyncHandler from "express-async-handler";
import { isAdmin, isAuth, suAdmin } from "../utils.js";
import Report from "../models/reportModal.js";
import User from "../models/userModal.js";
import Product from "../models/productModel.js";

const reportRouter = express.Router();

reportRouter.delete(
  "/:id?",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      // Handle bulk delete
      if (!req.params.id) {
        const { reportIds } = req.body;
        
        // Validate input
        if (!reportIds || !Array.isArray(reportIds) || reportIds.length === 0) {
          return res.status(400).send({message:"Report IDs array is required"});
        }
        
        // Delete multiple reports
        const result = await Report.deleteMany({
          _id: { $in: reportIds }
        });
        
        if(result.deletedCount > 0){
          return res.send({
            message: `${result.deletedCount} report(s) successfully deleted`,
            deletedCount: result.deletedCount
          });
        }else{
          return res.status(404).send({message:"No reports found with the provided IDs"});
        }
      }
      
      // Handle single delete
      const report = await Report.findByIdAndDelete(req.params.id)
      if(report){
        res.send({message:"Report successfully deleted"})
      }else{
        res.status(404).send({message:"Report not found"})
      }
    } catch (error) {
      console.log(error);
      res.status(500).send({message:"Server error", error: error.message})
    }
  })
);

  reportRouter.post(
  "/",
  isAuth,

  expressAsyncHandler(async (req, res) => {
    const newReport = await Report.create({
      reportItems: req.body.reportItems.map((x) => ({ ...x, product: x._id })),
      paymentMethod: req.body.paymentMethod,
      sales: req.body.sales,
      givenTo: req.body.givenTo,
      quantity: req.body.reportItems.quantity,
      taxPrice: req.body.taxPrice,
      grossProfit: req.body.grossProfit,
      netProfit: req.body.netProfit,
      costPrice: req.body.costPrice,
      soldAt: req.body.soldAt,
      ibyangiritse: req.body.ibyangiritse,
      comments: req.body.comments,
      depts: req.body.depts,
      igice: req.body.igice,
      costs: req.body.costs,
      real: req.body.real,
      inStock: req.body.report,
      user: req.user,
    });
    const report = await newReport.save();
    res.status(201).send({ message: "new report generated", report });
  })
);

reportRouter.put("/update/:id",isAuth,expressAsyncHandler(async(req,res)=>{
  const reportId = req.params.id
  const updatedData=req.body

  try {
    const report = await Report.findById(reportId)
    if(report){
      report.reportItems=report.reportItems
      report.ibyangiritse = updatedData.ibyangiritse||report.ibyangiritse
      report.soldAt = updatedData.soldAt||report.soldAt
      report.depts = updatedData.depts||report.depts
      report.real = updatedData.real||report.real
      report.comments = updatedData.comments||report.comments
      report.igice = updatedData.igice||report.igice
      report.givenTo = updatedData.givenTo||report.givenTo
      report.paymentMethod = updatedData.paymentMethod||report.paymentMethod
      report.status = updatedData.status||report.status
      report.sales = updatedData.sales||report.sales
      report.costs = updatedData.costs||report.costs
      report.taxPrice = updatedData.taxPrice||report.taxPrice
      report.netProfit = updatedData.netProfit||report.netProfit
      report.grossProfit = updatedData.grossProfit||report.grossProfit
      report.user = updatedData.user||report.user
      report.isPaid = updatedData.isPaid||report.isPaid
      report.inStock = updatedData.inStock||report.inStock
      report.paidAt = updatedData.paidAt||report.paidAt

      const updatedReport = await report.save()
      res.send({message:"Report updated!",report: updatedReport})
    }else{
      res.status(404).send({ message: "Report not found" });
    }


  } catch (error) {
    console.error("Error updating report:", error);
      res.status(500).json({ error: "Internal Server Error" });
  }

}))

// Delete a report by ID
reportRouter.delete(
  "/delete/:id",expressAsyncHandler(async(req,res)=>{
    const reportId = req.params.id
    try {
      const report = await Report.findById(reportId)
      if(report){
        await report.remove()
        res.send({message:"Report deleted"})
      }else{
        res.status(404).send({ message: "Report not found" });
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  })
)


const PAGE_SIZE = 2;

reportRouter.get(
  "/summary",
  isAuth,

  expressAsyncHandler(async (req, res) => {
    const orders = await Report.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: "$sales" },
          totalCosts: { $sum: "$costs" },
          taxPrice: { $sum: "$taxPrice" },
          grossProfit: { $sum: "$grossProfit" },
          netProfit: { $sum: "$netProfit" },
          expense: { $sum: "$expense" },
          depts: { $sum: "$depts" },
        },
      },
    ]);

    const users = await User.aggregate([
      {
        $group: {
          _id: null,
          numUsers: { $sum: 1 },
        },
      },
    ]);
    const dailyOrders = await Report.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          sales: { $sum: "$sales" },
          grossProfit:{$sum:"$grossProfit"},
          netProfit:{$sum:"$netProfit"}
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthlyOrders = await Report.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          orders: { $sum: 1 },
          sales: { $sum: "$sales" },
          grossProfit:{$sum:"$grossProfit"},
          
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const yearlyOrders = await Report.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y", date: "$createdAt" } },
          orders: { $sum: 1 },
          sales: { $sum: "$sales" },
          grossProfit:{$sum:"$grossProfit"},
          
        },
      },
      { $sort: { _id: 1 } },
    ]);

   

    const productCategories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
    ]);
    res.send({ users, orders, monthlyOrders,dailyOrders,yearlyOrders, productCategories });
  })
);

reportRouter.get("/search", async (req, res) => {
  try {
    const { key, page = 1, limit = 10, depts, dateFilter, year, month, day } = req.query;
    const skip = (page - 1) * limit;
    
    // Build the base search filter
    let searchFilter = {};
    
    // Add text search if key is provided
    if (key) {
      searchFilter.$or = [
        { givenTo: { $regex: key, $options: "i" } },
        { comments: { $regex: key, $options: "i" } },
        { "reportItems.name": { $regex: key, $options: "i" } },
        { paymentMethod: { $regex: key, $options: "i" } },
        { status: { $regex: key, $options: "i" } }
      ];
    }
    
    // Add depts filter if provided
    if (depts !== undefined) {
      if (depts === "true" || depts === true) {
        searchFilter.depts = { $gt: 0 };
      } else if (depts === "false" || depts === false) {
        searchFilter.depts = { $eq: 0 };
      }
    }
    
    // Add year filter if provided
    if (year) {
      const yearInt = parseInt(year);
      if (!isNaN(yearInt)) {
        const startDate = new Date(yearInt, 0, 1);
        const endDate = new Date(yearInt + 1, 0, 1);
        searchFilter.createdAt = {
          $gte: startDate,
          $lt: endDate
        };
      }
    }
    
    // Add month filter if provided (requires year)
    if (month && year) {
      const yearInt = parseInt(year);
      const monthInt = parseInt(month) - 1; // Months are 0-indexed in JS
      if (!isNaN(yearInt) && !isNaN(monthInt)) {
        const startDate = new Date(yearInt, monthInt, 1);
        const endDate = new Date(yearInt, monthInt + 1, 1);
        searchFilter.createdAt = {
          $gte: startDate,
          $lt: endDate
        };
      }
    }
    
    // Add day filter if provided (requires year and month)
    if (day && month && year) {
      const yearInt = parseInt(year);
      const monthInt = parseInt(month) - 1; // Months are 0-indexed in JS
      const dayInt = parseInt(day);
      if (!isNaN(yearInt) && !isNaN(monthInt) && !isNaN(dayInt)) {
        const startDate = new Date(yearInt, monthInt, dayInt);
        const endDate = new Date(yearInt, monthInt, dayInt + 1);
        searchFilter.createdAt = {
          $gte: startDate,
          $lt: endDate
        };
      }
    }
    
    // Add date range filter if provided
    if (dateFilter) {
      try {
        const dateFilters = JSON.parse(dateFilter);
        
        if (dateFilters.startDate || dateFilters.endDate) {
          searchFilter.createdAt = {};
          
          if (dateFilters.startDate) {
            searchFilter.createdAt.$gte = new Date(dateFilters.startDate);
          }
          
          if (dateFilters.endDate) {
            // Set end of day for end date
            const endDate = new Date(dateFilters.endDate);
            endDate.setHours(23, 59, 59, 999);
            searchFilter.createdAt.$lte = endDate;
          }
        }
      } catch (e) {
        console.error("Error parsing date filter:", e);
      }
    }
    
    const totalCount = await Report.countDocuments(searchFilter);
    
    const data = await Report.find(searchFilter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    res.json({
      data,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



reportRouter.get(
  "/given",
  expressAsyncHandler(async (req, res) => {
    const givenTo = await Report.find().distinct("givenTo");
    res.send(givenTo);
  })
);

reportRouter.get(
  "/all",
  isAuth,

  expressAsyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await Report.countDocuments({});
  const reports = await Report.find({})
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({ reports, page, pages: Math.ceil(total / limit) });
  })
);
reportRouter.put(
  "/given/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);
    if (report.igice >0) {
      report.igice = req.body.igice;
      report.soldAt = report.soldAt;
      report.paymentMethod = report.paymentMethod;
      report.comments = report.comments;
      report.sales = report.igice+report.sales;

      report.depts = report.depts - report.igice;

      report.costs = report.costs;
      report.grossProfit = report.sales - report.costs;
      report.taxPrice = report.grossProfit * 0.18;
      report.createdAt = Date.now();
      report.netProfit = report.grossProfit - report.taxPrice;
      report.reportItems = req.body.reportItems.map((x) => ({
        ...x,
        product: x._id,
      }));

      const updatedReport = await report.save();
      res.send({ message: "Report updated!", report: updatedReport });
    } else {
      report.igice = req.body.igice;
      report.soldAt = report.soldAt;
      report.paymentMethod = report.paymentMethod;
      report.comments = report.comments;
      report.sales = report.igice;
      report.depts = report.depts - report.igice;
      report.costs = report.costs;
      report.grossProfit = report.sales - report.igice;
      report.taxPrice = report.grossProfit * 0.18;
      report.createdAt = Date.now();
