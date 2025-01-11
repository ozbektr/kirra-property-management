// Exchange rates - Updated from TradingView USDTRY
export const EXCHANGE_RATES = {
  USD_TO_TRY: 35.39, // Current exchange rate from TradingView
  TRY_TO_USD: 1 / 35.39
};

// Format currency with proper exchange rate
export const formatCurrency = (
  amount: number | null | undefined,
  fromCurrency: 'USD' | 'TRY',
  toCurrency: 'USD' | 'TRY'
): string => {
  if (amount == null) return toCurrency === 'USD' ? '$0.00' : '₺0.00';

  let convertedAmount = amount;
  if (fromCurrency !== toCurrency) {
    convertedAmount = fromCurrency === 'USD' 
      ? amount * EXCHANGE_RATES.USD_TO_TRY 
      : amount * EXCHANGE_RATES.TRY_TO_USD;
  }

  return toCurrency === 'USD'
    ? `$${convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    : `₺${convertedAmount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
};