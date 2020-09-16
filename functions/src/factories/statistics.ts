
import { DateUtilities } from "../utilities/date";

export enum TimePeriod {
  weekly = "weekly",
  monthly = "monthly",
  yearly = "yearly"
}

export type ChartData = {
  key: string;
  value: number;
};

export type ChartTimeData = {
  key: string;
  values: ChartData[];
};

export type OverviewChartTimeData = {
  key: string;
  values: ChartTimeData[];
};

export type OverviewStatistics = {
  total_reduced_waste: number;
  total_point: number;
  // total_achievement: number;
  total_weight: number;
  most_active_category: string;
  data: OverviewChartTimeData[];
};

export const windowKeys = (window: TimePeriod): string[] => {
  const dateUtil = new DateUtilities();
  switch (window) {
    case TimePeriod.weekly:
      return ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
    case TimePeriod.monthly:
      return dateUtil.getLastNMonths(8);
    case TimePeriod.yearly:
      return dateUtil.getLastNYears(7);
  }
};
