import User from '../../models/User.js';
import { uploadToFirebase } from '../../utils/uploadHandler.js';

export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: user.avatar_url,
      phone_number: user.phone_number,
      address: user.address,
      status: user.status,
    };

    res.json(sanitizedUser);
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (req, res, next) => {
  try {
    const { name, phone_number, address } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone_number) updates.phone_number = phone_number;
    if (address) updates.address = address;

    if (req.file) {
      try {
        const avatarUrl = await uploadToFirebase(req.file, 'avatars');
        updates.avatar_url = avatarUrl;
      } catch (uploadError) {
        return res.status(400).json({
          message: 'Error uploading avatar',
          error: uploadError.message,
        });
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar_url: updates.avatar_url || user.avatar_url,
      phone_number: updates.phone_number || user.phone_number,
      address: updates.address || user.address,
      status: user.status,
    };

    res.json({
      message: 'User profile updated successfully.',
      user: sanitizedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
};
