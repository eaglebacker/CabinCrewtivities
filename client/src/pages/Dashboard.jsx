import Calendar from '../components/Calendar';
import ActivityList from '../components/ActivityList';
import Navbar from '../components/Navbar';

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#6B3410' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
              </svg>
              Crew Availability
            </h2>
            <Calendar />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#6B3410' }}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Crewtivities
            </h2>
            <ActivityList />
          </div>
        </div>
      </main>
    </div>
  );
}
