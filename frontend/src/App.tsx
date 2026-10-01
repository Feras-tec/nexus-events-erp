import { useState } from "react";
import {
  Show,
  SignInButton,
  SignOutButton,
  UserButton,
  useAuth,
} from "@clerk/react";

function App() {
  const { getToken } = useAuth();
  const [apiResult, setApiResult] = useState("");

  async function testBackend() {
    const token = await getToken();

    const response = await fetch("http://localhost:3000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    setApiResult(JSON.stringify(data, null, 2));
  }

  return (
    <main>
      <h1>Nexus Events ERP</h1>

      <Show when="signed-out">
        <p>Bitte anmelden, um fortzufahren.</p>
        <SignInButton />
      </Show>

      <Show when="signed-in">
        <p>Erfolgreich angemeldet.</p>

        <UserButton />
        <SignOutButton />

        <hr />

        <button onClick={testBackend}>Backend testen</button>

        {apiResult && <pre>{apiResult}</pre>}
      </Show>
    </main>
  );
}

export default App;
