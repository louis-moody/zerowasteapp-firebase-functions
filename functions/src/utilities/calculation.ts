import { StoryType } from "../interfaces";

export const accumlator = (array: any[], key: string) => {
  const numbers = array.map(item => item.data()[key]);
  return numbers.length === 0
    ? 0
    : numbers.reduce((previous, current) => previous + current);
};

export const groupedAccumlator = (
  docs: any[],
  key: string,
  type: StoryType
) => {

  const histories = docs.map(item => item.data());

  const plucked = histories.map((history: any) => { 
      const filtered = history.items.filter((item: any): boolean => item.type === type)
      const numbers = filtered.map((item: any) => item[key])
      if (numbers.length === 0) return 0;
      return numbers.reduce((acc: number, value: number) => acc + value, 0)
  });

  return plucked.length === 0 ? 0 : plucked.reduce((acc, value) => acc + value, 0);
};