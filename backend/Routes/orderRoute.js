import express  from"express";
import axios  from"axios"
import expressAsyncHandler  from"express-async-handler";
import { isAdmin, isAuth }  from"../utils.js";
import Order  from"../models/orderModals.js";
import Product  from"../models/productModel.js";
import User  from"../models/userModal.js";
import Payment  from"../models/payment.js";
import { v4 as uuidv4 }  from'uuid';
const orderRouter = express.Router();
orderRouter.get(
  "/",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find().populate("user", "name");
    res.send(orders);
  })
);
orderRouter.post(
  "/",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const newOrder = new Order({
      orderItems: req.body.orderItems.map((x) => ({ ...x, product: x._id })),
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod,
      itemsPrice: req.body.itemsPrice,
      shippingPrice: req.body.shippingPrice,
      taxPrice: req.body.taxPrice,
      totalPrice: req.body.totalPrice,
      user: req.user._id,
    });

    const order = await newOrder.save();
    res.status(201).send({ message: "New Order Created", order });
  })
);

orderRouter.get(
  "/summary",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.aggregate([
      {
        $group: {
          _id: null,
          numOrders: { $sum: 1 },
          totalSales: { $sum: "$totalPrice" },
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
    const dailyOrders = await Order.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          orders: { $sum: 1 },
          sales: { $sum: "$totalPrice" },
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
    res.send({ users, orders, dailyOrders, productCategories });
  })
);

orderRouter.get(
  "/mine",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id });
    res.send(orders);
  })
);

orderRouter.get(
  "/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      res.send(order);
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

// deliver order
orderRouter.put(
  "/:id/deliver",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
      await order.save();
      res.send({ message: "Order Delivered" });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);
// delete orders
orderRouter.delete(
  "/:id",
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      await order.remove();
      res.send({ message: "Order Deleted" });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);

orderRouter.put(
  "/:id/pay",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
      };
      const updatedOrder = await order.save();
      res.send({ message: "Order Paid!", order: updatedOrder });
    } else {
      res.status(404).send({ message: "Order Not Found" });
    }
  })
);


// payment with mobile money


orderRouter.post('/submitPayment', async (req, res) => {
  try {
    const referenceId=uuidv4()
    const { amount, phone } = req.body;
    console.log(phone)
   

    // Get the token
    const tokenResponse =await  axios.post("https://proxy.momoapi.mtn.co.rw/collection/token/", null, {
      headers: {
        Authorization: `Basic ${Buffer.from('MDg4Zjg4ZTUtOTAxOS00NzAzLWJjMjQtODhkYzZjOTMzNjJlOmNmOWEzMTNjMWE1NTRkODJhOWNkNDZhOWY2MzMzNTA3', 'base64').toString('base64')}`,
        'Ocp-Apim-Subscription-Key': '7e1aa7908e3a48f78351c20a490579ca',
      },
    });

    const token = tokenResponse.data?.access_token;
    console.log(token)
    if (!token) {
      throw new Error('Token not found in the response');
    }

    // Make the payment request
    const requestPayment =await axios.post("https://proxy.momoapi.mtn.co.rw/collection/v1_0/requesttopay", {
      "amount": amount,
      "currency": "RWF",
      "externalId": "125645",
      "payer": {
        "partyIdType": "MSISDN",
        "partyId": `25${phone}`,
      },
      "payerMessage": "You paid all required amount",
      "payeeNote": "you have paid",
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Callback-Url': 'https://www.irembo.com',
        'X-Reference-Id': referenceId,
        'X-Target-Environment': 'mtnrwanda',
        "Content-Type": 'application/json',
        "Ocp-Apim-Subscription-Key": '7e1aa7908e3a48f78351c20a490579ca',
      },
    });
console.log(requestPayment)
    
    const payment = new Payment({
      amount: amount,
      phone: phone,
      referenceID: referenceId,
      
    });

    await payment.save();

   

     res.send(payment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error',error });
  }
});
export default orderRouter;
