const LAPTOP_PATTERN = /(?:laptop|ноутбук|ноут|лэптоп)/i;

export function isLaptop(assetType) {
  return LAPTOP_PATTERN.test(String(assetType ?? ""));
}

export function selectComputersForTransfer(computers) {
  const laptopCount = computers.filter((computer) =>
    isLaptop(computer.assetType),
  ).length;
  const singleLaptopExcluded = laptopCount === 1;

  return {
    computers: singleLaptopExcluded
      ? computers.filter((computer) => !isLaptop(computer.assetType))
      : computers,
    laptopCount,
    singleLaptopExcluded,
  };
}
