import Calendar from '../components/Calendar';
import ActivityList from '../components/ActivityList';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3">Availability</h2>
            <Calendar />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">What to do?</h2>
            <ActivityList />
          </div>
        </div>
      </main>
    </div>
  );
}
