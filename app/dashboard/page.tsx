// app/dashboard/page.tsx

export default function Dashboard() {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6">
        <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-900 dark:text-white">
          Choose an action from the sidebar to start.
        </p>
      </main>
    </div>
  );
}
