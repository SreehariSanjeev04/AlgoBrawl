import React from 'react'
import SectionLabel from '@/components/ui/SectionLabel'
import Card from '@/components/ui/Card'

const FriendsComponent = () => {
  return (
    <Card className="w-56 overflow-y-auto" hover={false}>
      <div className="p-3">
        <SectionLabel>friends online</SectionLabel>
        <p className="text-[11px] text-zinc-600 mt-2">No friends online</p>
      </div>
    </Card>
  )
}

export default FriendsComponent