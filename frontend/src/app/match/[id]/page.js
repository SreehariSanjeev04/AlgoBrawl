"use client"

import React, { useEffect, useState } from 'react'
import CodeEditor from '@/components/CodeEditor/CodeEditor'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import axios from 'axios'

const Match = () => {
    const params = useParams()
    const { id } = params
    const [problem, setProblem] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchMatchDetails = async () => {
            setLoading(true)
            try {
                const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI || "http://localhost:5000/api"
                const response = await axios.get(`${BACKEND_URI}/match/${id}`)
                setProblem(response.data?.room.problem)
            } catch(err) {
                toast.error("Failed to load match")
            } finally {
                setLoading(false)
            }
        }
        fetchMatchDetails()
    }, [id])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#08090a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-5 h-5 border border-accent/30 border-t-accent rounded-full animate-spin" />
                    <span className="text-[11px] font-mono text-zinc-500">Loading match...</span>
                </div>
            </div>
        )
    }

    return <CodeEditor roomId={id} problem={problem} />
}

export default Match