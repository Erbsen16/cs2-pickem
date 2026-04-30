import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Swiss from './pages/Swiss';
import Gsl from './pages/Gsl';
import Playoffs from './pages/Playoffs';
import PickemTournament from './pages/PickemTournament';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Navbar />
      <main style={{ minHeight: 'calc(100vh - 56px)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/swiss" element={<Swiss />} />
          <Route path="/gsl" element={<Gsl />} />
          <Route path="/playoffs" element={<Playoffs />} />
          <Route path="/pickem/:id" element={<PickemTournament />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
