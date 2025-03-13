import { createContext, useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 检查用户个人资料状态
  const checkProfileStatus = async (token) => {
    try {
      const response = await fetch("http://localhost:3001/api/profile/status", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.data && data.data.isProfileComplete;
      }
      return false;
    } catch (error) {
      console.error("❌ 检查个人资料状态失败:", error);
      return false;
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUser(payload);

          // 检查用户个人资料状态
          const isComplete = await checkProfileStatus(token);
          setProfileComplete(isComplete);
        } catch (error) {
          console.error("❌ Token 解析失败:", error);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (token) => {
    console.log("AuthContext: 开始处理登录...");
    if (!token) {
      console.error("❌ AuthContext: 无效的 token");
      throw new Error("Invalid token");
    }

    try {
      localStorage.setItem("token", token);
      console.log("AuthContext: Token已保存到localStorage");

      // 解析 token
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      const payload = JSON.parse(atob(parts[1]));
      console.log("AuthContext: Token解析成功:", payload);

      setUser(payload);
      console.log("AuthContext: 用户状态已更新");

      // 检查用户个人资料状态
      const isComplete = await checkProfileStatus(token);
      setProfileComplete(isComplete);
      console.log("AuthContext: 个人资料状态已更新:", isComplete);

      return isComplete;
    } catch (error) {
      console.error("❌ Token 处理错误:", error);
      localStorage.removeItem("token");
      throw new Error("Failed to process token");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setProfileComplete(false);
    navigate("/signin");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profileComplete,
        loading,
        login,
        logout,
        checkProfileStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
