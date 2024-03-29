import React from "react";
import { addons, types } from "@storybook/addons";
import {
  ADDON_ID,
  EXPORT_ALL_STORIES,
  EXPORT_END,
  EXPORT_PROGRESS,
  EXPORT_SINGLE_STORY,
  EXPORT_START,
} from "./constants";
import { ExportButton } from "./ExportButton";
import { injectCustomStyles } from "./utils";
import { get } from "lodash";
import ReactDOM from "react-dom";
import Banner from "./components/banner";

addons.register(ADDON_ID, (api) => {
  const channel = api.getChannel();

  injectCustomStyles();

  // ON THE MAIN PAGE
  if (window.location === window.parent.location) {
    const locofyRoot = document.createElement("div");
    locofyRoot.id = "anima-root";
    document.body.appendChild(locofyRoot);

    ReactDOM.render(<Banner channel={channel} />, locofyRoot);

    window.addEventListener(
      "message",
      (event) => {
        const source = get(event, "data.source", "");
        if (source === "locofy") {
          const action = get(event, "data.action", "");
          const data = get(event, "data.data", {});

          switch (action) {
            case EXPORT_START:
              channel.emit(EXPORT_START, data);
              break;
            case EXPORT_END:
              channel.emit(EXPORT_END, { error: data.error });
              break;
            case EXPORT_PROGRESS:
              channel.emit(EXPORT_PROGRESS, data);
              break;

            default:
              break;
          }
        }
      },
      false
    );

    const frame = document.createElement("iframe");
    Object.assign(frame.style, {
      width: "100%",
      height: "100%",
      border: "none",
      zIndex: -1,
      visibility: "hidden",
      position: "fixed",
    });

    // let exportButton: HTMLButtonElement | null;

    frame.onload = function () {
      // exportButton = frame.contentDocument.querySelector(
      //   "#export-button"
      // ) as HTMLButtonElement;
    };
    frame.src = window.location.href;
    document.body.appendChild(frame);

    channel.on(EXPORT_SINGLE_STORY, async ({ storyId }) => {
      const ev = new CustomEvent(EXPORT_SINGLE_STORY, { detail: { storyId } });
      frame.contentDocument.dispatchEvent(ev);
    });
    channel.on(EXPORT_ALL_STORIES, async ({ stories }) => {
      const ev = new CustomEvent(EXPORT_ALL_STORIES, { detail: { stories } });
      frame.contentDocument.dispatchEvent(ev);
    });
  }

  addons.add(ADDON_ID, {
    title: "Locofy",
    type: types.TOOL,
    match: () => true,
    render: () => <ExportButton api={api} />,
  });
});