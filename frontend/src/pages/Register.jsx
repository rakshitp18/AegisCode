import { useNavigate } from "react-router-dom";
import AuthModal from "../components/common/AuthModal";
import Landing from "./Landing";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen">
      <Landing />
      <AuthModal
        isOpen={true}
        onClose={() => navigate("/")}
        initialMode="register"
        redirectTo="/dashboard"
      />
    </div>
  );
}
