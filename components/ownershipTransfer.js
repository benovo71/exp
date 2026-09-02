const LAPTOP_PATTERN = /(?:laptop|ноутбук|ноут|лэптоп)/i;

export function isLaptop(assetType) {
  return LAPTOP_PATTERN.test(String(assetType ?? ""));
}

export function selectComputersForTransfer(computers) {
  const laptops = computers.filter((computer) =>
    isLaptop(computer.assetType),
  );

  return {
    computers: computers.filter((computer) => !isLaptop(computer.assetType)),
    laptops,
    laptopCount: laptops.length,
  };
}
