import React, { useEffect, useState } from 'react'
import { useClient } from 'sanity'

const WISHES_QUERY = `*[_type == "wish"] | order(createdAt desc) {
  _id,
  guestName,
  message,
  createdAt
}`

export function WishesReport() {
  const [wishes, setWishes] = useState<any[]>([])
  const client = useClient({ apiVersion: '2023-01-01' })

  useEffect(() => {
    client.fetch(WISHES_QUERY).then(setWishes)
  }, [client])

  return (
    <div style={{ padding: '40px', background: '#FFF5EF', minHeight: '100%', overflowY: 'auto' }}>
      <style>
        {`
          @media print { .no-print { display: none !important; } }
          .wish-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 25px;
            margin-top: 30px;
          }
          .wish-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            border-left: 5px solid #D6AA67;
            box-shadow: 0 4px 15px rgba(168, 117, 38, 0.1);
            position: relative;
          }
          .guest-name {
            font-family: serif;
            font-size: 18px;
            color: #8B5E1F;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .message {
            font-size: 14px;
            line-height: 1.6;
            color: #444;
            font-style: italic;
          }
          .date {
            font-size: 10px;
            color: #D6AA67;
            margin-top: 15px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
        `}
      </style>

      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #D6AA67', paddingBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '32px', color: '#8B5E1F', fontFamily: 'serif' }}>Wall of Love</h1>
            <p style={{ margin: '5px 0 0 0', color: '#D6AA67' }}>Total Wishes Received: {wishes.length}</p>
          </div>
          <button className="no-print" onClick={() => window.print()} style={{ background: '#D6AA67', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            Print Wall
          </button>
        </header>

        <div className="wish-grid">
          {wishes.map((wish) => (
            <div key={wish._id} className="wish-card">
              <div className="guest-name">{wish.guestName}</div>
              <div className="message">"{wish.message}"</div>
              <div className="date">{new Date(wish.createdAt).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}