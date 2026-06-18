import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Walls from "@/pages/Walls";
import Schedule from "@/pages/Schedule";
import Bookings from "@/pages/Bookings";
import Credits from "@/pages/Credits";
import Equipment from "@/pages/Equipment";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/walls" element={<Walls />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/equipment" element={<Equipment />} />
        </Route>
      </Routes>
    </Router>
  );
}
