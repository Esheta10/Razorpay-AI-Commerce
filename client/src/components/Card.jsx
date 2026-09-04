export function Card({ children, className = '' }) {
  return (
    <section
      className={`rounded-lg border border-line bg-gradient-to-b from-panelStrong to-panel p-5 shadow-[0_18px_48px_rgba(0,0,0,0.22)] ${className}`}
    >
      {children}
    </section>
  );
}
