import mongoose from "mongoose";
import dns from "dns";

// Ensure DNS resolution succeeds for mongodb+srv records across Windows ISPs
try {
  dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch {
  // Ignore if DNS server override is not permitted
}

const MongooseConnect = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb+srv://abhinavpandey09:abhinavpandey091@media.jfdiy0v.mongodb.net/mern-auth?retryWrites=true&w=majority&appName=USER_CAPTAIN";
    const connectDb = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Atlas connected successfully: ${connectDb.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
  }
};

export default MongooseConnect;