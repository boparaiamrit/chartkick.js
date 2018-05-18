import {
    formatValue,
    isArray,
    isDay,
    isHour,
    isMinute,
    isMonth,
    isWeek,
    isYear,
    jsOptionsFunc,
    merge,
    sortByNumber,
    toFloat,
    toStr
} from "../helpers";

function allZeros(data) {
    let i, j, d;
    for (i = 0; i < data.length; i++) {
        d = data[i].data;
        for (j = 0; j < d.length; j++) {
            if (d[j][1] != 0) {
                return false;
            }
        }
    }
    return true;
}

let baseOptions = {
    maintainAspectRatio: false,
    animation: false,
    tooltips: {
        displayColors: false,
        callbacks: {}
    },
    legend: {},
    title: {fontSize: 20, fontColor: "#333"}
};

let defaultOptions = {
    scales: {
        yAxes: [
            {
                ticks: {
                    maxTicksLimit: 4
                },
                scaleLabel: {
                    fontSize: 16,
                    // fontStyle: "bold",
                    fontColor: "#333"
                }
            }
        ],
        xAxes: [
            {
                gridLines: {
                    drawOnChartArea: false
                },
                scaleLabel: {
                    fontSize: 16,
                    // fontStyle: "bold",
                    fontColor: "#333"
                },
                time: {},
                ticks: {}
            }
        ]
    }
};

let colors = [
    "#0A5C98",
    "#2375B1",
    "#3D8FCB",
    "#56A8E4",
    "#66B0E6",
    "#77B9E9",
    "#88C2EC",
    "#99CAEE",
    "#B3E4FF",
    "#CDFEFF"
];

let hideLegend = function (options, legend, hideLegend) {
    if (legend !== undefined) {
        options.legend.display = !!legend;
        if (legend && legend !== true) {
            options.legend.position = legend;
        }
    } else if (hideLegend) {
        options.legend.display = false;
    }
};

let setTitle = function (options, title) {
    options.title.display = true;
    options.title.text = title;
};

let setMin = function (options, min) {
    if (min !== null) {
        options.scales.yAxes[0].ticks.min = toFloat(min);
    }
};

let setMax = function (options, max) {
    options.scales.yAxes[0].ticks.max = toFloat(max);
};

let setBarMin = function (options, min) {
    if (min !== null) {
        options.scales.xAxes[0].ticks.min = toFloat(min);
    }
};

let setBarMax = function (options, max) {
    options.scales.xAxes[0].ticks.max = toFloat(max);
};

let setStacked = function (options, stacked) {
    options.scales.xAxes[0].stacked = !!stacked;
    options.scales.yAxes[0].stacked = !!stacked;
};

let setXtitle = function (options, title) {
    options.scales.xAxes[0].scaleLabel.display = true;
    options.scales.xAxes[0].scaleLabel.labelString = title;
};

let setYtitle = function (options, title) {
    options.scales.yAxes[0].scaleLabel.display = true;
    options.scales.yAxes[0].scaleLabel.labelString = title;
};

let setLabelSize = function (chart, data, options) {
    let maxLabelSize = Math.ceil(chart.element.offsetWidth / 4.0 / data.labels.length);
    if (maxLabelSize > 25) {
        maxLabelSize = 25;
    }
    options.scales.xAxes[0].ticks.callback = function (value) {
        value = toStr(value);
        if (value.length > maxLabelSize) {
            return value.substring(0, maxLabelSize - 2) + "...";
        } else {
            return value;
        }
    };
};

let setFormatOptions = function (chart, options, chartType) {
    let formatOptions = {
        prefix: chart.options.prefix,
        suffix: chart.options.suffix,
        thousands: chart.options.thousands,
        decimal: chart.options.decimal
    };

    if (formatOptions.prefix || formatOptions.suffix || formatOptions.thousands || formatOptions.decimal) {
        if (chartType !== "pie") {
            let myAxes = options.scales.yAxes;
            if (chartType === "bar") {
                myAxes = options.scales.xAxes;
            }

            if (!myAxes[0].ticks.callback) {
                myAxes[0].ticks.callback = function (value) {
                    return formatValue("", value, formatOptions);
                };
            }
        }

        if (!options.tooltips.callbacks.label) {
            if (chartType !== "pie") {
                let valueLabel = chartType === "bar" ? "xLabel" : "yLabel";
                options.tooltips.callbacks.label = function (tooltipItem, data) {
                    let label = data.datasets[tooltipItem.datasetIndex].label || '';
                    if (label) {
                        label += ': ';
                    }
                    return formatValue(label, tooltipItem[valueLabel], formatOptions);
                };
            } else {
                // need to use separate label for pie charts
                options.tooltips.callbacks.label = function (tooltipItem, data) {
                    let dataLabel = data.labels[tooltipItem.index];
                    let value = ': ';

                    if (isArray(dataLabel)) {
                        // show value on first line of multiline label
                        // need to clone because we are changing the value
                        dataLabel = dataLabel.slice();
                        dataLabel[0] += value;
                    } else {
                        dataLabel += value;
                    }

                    return formatValue(dataLabel, data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index], formatOptions);
                };
            }
        }
    }
};

let jsOptions = jsOptionsFunc(merge(baseOptions, defaultOptions), hideLegend, setTitle, setMin, setMax, setStacked, setXtitle, setYtitle);

let createDataTable = function (chart, options, chartType) {
    let datasets = [];
    let labels = [];

    let day = true;
    let week = true;
    let dayOfWeek;
    let month = true;
    let year = true;
    let hour = true;
    let minute = true;
    let detectType = (chartType === "line" || chartType === "area") && !chart.discrete;

    let series = chart.data;

    let sortedLabels = [];

    let i, j, s, d, key, rows = [];
    for (i = 0; i < series.length; i++) {
        s = series[i];

        for (j = 0; j < s.data.length; j++) {
            d = s.data[j];
            key = detectType ? d[0].getTime() : d[0];
            if (!rows[key]) {
                rows[key] = new Array(series.length);
            }
            rows[key][i] = toFloat(d[1]);
            if (sortedLabels.indexOf(key) === -1) {
                sortedLabels.push(key);
            }
        }
    }

    if (detectType || chart.options.xtype === "number") {
        sortedLabels.sort(sortByNumber);
    }

    let rows2 = [];
    for (j = 0; j < series.length; j++) {
        rows2.push([]);
    }

    let value;
    let k;
    for (k = 0; k < sortedLabels.length; k++) {
        i = sortedLabels[k];
        if (detectType) {
            value = new Date(toFloat(i));
            // TODO make this efficient
            day = day && isDay(value);
            if (!dayOfWeek) {
                dayOfWeek = value.getDay();
            }
            week = week && isWeek(value, dayOfWeek);
            month = month && isMonth(value);
            year = year && isYear(value);
            hour = hour && isHour(value);
            minute = minute && isMinute(value);
        } else {
            value = i;
        }
        labels.push(value);
        for (j = 0; j < series.length; j++) {
            // Chart.js doesn't like undefined
            rows2[j].push(rows[i][j] === undefined ? null : rows[i][j]);
        }
    }

    for (i = 0; i < series.length; i++) {
        s = series[i];

        let dataset = {
            label: s.name,
            data: rows2[i],
            fill: chartType === "area",
            borderColor: colors[i],
            backgroundColor: colors[i],
            pointBackgroundColor: colors[i],
            borderWidth: 2
        };

        if (s.stack) {
            dataset.stack = s.stack;
        }

        if (chart.options.curve === false) {
            dataset.lineTension = 0;
        }

        if (chart.options.points === false) {
            dataset.pointRadius = 0;
            dataset.pointHitRadius = 5;
        }

        datasets.push(merge(dataset, s.library || {}));
    }

    if (detectType && labels.length > 0) {
        let minTime = labels[0].getTime();
        let maxTime = labels[0].getTime();
        for (i = 1; i < labels.length; i++) {
            value = labels[i].getTime();
            if (value < minTime) {
                minTime = value;
            }
            if (value > maxTime) {
                maxTime = value;
            }
        }

        let timeDiff = (maxTime - minTime) / (86400 * 1000.0);

        if (!options.scales.xAxes[0].time.unit) {
            let step;
            if (year || timeDiff > 365 * 10) {
                options.scales.xAxes[0].time.unit = "year";
                step = 365;
            } else if (month || timeDiff > 30 * 10) {
                options.scales.xAxes[0].time.unit = "month";
                step = 30;
            } else if (day || timeDiff > 10) {
                options.scales.xAxes[0].time.unit = "day";
                step = 1;
            } else if (hour || timeDiff > 0.5) {
                options.scales.xAxes[0].time.displayFormats = {hour: "MMM D, h a"};
                options.scales.xAxes[0].time.unit = "hour";
                step = 1 / 24.0;
            } else if (minute) {
                options.scales.xAxes[0].time.displayFormats = {minute: "h:mm a"};
                options.scales.xAxes[0].time.unit = "minute";
                step = 1 / 24.0 / 60.0;
            }

            if (step && timeDiff > 0) {
                let unitStepSize = Math.ceil(timeDiff / step / (chart.element.offsetWidth / 100.0));
                if (week && step === 1) {
                    unitStepSize = Math.ceil(unitStepSize / 7.0) * 7;
                }
                options.scales.xAxes[0].time.unitStepSize = unitStepSize;
            }
        }

        if (!options.scales.xAxes[0].time.tooltipFormat) {
            if (day) {
                options.scales.xAxes[0].time.tooltipFormat = "ll";
            } else if (hour) {
                options.scales.xAxes[0].time.tooltipFormat = "MMM D, h a";
            } else if (minute) {
                options.scales.xAxes[0].time.tooltipFormat = "h:mm a";
            }
        }
    }

    let data = {
        labels: labels,
        datasets: datasets
    };

    return data;
};

export default class {
    constructor(library) {
        this.name = "chartjs";
        this.library = library;
    }

    renderLineChart(chart, chartType) {
        if (chart.options.xtype === "number") {
            return this.renderScatterChart(chart, chartType, true);
        }

        let chartOptions = {};
        if (chartType === "area") {
            // TODO fix area stacked
            // chartOptions.stacked = true;
        }
        // fix for https://github.com/chartjs/Chart.js/issues/2441
        if (!chart.options.max && allZeros(chart.data)) {
            chartOptions.max = 1;
        }

        let options = jsOptions(chart, merge(chartOptions, chart.options));
        setFormatOptions(chart, options, chartType);

        let data = createDataTable(chart, options, chartType || "line");

        options.scales.xAxes[0].type = chart.discrete ? "category" : "time";

        this.drawChart(chart, "line", data, options);
    }

    renderPieChart(chart) {
        let options = merge({}, baseOptions);
        if (chart.options.donut) {
            options.cutoutPercentage = 50;
        }

        if ("legend" in chart.options) {
            hideLegend(options, chart.options.legend);
        }

        if (chart.options.title) {
            setTitle(options, chart.options.title);
        }

        options = merge(options, chart.options.library || {});
        setFormatOptions(chart, options, "pie");

        let labels = [];
        let values = [];
        for (let i = 0; i < chart.data.length; i++) {
            let point = chart.data[i];
            labels.push(point[0]);
            values.push(point[1]);
        }

        let data = {
            labels: labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: colors,
                    borderColor: colors
                }
            ]
        };

        this.drawChart(chart, "pie", data, options);
    }

    renderColumnChart(chart, chartType) {
        let options;
        if (chartType === "bar") {
            options = jsOptionsFunc(merge(baseOptions, defaultOptions), hideLegend, setTitle, setBarMin, setBarMax, setStacked, setXtitle, setYtitle)(chart, chart.options);
        } else {
            options = jsOptions(chart, chart.options);
        }
        setFormatOptions(chart, options, chartType);
        let data = createDataTable(chart, options, "column");
        if (chartType !== "bar") {
            setLabelSize(chart, data, options);
        }
        this.drawChart(chart, (chartType === "bar" ? "horizontalBar" : "bar"), data, options);
    }

    renderAreaChart(chart) {
        this.renderLineChart(chart, "area");
    }

    renderBarChart(chart) {
        this.renderColumnChart(chart, "bar");
    }

    renderScatterChart(chart, chartType, lineChart) {
        chartType = chartType || "line";

        let options = jsOptions(chart, chart.options);
        if (!lineChart) {
            setFormatOptions(chart, options, chartType);
        }

        let datasets = [];
        let series = chart.data;
        for (let i = 0; i < series.length; i++) {
            let s = series[i];
            let d = [];
            for (let j = 0; j < s.data.length; j++) {
                let point = {
                    x: toFloat(s.data[j][0]),
                    y: toFloat(s.data[j][1])
                };
                if (chartType === "bubble") {
                    point.r = toFloat(s.data[j][2]);
                }
                d.push(point);
            }

            datasets.push({
                label: s.name,
                showLine: lineChart || false,
                data: d,
                borderColor: colors[i],
                backgroundColor: colors[i],
                pointBackgroundColor: colors[i],
                fill: chartType === "area"
            });
        }

        if (chartType === "area") {
            chartType = "line";
        }

        let data = {datasets: datasets};

        options.scales.xAxes[0].type = "linear";
        options.scales.xAxes[0].position = "bottom";

        this.drawChart(chart, chartType, data, options);
    }

    renderBubbleChart(chart) {
        this.renderScatterChart(chart, "bubble");
    }

    drawChart(chart, type, data, options) {
        if (chart.chart) {
            chart.chart.destroy();
        }

        chart.element.innerHTML = "<canvas></canvas>";
        let ctx = chart.element.getElementsByTagName("CANVAS")[0];
        chart.chart = new this.library(ctx, {
            type: type,
            data: data,
            options: options
        });
    }
}
