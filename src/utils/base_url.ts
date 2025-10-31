import path from "path";

import { isNode } from "./is_node";

function getFilePath() {
  return path.resolve(process.cwd(), "static/");
}


export function getBaseUrl(): string {

  if (isNode) {
    // simulation
    return path.resolve(process.cwd(), "static");
  } else {
    // in-browser
    return import.meta.env.BASE_URL || "/scalade/";
  }
}