import React, { useCallback, useState } from "react";

export function PersonPrompt() {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const response = await fetch("http://localhost:3000/api/personPrompt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: inputValue }),
        });

        if (!response.ok) {
          throw new Error("Failed to submit data");
        }

        const data = await response.json();
        console.log("Response from server:", data);
      } catch (error) {
        console.error("Error submitting data:", error);
        alert("Server error occurred. Please try again later.");
      }
    },
    [inputValue]
  );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        width: "300px",
      }}
    >
      <textarea
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type something about someone in your life..."
        style={{ height: "100px", padding: "0.5rem", fontSize: "1rem" }}
      />
      <button
        type="submit"
        style={{ padding: "0.5rem", fontSize: "1rem", cursor: "pointer" }}
      >
        Submit
      </button>
    </form>
  );
}
