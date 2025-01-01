import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

function App() {
  const [bedTime, setBedTime] = useState('02:00 AM');
  const [targetTime, setTargetTime] = useState('11:00 PM');
  const [sleepDuration, setSleepDuration] = useState(9);
  const [nightlyShift, setNightlyShift] = useState(1);
  const [mode, setMode] = useState('automatic');
  const [results, setResults] = useState([]);
  const [chosenMode, setChosenMode] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatTime = (timeString) => {
    const { hours, minutes } = parseTimeString(timeString);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${period}`;
  };

  const handleBlur = (event, setTime) => {
    try {
      const formattedTime = formatTime(event.target.value);
      setTime(formattedTime);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSubmit = () => {
    try {
      const { results, chosenMode } = sleepSchedule(bedTime, targetTime, sleepDuration, nightlyShift, mode);
      setResults(results);
      setChosenMode(chosenMode);
      setShowPopup(true);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    }
  };

  const handleSaveImage = () => {
    const elementToInclude = document.querySelector('#screenshot-area');
    
    // Increase resolution by scaling
    const scale = 5;

    html2canvas(elementToInclude, { scale }).then(canvas => {
      // Trim edges
      const trimMargin = 20; // pixels
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = canvas.width - 2 * trimMargin;
      trimmedCanvas.height = canvas.height - 2 * trimMargin;
      trimmedCanvas.getContext('2d').drawImage(
        canvas,
        trimMargin, trimMargin,   // Start cropping inside the original canvas
        canvas.width - 2 * trimMargin, canvas.height - 2 * trimMargin, // Crop size from the original canvas
        0, 0, // Place cropped content at (0,0) of new canvas
        canvas.width - 2 * trimMargin, canvas.height - 2 * trimMargin // Size of cropped content on new canvas
      );

      // Create link to download the image
      const link = document.createElement('a');
      link.download = 'sleep-prescription.png';
      link.href = trimmedCanvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="App">
      <div className="container">
        <h1>Sleep Schedule Adjuster</h1>
        <div className="input-group">
          <label>Previous Bed Time:</label>
          <input
            type="text"
            placeholder="HH:MM AM/PM"
            value={bedTime}
            onChange={(e) => setBedTime(e.target.value)}
            onBlur={(e) => handleBlur(e, setBedTime)}
          />
        </div>
        <div className="input-group">
          <label>Target Bed Time:</label>
          <input
            type="text"
            placeholder="HH:MM AM/PM"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
            onBlur={(e) => handleBlur(e, setTargetTime)}
          />
        </div>
        <div className="input-group">
          <label>Sleep Duration (hours):</label>
          <input
            type="number"
            value={sleepDuration}
            onChange={(e) => setSleepDuration(parseFloat(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label>Nightly Shift (half hours):</label>
          <input
            type="number"
            value={nightlyShift}
            onChange={(e) => setNightlyShift(parseInt(e.target.value))}
          />
        </div>
        <div className="input-group">
          <label>Mode:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="automatic">Automatic</option>
            <option value="sleep later">Sleep Later</option>
            <option value="sleep earlier">Sleep Earlier</option>
          </select>
        </div>
        <button className="submit-button" onClick={handleSubmit}>Calculate</button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {showPopup && (
          <div className="popup">
            <div id="popup-inner" className="popup-inner">
              <div id="screenshot-area" className="screenshot-area" style={{ backgroundColor: '#1e1e1e', color: '#e0e0e0', padding: '20px', borderRadius: '8px' }}>
                <h2>Sleep Prescription</h2>
                <p>Mode Chosen: {chosenMode}</p>
                <div className="results">
                  {results.map((result, index) => (
                    <div key={index} className="result-entry">
                      <p>Day {result.day}</p>
                      <p>Sleep: {result.sleep}</p>
                      <p>Wake: {result.wake}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button className="popup-button" onClick={handleSaveImage}>Save as Image</button>
              <button className="popup-button" onClick={() => setShowPopup(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function parseTimeString(timeString) {
  const regex = /^(\d{1,2})(?::?(\d{2}))?\s*([AaPp]?[Mm]?)?$/;
  const match = timeString.match(regex);
  
  if (!match) {
    throw new Error('Time must be in the format HH:MM AM/PM, HHMM, HH:MM, or military time.');
  }

  let [_, hours, minutes, period] = match;
  
  _ = _ + ""; // eslint-disable-line no-unused-vars
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10) || 0;

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time');
  }

  if (period) {
    period = period.toUpperCase();
    if (period === 'P' || period === 'PM') {
      if (hours < 12) {
        hours += 12;
      }
    } else if ((period === 'A' || period === 'AM') && hours === 12) {
      hours = 0;
    }
  }

  return { hours, minutes };
}

function sleepSchedule(bedTime, targetTime, sleepDuration, nightlyShift, mode) {
  const current = parseTimeString(bedTime);
  const target = parseTimeString(targetTime);
  const maxChangeMillis = nightlyShift * 1800 * 1000;
  const sleepDurationMillis = sleepDuration * 3600 * 1000;

  let currentTime = new Date(1970, 0, 1, current.hours, current.minutes);
  const targetTimeObj = new Date(1970, 0, 1, target.hours, target.minutes);
  const results = [];
  let day = 1;
  let chosenMode = mode;

  while (currentTime.getHours() !== targetTimeObj.getHours() || currentTime.getMinutes() !== targetTimeObj.getMinutes()) {
    let timeDiff = targetTimeObj - currentTime;
    
    // Adjust for crossing midnight
    if (timeDiff > 12 * 3600 * 1000) {
      timeDiff -= 24 * 3600 * 1000;
    } else if (timeDiff < -12 * 3600 * 1000) {
      timeDiff += 24 * 3600 * 1000;
    }

    let effectiveMode = mode;
    if (mode === 'automatic') {
      effectiveMode = timeDiff > 0 ? 'Sleep Later' : 'Sleep Earlier';
    }

    const adjustment = Math.min(Math.abs(timeDiff), maxChangeMillis);
    if (effectiveMode === 'Sleep Later') {
      currentTime = new Date(currentTime.getTime() + adjustment);
    } else {
      currentTime = new Date(currentTime.getTime() - adjustment);
    }

    const wakeTime = new Date(currentTime.getTime() + sleepDurationMillis);
    results.push({
      day: day,
      sleep: currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      wake: wakeTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
    });

    if (mode === 'automatic') {
      chosenMode = effectiveMode;
    }

    day += 1;
  }

  return { results, chosenMode };
}

export default App;
