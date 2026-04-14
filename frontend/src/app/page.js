"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import axios from "axios";
import ChartView from "../components/ChartView";

export default function Home() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chartType, setChartType] = useState("bar");
  const [darkMode, setDarkMode] = useState(false);
  const latestData = messages[messages.length - 1]?.data;
  const values = latestData?.result?.map((r) => Number(r.value) || 0) || [];

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
    setQuestion(""); // clear input
  };

  const analyzeData = async () => {
    setLoading(true);

    const userMsg = { role: "user", text: "Analyze this dataset" };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/query`,
        {
          question: "Give a full analysis of this dataset with insights",
        }
      );

      const botMsg = {
        role: "bot",
        text: res.data.answer,
        data: res.data,
      };

      setMessages((prev) => [...prev, botMsg]);
      setData(res.data);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Failed to analyze data. Try again." },
      ]);
    }

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
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-3xl font-bold text-center">📊 AI Data Analyst</h1>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="px-3 py-1 rounded bg-gray-800 text-white dark:bg-white dark:text-black"
      >
        {darkMode ? "☀ Light" : "🌙 Dark"}
      </button>

      {/* 📁 Upload Section */}
      <Card className="p-4">
        <CardContent className="space-y-3">
          <Input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
          />

          <div className="flex gap-2">
            <Button onClick={uploadFile}>Upload</Button>

            <Button
              onClick={analyzeData}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
            >
              Analyze 📊
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 💬 Chat Section */}
      <Card>
        <CardContent>
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                    }`}
                >
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-xs shadow ${msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                      }`}
                  >
                    {msg.text}

                    {msg.data?.result?.length > 0 && (
                      <div className="mt-3">
                        <ChartView data={{ ...msg.data, type: chartType }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <p className="text-center text-gray-500">
                  Thinking... 🤖
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* ❓ Ask Section */}
      <Card className="p-4">
        <CardContent className="space-y-2">
          <Input
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askQuestion();
            }}
          />

          <Button
            onClick={askQuestion}
            className="w-full bg-green-500 text-white"
            disabled={loading}
          >
            Ask
          </Button>
          <div className="flex gap-2 mt-2">
            {["bar", "line", "pie"].map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type)}
                className={`px-3 py-1 rounded ${chartType === type
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
                  }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* KPI */}
      {values.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded">
            <h3 className="text-sm">Total</h3>
            <p className="text-xl font-bold">
              {values.reduce((a, b) => a + b, 0)}
            </p>
          </div>

          <div className="p-4 bg-green-100 dark:bg-green-900 rounded">
            <h3 className="text-sm">Average</h3>
            <p className="text-xl font-bold">
              {(
                values.reduce((a, b) => a + b, 0) /
                values.length
              ).toFixed(2)}
            </p>
          </div>

          <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded">
            <h3 className="text-sm">Max</h3>
            <p className="text-xl font-bold">
              {Math.max(...values)}
            </p>
          </div>
        </div>
      )}

      {/* 📊 Insight */}
      {data?.answer && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <h2 className="text-lg font-semibold">Insight</h2>
            <p className="text-gray-700">{data.answer}</p>
          </CardContent>
        </Card>
      )}

      {/* 📥 Download */}
      {data?.result?.length > 0 && (
        <Button
          onClick={downloadCSV}
          className="w-full bg-blue-600 text-white"
        >
          Download Report 📄
        </Button>
      )}
    </div>
    //   <div className="p-6 max-w-4xl mx-auto space-y-4">
    //     <h1 className="text-3xl font-bold text-center mb-4">AI Data Analyst</h1>

    //     <div className="chat-box border p-4 h-96 overflow-y-auto bg-gray-50 rounded">
    //       {messages.map((msg, i) => (
    //         <div key={i} className={`mb-3 ${msg.role === "user" ? "text-right" : "text-left"}`}>
    //           <div className={`inline-block p-2 rounded ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300"
    //             }`}>
    //             {msg.text}
    //           </div>

    //           {msg.data?.result?.length > 0 && (
    //             <div className="mt-2">
    //               <ChartView data={msg.data} />
    //             </div>
    //           )}
    //         </div>
    //       ))}

    //       {loading && <p>Thinking... 🤖</p>}
    //     </div>

    //     {/* <input type="file" onChange={(e) => setFile(e.target.files[0])} />
    //     <button onClick={uploadFile}>Upload</button> */}

    //     <input type="file" onChange={(e) => setFile(e.target.files[0])} />

    //     <div className="flex gap-2 mt-2">
    //       <button
    //         onClick={uploadFile}
    //         className="px-4 py-2 bg-blue-500 text-white rounded"
    //       >
    //         Upload
    //       </button>

    //       <button
    //         onClick={analyzeData}
    //         className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded shadow"
    //       >
    //         Analyze
    //       </button>
    //     </div>

    //     <input
    //       className="border p-2 w-full mt-4"
    //       // type="text"
    //       placeholder="Ask a question..."
    //       value={question}
    //       onChange={(e) => setQuestion(e.target.value)}
    //     />
    //     <button onClick={askQuestion} className="mt-2 px-4 py-2 bg-green-500 text-white rounded">
    //       Ask
    //     </button>
    //     {data?.answer && (
    //       <div className="p-4 bg-gray-100 rounded mt-4">
    //         <h2 className="text-xl font-bold">Insight</h2>
    //         <p>{data.answer}</p>
    //       </div>
    //     )}
    //     {data?.result?.length > 0 && (
    //       <button
    //         onClick={downloadCSV}
    //         className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
    //       >
    //         Download Your Report
    //       </button>
    //     )}
    //   </div>
  );
}