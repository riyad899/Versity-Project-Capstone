import { useState, useEffect } from 'react'
import apiClient from '../../../Hooks/Axios'
import { History, Bus, Route, Clock, Calendar, CheckCircle2, RotateCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/Components/ui/card'
import { Badge } from '@/Components/ui/badge'

export default function DriverTripHistoryTab() {
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/api/v1/trips/history')
        setTrips(res.data?.data || [])
      } catch (err) {
        console.error('Failed to load trip history:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <Card className="p-16 text-center text-slate-500 border-slate-200">
        <RotateCw className="h-6 w-6 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-sm font-medium">Loading completed trips history...</p>
      </Card>
    )
  }

  if (trips.length === 0) {
    return (
      <Card className="p-12 text-center border-slate-200/90 shadow-sm bg-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-3">
          <History className="h-6 w-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">No Previous Trips Logged</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          When you start and complete trips on your assigned route, they will be archived here with exact timestamps and remarks.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
          <History className="h-5 w-5 text-blue-600" />
          Driver Trip History
        </h2>
        <p className="text-xs text-slate-500">Record of your recent started and completed transit trips.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {trips.map((trip) => {
          const startDate = trip.startTime ? new Date(trip.startTime) : null
          const endDate = trip.endTime ? new Date(trip.endTime) : null
          const durationMinutes =
            startDate && endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : null

          return (
            <Card key={trip._id} className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <CardHeader className="py-3.5 px-5 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs font-bold">
                    #{trip.bus?.busNumber || 'Bus'}
                  </Badge>
                  <CardTitle className="text-sm font-bold text-slate-900 truncate">
                    {trip.bus?.name || 'Campus Shuttle'}
                  </CardTitle>
                </div>
                <Badge
                  variant={trip.status === 'in_progress' ? 'softGreen' : 'secondary'}
                  className="capitalize text-xs font-semibold"
                >
                  {trip.status === 'in_progress' ? 'In Progress' : 'Completed'}
                </Badge>
              </CardHeader>

              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                  <Route className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>{trip.route?.routeName || 'Transit Route'}</span>
                  <span className="text-slate-400 font-normal">
                    ({trip.route?.startPoint} → {trip.route?.endPoint})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-600">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Departure</span>
                    <span className="font-medium text-slate-900">
                      {startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {startDate ? startDate.toLocaleDateString() : ''}
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Arrival / End</span>
                    <span className="font-medium text-slate-900">
                      {endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Progress'}
                    </span>
                    {durationMinutes !== null && (
                      <span className="text-[10px] text-emerald-600 font-bold block">
                        Duration: {durationMinutes} mins
                      </span>
                    )}
                  </div>
                </div>

                {trip.remarks && (
                  <p className="text-[11px] text-slate-500 italic bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    Remarks: &ldquo;{trip.remarks}&rdquo;
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
