const config = {
  multipass: true,
  js2svg: { pretty: false },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          collapseGroups: false,
          convertShapeToPath: false,
          mergePaths: false,
          removeUnknownsAndDefaults: false,
        },
      },
    },
    { name: "inlineStyles", params: { onlyMatchedOnce: false } },
    "removeDimensions",
  ],
}

export default config
