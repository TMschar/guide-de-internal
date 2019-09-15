export default {};

function constructUrl(endpoint, params) {
  const url = new URL(endpoint);

  Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));

  return url;
}

export const getAllLocations = () => (
  fetch(
    process.env.REACT_APP_GET_ALL_LOCATIONS_ENDPOINT,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )
);

export const getLocationById = (locationId) => (
  fetch(
    constructUrl(
      process.env.REACT_APP_GET_LOCATION_ENDPOINT,
      { location_id: locationId },
    ), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )
);

export const addLocation = (
  name,
  description,
  username,
  longitude,
  latitude,
) => (
  fetch(
    process.env.REACT_APP_ADD_LOCATION_ENDPOINT,
    {
      method: 'POST',
      body: JSON.stringify({
        location_name: name,
        description,
        username,
        longitude,
        latitude,
      }),
    },
  )
);

export const addLocationReview = (
  locationId,
  username,
  text,
  stars,
) => (
  fetch(
    constructUrl(
      process.env.REACT_APP_ADD_LOCATION_REVIEW_ENDPOINT,
      { location_id: locationId },
    ), {
      method: 'POST',
      body: JSON.stringify({
        username,
        text,
        stars,
      }),
    },
  )
);
