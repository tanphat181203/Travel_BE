import User from '../../models/User.js';
import { uploadToFirebase } from '../../utils/uploadHandler.js';

export const getSellerProfile = async (req, res, next) => {
  try {
    const seller = await User.findById(req.userId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const sanitizedSeller = {
      id: seller.id,
      email: seller.email,
      name: seller.name,
      role: seller.role,
      avatar_url: seller.avatar_url,
      phone_number: seller.phone_number,
      address: seller.address,
      status: seller.status,
      hasActiveSubscription: req.hasActiveSubscription || false,
    };

    if (req.subscription) {
      sanitizedSeller.subscription = {
        package_name: req.subscription.package_name,
        expiry_date: req.subscription.expiry_date,
        status: req.subscription.status,
      };
    }

    res.json(sanitizedSeller);
  } catch (error) {
    next(error);
  }
};

export const updateSellerProfile = async (req, res, next) => {
  try {
    const seller = await User.findById(req.userId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const { name, phone_number, address } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone_number) updates.phone_number = phone_number;
    if (address) updates.address = address;

    if (req.file) {
      try {
        const avatarUrl = await uploadToFirebase(req.file, 'seller-avatars');
        updates.avatar_url = avatarUrl;
      } catch (uploadError) {
        return res.status(400).json({
          message: 'Error uploading avatar',
          error: uploadError.message,
        });
      }
    }

    const updatedSeller = await User.findByIdAndUpdate(req.userId, updates);

    const sanitizedSeller = {
      id: updatedSeller.id,
      email: updatedSeller.email,
      name: updates.name || updatedSeller.name,
      role: updatedSeller.role,
      avatar_url: updates.avatar_url || updatedSeller.avatar_url,
      phone_number: updates.phone_number || updatedSeller.phone_number,
      address: updates.address || updatedSeller.address,
      status: updatedSeller.status,
    };

    res.json(sanitizedSeller);
  } catch (error) {
    next(error);
  }
};

export const deleteSeller = async (req, res, next) => {
  try {
    const seller = await User.findById(req.userId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    if (seller.role !== 'seller') {
      return res
        .status(403)
        .json({ message: 'Access denied. Not a seller account.' });
    }

    await User.findByIdAndDelete(req.userId);
    res.json({ message: 'Seller account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
