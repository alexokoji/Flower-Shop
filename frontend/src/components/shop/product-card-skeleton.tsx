export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-2xl bg-muted" />
      <div className="pt-3 px-1 space-y-2">
        <div className="h-4 rounded bg-muted w-3/4" />
        <div className="h-3 rounded bg-muted w-1/3" />
        <div className="h-4 rounded bg-muted w-1/4" />
      </div>
    </div>
  );
}
