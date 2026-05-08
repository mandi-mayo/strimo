import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Details from './pages/Details.jsx';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/discover/:type" element={<Home />} />
          <Route path="/top-rated" element={<Home />} />
          <Route path="/upcoming" element={<Home />} />
          <Route path="/history" element={<Home />} />
          <Route path="/details/:id" element={<Details />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
