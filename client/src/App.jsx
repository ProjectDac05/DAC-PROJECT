import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import EventsListPage from "./pages/Events/EventsListPage";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
              <h1 className="text-4xl font-bold mb-6">
                Welcome to DAC Project
              </h1>
              <Link
                to="/events"
                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
              >
                Go to Events
              </Link>
            </div>
          }
        />
        <Route path="/events" element={<EventsListPage />} />
      </Routes>
    </Router>
  );
}

export default App;
