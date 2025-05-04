<<<<<<< HEAD
import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import EventList from "./components/EventList.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <EventList />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
=======
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
>>>>>>> upstream/Dev
  );
}

export default App;
