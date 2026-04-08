"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import ChartView from "../components/ChartView";

export default function Home() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const uploadFile = async () => {
    const formData = new FormData();
    formData.append("file", file);

    await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, formData);
    alert("File uploaded!");
  };

  useEffect(() => {
    const chat = document.querySelector(".chat-box");
    if (chat) chat.scrollTop = chat.scrollHeight;
  }, [messages]);

  const askQuestion = async () => {
    setLoading(true);

    const userMsg = { role: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);

    const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/query`, {
      question,
    });
    const botMsg = {
      role: "bot",
      text: res.data.answer,
      data: res.data,
    };

    setMessages((prev) => [...prev, botMsg]);
    setData(res.data);

    setLoading(false);
  };

  const downloadCSV = () => {
    if (!data?.result) return;

    const csv = [
      ["Name", "Value"],
      ...data.result.map((row) => [row.name, row.value]),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "report.csv";
    a.click();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">AI Data Analyst</h1>

      <div className="chat-box border p-4 h-96 overflow-y-auto bg-gray-50 rounded">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block p-2 rounded ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300"
              }`}>
              {msg.text}
            </div>

            {msg.data?.result && <ChartView data={msg.data} />}
          </div>
        ))}

        {loading && <p>Thinking... 🤖</p>}
      </div>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={uploadFile}>Upload</button>

      <input
        className="border p-2 w-full mt-4"
        // type="text"
        placeholder="Ask a question..."
        onChange={(e) => setQuestion(e.target.value)}
      />
      <button onClick={askQuestion} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
        Ask
      </button>
      {data?.answer && (
        <div className="p-4 bg-gray-100 rounded mt-4">
          <h2 className="text-xl font-bold">Insight</h2>
          <p>{data.answer}</p>
        </div>
      )}
      {/* {data?.result?.length > 0 && <ChartView data={data} />} */}
      {data?.result?.length > 0 && (
        <button
          onClick={downloadCSV}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Download Your Report
        </button>
      )}
    </div>
  );
}