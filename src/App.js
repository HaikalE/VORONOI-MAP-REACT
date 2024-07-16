// src/App.js
import React from 'react';
import VoronoiMap from './components/VoronoiMap';
import './styles/styles.css';
import './styles/style.scss'; 

function App() {
  const fitBounds = [[1.0, 98.0], [4.5, 100.5]]; // Bounds for North Sumatra (Sumatera Bagian Utara)



  const country = 'points'; // replace with your logic to determine the country
  const url = `/data/${country}.csv`; // update with your actual data URL
  const initialSelections = new Set(["BINJAI"]); // example initial selections

  return (
    <div className="App">
      <div id="selected">Click on an area to show the team name</div>
      <VoronoiMap url={url} fitBounds={fitBounds} initialSelections={initialSelections} />
    </div>
  );
}

export default App;
