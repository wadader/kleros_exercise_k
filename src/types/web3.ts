export type EthAddress = `0x${string & { length: 40 }}`;

export function isEthAddress(value: string): value is EthAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export type Hash = `0x${string}`;

export function areEthereumHashesEqual(hash1: string, hash2: string): boolean {
  const normalizedHash1 = hash1.startsWith("0x")
    ? hash1.slice(2).toLowerCase()
    : hash1.toLowerCase();
  const normalizedHash2 = hash2.startsWith("0x")
    ? hash2.slice(2).toLowerCase()
    : hash2.toLowerCase();

  return normalizedHash1 === normalizedHash2;
}
