import { useAuth as useAuthContext } from "../context/AuthContext";

export const useAuth = () => {
  const { login } = useAuthContext();

  const handleLogin = async (credentials: { email: string; password: string }) => {
    await login(credentials.email, credentials.password);
  };

  return { handleLogin };
};
