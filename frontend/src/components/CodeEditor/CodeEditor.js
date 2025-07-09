"use client";

import React, { useRef, useState } from "react";
import { Editor } from "@monaco-editor/react";
import { LANGUAGE_VERSIONS } from "../lang_constants";

const CodeEditor = () => {
  const BACKEND_URI = process.env.BACKEND_URI || "http://localhost:5000/api";
  const editorRef = useRef(null);
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [outputValue, setOutputValue] = useState("// Output will appear here");
  const [outputError, setOutputError] = useState(false);

  const currentLanguages = Object.entries(LANGUAGE_VERSIONS);

  const onMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  /*{
  "id": 2,
  "title": "Sum of Digits",
  "description": "Given a non-negative integer n, return the sum of its digits.",
  "testcases": [
    {
      "input": "123",
      "expected": "6"
    },
    {
      "input": "0",
      "expected": "0"
    },
    {
      "input": "9999",
      "expected": "36"
    }
  ],
  "difficulty": "Easy",
  "createdAt": "2025-06-23T12:21:13.021Z",
  "updatedAt": "2025-06-23T12:21:13.021Z"
} */

  const submitCode = async () => {
    const blob = await fetch(`${BACKEND_URI}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        language,
        code: value,
      }),
    });
    const response = await blob.json();
    setOutputError(!blob.ok);
    setOutputValue(response);
  };

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col">
      <div className="p-4 flex items-center gap-4 font-semibold">
        <label htmlFor="language" className="text-sm text-gray-300">
          Language:
        </label>
        <select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="bg-gray-800 border text-gray-300 border-gray-600 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {currentLanguages.map(([lang]) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button
          className="inline-block bg-gradient-to-r from-green-500 to-teal-500 px-3 py-2 rounded-xl font-semibold text-black hover:opacity-90 transition-all duration-200"
          onClick={submitCode}
        >
          Submit
        </button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-2 p-2">
        <div className="col-span-12 md:col-span-3 bg-gray-800 p-4 rounded-lg overflow-auto">
          <h2 className="text-lg font-semibold mb-2">Problem Description</h2>
          <p className="text-sm text-gray-400">
            // Describe the problem or input here
          </p>
        </div>

        <div className="col-span-12 md:col-span-6 bg-gray-800 rounded-lg overflow-hidden">
          <Editor
            theme="vs-dark"
            height="100%"
            language={language}
            defaultValue="// some comment"
            value={value}
            onChange={(val) => setValue(val || "")}
            onMount={onMount}
          />
        </div>

        <div className="col-span-12 md:col-span-3">
          <div className="bg-gray-800 h-1/2 p-4 rounded-lg overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Output</h2>
            <p
              className={`text-sm ${
                outputError ? "text-red-500" : "text-gray-400"
              }`}
            >
              {outputValue.output}
            </p>
          </div>
          <div className="h-1/2 bg-gray-800 mt-2 p-4 rounded-lg overflow-auto">
            <h2 className="text-lg font-semibold mb-2">Testcase</h2>
            <textarea
              className="h-full w-full bg-gray-900 text-gray-200 border border-gray-700 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
              placeholder="Enter test case input here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;
