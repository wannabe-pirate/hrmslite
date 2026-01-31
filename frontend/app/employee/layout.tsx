// app/employee/attendance/layout.tsx

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      {children}
    </section>
  );
}
