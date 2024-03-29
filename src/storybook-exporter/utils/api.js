import { API_URL, STORYBOOK_ANIMA_TOKEN } from "../constants";
import { capitalize, isBoolean, isString } from "./helpers";
import { Args } from "@storybook/api";
import { gzip } from "pako";


export const authenticate = async (storybookToken) => {
  if (!storybookToken) return false;
  try {
    const res = await fetch(`${API_URL}/storybook_token/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ storybook_auth_token: storybookToken }),
    });
    return res.status === 200;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const getStorybookToken = () => {
  const params = new URLSearchParams(window.location.search);
  const tokenFromUrl = params.get("anima_t");
  if (tokenFromUrl) {
    localStorage.setItem("anima_t", tokenFromUrl);
    return tokenFromUrl;
  }

  const tokenFromLocalStorage = localStorage.getItem("anima_t");
  if (tokenFromLocalStorage) {
    return tokenFromLocalStorage;
  }

  return STORYBOOK_ANIMA_TOKEN;
};

export const createStoryRequest = async (args) => {
  const {
    storybookToken,
    fingerprint,
    CSS,
    HTML,
    height,
    name,
    width,
    defaultCSS,
    defaultHTML,
    storybookId,
  } = args;
  if (!storybookToken) return Promise.reject("No token");

  const gzippedBody = gzip(
    JSON.stringify({
      html: HTML,
      css: CSS,
      fingerprint,
      width,
      height,
      name,
      storybookId,
      storybook_auth_token: storybookToken,
      default_css: defaultCSS,
      default_html: defaultHTML,
      with_variants: true,
    })
  );

  return fetch(`${API_URL}/stories`, {
    method: "POST",
    headers: {
      storybook_auth_token: storybookToken,
      "Content-Type": "application/json",
      "Content-Encoding": "gzip",
    },
    body: gzippedBody,
  });
};

export const extractCSS = () => {
  return Array.from(document.querySelectorAll("style"))
    .flatMap(({ sheet }) =>
      [...sheet.cssRules].map((rule) => {
        const selector = rule?.selectorText || (rule?.name);
        if ([".sb-", "sb-", ":not(.sb"].some((e) => selector?.startsWith(e)))
          return "";
        return rule.cssText;
      })
    )
    .join(" ")
    .replace(/\\n/g, " ")
    .trim();
};

export const getStoryNameFromArgs = (storyName, args) => {
  const defaultName = capitalize(storyName);
  let name = `${defaultName}`;
  const addedArgs = [defaultName];

  const addArg = (s) => {
    if (addedArgs.includes(s)) return;
    name += ` / ${capitalize(s)}`;
    addedArgs.push(s);
  };

  const keys = Object.keys(args);
  for (let i = 0; i < keys.length; i++) {
    if (addedArgs.length > 5) break; // max of 5 args per name
    const key = keys[i];
    const value = args[key];
    if (isString(value)) {
      addArg(value);
    }
    if (isBoolean(value) && value) {
      addArg(key);
    }
  }

  return name;
};