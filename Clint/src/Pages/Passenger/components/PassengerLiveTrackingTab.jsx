import LiveFleetTracker from '@/Components/Map/LiveFleetTracker'

export default function PassengerLiveTrackingTab({ initialBusId = 'all' }) {
  return (
    <LiveFleetTracker
      initialBusId={initialBusId}
      title="Live Campus Bus Tracking Map"
      subtitle="View real-time locations, live speed, heading, and movement trails of all active campus shuttle buses."
    />
  )
}
