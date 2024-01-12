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

app.get("/api/keys/paypal", (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || "sb");
});
app.get("/api/keys/google", (req, res) => {
  res.send({ key: process.env.GOOGLE_API_KEY || "" });
});

//app.use("/api/seed", seedRouter);
app.use("/api/products", productRouter);
app.use("/api/users", userRouter);
app.use("/api/orders", orderRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/report", reportRouter);
app.use("/api/expense", expenseRouter);
app.use("/api/special", specialRouter);


app.get("/api/products", (req, res) => {
  res.send(data.products);
});

app.get("/api/products/slug/:slug", (req, res) => {
  const product = data.products.find((x) => x.slug === req.params.slug);

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product not found" });
  }
});

app.get("/api/products/:id", (req, res) => {
  const product = data.products.find((x) => x._id === req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product Not Found" });
  }
});

const __dirname = path.resolve();
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

