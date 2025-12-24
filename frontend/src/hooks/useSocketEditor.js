import socket from "@/app/socket/socket";
import { createContext, useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export const useSocketEditor = (roomId, { onTimeUpdate, onMatchEnd, onFeedback, onTimeUp, currentValue }) => {
    const valueRef = useRef(currentValue);

    useEffect(() => {
        valueRef.current = currentValue;
    }, [currentValue]);

    useEffect(() => {
        socket.on("match-time", ({ duration }) => onTimeUpdate(duration));

        socket.on("match-ended", (data) => {
            if(data.result === "win") toast.success(data.message);
            else toast.error(data.message);
            onMatchEnd(data);
        });

        socket.on("time-up", () => {
            toast.error("Time's up! Auto-submitting your code.");
            onTimeUp();
        });

        socket.on("solution-feedback", onFeedback);

        return () => {
            socket.off("match-time");
            socket.off("match-ended");
            socket.off("time-up");
            socket.off("solution-feedback");
        }
    })
}