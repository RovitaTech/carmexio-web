// Same selects as ../carmexio/lib/core/constants/supabase_constants.dart.
export const LISTING_SELECT = '*, location:locations(*)';
export const CONVERSATION_SELECT =
  '*, listing:listings(id, brand, model, year, price, images), location:locations(*)';

export const LISTING_IMAGES_BUCKET = 'listing-images';
export const AVATARS_BUCKET = 'avatars';
