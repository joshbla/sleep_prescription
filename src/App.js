import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import { FaMoon, FaClock, FaSave, FaTimes } from 'react-icons/fa';
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
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      const { results, chosenMode } = sleepSchedule(bedTime, targetTime, sleepDuration, nightlyShift, mode);
      setResults(results);
      setChosenMode(chosenMode);
      setShowPopup(true);
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveImage = () => {
    const elementToInclude = document.querySelector('#screenshot-area');
    const scale = 5;

    html2canvas(elementToInclude, { scale }).then(canvas => {
      const trimMargin = 20;
      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = canvas.width - 2 * trimMargin;
      trimmedCanvas.height = canvas.height - 2 * trimMargin;
      trimmedCanvas.getContext('2d').drawImage(
        canvas,
        trimMargin, trimMargin,
        canvas.width - 2 * trimMargin, canvas.height - 2 * trimMargin,
        0, 0,
        canvas.width - 2 * trimMargin, canvas.height - 2 * trimMargin
      );

      const link = document.createElement('a');
      link.download = 'sleep-prescription.png';
      link.href = trimmedCanvas.toDataURL('image/png');
      link.click();
    });
  };

  return (
    <div className="App">
      <div className="container">
        <header className="app-header">
          <FaMoon className="app-logo" />
          <h1>Sleep Schedule Adjuster</h1>
          <p className="subtitle">Optimize your sleep transition schedule</p>
        </header>

        <div className="form-container">
          <div className="input-group">
            <label>
              <FaClock className="input-icon" />
              Previous Bed Time:
            </label>
            <input
              type="text"
              placeholder="HH:MM AM/PM"
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
              onBlur={(e) => handleBlur(e, setBedTime)}
            />
          </div>

          <div className="input-group">
            <label>
              <FaClock className="input-icon" />
              Target Bed Time:
            </label>
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
              min="1"
              max="24"
            />
          </div>

          <div className="input-group">
            <label>Nightly Shift (half hours):</label>
            <input
              type="number"
              value={nightlyShift}
              onChange={(e) => setNightlyShift(parseInt(e.target.value))}
              min="1"
              max="48"
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

          <button 
            className="submit-button" 
            onClick={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? 'Calculating...' : 'Calculate Schedule'}
          </button>

          {errorMessage && (
            <div className="error-message">
              <p>{errorMessage}</p>
            </div>
          )}
        </div>

        <div className="info-section">
          <h3>How to use:</h3>
          <ul>
            <li>Enter your current bedtime in HH:MM AM/PM format</li>
            <li>Enter your desired bedtime</li>
            <li>Specify how long you want to sleep</li>
            <li>Choose how much you want to adjust each night (in half hours)</li>
            <li>Select whether you want to automatically determine the best adjustment or manually choose</li>
          </ul>
        </div>

        {showPopup && (
          <div className="popup">
            <div className="popup-inner">
              <div id="screenshot-area" className="screenshot-area">
                <h2>Sleep Prescription</h2>
                <p className="mode-chosen">Mode Chosen: {chosenMode}</p>
                <div className="results">
                  {results.map((result, index) => (
                    <div key={index} className="result-entry">
                      <p className="day">Day {result.day}</p>
                      <p className="sleep">Sleep: {result.sleep}</p>
                      <p className="wake">Wake: {result.wake}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="popup-buttons">
                <button className="popup-button save" onClick={handleSaveImage}>
                  <FaSave /> Save as Image
                </button>
                <button className="popup-button close" onClick={() => setShowPopup(false)}>
                  <FaTimes /> Close
                </button>
              </div>
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
  const dayMillis = 24 * 3600 * 1000;

  let currentTime = new Date(1970, 0, 1, current.hours, current.minutes);
  let targetTimeObj = new Date(1970, 0, 1, target.hours, target.minutes);
  const results = [];
  let day = 1;
  let chosenMode = mode;

  // Handle automatic mode selection
  if (mode === 'automatic') {
    let timeDiff = targetTimeObj - currentTime;
    if (timeDiff <= -12 * 3600 * 1000) timeDiff += dayMillis;
    if (timeDiff > 12 * 3600 * 1000) timeDiff -= dayMillis;
    chosenMode = timeDiff > 0 ? 'sleep later' : 'sleep earlier';
  }

  while (currentTime.getHours() !== targetTimeObj.getHours() || 
         currentTime.getMinutes() !== targetTimeObj.getMinutes()) {
    
    // Calculate next time
    let nextTime;
    if (chosenMode === 'sleep later') {
      nextTime = new Date(currentTime.getTime() + maxChangeMillis);
      if (nextTime.getTime() >= new Date(1970, 0, 2).getTime()) {
        nextTime = new Date(nextTime.getTime() - dayMillis);
      }
    } else {
      nextTime = new Date(currentTime.getTime() - maxChangeMillis);
      if (nextTime.getTime() < new Date(1970, 0, 1).getTime()) {
        nextTime = new Date(nextTime.getTime() + dayMillis);
      }
    }

    // Check if we would overshoot the target
    let currentDiff = Math.abs(targetTimeObj - currentTime);
    let nextDiff = Math.abs(targetTimeObj - nextTime);
    
    if (nextDiff > currentDiff) {
      // If we're going to overshoot, just set to target time
      currentTime = new Date(targetTimeObj.getTime());
    } else {
      currentTime = nextTime;
    }

    const wakeTime = new Date(currentTime.getTime() + sleepDurationMillis);
    let adjustedWakeTime = new Date(wakeTime);
    if (wakeTime.getTime() >= new Date(1970, 0, 2).getTime()) {
      adjustedWakeTime = new Date(wakeTime.getTime() - dayMillis);
    }

    results.push({
      day: day,
      sleep: currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      wake: adjustedWakeTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    });

    day += 1;

    // If we've reached the target, break
    if (currentTime.getHours() === targetTimeObj.getHours() && 
        currentTime.getMinutes() === targetTimeObj.getMinutes()) {
      break;
    }
  }

  return { results, chosenMode };
}

export default App;
