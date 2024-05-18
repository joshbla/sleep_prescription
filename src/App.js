import React, { useState } from 'react';

function App() {
  const [bedTime, setBedTime] = useState('07:00 AM');
  const [targetTime, setTargetTime] = useState('12:00 AM');
  const [sleepDuration, setSleepDuration] = useState(9);
  const [maxChange, setMaxChange] = useState(1.5);
  const [results, setResults] = useState([]);

  const handleSubmit = () => {
    const schedule = sleepSchedule(bedTime, targetTime, sleepDuration, maxChange);
    setResults(schedule);
  };

  return (
    <div>
      <h1>Sleep Schedule Adjuster</h1>
      <div>
        <label>
          Last Bed Time:
          <input
            type="time"
            value={bedTime}
            onChange={(e) => setBedTime(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Target Bed Time:
          <input
            type="time"
            value={targetTime}
            onChange={(e) => setTargetTime(e.target.value)}
          />
        </label>
      </div>
      <div>
        <label>
          Sleep Duration (hours):
          <input
            type="number"
            value={sleepDuration}
            onChange={(e) => setSleepDuration(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Max Change (hours):
          <input
            type="number"
            value={maxChange}
            onChange={(e) => setMaxChange(parseFloat(e.target.value))}
          />
        </label>
      </div>
      <button onClick={handleSubmit}>Calculate</button>
      <div>
        <h2>Results</h2>
        {results.map((result, index) => (
          <div key={index}>
            <p>Day {result.day}</p>
            <p>Sleep: {result.sleep}</p>
            <p>Wake: {result.wake}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function sleepSchedule(bedTime, targetTime, sleepDuration, maxChange) {
  let current = new Date(`1970-01-01T${bedTime}:00`);
  let target = new Date(`1970-01-01T${targetTime}:00`);
  const maxChangeMillis = maxChange * 3600 * 1000; // convert hours to milliseconds
  let day = 1;
  const results = [];

  while (current.getTime() !== target.getTime()) {
    let diffForward = target - current;
    let diffBackward = current - target + 24 * 3600 * 1000;

    if (diffForward < 0) diffForward += 24 * 3600 * 1000;
    if (diffBackward < 0) diffBackward += 24 * 3600 * 1000;

    if (diffForward <= diffBackward) {
      if (diffForward <= maxChangeMillis) {
        current = target;
      } else {
        current = new Date(current.getTime() + maxChangeMillis);
      }
    } else {
      if (diffBackward <= maxChangeMillis) {
        current = target;
      } else {
        current = new Date(current.getTime() - maxChangeMillis);
      }
    }

    const wakeTime = new Date(current.getTime() + sleepDuration * 3600 * 1000);
    results.push({
      day: day,
      sleep: current.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      wake: wakeTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    });

    day += 1;
  }

  return results;
}

export default App;
