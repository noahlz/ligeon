export default function (eleventyConfig) {
  // Pass through the css directory and the screenshot from repo root
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy({ "../ligeon-screen.png": "ligeon-screen.png" });

  return {
    dir: {
      input: ".",
      output: "_site",
    },
  };
}
