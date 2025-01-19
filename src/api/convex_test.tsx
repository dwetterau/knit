import { useAuth0 } from "@auth0/auth0-react";
import { useState } from "react";

export function ConvexTest() {
  const [response, setResponse] = useState("");
  const { getIdTokenClaims } = useAuth0();

  const runTest = async () => {
    const claims = await getIdTokenClaims();
    const token = claims?.__raw; // Get the raw JWT token
    console.log("ID Token:", token);
    if (!token) {
      throw new Error("No token present");
    }

    const response = await fetch("http://localhost:3000/api/convexTest", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    setResponse(JSON.stringify(data, null, 2));
  };

  return (
    <div>
      <button onClick={() => runTest()}>Test Convex</button>
      {response && <code>{response}</code>}
    </div>
  );
}
