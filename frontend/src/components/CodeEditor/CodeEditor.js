"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });
import { LANGUAGE_VERSIONS } from "@/constants/lang_constants";
import { toast } from "sonner";
import socket from "@/app/socket/socket";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BOILERPLATE from "../../constants/boilerplate";
import CodeTimer from "../CodeTimer/CodeTimer";
import { useAutoSave } from "@/hooks/useAutoSave";
import SectionLabel from "@/components/ui/SectionLabel";
import Button from "@/components/ui/Button";

const CodeEditor = ({ roomId, problem }) => {
  const BACKEND_URI = process.env.NEXT_PUBLIC_BACKEND_URI || "http://localhost:5000/api";
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("python");
  const [value, setValue] = useState(BOILERPLATE[language] || "");
  const [outputValue, setOutputValue] = useState("// output will appear here");
  const [outputError, setOutputError] = useState(false);
  const [subLoading, setCodeLoading] = useState(false);
  const [testcase, setTestcase] = useState("");
  const [expected, setExpected] = useState("");
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(Infinity);
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const currentLanguages = Object.entries(LANGUAGE_VERSIONS);
  const valueRef = useRef(value);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  useAutoSave(`code_${roomId}_${user?.id}`, value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      submitCode(false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "e") {
      e.preventDefault();
      runCode();
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated && !loading) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (problem?.testcases?.length) {
      const inputStr = problem.testcases.map((t) => t.input).join("\n");
      let expectedStr = problem.testcases.map((t) => t.output).join("\n");
      expectedStr += "\n";
      setInput(inputStr);
      setExpected(expectedStr);
    }
  }, [problem]);

  useEffect(() => {
    setValue(BOILERPLATE[language] || "");
  }, [language]);

  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${roomId}_${user?.id}`);
    if (savedCode) {
      setValue(savedCode);
    }
  }, [roomId, user?.id]);

  useEffect(() => {
    socket.on("match-ended", ({ winner }) => {
      if (winner === user?.id) toast.success("You won the match!");
      else toast.error("You lost. Better luck next time!");
      setTimeout(() => router.push("/dashboard"), 5000);
    });

    socket.on("time-up", () => {
      toast.error("Time's up! Auto-submitting your code.");
      submitCode(true);
    });

    socket.on("match-time", ({ duration }) => {
      setTimeLeft(duration);
    });

    socket.on("solution-feedback", (details) => {
      setOutputError(!details.passed);
      setOutputValue(details.message);
    });

    socket.on("player-disconnected", ({ username }) => {
      toast.error(`${username} disconnected. Match paused.`);
    });

    socket.on("match-resumed", ({ username }) => {
      toast.success(`${username} reconnected. Match resumed.`);
    });

    return () => {
      socket.off("match-ended");
      socket.off("time-up");
      socket.off("match-time");
      socket.off("solution-feedback");
      socket.off("player-disconnected");
      socket.off("match-resumed");
    };
  }, []);

  const submitCode = async (isAuto) => {
    setCodeLoading(true);
    const payload = {
      roomId,
      userId: user?.id,
      language,
      code: value,
      testcases: input,
      expected,
      isAuto,
    };
    try {
      socket.emit("submit-solution", payload, (response) => {
        if (response.status === "ok") {
          toast.success("Code submitted!");
        } else {
          toast.error("Submission failed, try again!");
        }
      });
    } catch (err) {
      setOutputError(true);
      setOutputValue(err.message || "Could not connect to backend");
    } finally {
      setCodeLoading(false);
    }
  };

  const runCode = async () => {
    setCodeLoading(true);
    try {
      const res = await fetch(`${BACKEND_URI}/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          language,
          code: value,
          testcases: testcase,
        }),
      });

      const data = await res.json();
      setOutputError(!res.ok);
      setOutputValue(data.output || data.error || "No output");
    } catch {
      setOutputError(true);
      setOutputValue("Error connecting to backend.");
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-[#08090a] text-zinc-100 flex flex-col">
      <div className="flex items-center justify-between h-11 px-4 border-b border-[var(--border-default)] bg-[#08090a]/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="language" className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
              lang
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-surface-1 text-zinc-300 border border-[var(--border-default)] rounded-[var(--radius-sm)] px-2 py-1 text-[12px] font-mono focus:outline-none focus:border-accent/50 appearance-none cursor-pointer"
            >
              {currentLanguages.map(([lang]) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="xs"
              onClick={runCode}
              disabled={subLoading}
            >
              {subLoading ? "running..." : "run"}
            </Button>
            <Button
              variant="primary"
              size="xs"
              onClick={() => submitCode(false)}
              disabled={subLoading}
            >
              {subLoading ? "submitting..." : "submit"}
            </Button>
          </div>
        </div>

        <CodeTimer duration={timeLeft} />
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-px bg-[var(--border-default)] overflow-hidden">
        <div className="lg:w-72 bg-surface-1 overflow-y-auto p-4 flex-shrink-0">
          <h2 className="text-[13px] font-semibold text-zinc-200 mb-2">
            {problem?.title || "Problem"}
          </h2>
          <p className="text-[12px] text-zinc-500 leading-relaxed mb-4">
            {problem?.description || "// Loading problem description..."}
          </p>

          <SectionLabel className="mb-2 block">test cases</SectionLabel>
          <div className="space-y-2">
            {problem?.testcases?.length ? (
              problem.testcases.slice(0, 3).map((tc, idx) => (
                <div
                  key={idx}
                  className="bg-black/40 border border-[var(--border-default)] rounded-[var(--radius-sm)] p-2.5"
                >
                  <div className="text-[11px] font-mono text-zinc-500">
                    <span className="text-zinc-600">input:</span> {tc.input}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-500 mt-0.5">
                    <span className="text-zinc-600">expected:</span> {tc.output}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[11px] font-mono text-zinc-600">{'// test cases will appear here'}</p>
            )}
          </div>
        </div>

        <div className="flex-1 bg-surface-1 overflow-hidden min-w-0">
          <Editor
            theme="hc-black"
            height="100%"
            language={language}
            defaultValue={BOILERPLATE[language] || ""}
            value={value}
            onChange={(val) => setValue(val || "")}
            onMount={onMount}
            options={{
              fontSize: 13,
              fontFamily: "var(--font-geist-mono), JetBrains Mono, monospace",
              lineNumbers: "on",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 12 },
              renderLineHighlight: "line",
              cursorBlinking: "smooth",
              cursorStyle: "line",
              smoothScrolling: true,
              bracketPairColorization: { enabled: true },
            }}
          />
        </div>

        <div className="lg:w-72 bg-surface-1 flex flex-col flex-shrink-0">
          <div className="flex-1 p-4 border-b border-[var(--border-default)] overflow-y-auto">
            <SectionLabel className="mb-2 block">output</SectionLabel>
            <pre
              className={`text-[12px] font-mono whitespace-pre-wrap ${
                outputError ? "text-danger" : "text-accent"
              }`}
            >
              {outputValue}
            </pre>
          </div>

          <div className="p-4">
            <SectionLabel className="mb-2 block">custom input</SectionLabel>
            <textarea
              className="w-full h-24 bg-black/40 text-zinc-300 border border-[var(--border-default)] rounded-[var(--radius-sm)] p-2.5 text-[11px] font-mono focus:outline-none focus:border-accent/50 resize-none"
              placeholder="Enter test case input here..."
              value={testcase}
              onChange={(e) => setTestcase(e.target.value)}
              name="test-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;