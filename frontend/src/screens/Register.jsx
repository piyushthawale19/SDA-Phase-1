import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../context/user.context";
import axios from "../config/axios";
import Particles from "../components/Particles";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // error state
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

  async function submitHandle(e) {
    e.preventDefault();
    setError(""); // reset error before validation
    setIsLoading(true);

    // Client-side validation for password
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post("/users/register", { email, password });

      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);

      navigate("/");
    } catch (err) {
      console.log(err.response?.data || err.message);

      const msg = err.response?.data?.message?.toLowerCase() || "";

      // If backend says duplicate email → always show this
      if (msg.includes("already") || msg.includes("duplicate")) {
        setError("You already have an account, please login");
      } else {
        setError("You already have an account, please login");
      }
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      {canUseWebGL && (
        <div className="absolute inset-0 z-0">
          <Particles
            particleColors={["#9F7AEA", "#E9D8FD", "#805AD5"]}
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
      <div className="bg-gray-800/70 backdrop-blur-md p-8 rounded-xl shadow-lg w-full max-w-md z-10 relative border border-purple-500/20 animate-border-pulse">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">
          Register
        </h2>

        {/* Show error if exists */}
        {error && (
          <div className="mb-4 p-2 bg-red-500/80 text-white text-sm text-center rounded backdrop-blur-sm">
            {error}
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
              className="w-full px-4 py-2 rounded bg-gray-700/80 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 border border-purple-500/30"
              type="email"
              id="email"
              name="email"
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
              className="w-full px-4 py-2 rounded bg-gray-700/80 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 border border-purple-500/30"
              type="password"
              id="password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded text-white font-semibold transition duration-300 shadow-lg hover:shadow-purple-500/50 flex items-center justify-center"
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
              "Register"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-400">Already have an account? </span>
          <Link
            to="/login"
            className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
