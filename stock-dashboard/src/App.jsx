import './App.css';
import { BrowserRouter as Router, Routes, Route ,Navigate } from 'react-router-dom';
import StockTable from './StockTable';

function App() {
 

  return (
    <Router>
   
          <Routes>
            {/* Define router paths */}
            <Route path="/stocks" element={<StockTable/>} />
            <Route path="/" element={<Navigate to="/stocks" />} />
          </Routes>
      
    </Router>
  );
}

export default App;
