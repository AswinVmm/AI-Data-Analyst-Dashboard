import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { ResponsiveContainer } from "recharts";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

export default function ChartView({ data }) {
    const type = data?.type || "bar";
    if (!data?.result || data.result.length === 0) {
        return <p>No data to display</p>;
    }

    // 🥧 PIE CHART
    if (type === "pie") {
        return (
            <PieChart width={400} height={400}>
                <Pie
                    data={data.result}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={120}
                    label
                >
                    {data.result.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px" }} />
                <Legend />
            </PieChart>
        );
    }
    // 📊 BAR CHART

    if (type === "bar") {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.result}>
                    <XAxis dataKey="name" stroke="#555" interval={0} angle={-35}
                        textAnchor="end" height={80} />
                    <YAxis stroke="#555" />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px" }} />
                    <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
            </ResponsiveContainer>
        );
    }

    // 📈 LINE CHART
    if (type === "line") {
        return (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.result}>
                    <XAxis dataKey="name" stroke="#555" interval={0} angle={-35}
                        textAnchor="end" height={80} />
                    <YAxis stroke="#555" />
                    <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} />
                </LineChart>
            </ResponsiveContainer>
        );
    }

    return <pre>{JSON.stringify(data.result, null, 2)}</pre>;
}