import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const socket = io("http://localhost:5000");

function VarChart() {
    const [tableData, setTableData] = useState([]);

    useEffect(() => {
        socket.on("updateTable", (data) => {
            console.log("Received table data:", data);

            // Convert MySQL UTC timestamp to Houston time
            const convertedData = data.map(item => ({
                ...item,
                calculation_time: dayjs.utc(item.calculation_time).tz("America/Chicago").format("YYYY-MM-DD HH:mm:ss")
            }));

            setTableData(convertedData);
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    return (
        <div>
            <h2>Dow Jones Industrial Average</h2>
            <ResponsiveContainer width="100%" height={400}>
                <LineChart width={500} height={300} data={tableData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <ResponsiveContainer width="100%" height={400}>
                <LineChart width={500} height={300} data={tableData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                        dataKey="calculation_time" 
                        tickFormatter={(tick) => dayjs(tick).format("HH:mm:ss")} 
                    />
                    <YAxis domain={['dataMin - 100', 'dataMax + 100']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="var_value" stroke="#82ca9d" dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

export default VarChart;
