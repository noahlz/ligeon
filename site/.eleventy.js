export default function (eleventyConfig) {
  // Force passthrough files to be physically copied to _site/ on each change,
  // rather than served virtually — prevents CSS edits from reverting on rebuild.
  eleventyConfig.setServerPassthroughCopyBehavior("copy");

  // Pass through the css directory and the screenshot from repo root
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy({ "../ligeon-screen.png": "ligeon-screen.png" });
  eleventyConfig.addPassthroughCopy({ "../resources/icons/png/128x128.png": "icon.png" });

  return {
    dir: {
      input: ".",
      output: "_site",
    },
  };
}
