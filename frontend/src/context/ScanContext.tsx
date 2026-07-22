import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { AnalysisResult } from '../lib/mockAnalysis';

interface ScanContextType {
  currentResult: AnalysisResult | null;
  scanHistory: AnalysisResult[];
  isScanning: boolean;
  setCurrentResult: (result: AnalysisResult | null) => void;
  addToHistory: (result: AnalysisResult) => void;
  setIsScanning: (v: boolean) => void;
}

const ScanContext = createContext<ScanContextType | null>(null);

export function ScanProvider({ children }: { children: ReactNode }) {
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [scanHistory, setScanHistory] = useState<AnalysisResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const addToHistory = (result: AnalysisResult) => {
    setScanHistory(prev => [result, ...prev.slice(0, 49)]);
  };

  return (
    <ScanContext.Provider value={{ currentResult, scanHistory, isScanning, setCurrentResult, addToHistory, setIsScanning }}>
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const ctx = useContext(ScanContext);
  if (!ctx) throw new Error('useScan must be used within ScanProvider');
  return ctx;
}
