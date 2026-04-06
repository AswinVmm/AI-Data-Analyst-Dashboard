import { BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

export default function ChartView({ data }) {
    if (!data?.result || data.result.length === 0) {
        return <p>No data to display</p>;
    }

    // 🥧 PIE CHART
    if (data.type === "pie") {
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
                <Tooltip />
                <Legend />
            </PieChart>
        );
    }
    // 📊 BAR CHART
    if (data.type === "bar") {
        return (
            <BarChart width={500} height={300} data={data.result}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
            </BarChart>
        );
    }

    // 📈 LINE CHART
    if (data.type === "line") {
        return (
            <LineChart width={500} height={300} data={data.result}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="value" />
            </LineChart>
        );
    }

    return <pre>{JSON.stringify(data.result, null, 2)}</pre>;
}