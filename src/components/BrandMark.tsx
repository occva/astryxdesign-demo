export function BrandMark({className = ''}: {className?: string}) {
  return (
    <img
      className={`size-8 shrink-0 rounded-xl ${className}`}
      src="/original-logo.png"
      alt=""
      aria-hidden="true"
    />
  );
}
