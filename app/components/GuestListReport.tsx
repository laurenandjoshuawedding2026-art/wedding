import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

// Query to get all guests and their response details
const GUEST_REPORT_QUERY = `*[_type == "guest"] | order(name asc) {
  _id,
  name,
  RSVP_status,
  attending_count,
  table_number,
  dietary_restrictions
}`

export function GuestListReport() {
  const [guests, setGuests] = useState<any[]>([])
  const client = useClient({ apiVersion: '2023-01-01' })

  useEffect(() => {
    client.fetch(GUEST_REPORT_QUERY).then(setGuests)
  }, [client])

  const totalAttending = guests.reduce(
    (acc, curr) => acc + (curr.RSVP_status === 'attending' ? (curr.attending_count || 1) : 0),
    0
  )

  return (
    <div style={{ padding: '40px', background: 'white', color: 'black', minHeight: '100%', overflowY: 'auto' }}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { margin: 0; padding: 0; }
            .report-container { width: 100% !important; max-width: none !important; padding: 0 !important; }
          }
          .report-container { 
            max-width: 1000px; 
            margin: 0 auto; 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .summary-cards { display: flex; gap: 20px; margin-top: 30px; }
          .card { border: 1px solid #D6AA67; padding: 20px; border-radius: 8px; flex: 1; }
          .card-label { font-size: 10px; text-transform: uppercase; color: #8B5E1F; letter-spacing: 0.1em; font-weight: bold; }
          .card-value { font-size: 28px; font-weight: bold; margin-top: 8px; color: #111; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          th { 
            text-align: left; 
            padding: 14px; 
            border-bottom: 2px solid #D6AA67; 
            color: #8B5E1F;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          td { padding: 14px; border-bottom: 1px solid #f0f0f0; font-size: 13px; color: #333; }
          .status-tag { 
            padding: 4px 10px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: bold; 
            text-transform: uppercase;
          }
          .attending { background: #E6F4EA; color: #1E7E34; }
          .declined { background: #FCE8E6; color: #D93025; }
          .pending { background: #F1F3F4; color: #5F6368; }
        `}
      </style>

      <div className="report-container">
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', color: '#8B5E1F', fontFamily: 'serif' }}>Guest Response Report</h1>
            <p style={{ margin: '8px 0 0 0', color: '#D6AA67', fontSize: '16px', fontWeight: 'bold' }}>Lauren & Joshua • 2026</p>
          </div>
          <button 
            className="no-print"
            onClick={() => window.print()}
            style={{ 
              background: '#D6AA67', color: 'white', border: 'none', 
              padding: '12px 24px', borderRadius: '4px', cursor: 'pointer',
              fontWeight: 'bold', fontSize: '13px'
            }}
          >
            Download PDF
          </button>
        </header>

        <div className="summary-cards">
          <div className="card">
            <div className="card-label">Total Guests</div>
            <div className="card-value">{guests.length}</div>
          </div>
          <div className="card">
            <div className="card-label">Confirmed Seats</div>
            <div className="card-value" style={{ color: '#1E7E34' }}>{totalAttending}</div>
          </div>
          <div className="card">
            <div className="card-label">Missing RSVP</div>
            <div className="card-value">{guests.filter(g => !g.RSVP_status).length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Guest Name</th>
              <th>Status</th>
              <th>Seats</th>
              <th>Table</th>
              <th>Dietary Restrictions</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <tr key={guest._id}>
                <td style={{ fontWeight: '600' }}>{guest.name}</td>
                <td>
                  <span className={`status-tag ${guest.RSVP_status || 'pending'}`}>
                    {guest.RSVP_status || 'Pending'}
                  </span>
                </td>
                <td>{guest.RSVP_status === 'attending' ? (guest.attending_count || 1) : '-'}</td>
                <td>{guest.table_number || 'TBD'}</td>
                <td style={{ color: '#666', fontStyle: 'italic' }}>{guest.dietary_restrictions || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
