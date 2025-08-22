import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import StockTable from './StockTable';

function App() {
 

  return (
    <Router>
   
          <Routes>
            {/* Define router paths */}
            <Route path="/stocks" element={<StockTable/>} />
            
          </Routes>
      
    </Router>
  );
}

export default App;
