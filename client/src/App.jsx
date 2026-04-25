import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Search from './pages/Search';
import Details from './pages/Details';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <Router>
      <Navbar />
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/details/:id" element={<Details />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
