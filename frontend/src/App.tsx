import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScanProvider } from './context/ScanContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import AnalyzePage from './pages/AnalyzePage';
import ResultsPage from './pages/ResultsPage';
import DashboardPage from './pages/DashboardPage';
import AboutPage from './pages/AboutPage';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ScanProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/analyze" element={<AnalyzePage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </Layout>
        </ScanProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}
