// import React, { createContext, useContext, useState } from "react";

// // Create the context
// export const UserContext = createContext();

// // Provider component
// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);

//   return (
//     <UserContext.Provider value={{ user, setUser }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

import React, { useContext, useState } from "react";
import { UserContext } from "../context/user.context";
import ProfileMenu from "./ProfileMenu";

const Navbar = () => {
  const { user } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="w-full px-6 py-2 flex justify-between items-center border-b bg-white dark:bg-gray-900 shadow">
      {/* Left: Logo */}
      <div className="cursor-pointer">
  {/* App Logo */}
 <img
  src="/Logo/LogoBlackR.png"
  alt="logo"
  className="hidden dark:block w-16 h-16 rounded-md cursor-pointer hover:ring-2 hover:ring-purple-500 object-contain"
/>
<img
  src="/Logo/LogoBV.png"
  alt="logo"
  className="block dark:hidden w-16 h-16 rounded-md cursor-pointer hover:ring-2 hover:ring-purple-500 object-contain"
/>
</div>

      {/* Right: Profile */}
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
    </nav>
  );
};

export default Navbar;
