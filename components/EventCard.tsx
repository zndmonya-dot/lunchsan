'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import Link from 'next/link'
import type { Database } from '@/types/database'

type LunchEvent = Database['public']['Tables']['lunch_events']['Row']
type EventParticipant = Database['public']['Tables']['event_participants']['Row'] & {
  profiles: {
    name: string | null
    email: string
  } | null
}

interface EventCardProps {
  event: LunchEvent & {
    event_participants: EventParticipant[]
  }
}

const locationTypeLabels = {
  freeroom: 'フリースペース',
  restaurant: '外食',
  undecided: '未定',
}

const statusLabels = {
  going: '参加',
  not_going: '不参加',
  maybe: '未回答',
}

const statusColors = {
  going: 'bg-green-100 text-green-800 border border-green-200',
  not_going: 'bg-gray-100 text-gray-800 border border-gray-200',
  maybe: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
}

export default function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date)
  const goingCount = event.event_participants.filter(p => p.status === 'going').length
  const notGoingCount = event.event_participants.filter(p => p.status === 'not_going').length
  const maybeCount = event.event_participants.filter(p => p.status === 'maybe').length

  return (
    <Link href={`/events/${event.id}`}>
      <div className="hover-card bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 hover:border-orange-400 h-full flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 flex-1">
            {event.title || `${format(eventDate, 'M月d日', { locale: ja })}のお昼`}
          </h3>
          <span className="text-sm font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg ml-2 whitespace-nowrap">
            {format(eventDate, 'M/d(E)', { locale: ja })}
          </span>
        </div>
        
        {(event.start_time || event.end_time) && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="font-medium">
              {event.start_time ? event.start_time.substring(0, 5) : '12:00'} 〜 {event.end_time ? event.end_time.substring(0, 5) : '13:00'}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
            event.location_type === 'restaurant' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
            event.location_type === 'freeroom' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
            'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {locationTypeLabels[event.location_type]}
          </span>
          {event.restaurant_name && (
            <span className="text-sm text-gray-700 truncate font-medium px-2 py-1 bg-gray-50 rounded">
              {event.restaurant_name}
            </span>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm mb-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-600 font-bold text-base">{goingCount}</span>
            <span className="text-gray-500 text-xs">参加</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 font-bold text-base">{notGoingCount}</span>
            <span className="text-gray-500 text-xs">不参加</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <span className="text-yellow-600 font-bold text-base">{maybeCount}</span>
            <span className="text-gray-500 text-xs">未回答</span>
          </div>
        </div>

        {event.event_participants.length > 0 && (
          <div className="pt-3 border-t border-gray-100 mt-auto">
            <div className="flex flex-wrap gap-2">
              {event.event_participants.slice(0, 4).map((participant) => (
                <span
                  key={participant.id}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[participant.status]}`}
                >
                  {participant.profiles?.name || participant.name || participant.profiles?.email?.split('@')[0] || participant.email?.split('@')[0] || '匿名'}
                </span>
              ))}
              {event.event_participants.length > 4 && (
                <span className="text-xs text-gray-500 px-2.5 py-1 bg-gray-50 rounded-lg">
                  +{event.event_participants.length - 4}人
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}

