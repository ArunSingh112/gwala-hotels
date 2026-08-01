import { Suspense } from "react";
import { BookingsScreen } from "@/components/admin/bookings-screen";

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsScreen />
    </Suspense>
  );
}
