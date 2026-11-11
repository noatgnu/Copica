import { Component, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChartConfiguration, ChartDataset, Point } from "chart.js";
import { interval } from "rxjs";
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-random-chart',
  templateUrl: './random-chart.component.html',
  styleUrls: ['./random-chart.component.css'],
  imports: [BaseChartDirective]
})
export class RandomChartComponent {
  readonly scatterChartType = "scatter" as const;
  readonly points = signal<Point[]>([]);
  readonly chartDataSets = computed<ChartDataset<"scatter">[]>(() => [
    {
      data: this.points(),
      label: "Random",
      pointBorderColor: this.getRandomColor,
      pointBackgroundColor: this.getRandomColor,
      borderWidth: 0,
      borderColor: "transparent",
    }
  ]);
  readonly scatterOptions: ChartConfiguration<"scatter">["options"] = {
    responsive: false,
    animation: {
      duration: 10
    },
    plugins: {
      legend: {display: false}
    }
  };

  constructor() {
    interval(1000).pipe(takeUntilDestroyed()).subscribe(() => this.updateRandom());
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  getRandomData() {
    return Math.round(Math.random() * 100);
  }

  updateRandom() {
    const point = {x: this.getRandomData(), y: this.getRandomData()};
    const current = this.points();
    if (current.length < 10) {
      this.points.set([...current, point]);
    } else {
      const randomIndex = Math.floor(Math.random() * 9 + 1);
      const next = current.slice();
      next.splice(randomIndex, 1, point);
      this.points.set(next);
    }
  }
}
