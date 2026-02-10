const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Pending', 'Completed', 'Approved', 'Disputed'], 
    default: 'Pending' 
  },
  proofOfWork: { type: String }, // URL to uploaded evidence (images/files)
});

const TransactionSchema = new mongoose.Schema({
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['Awaiting Deposit', 'Funds Locked', 'Completed', 'In Dispute'], 
    default: 'Awaiting Deposit' 
  },
  milestones: [MilestoneSchema], // Array for staged payments
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
