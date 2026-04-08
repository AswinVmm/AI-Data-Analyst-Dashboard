const express = require("express");
const fs = require("fs");
const Papa = require("papaparse");
const { GoogleGenAI } = require("@google/genai");
const { processData, generateInsight } = require("../utils/logic");
const router = express.Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

router.post("/", async (req, res) => {
  try {
    console.log("Request received");
    const { question } = req.body;

    const file = fs.readFileSync("./uploads/latest.csv", "utf8");
    const csvData = Papa.parse(file, { header: true }).data;
    const columns = Object.keys(csvData[0] || {}).join(", ");

    const prompt = `
    You are a data analyst.
    Available columns:
    ${columns}

    Understand the user query and convert it into structured JSON.

    Rules:
    - ALWAYS return a chart if the query includes avg, sum, count, top, etc.
    - ALWAYS provide an "x" column for grouping (choose a relevant column like product/name/category if not specified)
    - You can create derived fields:
        stock * price = stock_value
    - If user asks "stock value", interpret it as stock * price
    - If question mentions "female/male", use gender column with filter
    - Only return text-only response if user explicitly asks for explanation or insights without chart
    - Prefer aggregation = count when counting people
    

    Return JSON:
     {
        "chart": {
          "type": "bar/line/pie",
          "x": "",
          "y": "",
          "aggregation": "",
          "filter": {},
          "limit": 5
          },
        "answer": ""
      }
      Question: "${question}"
      `;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;
    console.log("Gemini response:", text);

    // ⚠️ Clean response (Gemini sometimes adds extra text)
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;

    const cleanJSON = text.slice(jsonStart, jsonEnd);

    let parsed;

    try {
      parsed = JSON.parse(cleanJSON);
    } catch (e) {
      return res.json({
        type: "error",
        result: [],
        answer: "AI response parsing failed. Try rephrasing.",
      });
    }

    // ✅ HANDLE direct average (no grouping)
    if (parsed.chart?.aggregation === "avg" && !parsed.chart?.x) {
      const values = csvData
        .map((row) => {
          if (parsed.chart.y === "stock_value") {
            const stock = parseFloat(row.stock);
            const price = parseFloat(row.price);
            return stock * price;
          }
          return parseFloat(row[parsed.chart.y]);
        })
        .filter((v) => !isNaN(v));

      if (values.length === 0) {
        return res.json({
          type: "text",
          result: [],
          answer: "No valid numeric data found.",
        });
      }

      const avg =
        values.reduce((a, b) => a + b, 0) / values.length;

      return res.json({
        type: "text",
        result: [],
        answer: `Average ${parsed.chart.y} is ${avg.toFixed(2)}`,
      });
    }

    // ✅ AUTO FIX: if AI misses x, pick first column
    if (!parsed.chart?.x && parsed.chart?.y) {
      const cols = Object.keys(csvData[0] || {});
      parsed.chart.x = cols[0]; // default grouping
    }
    // const parsed = JSON.parse(cleanJSON);
    // const aiResponse = JSON.parse(response.choices[0].message.content);

    // if (!parsed.chart?.x && parsed.chart?.y && parsed.chart?.aggregation) {
    //   const columns = Object.keys(csvData[0] || {});

    //   // pick a default grouping column
    //   parsed.chart.x = columns[0]; // e.g. product/name
    // }

    if (!parsed.chart?.x || !parsed.chart?.type) {
      return res.json({
        type: "text",
        result: [],
        answer: parsed.answer || "Here is the analysis of your data.",
      });
    }

    const validColumns = Object.keys(csvData[0] || {});

    // Validate x and y
    // if (
    //   !validColumns.includes(parsed.chart.x) ||
    //   !validColumns.includes(parsed.chart.y)
    // ) {
    //   return res.json({
    //     type: "bar",
    //     result: [],
    //     answer: "AI selected invalid columns. Please try another question.",
    //   });
    // }

    const processed = processData(csvData, parsed.chart);
    const insight = generateInsight(processed, question);

    res.json({
      type: parsed.chart.type,
      result: processed,
      answer: insight,
    });
  } catch (err) {
    console.error("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;