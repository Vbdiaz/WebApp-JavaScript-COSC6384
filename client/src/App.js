import React from "react";
import Montecarlo from "./components/Montecarlo";
import Porfolio from "./components/Portfolio";
import Historical from "./components/Historical";

function App() {

    return (
        <>
            <Porfolio />
            <Montecarlo />
            <Historical />
        </>
    );
}

export default App;
