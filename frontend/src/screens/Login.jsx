import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../config/axios";
import { UserContext } from "../context/user.context";
import Particles from "../components/Particles";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [canUseWebGL, setCanUseWebGL] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if WebGL is available
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setCanUseWebGL(false);
      }
    } catch {
      setCanUseWebGL(false);
    }
  }, []);

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const submitHandle = async (e) => {
    e.preventDefault();
    setErr("");
    setIsLoading(true);

    // ✅ Frontend check for password length
    if (password.length < 6) {
      setErr("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post("/users/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      navigate("/");
    } catch (error) {
      // ✅ Show proper error from backend or fallback
      const msg =
        error.response?.data?.message ||
        "Invalid email or password. Please try again.";

      setErr(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      {canUseWebGL && (
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={["#4299E1", "#90CDF4", "#2B6CB0"]}
            particleCount={250}
            particleSpread={12}
            speed={0.15}
            particleBaseSize={120}
            moveParticlesOnHover={true}
            alphaParticles={true}
            disableRotation={false}
            cameraDistance={15}
            particleHoverFactor={1.5}
          />
        </div>
      )}
      <div className="bg-gray-800/70 backdrop-blur-md p-8 rounded-xl shadow-lg w-full max-w-md z-10 relative border border-blue-500/20 animate-border-pulse">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Login
        </h2>

        {err && (
          <div className="mb-4 p-2 bg-red-500/80 text-white text-sm text-center rounded backdrop-blur-sm">
            {err}
          </div>
        )}

        <form onSubmit={submitHandle} className="space-y-5">
          <div>
            <label
              className="block text-gray-300 mb-1 transition-colors"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="w-full px-4 py-2 rounded bg-gray-700/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-500/30"
              type="email"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label
              className="block text-gray-300 mb-1 transition-colors"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="w-full px-4 py-2 rounded bg-gray-700/80 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-500/30"
              type="password"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition duration-300 shadow-lg hover:shadow-blue-500/50 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400">Don't have an account? </span>
          <Link
            to="/register"
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
