import mongoose from "mongoose";

async function reset() {
  await mongoose.connect("mongodb://127.0.0.1:27017/mern-auth");
  const res = await mongoose.connection.collection("vendors").updateMany({}, {
    $set: { isOnline: false, lastActive: new Date(0) }
  });
  console.log("Successfully marked offline vendors count:", res.modifiedCount);
  await mongoose.disconnect();
}

reset().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
