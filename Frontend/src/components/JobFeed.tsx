"use client";

import React, { useState } from "react";
import Link from "next/link";

// Assuming you have a route configured that validates these search params
export function JobFeed() {
  const [search, setSearch] = useState<{ location?: string; q?: string }>({});

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setSearch({
      q: formData.get("keyword") as string,
      location: formData.get("location") as string,
    });
  };

  const handleVoiceQuery = () => {
    // TODO: Implement MediaRecorder API to capture audio
    console.log("Listening for Hustler voice query...");
  };

  return (
    <div className="p-4 relative min-h-screen">
      {/* Search & Filter Bar */}
      <form onSubmit={handleSearch} className="flex space-x-2 mb-6 bg-white p-4 rounded shadow">
        <input name="keyword" defaultValue={search.q || ""} placeholder="Search jobs (e.g., Plumber)..." className="border p-2 rounded grow" />
        <select name="location" defaultValue={search.location || ""} className="border p-2 rounded">
          <option value="">All Locations</option>
          <option value="Lekki Phase 1">Lekki Phase 1</option>
          <option value="Ajah">Ajah</option>
          <option value="Magodo">Magodo</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Search
        </button>
      </form>

      {/* Job Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* This would be a map over your fetched jobs from /api/v1/tasks/ */}
        <div className="border p-4 rounded-lg shadow-sm bg-white flex flex-col">
          <h3 className="font-bold text-lg">Fix Generator</h3>
          <span className="text-sm text-gray-500 mb-2">📍 Lekki Phase 1 • 💰 ₦8,000</span>
          <p className="text-sm mb-4 line-clamp-2">
            My generator has been making a weird noise and suddenly stopped. I need someone to check the carburetor.
          </p>
          <div className="mt-auto flex justify-between items-center">
            <Link href="/Jobs" className="text-blue-600 text-sm font-semibold">
              View Details
            </Link>
            <a href="tel:+2348000000000" className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-bold">
              Contact
            </a>
          </div>
        </div>
      </div>

      {/* Floating Mic Button for Hustler Voice Query */}
      <button
        onClick={handleVoiceQuery}
        className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        aria-label="Voice Query"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>
      </button>
    </div>
  );
}
