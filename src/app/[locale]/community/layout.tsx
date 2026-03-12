// ============================================================
// Community section layout
// ============================================================
// Each child page manages its own PageHeader and tab navigation.
// This layout serves as the shared container.

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
