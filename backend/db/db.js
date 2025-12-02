import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("MongoDB URI:", process.env.MONGODB_URL); // For debugging
    // Connect without deprecated options
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("Error connecting to MongoDB", err);
    process.exit(1);
  }
};

export default connectDB;
