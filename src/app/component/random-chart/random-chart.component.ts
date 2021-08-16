import {Component, Input, OnInit, AfterViewInit, OnChanges, ViewChild, SimpleChanges, OnDestroy} from '@angular/core';
import {ChartDataSets, ChartType, ChartOptions, ChartColor} from "chart.js"
import {BaseChartDirective, Label} from "ng2-charts";
import {Observable, OperatorFunction, interval, Subscription} from "rxjs";


@Component({
  selector: 'app-random-chart',
  templateUrl: './random-chart.component.html',
  styleUrls: ['./random-chart.component.css']
})
export class RandomChartComponent implements OnInit, OnDestroy {
  scatterChartType: ChartType = "scatter";
  chartDataSets: ChartDataSets[] = [
    {
      data: [],
      label: "Random",
      pointBorderColor:
      this.getRandomColor,
      pointBackgroundColor: this.getRandomColor,
      borderWidth: 0,
      borderColor: "transparent",
      fill: false,
    }
  ]
  scatterOptions: ChartOptions = {
    responsive: false,
    //maintainAspectRatio: true,
    animation: {
      duration: 10
    }
  }

  getRandomColor() {
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (var i = 0; i < 6; i++ ) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  data: number[] = []
  constructor() {

  }

  getRandomData() {
    return Math.round(Math.random()*100)
  }

  ngOnInit(): void {

    this.intervalSub = interval(1000).subscribe(this.updateRandom.bind(this))
  }

  intervalSub: Subscription = new Subscription();

  updateRandom() {
    if (this.chartDataSets[0].data) {
      if (this.chartDataSets[0].data.length < 10) {
        const point: any = {x: this.getRandomData(), y: this.getRandomData()}
        this.chartDataSets[0].data.push(point)

      } else {
        const min = Math.ceil(1)
        const max = Math.floor(10)
        const randomIndex = Math.floor(Math.random()*(max-min)+min)
        this.chartDataSets[0].data?.splice(randomIndex, 1, {x: this.getRandomData(), y: this.getRandomData()})
        this.chartDataSets[0].data = this.chartDataSets[0].data?.slice()
      }
    }

  }

  ngOnChanges(changes: SimpleChanges) {
    for (const p in changes) {
      if (p==="chartDataSets") {
        this.data = changes["chartDataSets"].currentValue;
      }
    }
  }

  ngOnDestroy() {
    this.intervalSub.unsubscribe()
  }
}
