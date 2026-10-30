export function isVariationOptionAvailable(variation, option) {
  return variation.optionAvailability?.[option] !== false;
}

export function getAvailableVariationOptions(variation) {
  return variation.options.filter((option) =>
    isVariationOptionAvailable(variation, option)
  );
}

export function getDefaultVariationSelections(variations) {
  return Object.fromEntries(
    variations.flatMap((variation) => {
      const option = getAvailableVariationOptions(variation)[0];
      return option === undefined ? [] : [[variation.name, option]];
    })
  );
}

export function hasAvailableVariantSelection(variations) {
  return variations.every(
    (variation) =>
      variation.options.length === 0 ||
      getAvailableVariationOptions(variation).length > 0
  );
}

export function areVariationSelectionsAvailable(variations, variationText) {
  if (!variationText) return true;

  return variationText.split(", ").every((selection) => {
    const separatorIndex = selection.indexOf(": ");
    if (separatorIndex < 0) return false;

    const name = selection.slice(0, separatorIndex);
    const option = selection.slice(separatorIndex + 2);
    const variation = variations.find((entry) => entry.name === name);

    return Boolean(
      variation &&
        variation.options.includes(option) &&
        isVariationOptionAvailable(variation, option)
    );
  });
}
