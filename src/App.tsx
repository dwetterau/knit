import "./App.css";
import { LoginButton } from "./authentication/login_button";
import { LogoutButton } from "./authentication/logout_button";
import { useStoreUser } from "./authentication/use_store_user";

function App() {
  const { isAuthenticated, isLoading } = useStoreUser();

  return (
    <>
      <h1>Knit</h1>
      <div className="card">
        {isLoading && <div>Loading...</div>}
        {isAuthenticated && (
          <div>
            Logged in
            <LogoutButton />
          </div>
        )}
        {!isAuthenticated && !isLoading && <LoginButton />}
      </div>
    </>
  );
}

export default App;
