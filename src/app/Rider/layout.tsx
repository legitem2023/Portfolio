// app/rider/layout.js
export const metadata = {
  title: {
    default: "Rider Dashboard",
    template: "%s | VendorCity Rider"
  },
  description: "VendorCity Rider Tracking and Management System",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RiderLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      {children}
    </div>
  );
}
