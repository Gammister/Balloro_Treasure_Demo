#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

function loadTrajectoryLibrary() {
  const sourcePath = path.join(__dirname, "trajectory-library-standard.js");
  const context = {};
  vm.runInNewContext(fs.readFileSync(sourcePath, "utf8"), context, {
    filename: sourcePath
  });
  if (!context.PuckLuckTrajectoryLibrary) {
    throw new Error(`Trajectory library was not exported by ${sourcePath}`);
  }
  return JSON.parse(JSON.stringify(context.PuckLuckTrajectoryLibrary));
}

module.exports = loadTrajectoryLibrary;
