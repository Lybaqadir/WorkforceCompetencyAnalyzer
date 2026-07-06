export default function PulsingDots() {
  return (
    <div className="flex items-center gap-1.5 py-10 justify-center">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full bg-maroon/40 pulse-dot"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}
