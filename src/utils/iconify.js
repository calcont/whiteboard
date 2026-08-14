// Searchable icon hub backed by the Iconify API (api.iconify.design) — 200k+
// icons across many sets, served on demand. We keep only the genuine full-colour
// logo/brand sets so dropped icons look like real AWS/Docker/Redis/React marks,
// not monochrome placeholders. Runtime dependency: needs network; the API is
// free, public and CORS-enabled.

const API = "https://api.iconify.design";

// Colour logo sets, in display priority (logos = Gil Barbara's brand marks).
const COLORED_SETS = [
  "logos",
  "devicon",
  "skill-icons",
  "vscode-icons",
  "thesvg-color",
];

// Shown before the user types anything.
export const POPULAR = [
  "logos:aws",
  "logos:google-cloud",
  "logos:microsoft-azure",
  "logos:docker-icon",
  "logos:kubernetes",
  "logos:terraform-icon",
  "logos:nginx",
  "logos:redis",
  "logos:postgresql",
  "logos:mongodb-icon",
  "logos:kafka-icon",
  "logos:rabbitmq-icon",
  "logos:react",
  "logos:nodejs-icon",
  "logos:python",
  "logos:java",
  "logos:go",
  "logos:typescript-icon",
  "logos:git-icon",
  "logos:github-icon",
];

export const iconImgUrl = (id, height = 32) =>
  `${API}/${id.replace(":", "/")}.svg?height=${height}`;

export const searchIcons = async (query, limit = 120) => {
  try {
    const res = await fetch(
      `${API}/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    );
    if (!res.ok) return [];
    const data = await res.json();
    const icons = data.icons || [];
    return icons
      .filter((id) => COLORED_SETS.includes(id.split(":")[0]))
      .sort(
        (a, b) =>
          COLORED_SETS.indexOf(a.split(":")[0]) -
          COLORED_SETS.indexOf(b.split(":")[0]),
      );
  } catch (e) {
    return [];
  }
};

export const fetchIconSvg = async (id) => {
  try {
    const res = await fetch(`${API}/${id.replace(":", "/")}.svg`);
    if (!res.ok) return null;
    return res.text();
  } catch (e) {
    return null;
  }
};
