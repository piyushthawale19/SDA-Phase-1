import React, { useContext, useState } from "react";
import { UserContext } from "../context/user.context";
import ProfileMenu from "./ProfileMenu";
import { addCollaborators } from "../screens/Project"; // ✅ Correct import

const Navbar = () => {
  const { user } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full px-6 py-3 flex justify-between items-center border-b bg-white dark:bg-gray-900 shadow">
      {/* Left: Logo */}
      <div className="text-xl font-bold cursor-pointer text-purple-700 dark:text-purple-400">
        MyAppLogo
      </div>

      {/* Right: Buttons & Profile */}
      <div className="flex items-center gap-4">
        {/* Add Collaborators Button */}
        <button
          onClick={addCollaborators}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-md hover:from-purple-700 hover:to-indigo-700 shadow-lg transition-all duration-200"
        >
          Add Collaborators
        </button>

        {/* Profile Menu */}
        <div className="relative">
          <button
            className="flex items-center gap-2 px-3 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <img
              src={user?.avatar || "/avatars/default1.png"}
              alt="avatar"
              className="w-8 h-8 rounded-md object-cover border"
            />
            <span className="hidden sm:block text-sm font-medium dark:text-white">
              {user?.name
                ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
                : user?.email
                ? user.email.split("@")[0].charAt(0).toUpperCase() +
                  user.email.split("@")[0].slice(1)
                : "Guest"}
            </span>
          </button>
          {menuOpen && <ProfileMenu user={user} />}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
