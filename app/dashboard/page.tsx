// app/dashboard/page.tsx

// import LogViewer from "../components/reports/LogViewer";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        {/* <LogViewer /> */}
      </main>
    </div>
  );
}
