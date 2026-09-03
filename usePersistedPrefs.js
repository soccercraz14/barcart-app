import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'barcart:prefs';

export function usePersistedPrefs(defaultCabinet) {
  const [cabinet, setCabinet] = useState(defaultCabinet);
  const [mocktailOnly, setMocktailOnly] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const prefs = JSON.parse(raw);
          if (Array.isArray(prefs.cabinet)) setCabinet(prefs.cabinet);
          if (typeof prefs.mocktailOnly === 'boolean') setMocktailOnly(prefs.mocktailOnly);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ cabinet, mocktailOnly })).catch(() => {});
  }, [loaded, cabinet, mocktailOnly]);

  return { cabinet, setCabinet, mocktailOnly, setMocktailOnly };
}
