import React, { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const VoronoiMap = ({ url, fitBounds, initialSelections }) => {
  useEffect(() => {
    const loadScripts = async () => {
      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      };

      try {
        console.log('Loading leaflet script...');
        await loadScript('/js/leaflet.min.js');
        console.log('Leaflet script loaded.');

        console.log('Loading D3 script...');
        await loadScript('https://unpkg.com/d3@3.5.17/d3.min.js');
        console.log('D3 script loaded.');

        const map = L.map('map').fitBounds(fitBounds).setMaxBounds([[-55, -180], [80, 180]]);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          maxZoom: 18,
          minZoom: 4,
          id: 'mapbox/streets-v11',
          tileSize: 512,
          zoomOffset: -1,
          opacity: 0.4,
          accessToken: 'pk.eyJ1IjoiZHV4a2doIiwiYSI6Ijg5NWE2ZWI5NmVhNTVmMGIyMjhkNDJhYmViNmI1ZjNjIn0.u2_1ZH77JRRo2JzCkcjbrw', // Replace with your access token
        }).addTo(map);

        const showHide = (selector) => {
          window.d3.select(selector).select('.hide').on('click', function () {
            window.d3.select(selector)
              .classed('visible', false)
              .classed('hidden', true);
          });

          window.d3.select(selector).select('.show').on('click', function () {
            window.d3.select(selector)
              .classed('visible', true)
              .classed('hidden', false);
          });
        };

        const voronoiMap = (map, url, initialSelections) => {
          const pointTypes = window.d3.map();
          let points = [];
          let lastSelectedPoint;

          const voronoi = window.d3.geom.voronoi()
            .x(d => d.x)
            .y(d => d.y);

          const selectPoint = function () {
            window.d3.selectAll('.selected').classed('selected', false);

            const cell = window.d3.select(this);
            const point = cell.datum();

            lastSelectedPoint = point;
            cell.classed('selected', true);

            window.d3.select('#selected').html(point.name).text(point.name);
          };

          const drawPointTypeSelection = () => {
            showHide('#selections');
            const labels = window.d3.select('#toggles').selectAll('input')
              .data(pointTypes.values())
              .enter().append('div')
              .attr('class', 'switch-wrapper')
              .append('div')
              .attr('class', 'pretty p-switch p-fill');

              labels.append("input")
            .attr("type", "checkbox")
            .property("checked", function(d) {
                console.log('Initial selection check:', d.type, initialSelections.has(d.type));
                return initialSelections === undefined || initialSelections.has(d.type);
            })
            .attr("value", function(d) { return d.type; })
            .attr("id", function(d) { return d.type; })
            .on("change", drawWithLoading);

        
        

            labels.append('div')
              .attr('class', d => `state p-${d.color}`)
              .append('label')
              .text(d => d.type);
          };

          const selectedTypes = () => {
            const selected = window.d3.selectAll('#toggles input[type=checkbox]').filter(function() {
              return this.checked;
            });
            return selected[0].map(elem => elem.value);
          };

          const pointsFilteredToSelectedTypes = () => {
            const currentSelectedTypes = ["BINJAI", "RANTAU PRAPAT","MEDAN","PEMATANG SIANTAR","PADANG SIDEMPUAN","PEMATANG SIANTAR","ACEH"]; // Tipe-tipe yang dipilih
            console.log('Current selected types:', currentSelectedTypes);
            
            const filteredPoints = points.filter(item => {
              console.log('Filtering point:', item);
              return currentSelectedTypes.includes(item.type); // Memeriksa apakah tipe termasuk dalam array tipe-tipe yang dipilih
            });
            
            console.log('Filtered points:', filteredPoints);
            return filteredPoints;
          };
          
          
        

          const drawWithLoading = (e) => {
            console.log('Draw with loading event:', e);
            if (e && e.type === 'viewreset') {
              window.d3.select('#overlay').remove();
            }
            draw();
          };

          const draw = () => {
            console.log('Drawing Voronoi map...');
            window.d3.select('#overlay').remove();
        
            const bounds = map.getBounds();
            const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
            const bottomRight = map.latLngToLayerPoint(bounds.getSouthEast());
            const existing = window.d3.set();
            const drawLimit = bounds.pad(1000);
        
            const filteredPoints = pointsFilteredToSelectedTypes().filter(d => {
                const latlng = new L.LatLng(d.latitude, d.longitude);
                if (!drawLimit.contains(latlng)) return false;
        
                const point = map.latLngToLayerPoint(latlng);
                const key = point.toString();
                if (existing.has(key)) return false;
        
                existing.add(key);
                d.x = point.x;
                d.y = point.y;
                return true;
            });
        
            console.log('Filtered points after bounds check:', filteredPoints);
        
            if (filteredPoints.length === 0) {
                console.warn('No points to draw.');
                return;
            }
        
            voronoi(filteredPoints).forEach(d => d.point.cell = d);
        
            const svg = window.d3.select(map.getPanes().overlayPane).append('svg')
                .attr('id', 'overlay')
                .attr('class', 'leaflet-zoom-hide')
                .style('width', `${map.getSize().x}px`)
                .style('height', `${map.getSize().y}px`)
                .style('margin-left', `${topLeft.x}px`)
                .style('margin-top', `${topLeft.y}px`);
        
            const g = svg.append('g').attr('transform', `translate(${-topLeft.x},${-topLeft.y})`);
        
            const svgPoints = g.attr('class', 'points')
                .selectAll('g').data(filteredPoints)
                .enter().append('g').attr('class', 'point');
        
            const buildPathFromPoint = (point) => {
                return `M${point.cell.join('L')}Z`;
            };
        
            svgPoints.append('path')
                .attr('class', 'point-cell')
                .attr('d', buildPathFromPoint)
                .attr('stroke', 'white')
                .attr('stroke-width', 1)
                .attr('fill', 'none')
                .on('click', selectPoint)
                .classed('selected', d => lastSelectedPoint === d);
        
            svgPoints.append('circle')
                .attr('transform', d => `translate(${d.x},${d.y})`)
                .attr('class', d => d.color)
                .attr('r', map.getZoom() / 2 + 1)
                // .attr('fill', d=>d.color); // Ensure that the color is assigned correctly
        
            const uniqueColors = [...new Set(points.map(point => point.color))];
            console.log("Unique colors:", uniqueColors);
            console.log('Voronoi map drawn.');
        };
        

          window.d3.csv(url, function (csv) {
            console.log('CSV data loaded:', csv);
            points = csv;
            points.forEach(point => {
                point.latitude = +point.latitude;
                point.longitude = +point.longitude;
                pointTypes.set(point.type, { type: point.type, color: point.color });
            });
            console.log('Points loaded:', points);
            drawPointTypeSelection();
            drawWithLoading();
        });
        

          map.on('viewreset moveend', drawWithLoading);
        };

        voronoiMap(map, url, initialSelections);
      } catch (error) {
        console.error('Error loading scripts:', error);
      }
    };

    loadScripts();
  }, [fitBounds, url, initialSelections]);

  return <div id="map" style={{ height: '800px', width: '100%' }}></div>;
};

export default VoronoiMap;
