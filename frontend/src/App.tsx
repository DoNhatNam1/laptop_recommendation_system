import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Welcome from './components/Welcome';
import UsageSelection from './components/UsageSelection'; 
import CriteriaSelection from './components/CriteriaSelection';
import CriteriaPairwiseComparison from './components/CriteriaPairwiseComparison';
import CustomCriteriaSelection from "./components/CustomCriteriaSelection"; 
import RecommendationResults from './components/RecommendationResults';
import './styles/globals.css';
import LaptopSelectionAndRating from './components/LaptopSelectionAndRating';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/usage" element={<UsageSelection />} />
        <Route path="/criteria" element={<CriteriaSelection />} />
        <Route path="/custom-criteria" element={<CustomCriteriaSelection />} /> 
        <Route path="/criteria-pairwise" element={<CriteriaPairwiseComparison />} /> 
        <Route path="/laptop-selection" element={<LaptopSelectionAndRating />} />
        <Route path="/recommendations" element={<RecommendationResults />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;