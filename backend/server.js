const express = require('express');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
dotenv.config();

const app = express();

// This proxy will handle both standard HTTP and WebSocket connections
const proxyOptions = {
  target: process.env.SUPABASE_URL,
  changeOrigin: true, // Necessary for handling CORS and host headers
  ws: true,          // The critical piece: enables WebSocket proxying
  // Additional logging (optional)
  // logLevel: 'debug', 
};

// Apply the proxy middleware to all incoming requests
// Important: Apply this BEFORE your other routes/middleware
app.use('/', createProxyMiddleware(proxyOptions));

const PORT = process.env.PORT || 10000; // Render provides the PORT env variable
app.listen(PORT, () => {
  console.log(`Proxy server listening on port ${PORT}`);
});