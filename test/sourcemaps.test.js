import test from "ava";
import fs from "fs";
import path from "path";
import assign from "object-assign";
import rimraf from "rimraf";
import webpack from "webpack";
import createTestDirectory from "./helpers/createTestDirectory";

const outputDir = path.join(__dirname, "output/sourcemaps");
const babelLoader = path.join(__dirname, "../lib");
const globalConfig = {
  entry: path.join(__dirname, "fixtures/basic.js"),
  module: {
    loaders: [
      {
        test: /\.jsx?/,
        loader: babelLoader,
        exclude: /node_modules/,
      },
    ],
  },
};

// Create a separate directory for each test so that the tests
// can run in parallel
test.cb.beforeEach(t => {
  createTestDirectory(outputDir, t.title, (err, directory) => {
    if (err) return t.end(err);
    t.context.directory = directory;
    t.end();
  });
});

test.cb.afterEach(t => rimraf(t.context.directory, t.end));

test.cb("should output webpack's sourcemap", t => {
  const config = assign({}, globalConfig, {
    devtool: "source-map",
    output: {
      path: t.context.directory,
    },
    module: {
      loaders: [
        {
          test: /\.jsx?/,
          loader: babelLoader + "?presets[]=es2015",
          exclude: /node_modules/,
        },
      ],
    },
  });

  webpack(config, err => {
    t.is(err, null);

    fs.readdir(t.context.directory, (err, files) => {
      t.is(err, null);

      const map = files.filter(file => file.indexOf(".map") !== -1);

      t.true(map.length > 0);

      fs.readFile(path.resolve(t.context.directory, map[0]), (err, data) => {
        t.is(err, null);
        t.not(data.toString().indexOf("webpack:///"), -1);
        t.end();
      });
    });
  });
});
