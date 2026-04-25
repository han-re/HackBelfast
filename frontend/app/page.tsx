"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("loading...");

  useEffect(() => {
    fetch(process.env.NEXT_PUBLIC_API_URL + "/health")
      .then(r => r.json())
      .then(d => setStatus(d.status))
      .catch(e => setStatus("error: " + e.message));
  }, []);

  return (
    <div className="p-10 text-2xl">
      Backend says: {status}
    </div>
  );
}