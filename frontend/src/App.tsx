import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './components/Welcome';
import UsageSelection from './components/UsageSelection'; 
import CriteriaSelection from './components/CriteriaSelection';
import CriteriaPairwiseComparison from './components/CriteriaPairwiseComparison';
import RecommendationResults from './components/RecommendationResults';
import LaptopListPage from './components/LaptopListPage';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/usage" element={<UsageSelection />} />
        <Route path="/criteria" element={<CriteriaSelection />} />
        <Route path="/criteria-pairwise" element={<CriteriaPairwiseComparison />} /> 
        <Route path="/recommendations" element={<RecommendationResults />} />
        <Route path="/laptops" element={<LaptopListPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;