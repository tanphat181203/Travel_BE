import User from '../../models/User.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const listSellers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const { users: sellers, totalItems } = await User.find(
      { role: 'seller' },
      limit,
      offset
    );

    const sanitizedSellers = sellers.map((seller) => ({
      id: seller.id,
      email: seller.email,
      name: seller.name,
      avatar_url: seller.avatar_url,
      phone_number: seller.phone_number,
      address: seller.address,
      status: seller.status,
    }));

    const pagination = createPaginationMetadata(page, limit, totalItems);

    res.json({
      sellers: sanitizedSellers,
      pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getSellerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller = await User.findById(id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'User is not a seller' });
    }

    const sanitizedSeller = {
      id: seller.id,
      email: seller.email,
      name: seller.name,
      avatar_url: seller.avatar_url,
      phone_number: seller.phone_number,
      address: seller.address,
      status: seller.status,
    };

    res.json(sanitizedSeller);
  } catch (error) {
    next(error);
  }
};

export const deleteSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seller = await User.findById(id);

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    if (seller.role !== 'seller') {
      return res.status(400).json({ message: 'User is not a seller' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Seller deleted successfully' });
  } catch (error) {
    next(error);
  }
};
