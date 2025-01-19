import React, { useCallback, useState } from "react";

export function PersonPrompt() {
  const [inputValue, setInputValue] = useState("");
  const [outputValue, setOutputValue] = useState("");

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

        if (!response.ok || !response.body) {
          throw new Error(`Failed to submit data: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let isDone = false;

        let outputText = "";
        while (!isDone) {
          const { value, done } = await reader.read();
          isDone = done;
          if (value) {
            const decodedLines = decoder.decode(value).split("\n");
            for (let line of decodedLines) {
              if (line.startsWith("data:")) {
                line = line.substring(5);
              }
              line = line.trim();
              if (!line) {
                continue;
              }
              const message = JSON.parse(line);
              if (message.newText) {
                outputText += message.newText;
                setOutputValue(outputText);
              }
            }
          }
        }
        console.log("Stream ended.");
      } catch (error) {
        console.error("Error submitting data:", error);
        alert("Server error occurred. Please try again later.");
      }
    },
    [inputValue]
  );

  return (
    <>
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
      {outputValue && <div className="card">{outputValue}</div>}
    </>
  );
}
