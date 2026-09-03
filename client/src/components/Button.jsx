export function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-ink text-white hover:bg-black',
    secondary: 'bg-white text-ink border border-stone-300 hover:bg-stone-50',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  };

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
