import { createAlert } from "../components/alert";

export const isString = (value) =>
  Object.prototype.toString.call(value) === "[object String]";

export const isBoolean = (val) => "boolean" === typeof val;

export const capitalize = (s) => {
  if (!isString(s)) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const createElementFromHTML = (htmlString) => {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div.firstElementChild;
};

export const notify = (text) => {
  const alertElement = createAlert(text);
  document.body.appendChild(alertElement);

  (alertElement.firstElementChild).style.opacity = "1";

  setTimeout(() => {
    (alertElement.firstElementChild).style.opacity = "0";
    requestAnimationFrame(() => {
      alertElement.remove();
    });
  }, 2500);
};

export const downloadAsJSON = (data) => {
  const content = JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: "text/json" });
  const dataURI = `data:text/json;charset=utf-8,${content}`;
  const URL = window.URL || window.webkitURL;
  const downloadURI =
    typeof URL.createObjectURL === "undefined"
      ? dataURI
      : URL.createObjectURL(blob);

  let link = document.createElement("a");
  link.setAttribute("href", downloadURI);
  link.setAttribute("download", "fg-json.json");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Source: https://stackoverflow.com/a/6234804/18342693
export const escapeHtml = (html) =>
  html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");