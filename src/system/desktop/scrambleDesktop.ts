import { ShellItem } from '../../types/Shell';

const hashString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const scrambleName = (name: string, id: string): string => {
  const hash = hashString(`${name}:${id}`);
  const token = hash.toString(36).slice(0, 4);
  const tokenB = (hash * 17).toString(36).slice(0, 4);

  if (name.includes('.')) {
    const nameParts = name.split('.');
    const extension = nameParts[nameParts.length - 1];
    return `x${token}_${tokenB}.${extension}`;
  }

  return `x${token}_${tokenB}`;
};

export const scrambleDesktop = (items: ShellItem[]): ShellItem[] => {
  const mappedItems = items.map((item) => {
    const scrambledName = scrambleName(item.name, item.id);

    if (item.type === 'file') {
      return {
        ...item,
        name: scrambledName,
        fileSystemFile: {
          ...item.fileSystemFile,
          name: scrambledName,
        },
      };
    }

    return {
      ...item,
      name: scrambledName,
    };
  });

  return mappedItems.sort(
    (a, b) => hashString(a.id + a.name) - hashString(b.id + b.name)
  );
};
