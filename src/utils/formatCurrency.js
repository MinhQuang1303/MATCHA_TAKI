export function formatCurrency(amount) {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `${safeAmount.toLocaleString('vi-VN')}đ`;
}
