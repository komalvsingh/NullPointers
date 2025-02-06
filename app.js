import express, { json, urlencoded } from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userrouter from "./src/user.js";
import itemrouter from "./src/items.js";
import postrouter from "./src/post.js";

const app = express();
dotenv.config();

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

const PORT = process.env.PORT || 5001;
const databaseUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/foodmanage";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

mongoose
  .connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});
app.use("/api/user", userrouter);
app.use("/api/items", itemrouter);
app.use("/api/post", postrouter);



export default app;
