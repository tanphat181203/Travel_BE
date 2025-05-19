import User from '../../models/User.js';
import {
  getPaginationParams,
  createPaginationMetadata,
} from '../../utils/pagination.js';

export const getAllSellers = async (req, res, next) => {
  try {
    const { page, limit, offset } = getPaginationParams(req.query);

    const { users: sellers, totalItems } = await User.find(
      { role: 'seller', status: 'active' },
      limit,
      offset
    );

    const sanitizedSellers = sellers.map((seller) => ({
      id: seller.id,
      name: seller.name,
      avatar_url: seller.avatar_url,
      phone_number: seller.phone_number,
      address: seller.address,
      seller_description: seller.seller_description,
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