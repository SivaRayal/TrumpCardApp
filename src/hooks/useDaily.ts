import { useState, useCallback } from 'react';
import { getTodaySelection, saveSelection, DailySelection } from '../services/database';
import { pickRandomQuote, getQuoteByIndex } from '../services/quotes';
import { useAuth } from './useAuth';

export interface DailyState {
  selection: DailySelection | null;
  quote: string | null;
  loading: boolean;
  error: string | null;
}

export function useDaily() {
  const { user } = useAuth();
  const [state, setState] = useState<DailyState>({
    selection: null,
    quote: null,
    loading: false,
    error: null,
  });

  const checkToday = useCallback(async () => {
    if (!user) return null;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const selection = await getTodaySelection(user.id);
      if (selection) {
        const quote = await getQuoteByIndex(selection.quote_index);
        setState({ selection, quote, loading: false, error: null });
        return { selection, quote };
      } else {
        setState({ selection: null, quote: null, loading: false, error: null });
        return null;
      }
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }));
      return null;
    }
  }, [user]);

  const pickCard = useCallback(async (cardIndex: number) => {
    if (!user) return null;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const existing = await getTodaySelection(user.id);
      if (existing) {
        const quote = await getQuoteByIndex(existing.quote_index);
        setState({ selection: existing, quote, loading: false, error: null });
        return { selection: existing, quote };
      }
      const { quote, index: quoteIndex } = await pickRandomQuote(user.id);
      const selection = await saveSelection(user.id, cardIndex, quoteIndex);
      setState({ selection, quote, loading: false, error: null });
      return { selection, quote };
    } catch (e: any) {
      setState(s => ({ ...s, loading: false, error: e.message }));
      return null;
    }
  }, [user]);

  return { ...state, checkToday, pickCard };
}
