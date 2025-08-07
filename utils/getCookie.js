export function getCookie(name) {
  const cookies = document.cookie.split("; ");
  console.log("cookies", cookies);
  for (let cookie of cookies) {
      console.log("single cookie", cookie);
    const [key, value] = cookie.split("=");
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}
