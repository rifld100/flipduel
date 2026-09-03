import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import CreateRoom from "./pages/CreateRoom";
import Room from "./pages/Room";
import Leaderboard from "./pages/Leaderboard";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/room/:id" element={<Room />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </Layout>
  );
}
