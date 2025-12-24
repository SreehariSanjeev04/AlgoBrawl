"use client";

import React, { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@monaco-editor/react"),  {ssr: false});
import { LANGUAGE_VERSIONS } from "@/constants/lang_constants";
import { toast } from "sonner";
import socket from "@/app/socket/socket";
import { redirect, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import BOILERPLATE from "../../constants/boilerplate";
import CodeTimer from "../CodeTimer/CodeTimer";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useSocketEditor } from "@/hooks/useSocketEditor";

const CodeEditor = ({ roomId, problem }) => {
  const BACKEND_URI = process.env.BACKEND_URI || "http://localhost:5000/api";
  const editorRef = useRef(null);
  const [language, setLanguage] = useState("python");
  const [value, setValue] = useState(BOILERPLATE[language] || "");
  const [outputValue, setOutputValue] = useState("// Output will appear here");
  const [outputError, setOutputError] = useState(false);
  const [subLoading, setCodeLoading] = useState(false);
  const [testcase, setTestcase] = useState("");
  const [expected, setExpected] = useState("");
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(Infinity); // 15 minutes in seconds
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const currentLanguages = Object.entries(LANGUAGE_VERSIONS);
  const valueRef = useRef(value);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  // auto save the code every 10 seconds

  useAutoSave(`code_${roomId}_${user?.id}`, value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const handleKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      console.log("Submitting code...");
      submitCode(false);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "e") {
      e.preventDefault();
      console.log("Running code...");
      runCode();
    }
  });


  useEffect(() => {
    if(loading) return;
    if(!isAuthenticated && !loading) {
      redirect("/login");
    }
  }, [isAuthenticated, loading])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (problem?.testcases.length) {
      console.log(problem.testcases);
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

  // retrieve saved code from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${roomId}_${user?.id}`);
    if (savedCode) {
      setValue(savedCode);
    }
  }, [roomId, user?.id]);

  useEffect(() => {
  
  })

  useEffect(() => {
    socket.on("match-ended", (matchData) => {
      if (matchData.result === "win") toast.success(matchData.message);
      else toast.error(matchData.message);
      setInterval(() => {
        router.push("/dashboard");
      }, 5000);
    });

    socket.on("time-up", () => { // socket when time is up
      toast.error("Time's up! Auto-submitting your code.");
      submitCode(true);
    })

    socket.on("match-time", ({ duration }) => {
      setTimeLeft(duration);
    })

    socket.on("solution-feedback", (details) => {
      setOutputError(!details.passed);
      setOutputValue(details.message);
    });

    socket.on("player-disconnected", ({ username }) => {
      toast.error(`Player ${username} has disconnected. Match paused.`);
    })

    socket.on("match-resumed", ({ username }) => {
      toast.success(`Player ${username} has reconnected. Match resumed.`);
    })

    return () => {
      socket.off("match-ended");
      socket.off("solution-feedback");
      socket.off("time-up");
      socket.off("solution-feedback");
    };
  }, []);

  const submitCode = async (isAuto) => {
    setCodeLoading(true);
    const payload = {
      roomId,
      username: user?.id,
      language,
      code: value,
      testcases: input,
      expected,
      isAuto,
    }
    try {
      socket.emit("submit-solution", payload, (response) => {
        if (response.status === "ok") {
          console.log("Submission received");
          toast.success("Code submitted successfully!");
        } else {
          console.log("Submission error:", response.message);
          toast.error(`Submission failed, try again!`);
        }
      });
    } catch (err) {
      console.log(err);
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
      console.log(data);
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
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col">
      <div className="p-4 flex flex-wrap items-center gap-4 font-semibold bg-gray-800 shadow">
        <div className="flex items-center gap-2">
          <label htmlFor="language" className="text-sm text-gray-300">
            Language:
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-700 text-gray-200 border border-gray-600 rounded px-2 py-1 text-sm focus:ring focus:ring-blue-500"
          >
            {currentLanguages.map(([lang]) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={runCode}
          disabled={subLoading}
          onMouseOver={() => {}}
          className={`px-4 py-2 rounded-lg font-semibold text-black bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 transition-all duration-200 ${
            subLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {subLoading ? "Running..." : "Run"}
        </button>
        <button
          onClick={() => submitCode(false)}
          disabled={subLoading}
          className={`px-4 py-2 rounded-lg font-semibold text-black bg-gradient-to-r from-green-500 to-teal-500 hover:opacity-90 transition-all duration-200 ${
            subLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {subLoading ? "Submitting" : "Submit"}
        </button>
        <CodeTimer duration={timeLeft} />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-4 p-4">
        <div className="col-span-12 md:col-span-3 bg-gray-800 p-4 rounded-xl overflow-auto">
          <h2 className="text-xl font-bold mb-2">
            {problem?.title || "Problem Title"}
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            {problem?.description || "// Describe the problem here"}
          </p>

          <div className="mt-6 bg-gray-700 p-3 rounded-xl">
            <h3 className="text-md font-semibold mb-2 text-white">Testcases</h3>
            {problem?.testcases?.length ? (
              problem.testcases.slice(0, 3).map((testcase, idx) => (
                <div
                  key={idx}
                  className="mb-3 p-2 border border-gray-600 rounded bg-gray-800 text-sm text-gray-300"
                >
                  <p>
                    <span className="text-gray-400">Input:</span>{" "}
                    {testcase.input}
                  </p>
                  <p>
                    <span className="text-gray-400">Expected:</span>{" "}
                    {testcase.output}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400">// Testcases will appear here</p>
            )}
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 bg-gray-800 rounded-xl overflow-hidden">
          <Editor
            theme="vs-dark"
            height="100%"
            language={language}
            defaultValue={BOILERPLATE[language] || ""}
            value={value}
            onChange={(val) => setValue(val || "")}
            onMount={onMount}
          />
        </div>

        <div className="col-span-12 md:col-span-3 flex flex-col gap-2">
          <div className="bg-gray-800 p-4 rounded-xl h-1/2 overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Output</h2>
            <pre
              className={`text-sm whitespace-pre-wrap ${
                outputError ? "text-red-500" : "text-green-400"
              }`}
            >
              {outputValue}
            </pre>
          </div>

          <div className="bg-gray-800 p-4 rounded-xl h-1/2">
            <h2 className="text-lg font-semibold mb-2">Custom Testcase</h2>
            <textarea
              className="w-full h-64 bg-gray-900 text-gray-200 border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
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
