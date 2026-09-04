export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-gradient-to-r from-[#b7adff] to-[#8da2ff] text-[#060c16] shadow-[0_8px_24px_rgba(146,164,255,0.35)] hover:brightness-110',
    secondary: 'border border-white/10 bg-[#1a2439] text-slate-100 hover:bg-[#242f49]',
    danger: 'bg-rose-600 text-white hover:bg-rose-500'
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-extrabold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
