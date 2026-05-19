import { ProductForm } from "@/components/admin/product-form";

export default function NewProductPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <p className="eyebrow">Catalog</p>
        <h1 className="display-serif text-3xl lg:text-4xl mt-2">New product</h1>
      </header>
      <ProductForm />
    </div>
  );
}