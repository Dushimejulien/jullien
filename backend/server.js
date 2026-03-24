import express from "express";
import mongoose from "mongoose";
import cors  from "cors";
import path from"path"
import dotenv  from "dotenv";
import productRouter  from "./Routes/productRoutes.js";
import userRouter  from "./Routes/userRoutes.js";
import orderRouter  from "./Routes/orderRoute.js";
import reportRouter  from "./Routes/reportModal.js";
import expenseRouter  from "./Routes/expense.js";
import uploadRouter  from "./Routes/uploadRoutes.js";
import specialRouter  from "./Routes/special.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err.message);
  });

const app = express();

app.use(cors())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __dirname = path.resolve();
app.use("/images", express.static(path.join(__dirname, "/images")));
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.get("/api/keys/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "sb");
});
app.get("/api/keys/google", (req, res) => {
  res.send({ key: process.env.GOOGLE_API_KEY || "" });
});

// app.use("/api/seed", seedRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/report", reportRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/special", specialRouter);

// Removed broken duplicate /api/products routes that used undefined 'data' variable

// Removed broken duplicate routes that used undefined 'data' variable


app.use(express.static(path.join(__dirname, "/store/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "/store/build/index.html"));
});

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});

