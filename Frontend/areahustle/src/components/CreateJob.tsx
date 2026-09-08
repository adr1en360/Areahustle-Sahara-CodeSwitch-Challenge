"use client";

"use client";

import React, { useState } from "react";

export function CreateJob({ existingJob = null }: { existingJob?: any }) {
  const [isRecording, setIsRecording] = useState(false);
  const [taskData, setTaskData] = useState(
    existingJob || {
      title: "",
      description: "",
      budget: "",
      location: "",
    },
  );

  // Max edits rule
  const editCount = existingJob?.editCount || 0;
  const canEdit = editCount < 3;

  const handleVoicePost = () => {
    if (isRecording) {
      setIsRecording(false);
      console.log("Stopped recording. Sending to Aethex/Gemini 1.5 Flash for structured extraction...");
      // MOCK: Simulate Gemini extracting structured data
      setTimeout(() => {
        setTaskData({
          title: "Wash my car",
          description: "I need a thorough exterior and interior wash for my Toyota Corolla.",
          budget: "5000",
          location: "Ajah",
        });
      }, 1500);
    } else {
      setIsRecording(true);
      console.log("Started recording...");
      // TODO: Wire up MediaRecorder API here
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert("You have reached the maximum number of edits (3) for this task.");
      return;
    }
    console.log("Demo job submitted:", taskData);
    alert(existingJob ? "Job updated in demo mode." : "Job posted in demo mode.");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{existingJob ? "Edit Task" : "Post a Task"}</h2>

        <button
          type="button"
          onClick={handleVoicePost}
          className={`flex items-center px-4 py-2 rounded shadow ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-gray-100"}`}
        >
          🎤 {isRecording ? "Listening..." : "Speak Task"}
        </button>
      </div>

      {!canEdit && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">You can no longer edit this job (Max 3 edits reached).</div>}

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Task Title"
          value={taskData.title}
          disabled={!canEdit}
          onChange={(e) => setTaskData({ ...taskData, title: e.target.value })}
          className="border p-2 rounded"
        />

        <textarea
          placeholder="Detailed Description (Help the hustler understand the job)"
          rows={4}
          disabled={!canEdit}
          value={taskData.description}
          onChange={(e) => setTaskData({ ...taskData, description: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          type="number"
          placeholder="Budget (₦)"
          value={taskData.budget}
          disabled={!canEdit}
          onChange={(e) => setTaskData({ ...taskData, budget: e.target.value })}
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="Neighbourhood / Location"
          value={taskData.location}
          disabled={!canEdit}
          onChange={(e) => setTaskData({ ...taskData, location: e.target.value })}
          className="border p-2 rounded"
        />

        <button type="submit" disabled={!canEdit} className="bg-blue-600 text-white py-3 rounded font-bold disabled:opacity-50">
          {existingJob ? `Update Job (${3 - editCount} edits left)` : "Post Job to Escrow"}
        </button>
      </form>
    </div>
  );
}
