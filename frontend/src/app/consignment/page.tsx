export const metadata = { title: "Consignment" };

export default function ConsignmentPage() {
  return (
    <div className="container-edge min-h-[60vh] flex flex-col items-center justify-center text-center py-24 lg:py-32">
      <p className="eyebrow mb-6">Consignment</p>
      <h1 className="display-serif font-bold text-6xl md:text-7xl lg:text-8xl tracking-tight">
        Coming <span className="text-roseGold">Soon</span>
      </h1>
      <p className="mt-6 text-muted-foreground max-w-md">
        We're building something special — check back soon.
      </p>
    </div>
  );
}