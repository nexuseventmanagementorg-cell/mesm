export function normalizeProductTag(value) {
  return value.replace(/\\(?=#)/g, "").replace(/#/g, "").trim();
}

export function parseProductTags(input) {
  const tags = [];
  const seen = new Set();

  for (const part of input.split(/[,;\n]+/)) {
    const tag = normalizeProductTag(part);
    const key = tag.toLocaleLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }

  return tags;
}
