'use client'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { messages as initialMessages } from '@/lib/data'
import { Message } from '@/lib/types'
import { formatDateTime } from '@/lib/utils'

const ATHLETE_ID = 'a1'

export default function AthleteChatPage() {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')

  function handleSend() {
    if (!input.trim()) return
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: ATHLETE_ID,
      content: input.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    }
    setMessages(prev => [...prev, msg])
    setInput('')
  }

  return (
    <div className="flex flex-col h-screen" style={{ color: 'var(--text-primary)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border)' }}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-bold text-white">TC</div>
        <div>
          <div className="font-semibold">Tomasz Czajka</div>
          <div className="text-xs text-green-400">● Online</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-24">
        {messages.map(msg => {
          const isMe = msg.senderId === ATHLETE_ID
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${isMe ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-orange-500 to-orange-600'}`}>
                {isMe ? 'KW' : 'TC'}
              </div>
              <div className={`max-w-xs flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className="px-4 py-3 text-sm"
                  style={{
                    background: isMe ? '#FF5C1B' : 'var(--bg-elevated)',
                    color: isMe ? 'white' : 'var(--text-primary)',
                    borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  }}
                >
                  {msg.content}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDateTime(msg.timestamp)}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input - fixed at bottom above nav */}
      <div className="fixed bottom-20 left-0 right-0 max-w-sm mx-auto px-5 py-3" style={{ background: 'var(--bg-base)' }}>
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Napisz do trenera..."
            className="flex-1 px-4 py-3 rounded-2xl text-sm"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50"
            style={{ background: '#FF5C1B' }}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
