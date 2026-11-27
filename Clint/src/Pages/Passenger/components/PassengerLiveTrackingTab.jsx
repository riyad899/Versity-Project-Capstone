import { useState, useEffect } from 'react'
import apiClient from '../../../Hooks/Axios'
import { Navigation, Bus, Route, Radio, RotateCw, MapPin, Gauge } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'
import GoogleMapView from '@/Components/Map/GoogleMapView'

export default function PassengerLiveTrackingTab() {
  const [liveTrips, setLiveTrips] = useState([])
  const [selectedTrip, setSelectedTrip] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchLiveTrips = async () => {
    try {
      const res = await apiClient.get('/api/v1/trips/live')
      const data = res.data?.data || []
      setLiveTrips(data)
      if (data.length > 0 && !selectedTrip) {
        setSelectedTrip(data[0])
      }
    } catch (err) {
      console.error('Failed to load live trips:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLiveTrips()
    const interval = setInterval(fetchLiveTrips, 7000) // auto-refresh every 7s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card className="p-16 text-center text-slate-500 border-slate-200">
        <RotateCw className="h-7 w-7 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-sm font-medium">Connecting to campus GPS live tracking...</p>
      </Card>
    )
  }

  if (liveTrips.length === 0) {
    return (
      <Card className="p-12 text-center border-slate-200/90 shadow-sm bg-white">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-3">
          <Bus className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No Active Trips in Transit</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
          Currently, no drivers have active trips started. As soon as a campus bus driver starts their trip, their live GPS location and route pathway will appear here in real time.
        </p>
      </Card>
    )
  }

  const activeTripToShow = selectedTrip || liveTrips[0]

  return (
    <div className="space-y-6">
      {/* Live status banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-950 block">
              {liveTrips.length} Campus Shuttle{liveTrips.length === 1 ? '' : 's'} Currently in Transit
            </span>
            <span className="text-[11px] text-emerald-700">
              Live GPS broadcast updated automatically every 7 seconds
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {liveTrips.map((t) => (
            <button
              key={t._id}
              onClick={() => setSelectedTrip(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeTripToShow?._id === t._id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              #{t.bus?.busNumber}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Google Map & Trip Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
            <CardHeader className="py-3 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Navigation className="h-4 w-4 text-blue-600" />
                Live Map View: {activeTripToShow?.bus?.name} (#{activeTripToShow?.bus?.busNumber})
              </CardTitle>
              <Badge variant="softGreen" className="text-[11px]">
                Live Signal Active
              </Badge>
            </CardHeader>
            <CardContent className="p-3">
              <GoogleMapView
                busLocation={activeTripToShow?.currentLocation}
                busInfo={activeTripToShow?.bus}
                routeInfo={activeTripToShow?.route}
                height="450px"
              />
            </CardContent>
          </Card>
        </div>

        {/* Selected Bus Telemetry */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="py-3.5 px-5 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Trip & Bus Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Bus</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {activeTripToShow?.bus?.name} (#{activeTripToShow?.bus?.busNumber})
                  </span>
                </div>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {activeTripToShow?.bus?.licensePlate}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Route</span>
                <span className="font-bold text-blue-800 text-xs block">
                  {activeTripToShow?.route?.routeName}
                </span>
                <span className="text-slate-600 block">
                  {activeTripToShow?.route?.startPoint} → {activeTripToShow?.route?.endPoint}
                </span>
              </div>

              {activeTripToShow?.route?.stops?.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Upcoming Intermediate Stops
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {activeTripToShow.route.stops.map((s, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]"
                      >
                        <MapPin className="h-2.5 w-2.5 text-blue-500" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-slate-700">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Speed</span>
                  <span className="font-bold text-blue-600 text-sm">
                    {activeTripToShow?.currentLocation?.speed || 0} km/h
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">Driver</span>
                  <span className="font-bold text-slate-900 truncate block">
                    {activeTripToShow?.driver?.name || 'Assigned Driver'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
