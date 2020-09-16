import * as admin from "firebase-admin";
import * as functions from 'firebase-functions';

import {
  OverviewStatistics,
  OverviewChartTimeData,
  windowKeys,
  TimePeriod,
  ChartTimeData
} from "../factories/statistics";
import { DateUtilities } from "../utilities/date";
import * as moment from "moment";

const chartDataMapper = (period: TimePeriod, set: any): ChartTimeData[] => {
  return windowKeys(period).map(label => {
    return {
      key: label,
      values: [
        {
          key: "Reuse",
          value: set[label].reuse
        },
        {
          key: "Refuse",
          value: set[label].refuse
        },
        {
          key: "Reduce",
          value: set[label].reduce
        },
        {
          key: "Recycle",
          value: set[label].recycle
        }
      ]
    };
  });
};

const emptyChartData = (): any => {
  const values = {
    reuse: 0,
    refuse: 0,
    reduce: 0,
    recycle: 0
  };
  const data: any = {};
  [TimePeriod.weekly, TimePeriod.monthly, TimePeriod.yearly].forEach(period => {
    data[period] = {};
    windowKeys(period).forEach(label => {
      data[period][label] = values;
    });
  });
  return data;
};

export class StatsService {
  async test(recordId: string, profileId: string): Promise<OverviewStatistics> {
    const all = await admin
      .firestore()
      .collection(`/records/${recordId}/submissions`)
      .orderBy("date", "desc")
      .get();

    // Get Most active category
    const mostActiveCategory = this.getMostActiveCategory(all.docs);

    // Get total tracked items count
    const totalTrackables = this.getTotalTrackableCount(all.docs);

    // Get total sutainability points
    const totalPoints = this.getTotalSustainabilityPoints(all.docs);

    // Get total unlocked achievements
    //...const totalAchievements = await this.getUnlockedAchievementCount(profileId);

    // Get total weight 
    const totalWeight = await this.getTotalWeight(all.docs)

    // Get chart data
    const data = this.getChartData(all.docs);

    return {
      total_reduced_waste: totalTrackables,
      total_point: totalPoints,
      // total_achievement: totalAchievements,
      total_weight: totalWeight,
      most_active_category: mostActiveCategory,
      data: data
    };
  }

  getChartData(
    snaps: FirebaseFirestore.QueryDocumentSnapshot[]
  ): OverviewChartTimeData[] {
    // thisweek: util.getThisWeekDates(),
    const util = new DateUtilities();
    const startOfWeek = util.getStartOfTheWeek();
    const endOfWeek = util.getEndOfTheWeek();

    functions.logger.info("Hello startOfWeek!", startOfWeek);
    functions.logger.info("Hello endOfWeek!", endOfWeek);

    const data: any[] = [];
    const weeklyData: any = {};
    const returnData: any = emptyChartData();

    windowKeys(TimePeriod.weekly).forEach(label => {
      weeklyData[label] = {
        reuse: 0,
        refuse: 0,
        reduce: 0,
        recycle: 0
      };
    });

    snaps.forEach(snap => {
      const createDate = snap.createTime.toDate();

      // Extract weights
      const { reuse, refuse, reduce, recycle } = snap.data().weights;

      // Calculate weekly stats
      if (moment(createDate).isBetween(startOfWeek, endOfWeek)) {
        // Fix Daylight savings offset
        const day = (!moment(createDate).isDST()
          ? moment(createDate).add(1, "hour")
          : moment(createDate)
        ).format("ddd");

        // Append this week's data
        try {
          if (returnData[TimePeriod.weekly][day]) {
            returnData[TimePeriod.weekly][day] = {
              reuse: returnData[TimePeriod.weekly][day].reuse + reuse,
              refuse: returnData[TimePeriod.weekly][day].refuse + refuse,
              reduce: returnData[TimePeriod.weekly][day].reduce + reduce,
              recycle: returnData[TimePeriod.weekly][day].recycle + recycle
            };
          }
        } catch (err) {
          console.error(err);
        }
      }

      // Calculate monthly stats (Between this year)
      if (moment(createDate).year() === moment().year()) {
        try {
          const month = moment(createDate).format("MMM");
          if (returnData[TimePeriod.monthly][month]) {
            returnData[TimePeriod.monthly][month] = {
              reuse: returnData[TimePeriod.monthly][month].reuse + reuse,
              refuse: returnData[TimePeriod.monthly][month].refuse + refuse,
              reduce: returnData[TimePeriod.monthly][month].reduce + reduce,
              recycle: returnData[TimePeriod.monthly][month].recycle + recycle
            };
          }
        } catch (err) {
          console.error(err);
        }
      }

      // Calculate yearly stats (In the past 5 years)
      try {
        const year = moment(createDate).format("YYYY");
        if (returnData[TimePeriod.yearly][`${year}`]) {
          returnData[TimePeriod.yearly][`${year}`] = {
            reuse: returnData[TimePeriod.yearly][`${year}`].reuse + reuse,
            refuse: returnData[TimePeriod.yearly][`${year}`].refuse + refuse,
            reduce: returnData[TimePeriod.yearly][`${year}`].reduce + reduce,
            recycle: returnData[TimePeriod.yearly][`${year}`].recycle + recycle
          };
        }
      } catch (err) {
        console.error(err);
      }
    });

    const dummyData = OverallStatisticsFactory.timePeriod().data;

    dummyData.forEach(period => {
      let key = TimePeriod.weekly;
      if (period.key === TimePeriod.weekly) {
        key = TimePeriod.weekly;
      } else if (period.key === TimePeriod.monthly) {
        key = TimePeriod.monthly;
      } else if (period.key === TimePeriod.yearly) {
        key = TimePeriod.yearly;
      }
      data.push({
        key: period.key,
        values: chartDataMapper(key, returnData[period.key])
      });
    });
    return data;
  }

  getMostActiveCategory(
    snaps: FirebaseFirestore.QueryDocumentSnapshot[]
  ): string {
    // Calucate active category
    const activeCategories: any = {
      Reuse: 0,
      Reduce: 0,
      Refuse: 0,
      Recycle: 0
    };

    snaps.forEach(snap => {
      const items = snap.data().items;
      items.forEach((item: any) => {
        activeCategories[item.type.label] += 1;
      });
    });

    let tempCategory = "";
    let tempCategoryCounter = 0;
    for (const [key, value] of Object.entries(activeCategories)) {
      const castedNumber = value as number;
      if (castedNumber > tempCategoryCounter) {
        tempCategory = key;
        tempCategoryCounter = castedNumber;
      }
    }

    return tempCategory;
  }

  getTotalTrackableCount(
    snaps: FirebaseFirestore.QueryDocumentSnapshot[]
  ): number {
    return snaps.reduce(
      (acc: number, snap: FirebaseFirestore.DocumentSnapshot) =>
        acc + snap.data()!.total,
      0
    );
  }

  getTotalSustainabilityPoints(
    snaps: FirebaseFirestore.QueryDocumentSnapshot[]
  ): number {
    return snaps.reduce(
      (acc: number, snap: FirebaseFirestore.DocumentSnapshot) => {
        const { recycle, reduce, refuse, reuse } = snap.data()!.points;
        return acc + recycle + reduce + refuse + reuse;
      },
      0
    );
  }
  getTotalWeight(
    snaps: FirebaseFirestore.QueryDocumentSnapshot[]
  ): number {
    return snaps.reduce(
      (acc: number, snap: FirebaseFirestore.DocumentSnapshot) => {
        const { recycle, reduce, refuse, reuse } = snap.data()!.weights;
        return acc + recycle + reduce + refuse + reuse;
      },
      0
    );
  }
  async getUnlockedAchievementCount(profileId: string): Promise<number> {
    const profiles = await admin
      .firestore()
      .collection(`/profiles/${profileId}/achievements`)
      .get();
    return profiles.docs.length;
  }
}


const TypeKeys: string[] = ["Reuse", "Reduce", "Refuse", "Recycle"];

export const OverallStatisticsFactory = {
  timePeriod: (): OverviewStatistics => {
    const data: OverviewChartTimeData[] = [];
    const windows = [TimePeriod.weekly, TimePeriod.monthly, TimePeriod.yearly];
    windows.forEach(windowType => {
      const timeLabels: string[] = windowKeys(windowType);
      // Map key into key & values
      const timeData: ChartTimeData[] = timeLabels.map(time => ({
        key: time,
        values: TypeKeys.map(type => ({
          key: type,
          value: 0 //faker.random.number({ min: 0, max: 3.2, precision: 2 }
        }))
      }));
      data.push({
        key: TimePeriod[windowType],
        values: timeData
      });
    });
    return {
      total_reduced_waste: 0,
      total_point: 0,
      total_weight: 0,
      most_active_category: "Reuser",
      data: data
    };
  }
};
