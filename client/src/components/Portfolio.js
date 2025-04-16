import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import './Portfolio.css';

dayjs.extend(utc);
dayjs.extend(timezone);

const socketPortfolio = io("http://localhost:5000/portfolio");

function Porfolio() {
  const [portfolioData, setPortfolioData] = useState([]);
  const [varData, setVarData] = useState([]);
  const [formData, setFormData] = useState({ ticker: '', shares: '', action: 'buy', method: 'montecarlo' });
  const [tradeResponse, setTradeResponse] = useState(null);
  const [operationDuration, setOperationDuration] = useState(null);

  useEffect(() => {
    socketPortfolio.on("updatePortfolio", (data) => {
      const { portfolioData, VaRData } = data;

      if (Array.isArray(portfolioData)) {
        setPortfolioData(portfolioData);
      } else {
        console.error("Portfolio data is not an array", portfolioData);
      }

      if (Array.isArray(VaRData)) {
        const convertedVarData = VaRData.map(item => ({
          ...item,
          calculation_time: dayjs.utc(item.calculation_time).tz("America/Chicago").format("YYYY-MM-DD HH:mm:ss"),
        }));
        setVarData(convertedVarData);
      } else {
        console.error("VaRData is not an array", VaRData);
      }
    });

    return () => {
      socketPortfolio.disconnect();
    };
  }, []);

  const propose_montecarlo = async (data) => {
    const startTime = Date.now();

    try {
      const res = await fetch('http://localhost:5001/var/montecarlo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      setTradeResponse(result);

      const endTime = Date.now();
      setOperationDuration(endTime - startTime);
    } catch (err) {
      console.error("Error proposing trade:", err);
      setTradeResponse({ error: "Failed to submit trade." });
      setOperationDuration(null);
    }
  };

  const propose_historical = async (data) => {
    const startTime = Date.now();

    try {
      const res = await fetch('http://localhost:5001/var/historical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      setTradeResponse(result);

      const endTime = Date.now();
      setOperationDuration(endTime - startTime);
    } catch (err) {
      console.error("Error proposing trade:", err);
      setTradeResponse({ error: "Failed to submit trade." });
      setOperationDuration(null);
    }
  };

  const make_trade = async (data) => {
    const startTime = Date.now();

    try {
        const res = await fetch('http://localhost:5001/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ticker: data.ticker,
                shares: data.shares,
                action: data.action,
            }),
        });

        const result = await res.json();
        setTradeResponse(result);

        const endTime = Date.now();
        setOperationDuration(endTime - startTime);
    } catch (err) {
        console.error("Error proposing trade:", err);
        setTradeResponse({ error: "Failed to submit trade." });
        setOperationDuration(null);
    }
};


  const [submitType, setSubmitType] = useState('propose');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitType === 'buy') {
      // Replace with your BUY API call
      make_trade(formData);
    } else {
      if(formData.method === "montecarlo") {
        propose_montecarlo(formData);
      } else {
        console.log(formData)
        propose_historical(formData);
      }
    }
  };

  return (
    <div>
    <h1>Portfolio Holdings</h1>
    <div className="portfolio-container">
      
      <div className="portfolio-left-section">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart width={500} height={300} data={varData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="calculation_time" tickFormatter={(tick) => dayjs(tick).format("HH:mm:ss")} />
            <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
            <Tooltip />
            <Line type="monotone" dataKey="portfolio_value" stroke="#82ca9d" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="portfolio-right-section">
        <table className="portfolio-table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Current Price</th>
              <th>Shares</th>
              <th>Market Value</th>
            </tr>
          </thead>
          <tbody>
            {portfolioData.map((item, index) => (
              <tr key={index} className={item.day_change === -1 ? 'portfolio-warning-row-down' : item.day_change === 1 ? 'portfolio-warning-row-up' : "portfolio-warning-row-stay"}>
                <td>{item.ticker}</td>
                <td>{item.current_price}</td>
                <td>{item.shares}</td>
                <td>{item.market_value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
    </div>
    <div className="form-container">
        <form onSubmit={handleSubmit}>
          <input name="ticker" placeholder="Ticker" onChange={e => setFormData({ ...formData, ticker: e.target.value })} />
          <input name="shares" type="number" placeholder="Shares" onChange={e => setFormData({ ...formData, shares: e.target.value })} />
          <select name="action" onChange={e => setFormData({ ...formData, action: e.target.value })}>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
          <select
  name="method"
  onChange={e => setFormData(prevState => ({ ...prevState, method: e.target.value }))}
>
  <option value="montecarlo">Monte Carlo</option>
  <option value="historical">Historical</option>
</select>
          <button
        type="submit"
        onClick={() => setSubmitType('propose')}
      >
        Propose
      </button>
      <button
        type="submit"
        onClick={() => setSubmitType('buy')}
      >
        Make Trade
      </button>
        </form>

        {/* ✅ Display the trade response below the form */}
        {tradeResponse && (
          <div className="trade-response">
            {tradeResponse.error ? (
              <p style={{ color: 'red' }}>{tradeResponse.error}</p>
            ) : (
              <div>
                <h3>Trade Response</h3>
                <ul>
  {Object.entries(tradeResponse).map(([key, value]) => (
    <li key={key}>
      <strong>{key.replace(/_/g, ' ')}:</strong>{' '}
      {typeof value === 'object' ? (
        <ul>
          {Object.entries(value).map(([subKey, subValue]) => (
            <li key={subKey}>
              <strong>{subKey.replace(/_/g, ' ')}:</strong> {String(subValue)}
            </li>
          ))}
        </ul>
      ) : (
        String(value)
      )}
    </li>
  ))}
</ul>

              </div>
            )}
          </div>
        )}


        {/* ✅ Display the operation duration */}
        {operationDuration !== null && (
          <div className="operation-duration">
            <p>Operation took {operationDuration} ms</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Porfolio;
