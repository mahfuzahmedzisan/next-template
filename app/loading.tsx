export default function Loading() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <span className="route-fallback__track">
        <span className="route-fallback__progress" />
      </span>
      <span className="sr-only">Loading page</span>
    </div>
  );
}
