import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
export default function BarGraph({ labels, probabilities, context }) {
  const data = labels.map((category, index) => {
    return {
      name: category,
      value: probabilities[index] || 0,
    };
  });
  return (
    <div className="w-full flex flex-col items-center p-6">
      <h2 className="text-lg font-bold mb-4">
        Bar Graph based on {context} Sentiments
      </h2>
      <div className="w-full max-w-4xl h-96">
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />{" "}
            <Tooltip formatter={(value) => `${value.toFixed(0)}%`} />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

//['Normal', 'Normal', 'Anxiety'] [33, 0, 1, 66, 0, 0, 0]
