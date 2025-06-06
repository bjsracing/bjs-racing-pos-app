import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx"; // Pastikan path ini benar, mengarah ke App.jsx
import "./index.css"; // Pastikan path ini benar, mengarah ke index.css

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
