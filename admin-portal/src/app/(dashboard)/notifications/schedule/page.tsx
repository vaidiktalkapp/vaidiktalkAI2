// app/(dashboard)/notifications/schedule/page.tsx (NEW)
import ScheduleForm from '@/components/forms/ScheduleForm';

export default function SchedulePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Schedule Notification</h1>
        <p className="text-gray-600 mt-2">Schedule a notification for future delivery</p>
      </div>

      <ScheduleForm />
    </div>
  );
}
