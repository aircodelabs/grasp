import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Layout from "./layout.jsx";
import Home from "./pages/home";
import Test from "./pages/test";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/live" element={<Test />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
