import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Risk } from '../types/risk';
import { MOCK_RISKS } from '../data/mockData';

interface RiskContextType {
  risks: Risk[];
  addRisk: (risk: Risk) => void;
  updateRisk: (id: string, updates: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  resetRisks: () => void;
}

const RiskContext = createContext<RiskContextType | undefined>(undefined);

export function RiskProvider({ children }: { children: React.ReactNode }) {
  // ใช้ MOCK_RISKS เป็นฐานข้อมูลเริ่มต้น
  // เมื่อ refresh หน้าเว็บ state จะ reset เป็น MOCK_RISKS อีกครั้ง
  const [risks, setRisks] = useState<Risk[]>(() => {
    // Deep copy เพื่อไม่ให้แก้ไข MOCK_RISKS โดยตรง
    return JSON.parse(JSON.stringify(MOCK_RISKS));
  });

  const addRisk = useCallback((risk: Risk) => {
    setRisks(prev => [risk, ...prev]);
  }, []);

  const updateRisk = useCallback((id: string, updates: Partial<Risk>) => {
    setRisks(prev => prev.map(risk => 
      risk.id === id ? { ...risk, ...updates, updatedAt: new Date().toISOString() } : risk
    ));
  }, []);

  const deleteRisk = useCallback((id: string) => {
    setRisks(prev => prev.filter(risk => risk.id !== id));
  }, []);

  const resetRisks = useCallback(() => {
    // Reset กลับเป็น MOCK_RISKS เริ่มต้น
    setRisks(JSON.parse(JSON.stringify(MOCK_RISKS)));
  }, []);

  return (
    <RiskContext.Provider value={{ risks, addRisk, updateRisk, deleteRisk, resetRisks }}>
      {children}
    </RiskContext.Provider>
  );
}

export function useRisks() {
  const context = useContext(RiskContext);
  if (!context) {
    throw new Error('useRisks must be used within RiskProvider');
  }
  return context;
}
