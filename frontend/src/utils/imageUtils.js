export const getValidImageUrl = (url) => {
  if (!url) return null;
  // If the backend saved the URL as localhost:5000 but the frontend is accessed from another device/host
  // we replace the backend's hardcoded localhost with the actual API URL being used.
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const apiOrigin = apiUrl.replace(/\/api$/, '');
    if (url.startsWith('http://localhost:5000')) {
      return url.replace('http://localhost:5000', apiOrigin);
    }
  }
  return url;
};
