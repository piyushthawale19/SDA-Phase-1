// import React, { useState, useContext } from "react";
// import AvatarSelector from "./AvatarSelector";
// import { ThemeContext } from "../context/theme.context"; // ✅ import ThemeContext

// const ProfileMenu = ({ user }) => {
//   const [showAvatarModal, setShowAvatarModal] = useState(false);
//   const { theme, toggleTheme } = useContext(ThemeContext); // ✅ get toggle function

//   return (
//     <>
//       <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 dark:text-white">
//         <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
//           {user?.email || "Guest"}
//         </div>

//         <button
//           onClick={() => setShowAvatarModal(true)}
//           className="w-full text-left px-4 py-2 text-sm hover:bg-gray-00 dark:hover:bg-gray-700"
//         >
//           🖼 Change Avatar
//         </button>

//         {/* Dark Mode Toggle */}
//         <button
//           onClick={toggleTheme} // ✅ call the toggle function
//           className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
//         >
//           {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
//         </button>
//       </div>

//       {showAvatarModal && <AvatarSelector onClose={() => setShowAvatarModal(false)} />}
//     </>
//   );
// };

// export default ProfileMenu;



import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AvatarSelector from "./AvatarSelector";
import { ThemeContext } from "../context/theme.context";
import { UserContext } from "../context/user.context"; // ✅ import UserContext

const ProfileMenu = ({ user }) => {
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { setUser } = useContext(UserContext); // ✅ get setUser to logout
  const navigate = useNavigate();

  // ✅ Logout function
  const handleLogout = () => {
    localStorage.removeItem("authToken"); // remove token
    setUser(null); // clear user context
    navigate("/login"); // redirect to login
  };

  return (
    <>
      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-50 dark:text-white">
        <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
          {user?.email || "Guest"}
        </div>

        <button
          onClick={() => setShowAvatarModal(true)}
          className="w-full text-left px-4 py-2 text-sm rounded-md m-1 transition duration-300 ease-in-out transform hover:scale-90 hover:bg-purple-700 hover:text-white hover:shadow-lg hover:shadow-purple-500/50"

        >
          🖼 Change Avatar
        </button>

        <button
          onClick={toggleTheme}
          className="w-full text-left px-4 py-2 text-sm rounded-md m-1 transition duration-300 ease-in-out transform hover:scale-90 hover:bg-purple-700 hover:text-white hover:shadow-lg hover:shadow-purple-500/50"

        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-sm rounded-md m-1 transition duration-300 ease-in-out transform hover:scale-90 hover:bg-red-700 hover:text-white hover:shadow-lg hover:shadow-red-500/50"
        >
          ➜] Logout
        </button>
      </div>

      {showAvatarModal && (
        <AvatarSelector onClose={() => setShowAvatarModal(false)} />
      )}
    </>
  );
};

export default ProfileMenu;
