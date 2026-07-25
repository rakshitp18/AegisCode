import { useNavigate, useLocation } from "react-router-dom";
import AuthModal from "../components/common/AuthModal";
import Landing from "./Landing";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  return (
    <div className="relative min-h-screen">
      <Landing />
      <AuthModal
        isOpen={true}
        onClose={() => navigate("/")}
        initialMode="login"
        redirectTo={from}
      />
    </div>
  );
}
