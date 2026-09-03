export function Card({ children, className = '' }) {
  return <section className={`rounded-md border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</section>;
}
