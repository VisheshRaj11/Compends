const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { createProxyMiddleware } = require("http-proxy-middleware");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://localhost:5173",
    ],
    credentials: true,
  })
);

// console.log(process.env.SUPABASE_URL);
app.use(
  "/",
  createProxyMiddleware({
    target: process.env.SUPABASE_URL,
    changeOrigin: true,
    ws: true,
    secure: true,
  })
);

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});