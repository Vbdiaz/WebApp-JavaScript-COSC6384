import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import './Montecarlo.css';

dayjs.extend(utc);
dayjs.extend(timezone);

const socketMonteCarlo = io("http://localhost:5000/montecarlo");

function Montecarlo() {
    const [tableData, setTableData] = useState([]);
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        socketMonteCarlo.on("updateMontecarlo", (data) => {
            console.log("Received table data:", data);

            // Convert MySQL UTC timestamp to Houston time
            const convertedData = data.map(item => ({
                ...item,
                calculation_time: dayjs.utc(item.calculation_time).tz("America/Chicago").format("YYYY-MM-DD HH:mm:ss"),
                threshold_line: item.portfolio_value * item.percent_threshold
            }));

            setTableData(convertedData);
            // Sort the data by calculation_time in ascending order for the chart
            const sortedChartData = [...convertedData].sort((a, b) => dayjs(a.calculation_time).isBefore(dayjs(b.calculation_time)) ? -1 : 1);

            // Set the sorted data for the chart (ascending order)
            setChartData(sortedChartData);
        });

        return () => {
            socketMonteCarlo.disconnect();
        };
    }, []);

    return (
        <div>
            <h1>Monte Carlo Method VaR</h1>
            <div className="montecarlo-container">
                <div className="montecarlo-left-section">
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            width={500}
                            height={300}
                            data={chartData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="calculation_time"
                                tickFormatter={(tick) => dayjs(tick).format("HH:mm:ss")}
                            />
                            <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                            <Tooltip />
                            <Line type="monotone" dataKey="var_value" stroke="#82ca9d" dot={false} />
                            <Line type="monotone" dataKey="threshold_line" stroke="#ff4d4f" strokeDasharray={"5 5"} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="montecarlo-right-section">
                    <table className="montecarlo-table">
                        <thead>
                            <tr>
                            <th>Date</th>
                            <th>Portfolio Value</th>
                            <th>Expected Shortfall</th>
                            <th>Value at Risk</th>
                            <th>% at Risk</th>
                            <th>% Threshold</th>
                            <th>WARNING</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tableData.map((item, index) => (
                                  <tr
                                  key={index}
                                  className={item.warning === 1 ? 'montecarlo-warning-row' : ''} // Apply the 'warning-row' class if warning is 1
                                >
                                <td>{item.time_only}</td>
                                <td>{item.portfolio_value}</td>
                                <td>{item.es_value}</td>
                                <td>{item.var_value}</td>
                                <td>{item.percent_at_risk}</td>
                                <td>{item.percent_threshold}</td>
                                <td>{item.warning}</td>
                                
                            </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </div>
        </div>
    );
}

export default Montecarlo;
