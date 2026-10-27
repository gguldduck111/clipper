export function formatMoney(cents: number) {
  return `₩${cents.toLocaleString("ko-KR")}`;
}
