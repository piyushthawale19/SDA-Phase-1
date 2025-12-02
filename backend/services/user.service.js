import userModel from "../models/user.model.js";


export const createUser = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // ✅ call the correct static method
  const hashPassword = await userModel.hashPassword(password);

  const user = await userModel.create({ 
    email, 
    password: hashPassword
  });

  return user;
};


export const getAllUsers = async ({ userId })=>{
 const users = await userModel.find({
  _id: {$ne: userId}
 });
 return users;
}

export const updateUserProfile = async (userId, data) => {
  try {
    const updatedUser = await  userModel.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    ).select("-password"); // never return password
    return updatedUser;
  } catch (error) {
    throw new Error("Error updating user profile: " + error.message);
  }
};