const express =require ("express");

const data =require ("../data");
const Product =require ("../models/productModel");
const User =require ("../models/userModal");

const seedRouter = express.Router();
seedRouter.get("/", async (req, res) => {
  await Product.remove({});
  const createdProducts = await Product.insertMany(data.products);

  await User.remove({});
  const createUser = await User.insertMany(data.users);
  res.send({ createdProducts, createUser });
});

module.exports= seedRouter;
