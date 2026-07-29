"use client"

import React, { useEffect, useRef, useState } from 'react'
import { Editor } from '@monaco-editor/react'
import CodeEditor from '@/components/CodeEditor/CodeEditor'
import { useParams } from 'next/navigation'
import { useRouter } from 'next/navigation' 
import { toast } from 'sonner'
import axios from 'axios'
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
                const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI || "http://localhost:5000/api"
                const response = await axios.get(`${BACKEND_URI}/match/${id}`)
                
                setProblem(response.data?.room.problem)
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