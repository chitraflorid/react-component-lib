import React, { useEffect, useRef, useState } from "react";
import { IconButton } from "@storybook/components";

import {
  API,
  useChannel,
  useStorybookApi,
  Story,
  useStorybookState,
  State,
} from "@storybook/api";
import {
  authenticate,
  createStoryRequest,
  escapeHtml,
  getStorybookToken,
  // getStoryNameFromArgs,
  notify,
} from "./utils";
import {
  EVENT_CODE_RECEIVED,
  EXPORT_END,
  EXPORT_START,
  EXPORT_PROGRESS,
  EXPORT_SINGLE_STORY,
  EXPORT_ALL_STORIES,
  ON_AUTH,
  IFRAME_RENDERER_CLICK,
} from "./constants";
import { STORY_RENDERED } from "@storybook/core-events";
import { choice, runSeed } from "./utils";
import {
  get,
  has,
  isEmpty,
  isNil,
  isString,
  omit,
  omitBy,
  uniqBy,
} from "lodash";
import { Args } from "@storybook/addons";
import md5 from "object-hash";
import { InputType } from "@storybook/csf";

const getArgType = (arg) => {
  let argType = "";
  const control = arg?.control;
  argType = control?.type;
  if (!argType) {
    argType = isString(arg.type) ? arg.type : arg.type.name;
  }
  return argType;
};

const getArgOptions = (arg) => {
  const options = arg?.options || arg?.control?.options || [];
  return options;
};

const populateSeedObjectBasedOnArgType = (
  seedObj,
  arg,
  argKey
) => {
  const seedObject = { ...seedObj };
  const argType = getArgType(arg);
  const argOptions = getArgOptions(arg);
  switch (argType) {
    case "select":
    case "radio":
      seedObject[argKey] = choice(...argOptions);
      break;
    case "boolean":
      seedObject[argKey] = choice(true, false);
      break;
  }
  return seedObject;
};

const getVariants = (story) => {
  const argTypes = get(story, "argTypes", null);
  let seedObj = {};
  const storyArgs = get(story, "args", {});
  const storyDefaultArgs = get(story, "initialArgs", {});

  if (argTypes) {
    const argKeys = Object.keys(argTypes);

    for (const argKey of argKeys) {
      const arg = argTypes[argKey];

      seedObj[argKey] = has(storyDefaultArgs, argKey)
        ? storyDefaultArgs[argKey]
        : has(storyArgs, argKey)
        ? storyArgs[argKey]
        : null;

      seedObj = populateSeedObjectBasedOnArgType(seedObj, arg, argKey);
    }
  }

  seedObj = omitBy(seedObj, isNil);
  let defaultVariant = {};
  Object.keys(seedObj).forEach((key) => {
    const getValue = (key) => {
      if (has(storyDefaultArgs, key)) return storyDefaultArgs[key];
      if (has(storyArgs, key)) return storyArgs[key];

      const arg = argTypes[key];
      const argType = getArgType(arg);

      if (["select", "radio"].includes(argType)) {
        const options = getArgOptions(arg);
        return options.length > 0 ? options[0] : null;
      }
      if (["boolean"].includes(argType)) {
        return false;
      }
    };

    defaultVariant[key] = getValue(key);
  });

  const hash = md5(defaultVariant);
  defaultVariant["hash"] = hash;

  const variants = (
    !isEmpty(seedObj) ? runSeed(() => seedObj) : [defaultVariant]
  );
  return [variants, defaultVariant, hash];
};

const doExport = async (
  api,
  state,
  data,
  action = "create-single-story"
) => {
  const channel = api.getChannel();

  if (window.location === window.parent.location) {
    if (action === EXPORT_SINGLE_STORY) {
      const story = api.getCurrentStoryData();
      channel.emit(EXPORT_SINGLE_STORY, { storyId: story.id });
     console.log(story);
    }

    if (action === EXPORT_ALL_STORIES) {
      const stories = Object.entries(state.storiesHash);
      const componentStories = stories
        .map(([_, story]) => story)
        .filter(
          (story) =>
            story.isComponent &&
            !(story.parameters || { docsOnly: false })["docsOnly"]
        );

        console.log(componentStories);
        channel.emit(EXPORT_ALL_STORIES, { stories: componentStories });
    }

    return Promise.resolve(true);
  }

  return createStory(api, data);
};

const createStory = async (
  api,
  data
) => {
  const story = api.getCurrentStoryData();

  const storyName = story.name;
  const storyId = story.id;

  let SBRenderCallback = (() => {});

  const getSBRenderPromise = () => {
    return new Promise((resolve) => {
      SBRenderCallback = resolve;
    });
  };

  const handleSBRender = () => {
    setTimeout(() => {
      process.nextTick(() => {
        SBRenderCallback();
      });
    }, 0);
  };

  api.on(STORY_RENDERED, handleSBRender);

  const [variants, defaultVariant, defaultVariantHash] = getVariants(story);

  console.log(variants);

  parent.postMessage(
    {
      action: EXPORT_START,
      source: "locofy",
      data: { total: variants.length, storyName },
    },
    "*"
  );

  let HTML = "",
    CSS = "",
    defaultHTML = "",
    defaultCSS = "";

  const orderedVariants = uniqBy([defaultVariant, ...variants], (e) => e.hash);

  const hashArray = orderedVariants.map((e) => e.hash);

  for (let i = 0; i < orderedVariants.length; i++) {
    const variantHash = get(orderedVariants[i], "hash", "");
    const variant = omit(orderedVariants[i], "hash");

    const p = getSBRenderPromise();

    api.updateStoryArgs(story, variant);
    await p;

    window.parent.postMessage(
      {
        action: EXPORT_PROGRESS,
        data: {
          current: i + 1,
          total: orderedVariants.length,
          storyName,
        },
        source: "locofy",
      },
      "*"
    );

    const variantData = Object.keys(variant).map(
      (key) => `${key}=${variant[key]}`
    );

    const variantID = escapeHtml(variantData.join(",") || "default");
    const variantHTML = `<div data-variant='${variantID}' data-variant-id="${variantHash}">${data.current.html}</div>`;
    const variantCSS = data.current.css;

    if (variantHash === defaultVariantHash) {
      defaultHTML = variantHTML;
      defaultCSS = variantCSS;
    }

    HTML += variantHTML;
    CSS += variantCSS;
  }

  const gridCSS = `
    #root{
      display: inline-grid;
      grid-template-columns: repeat(6, 1fr);
      grid-template-rows: auto;
      gap: 10px 5px;
    }
`;

  // display the variants in a grid layout
  if (orderedVariants.length > 1) {
    CSS += gridCSS;
  }

  const fingerprint = md5({ variants: hashArray, name: storyName });

  const { height, width } = data.current;
  return createStoryRequest({
    storybookToken: getStorybookToken(),
    fingerprint,
    CSS,
    HTML,
    defaultCSS,
    defaultHTML,
    height,
    name: storyName,
    width,
    storybookId: storyId,
  });
};

export const ExportButton = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const storyData = useRef<StoryData>({
    css: "",
    html: "",
    width: 0,
    height: 0,
  });

  useChannel({
    [IFRAME_RENDERER_CLICK]: () => {
      setIsPopoverOpen(false);
    },
    [EVENT_CODE_RECEIVED]: (data) => {
      storyData.current = data;
    },
    [ON_AUTH]: (authState) => {
      setIsAuthenticated(authState);
    },
    [EXPORT_START]: () => {
      setIsExporting(true);
      // openExportBanner()
    },
    [EXPORT_END]: ({ error = false } = {}) => {
      setIsExporting(false);
      if (!error) {
        notify("Story synced successfully");
      }
    },
  });

  const isMainThread = window.location === window.parent.location;
  const api = useStorybookApi();
  const state = useStorybookState();

  const handleChangeStory = ((event: CustomEvent) => {
    // api.selectStory(kindOeId);

    const storyId = get(event, "detail.storyId", null);
    if (storyId) {
      api.selectStory(storyId);
      doExport(api, state, storyData)
        .then(() => {
          parent.postMessage(
            { action: EXPORT_END, source: "locofy", error: null },
            "*"
          );
        })
        .catch(() => {
          parent.postMessage(
            { action: EXPORT_END, source: "locofy", error: true },
            "*"
          );
        });
    }
  });

  const handleExportAllStories = (async (event) => {
    const stories = get(event, "detail.stories", []);
    try {
      for (const story of stories) {
        api.selectStory(story.id);
        await doExport(api, state, storyData);
      }
      parent.postMessage(
        { action: EXPORT_END, source: "locofy", error: null },
        "*"
      );
    } catch (error) {
      parent.postMessage(
        { action: EXPORT_END, source: "locofy", error: true },
        "*"
      );
    }
  });

  useEffect(() => {
    let mounted = true;
    if (!isAuthenticated) {
      authenticate(getStorybookToken()).then((isAuthenticated) => {
        if (mounted) {
          setIsAuthenticated(isAuthenticated);
        }
      });
    }

    document.addEventListener(EXPORT_SINGLE_STORY, handleChangeStory);
    document.addEventListener(EXPORT_ALL_STORIES, handleExportAllStories);

    return () => {
      mounted = false;
      document.removeEventListener(EXPORT_SINGLE_STORY, handleChangeStory);
      document.removeEventListener(EXPORT_ALL_STORIES, handleExportAllStories);
    };
  }, []);

  const handleExportClick = (action = "create-single-story") => {
    doExport(api, state, storyData, action);
    setIsPopoverOpen(false);
  };

  return (
    <>
      <div
        style={{
          fontFamily: "Mulish, sans-serif",
          visibility: "hidden",
          position: "fixed",
          zIndex: -1,
        }}
      >
        Locofy
      </div>
      <Popover
        isOpen={isPopoverOpen}
        onClickOutside={() => setIsPopoverOpen(false)}
        positions={["bottom", "left"]} // preferred positions by priority
        content={
          <div className="sb_popover_content">
            <ul className="sb_popover_list">
              <li
                className="sb_popover_list_item"
                onClick={() => handleExportClick(EXPORT_SINGLE_STORY)}
              >
                Export Story
              </li>
              <li
                onClick={() => handleExportClick(EXPORT_ALL_STORIES)}
                className="sb_popover_list_item"
              >
                Export Full Library
              </li>
            </ul>
          </div>
        }
      >
        <div>
          <IconButton
            id="export-button"
            title={
              isAuthenticated ? "Export to Locofy" : "Authenticate to export"
            }
            onClick={() => {
              if (isMainThread && !isAuthenticated) {
                notify(
                  "Missing team token. Please read the installation instructions."
                );
                return;
              }
              setIsPopoverOpen(!isPopoverOpen);
            }}
          >
            {isExporting ? (
              <svg
                width="16px"
                height="16px"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 478 522"
              >
                <path
                  className="t"
                  d="M52.655 55h355.457a2.608 2.608 0 0 1 2.247 1.21 2.599 2.599 0 0 1 .147 2.546 398.689 398.689 0 0 1-134.045 153.408c-92.415 62.352-185.475 68.791-223.778 69.135A2.625 2.625 0 0 1 50 278.672V57.628A2.63 2.63 0 0 1 52.655 55Z"
                  fill="#FF6250"
                />
                <path
                  className="c"
                  d="M129.375 467.75c43.835 0 79.37-35.536 79.37-79.371 0-43.834-35.535-79.369-79.37-79.369-43.835 0-79.37 35.535-79.37 79.369 0 43.835 35.535 79.371 79.37 79.371Z"
                  fill="#FFDF90"
                />
                <path
                  className="l"
                  d="M310.854 464.542c-22.453-8.571-34.395-33.281-26.787-55.156l59.917-170.984c7.677-21.875 32.098-32.648 54.552-24.077 22.453 8.585 34.395 33.281 26.787 55.169l-59.917 170.985c-7.677 21.875-32.098 32.662-54.552 24.063Z"
                  fill="#36F"
                />
              </svg>
            ) : (
              <svg
                style={{
                  ...(!isAuthenticated ? { filter: "grayscale(1)" } : {}),
                }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 32 32"
              >
                <rect width="32" height="32" fill="#3B3B3B" rx="4" />
                <path
                  fill="#FF6250"
                  d="M7.1287 6H24.353a.1262.1262 0 0 1 .1088.0586.1266.1266 0 0 1 .0072.1234 19.319 19.319 0 0 1-6.4955 7.4335c-4.4781 3.0214-8.9875 3.3334-10.8435 3.35a.1261.1261 0 0 1-.12-.0779.1282.1282 0 0 1-.01-.0494V6.1273A.1274.1274 0 0 1 7.1287 6Z"
                />
                <path
                  fill="#FFDF90"
                  d="M10.8461 25.9999c2.1241 0 3.846-1.7219 3.846-3.846 0-2.1242-1.7219-3.8461-3.846-3.8461C8.7219 18.3078 7 20.0297 7 22.1539c0 2.1241 1.722 3.846 3.8461 3.846Z"
                />
                <path
                  fill="#36F"
                  d="M18.708 25.7722c-1.088-.4153-1.6667-1.6127-1.298-2.6727l2.9034-8.2855c.372-1.06 1.5554-1.582 2.6434-1.1667 1.088.4161 1.6667 1.6127 1.298 2.6734l-2.9034 8.2855c-.372 1.06-1.5553 1.5827-2.6434 1.166Z"
                />
              </svg>
            )}
          </IconButton>
        </div>
      </Popover>
    </>
  );
};