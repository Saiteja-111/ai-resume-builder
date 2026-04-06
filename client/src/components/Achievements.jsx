import React, { useState } from "react";

const Achievements = ({ data, onChange }) => {
  const [input, setInput] = useState("");

  const addAchievement = () => {
    if (!input.trim()) return;
    onChange([...(data || []), input]);
    setInput("");
  };

  const remove = (index) => {
    const updated = data.filter((_, i) => i !== index);
    onChange(updated);
  };

  return (
    <div>
      <h2 className="font-semibold text-lg mb-3">Achievements</h2>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border p-2 w-full rounded"
          placeholder="Ex: AWS Certified, Hackathon Winner"
        />
        <button
          onClick={addAchievement}
          className="bg-blue-500 text-white px-3 rounded"
        >
          Add
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {data?.map((item, i) => (
          <div key={i} className="flex justify-between items-center">
            <span>• {item}</span>
            <button onClick={() => remove(i)}>❌</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;