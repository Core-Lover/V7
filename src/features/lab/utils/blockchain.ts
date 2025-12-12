import {
  Connection,
  PublicKey,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  getMint,
  getAccount,
} from '@solana/spl-token';

export async function waitForTransaction(
  connection: Connection,
  signature: string,
  commitment: 'processed' | 'confirmed' | 'finalized' = 'confirmed'
): Promise<void> {
  await connection.confirmTransaction(signature, commitment);
}

export async function getTokenBalance(
  connection: Connection,
  tokenAddress: string,
  ownerAddress: string
): Promise<number> {
  try {
    const mintPubkey = new PublicKey(tokenAddress);
    const ownerPubkey = new PublicKey(ownerAddress);
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintPubkey,
      ownerPubkey
    );

    const accountInfo = await getAccount(connection, associatedTokenAddress);
    const mintInfo = await getMint(connection, mintPubkey);
    
    return Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals);
  } catch (error) {
    console.error('Failed to get token balance:', error);
    return 0;
  }
}

export function validateSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function validateEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function formatTokenAmount(amount: string | number, decimals: number): bigint {
  const amountStr = typeof amount === 'number' ? amount.toString() : amount;
  const [whole, fraction = ''] = amountStr.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole + paddedFraction);
}

export function parseTokenAmount(amount: bigint, decimals: number): string {
  const amountStr = amount.toString().padStart(decimals + 1, '0');
  const whole = amountStr.slice(0, -decimals) || '0';
  const fraction = amountStr.slice(-decimals);
  return `${whole}.${fraction}`.replace(/\.?0+$/, '');
}

export async function estimateGas(
  provider: any,
  transaction: any
): Promise<bigint> {
  try {
    return await provider.estimateGas(transaction);
  } catch (error) {
    console.error('Gas estimation failed:', error);
    return BigInt(100000);
  }
}

export function generateERC20Contract(params: {
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  isMintable: boolean;
  isBurnable: boolean;
  isPausable: boolean;
  isCapped: boolean;
  maxSupply?: string;
}): string {
  const {
    name,
    symbol,
    decimals,
    supply,
    isMintable,
    isBurnable,
    isPausable,
    isCapped,
    maxSupply,
  } = params;

  const imports: string[] = [
    'import "@openzeppelin/contracts/token/ERC20/ERC20.sol";',
    'import "@openzeppelin/contracts/access/Ownable.sol";',
  ];

  const inheritance = ['ERC20', 'Ownable'];
  const constructorBody: string[] = [
    `        _mint(msg.sender, ${supply} * 10 ** decimals());`,
  ];

  if (isMintable) {
    if (isCapped && maxSupply) {
      imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";');
      inheritance.splice(1, 0, 'ERC20Capped');
      constructorBody.unshift(`        ERC20Capped(${maxSupply} * 10 ** decimals())`);
    }
  }

  if (isBurnable) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";');
    inheritance.push('ERC20Burnable');
  }

  if (isPausable) {
    imports.push('import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";');
    inheritance.push('ERC20Pausable');
  }

  let contractCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

${imports.join('\n')}

contract ${name.replace(/\s/g, '')} is ${inheritance.join(', ')} {
    constructor() ERC20("${name}", "${symbol}") Ownable(msg.sender) {
${constructorBody.join('\n')}
    }

    function decimals() public pure override returns (uint8) {
        return ${decimals};
    }
`;

  if (isMintable && !isCapped) {
    contractCode += `
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
`;
  } else if (isMintable && isCapped) {
    contractCode += `
    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= cap(), "ERC20Capped: cap exceeded");
        _mint(to, amount);
    }
`;
  }

  if (isPausable) {
    contractCode += `
    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }
`;
  }

  if (isPausable) {
    contractCode += `
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20${isPausable ? ', ERC20Pausable' : ''})
    {
        super._update(from, to, value);
    }
`;
  }

  contractCode += `}`;

  return contractCode;
}

export function truncateAddress(address: string, chars = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}
