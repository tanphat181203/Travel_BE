import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';
import { convert } from 'html-to-text';

const regionMap = {
  1: 'Miền Bắc',
  2: 'Miền Trung',
  3: 'Miền Nam',
};

const generateTourText = (tour) => {
  const regionName = regionMap[tour.region] || 'không xác định';

  const destinationList = tour.destination.join(', ');

  const itinerarySummary = tour.itinerary
    .map((day) => `Ngày ${day.day_number}: ${convert(day.description)}`)
    .join('; ');

  const availabilityStatus = tour.availability
    ? 'hiện đang có sẵn'
    : 'hiện không có sẵn';

  return `Tour du lịch '${tour.title}' kéo dài ${tour.duration}, khởi hành từ ${tour.departure_location}. ${convert(tour.description)}. Tour bao gồm các điểm đến: ${destinationList}, nằm ở ${regionName}. Lịch trình chi tiết: ${itinerarySummary} Tour có sức chứa tối đa ${tour.max_participants} người và ${availabilityStatus}.`;
}

const formatEmbeddingForPgVector = (embeddingData) => {
  let vector = embeddingData;
  if (Array.isArray(vector[0])) {
    vector = vector[0];
  }

  return '[' + vector.join(',') + ']';
}

export const generateEmbedding = async (tourData) => {
  try {
    const response = await fetch(`${process.env.AI_SERVER_URL}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.AI_SERVER_KEY}`,
      },
      body: JSON.stringify({
        text: generateTourText(tourData),
      }),
    });

    const data = await response.json();
    return formatEmbeddingForPgVector(data.embeddings);
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}
