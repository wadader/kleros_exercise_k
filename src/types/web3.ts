export type EthAddress = `0x${string & { length: 40 }}`;

export function isEthAddress(value: string): value is EthAddress {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}
