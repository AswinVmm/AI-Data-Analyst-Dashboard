function processData(data, config) {
    const normalize = (str) =>
        str?.toLowerCase().replace(/[_\s]/g, "");

    const synonyms = {
        gender: ["sex"],
        job: ["job_title", "role"],
    };

    const findColumn = (columns, target) => {
        const normalizedTarget = normalize(target);

        // direct match
        let match = columns.find(
            (col) => normalize(col) === normalizedTarget
        );

        if (match) return match;

        // synonym match
        if (synonyms[normalizedTarget]) {
            return columns.find((col) =>
                synonyms[normalizedTarget].includes(normalize(col))
            );
        }

        return null;
    };

    const { x, y, aggregation, filter, limit } = config;

    const columns = Object.keys(data[0] || {});

    const xCol = findColumn(columns, x);
    const yCol = findColumn(columns, y);

    // ❌ prevent crash
    if (!xCol || (aggregation !== "count" && !yCol)) {
        // throw new Error("AI selected invalid columns");
        return [];
    }

    let filteredData = data;

    // ✅ FILTER
    if (filter) {
        filteredData = data.filter((row) => {
            return Object.keys(filter).every((key) => {
                const realKey = findColumn(columns, key);
                if (!realKey) return false;

                return (
                    row[realKey]?.toLowerCase() ===
                    filter[key].toLowerCase()
                );
            });
        });
    }

    const grouped = {};

    filteredData.forEach((row) => {
        const key = row[xCol];
        if (!key) return;

        let value;

        if (aggregation === "count") {
            value = 1;
        } else {
            value = parseFloat(row[yCol]);
            if (isNaN(value)) value = 0;
        }

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(value);
    });

    let result = Object.keys(grouped).map((key) => {
        let val = 0;

        if (aggregation === "sum") {
            val = grouped[key].reduce((a, b) => a + b, 0);
        }

        if (aggregation === "avg") {
            val =
                grouped[key].reduce((a, b) => a + b, 0) /
                grouped[key].length;
        }

        if (aggregation === "count") {
            val = grouped[key].length;
        }

        return { name: key, value: val };
    });

    // ✅ SORT + LIMIT (for "top 5")
    result.sort((a, b) => b.value - a.value);

    if (limit) {
        result = result.slice(0, limit);
    }

    return result;
}
function generateInsight(result, question) {
    if (!result || result.length === 0) {
        return "No meaningful data found for this query.";
    }

    const top = result[0];

    return `${top.name} has the highest value (${top.value}) for: "${question}"`;
}
module.exports = { processData, generateInsight };