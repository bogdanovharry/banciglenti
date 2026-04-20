import ShopPage from "@/app/(frontend)/shop/page";

// Category pages reuse the Shop page layout with filters
// In production, the slug would be used to filter products from Payload CMS
export default function CategoryPage() {
  return <ShopPage />;
}
