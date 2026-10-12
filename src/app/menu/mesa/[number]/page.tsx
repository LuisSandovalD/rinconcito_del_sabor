import { TableMenuPage } from "@/components/storefront/table-menu-page";

export default async function PublicTableMenuPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  return <TableMenuPage tableNumber={Number(number)} />;
}
