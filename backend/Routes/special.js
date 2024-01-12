import express from"express";
import expressAsyncHandler from"express-async-handler";
import Special from"../models/newProduct.js";
import { isAuth } from"../utils.js";
const specialRouter = express.Router();

specialRouter.get("/", async (req, res) => {
  const { query } = req;
  const products = await Special.find();
  res.send(products);
});
// post product
specialRouter.post(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const { name, image, category, description } = req.body;
    const newProduct = new Special({
      name,
      image,
      category,
      description,
    });
    const product = await newProduct.save();
    res.send({ message: "Product Created", product });
  })
);

export default specialRouter;
