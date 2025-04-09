import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import './Portfolio.css'

dayjs.extend(utc);
dayjs.extend(timezone);

const socketPortfolio = io("http://localhost:5000/portfolio");

function Porfolio() {
        const [portfolioData, setPortfolioData] = useState([]);
        const [varData, setVarData] = useState([]);
      
        useEffect(() => {
          socketPortfolio.on("updatePortfolio", (data) => {
            console.log("Received table data:", data);
      
            // Extract portfolioData and VaRData from the received data
            const { portfolioData, VaRData } = data;
      
            // If portfolioData is an array, set it to state
            if (Array.isArray(portfolioData)) {
              setPortfolioData(portfolioData);
            } else {
              console.error("Portfolio data is not an array", portfolioData);
            }
      
            // If VaRData is an array, process and set it to state
            if (Array.isArray(VaRData)) {
              // Convert MySQL UTC timestamp to Houston time for VaRData
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

    return (
        <div>
            <h1>Portfolio Holdings</h1>
            <div className="portfolio-container">
                <div className="portfolio-left-section">
                <ResponsiveContainer width="100%" height={300}>
                <LineChart width={500} height={300} data={varData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="calculation_time" 
                        tickFormatter={(tick) => dayjs(tick).format("HH:mm:ss")} 
                    />
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
                                <tr
                                    key={index}
                                    className={item.day_change === 1 ? 'portfolio-warning-row-down' : 'portfolio-warning-row-up'} // Apply the 'warning-row' class if warning is 1
                                >
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
        </div>
    );
}

export default Porfolio;
