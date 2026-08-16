import { useState, useEffect, useCallback } from 'react';
import { 
  EconomicIndicator, 
  MacroeconomicSummary, 
  BASELINE_ECONOMIC_SUMMARY, 
  OFFICIAL_ECONOMIC_INDICATORS 
} from '../data/economicRadarData';
import { fetchLiveMarketData, LiveRadarFetchResult } from '../services/economicRadarService';

export function useEconomicRadar() {
  const [summary, setSummary] = useState<MacroeconomicSummary>(BASELINE_ECONOMIC_SUMMARY);
  const [indicators, setIndicators] = useState<EconomicIndicator[]>(OFFICIAL_ECONOMIC_INDICATORS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [syncStatus, setSyncStatus] = useState<'live' | 'cached' | 'syncing'>('cached');
  const [sourceSummary, setSourceSummary] = useState<string>('Bases Oficiais: Banco Central, IBGE, B3');

  const refreshData = useCallback(async (isManual: boolean = false) => {
    setIsLoading(true);
    setSyncStatus('syncing');
    try {
      const result: LiveRadarFetchResult = await fetchLiveMarketData();
      setSummary(result.summary);
      setIndicators(result.indicators);
      setLastSync(result.fetchedAt);
      setSyncStatus(result.status);
      setSourceSummary(result.sourceSummary);
    } catch (err) {
      console.error('Error refreshing economic radar:', err);
      setSyncStatus('cached');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    refreshData();

    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 60000);

    return () => clearInterval(interval);
  }, [refreshData]);

  return {
    summary,
    indicators,
    isLoading,
    lastSync,
    syncStatus,
    sourceSummary,
    refreshData
  };
}
