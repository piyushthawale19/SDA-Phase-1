import React, { useContext } from "react";
import { UserContext } from "../context/user.context";
 

const defaultAvatars = [
  "/avatars/default1.png",
  "/avatars/default2.png",
  "/avatars/default3.png",
  "/avatars/default4.png",
  "/avatars/default5.png",
  "/avatars/default6.png",
];

const AvatarSelector = ({ onClose }) => {
  const { updateProfile } = useContext(UserContext);

  const handleAvatarSelect = async (avatar) => {
    try {
      // Call your context function to update profile
      const updatedUser = await updateProfile({ avatar });
      console.log("Avatar updated:", updatedUser);

      // Close the modal after successful update
      if (onClose) onClose();
    } catch (error) {
      console.error("Failed to update avatar:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Choose Avatar</h2>

        <div className="grid grid-cols-3 gap-3">
          {defaultAvatars.map((avatar) => (
            <img
              key={avatar} // ✅ unique key
              src={avatar}
              alt="avatar"
              className="w-16 h-16 rounded-md  cursor-pointer hover:ring-2 hover:ring-purple-500 object-cover"
              onClick={() => handleAvatarSelect(avatar)}
            />
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-slate-500 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AvatarSelector;
