import mongoose from "mongoose"


const paymentSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["Paid", "Pending", "Not paid"],
        default: "Pending",
      },
      amount:{type:String},
    phone:{type:String},
    referenceID:{type:String},
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    paidBy:{type:mongoose.Schema.Types.ObjectId,ref:"Order"},

},{timestamps:true})

const Payment = mongoose.model("Payment",paymentSchema)
export default Payment