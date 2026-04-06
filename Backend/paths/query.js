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
    - Use ONLY exact column names
    - If question mentions "female/male", use "gender" column with filter
    - If asking "top", include limit
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

    const parsed = JSON.parse(cleanJSON);
    // const aiResponse = JSON.parse(response.choices[0].message.content);

    const validColumns = Object.keys(csvData[0] || {});

    // Validate x and y
    if (
      !validColumns.includes(parsed.chart.x) ||
      !validColumns.includes(parsed.chart.y)
    ) {
      return res.json({
        type: "bar",
        result: [],
        answer: "AI selected invalid columns. Please try another question.",
      });
    }

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