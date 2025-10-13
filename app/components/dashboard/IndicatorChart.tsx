'use client'
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface IndicatorChartProps {
  data: Array<{
    date: string;
    value: number;
  }>;
  type: string;
}

export function IndicatorChart({ data, type }: IndicatorChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !chartRef.current) return;

    // Clear previous chart
    d3.select(chartRef.current).selectAll('*').remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = chartRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');

    
    const processedData = data.map(d => ({
      date: parseDate(d.date),
      value: d.value
    })).filter(d => d.date !== null) as { date: Date; value: number }[]; // Filter out null dates and assert type

    if (processedData.length === 0) return; // Exit if no valid data

    // Set scales
    const x = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.value) as number])
      .nice()
      .range([height, 0]);

    // Create SVG
    const svg = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x));

    svg.append('g')
      .call(d3.axisLeft(y));

    // Create chart based on type
    switch (type) {
      case 'bar':
        svg.selectAll('.bar')
          .data(processedData)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => x(d.date))
          .attr('y', d => y(d.value))
          .attr('width', width / processedData.length - 2)
          .attr('height', d => height - y(d.value))
          .attr('fill', '#3b82f6');
        break;

      case 'line':
        const line = d3.line<{date: Date, value: number}>()
          .x(d => x(d.date))
          .y(d => y(d.value));

        svg.append('path')
          .datum(processedData)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 2)
          .attr('d', line);
        break;

      case 'pie':
        const pieData = processedData.map(d => d.value);
        const pie = d3.pie<number>();
        const arc = d3.arc<d3.PieArcDatum<number>>()
          .innerRadius(0)
          .outerRadius(Math.min(width, height) / 2);

        const pieGroup = svg.append('g')
          .attr('transform', `translate(${width/2},${height/2})`);

        pieGroup.selectAll('path')
          .data(pie(pieData))
          .enter()
          .append('path')
          .attr('d', arc)
          .attr('fill', (d, i) => d3.schemeCategory10[i % 10]);
        break;

      default:
        // Default to line chart
        const defaultLine = d3.line<{date: Date, value: number}>()
          .x(d => x(d.date))
          .y(d => y(d.value));

        svg.append('path')
          .datum(processedData)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', 2)
          .attr('d', defaultLine);
    }

  }, [data, type]);

  return <div ref={chartRef} className="w-full h-full" />;
}