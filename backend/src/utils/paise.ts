export function formatPaise(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function paiseToCurrency(paise: number): number {
  return paise / 100;
}
