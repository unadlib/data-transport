export const detectSafari = () =>
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
