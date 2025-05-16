import User from '../../models/User.js';
import { uploadToFirebase } from '../../utils/uploadHandler.js';

export const getProfile = async (req, res, next) => {
  try {
    const adminId = req.userId;
    
    const admin = await User.findById(adminId);

    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    const sanitizedAdmin = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      avatar_url: admin.avatar_url,
      phone_number: admin.phone_number,
      address: admin.address,
      status: admin.status,
      role: admin.role
    };

    res.json(sanitizedAdmin);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const adminId = req.userId;
    const { name, phone_number, address } = req.body;

    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(404).json({ message: 'Admin account not found' });
    }

    const updates = {};
    if (name) updates.name = name;
    if (phone_number) updates.phone_number = phone_number;
    if (address) updates.address = address;

    if (req.file) {
      try {
        const avatarUrl = await uploadToFirebase(req.file, 'admin-avatars');
        updates.avatar_url = avatarUrl;
      } catch (uploadError) {
        return res.status(400).json({
          message: 'Error uploading avatar',
          error: uploadError.message,
        });
      }
    }

    const updatedAdmin = await User.findByIdAndUpdate(adminId, updates);
    
    const sanitizedAdmin = {
      id: updatedAdmin.id,
      email: updatedAdmin.email,
      name: updatedAdmin.name,
      avatar_url: updatedAdmin.avatar_url,
      phone_number: updatedAdmin.phone_number,
      address: updatedAdmin.address,
      status: updatedAdmin.status,
      role: updatedAdmin.role
    };

    res.json({
      message: 'Profile updated successfully',
      admin: sanitizedAdmin
    });
  } catch (error) {
    next(error);
  }
}; 