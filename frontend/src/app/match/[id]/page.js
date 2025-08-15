"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Editor } from '@monaco-editor/react'
import CodeEditor from '@/components/CodeEditor/CodeEditor'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation' 
import { toast } from 'sonner'
const Match = () => {
    const params = useParams()
    const router = useRouter()
    const { id } = params;
    const [problem, setProblem] = useState({});
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const fetchMatchDetails = async () => {
            setLoading(true)
            try {
                const response = await fetch(`http://localhost:5000/api/match/${id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json"
                }
            });
            
            if(!response.ok) {
                toast.error("Error fetching problem description")
                router.replace("/")
            }

            const matchDetails = await response.json()

            setProblem(matchDetails?.room.problem)
            } catch(err) {
                console.log(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchMatchDetails()
    }, [])
    return loading ? <h1>Loading...</h1> : <CodeEditor roomId={id} problem={problem} />
}

export default Match