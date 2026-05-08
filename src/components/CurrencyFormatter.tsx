interface CurrencyFormatterProps {
  amount: number;
  className?: string;
  showSymbol?: boolean;
}

export function CurrencyFormatter({ amount, className = '', showSymbol = true }: CurrencyFormatterProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value).replace('PHP', '₱');
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <span className={className}>
      {showSymbol ? formatCurrency(amount) : formatNumber(amount)}
    </span>
  );
}

export const formatPeso = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount).replace('PHP', '₱');
};