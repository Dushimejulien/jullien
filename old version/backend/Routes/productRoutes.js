import express from"express";
import Product  from"../models/productModel.js";
import expressAsycHandler  from"express-async-handler";
import expressAsyncHandler  from"express-async-handler";
import { isAdmin, isAuth }  from"../utils.js";

const productRouter = express.Router();

productRouter.get("/", async (req, res) => {
  const { query } = req;
  const products = await Product.find();
  res.send(products);
});


productRouter.get("/myshop",async(req,res)=>{
  try {
   
    const products = await Product.find({});

  
    let totalCostPrice = 0;
    let totalQuantityInStock = 0;

   
    products.forEach((product) => {
      const productCost = product.costPrice * product.countInStock;
      totalCostPrice += productCost;
      totalQuantityInStock += product.countInStock;
    });

    
    const response = {
      
      totalCostPrice,
      totalQuantityInStock,
    };

   
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
})
productRouter.post(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Product({
      name: "sample name " + Date.now(),
      slug: "add slug" + Date.now(),
      image: "/images/logo.png",
      price: 0,
      category: "sample category",
      brand: "sample brand",
      costPrice: 0,
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: "sample description",
    });
    const product = await newProduct.save();
    res.send({ message: "Product Created", product });
  })
);

//update product
productRouter.put(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.costPrice = req.body.costPrice;
      product.image = req.body.image;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;

      await product.save();
      res.send({ message: "Product Updated" });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);
productRouter.patch(
  "/:id",

  expressAsyncHandler(async (req, res) => {
    const {
      body: { countInStock },
      params: { id: productId },
    } = req;
    const product = await Product.findByIdAndUpdate(
      { _id: productId },
      req.body,
      { new: true, runValidators: true }
    );
    if (product) {
      await product.save();
      res.send(product);
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);

// delete product
productRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;

    // Use deleteOne or deleteMany instead of remove
    const result = await Product.deleteOne({ _id: productId });

    if (result.deletedCount > 0) {
      res.send({ message: "Product Deleted" });
    } else {
      res.status(404).send({ message: "Product Not Found" });
    }
  })
);


const PAGE_SIZE = 3;
// manage product
productRouter.get(
  "/admin",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const products = await Product.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Product.countDocuments();
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

// search product
productRouter.get(
  "/search",
  expressAsycHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || "";
    const costPrice = query.costPrice || "";
    const price = query.price || "";
    const rating = query.rating || "";
    const order = query.order || "";
    const searchQuery = query.query || "";

    const queryFilter =
      searchQuery && searchQuery !== "all"
        ? {
            name: {
              $regex: searchQuery,
              $options: "i",
            },
          }
        : {};
    const categoryFilter = category && category !== "all" ? { category } : {};
    const ratingFilter =
      rating && rating !== "all"
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== "all"
        ? {
            // 1-50
            price: {
              $gte: Number(price.split("-")[0]),
              $lte: Number(price.split("-")[1]),
            },
          }
        : {};
    const costPriceFilter =
      costPrice && costPrice !== "all"
        ? {
            // 1-50
            price: {
              $gte: Number(price.split("-")[0]),
              $lte: Number(price.split("-")[1]),
            },
          }
        : {};
    const sortOrder =
      order === "featured"
        ? { featured: -1 }
        : order === "lowest"
        ? { price: 1 }
        : order === "highest"
        ? { price: -1 }
        : order === "toprated"
        ? { rating: -1 }
        : order === "newest"
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Product.find({
      ...queryFilter,
      ...categoryFilter,
      ...costPriceFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Product.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...costPriceFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

productRouter.get(
  "/categories",
  expressAsycHandler(async (req, res) => {
    const categories = await Product.find().distinct("category");
    res.send(categories);
  })
);

productRouter.get("/slug/:slug", async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product not found" });
  }
});

productRouter.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: "Product Not Found" });
  }
});

export default productRouter;
