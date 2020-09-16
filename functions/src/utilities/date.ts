import * as moment from "moment";

export class DateUtilities {
  isThisWeek(date: Date): boolean {
    const monday = this.getStartOfTheWeek();
    const sunday = this.getEndOfTheWeek();
    return moment(new Date()).isBetween(monday, sunday);
  }

  getStartOfTheWeek(): Date {
    const start = moment()
      .startOf("week")
      .startOf("day");
    // Get Last week if is Sunday. As Week starts on Sun not Mon
    if (start.get("day") === 0) {
      start.subtract(6, "day");
    }
    start.add(1, "day");
    return start.toDate();
  }

  getEndOfTheWeek(): Date {
    const end = moment(this.getStartOfTheWeek());
    end.add(6, "day");
    return end.toDate();
  }

  getThisWeekDates(): Date[] {
    const start = moment(this.getStartOfTheWeek());
    const dates: [any] = [start.toDate().toUTCString()];
    for (let index = 1; index < 7; index++) {
      dates.push(
        start
          .add(1, "days")
          .toDate()
          .toUTCString()
      );
    }
    return dates;
  }

  getLastNMonths(count: number = 6): string[] {
    return this.getLastN("month", "MMM", count);
  }

  getLastNYears(count: number = 6): string[] {
    return this.getLastN("year", "YYYY", count);
  }

  getLastN(
    type: moment.unitOfTime.DurationConstructor,
    format: string,
    count: number = 6
  ): string[] {
    const current = moment().subtract(count - 1, type);
    const dates: [any] = [current.format(format)];
    for (let index = 0; index < count - 1; index++) {
      dates.push(current.add(1, type).format(format));
    }
    return dates;
  }
}
