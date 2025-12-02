import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/user.context";
import { useNavigate } from "react-router-dom";

function UserAuth({ children }) {
  const { user } = useContext(UserContext);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token || !user) {
      navigate("/login");
    } else {
      setLoading(false);
    }
  }, [user, token, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

export default UserAuth;
