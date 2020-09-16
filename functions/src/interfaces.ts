export enum StoryType {
  reuse = "reuse",
  reduce = "reduce",
  refuse = "refuse",
  recycle = "recycle"
}

export interface Acculmatables {
  count: number;
  point: number;
  weight: number;
}

export interface StoryStatistics {
  reuse: number;
  reduce: number;
  refuse: number;
  recycle: number;
}

export interface OverallStatistics {
  total: Acculmatables;
  breakdown_weight: StoryStatistics;
  breakdown_point: StoryStatistics;
}
