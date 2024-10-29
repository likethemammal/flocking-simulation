import { useState } from "react";

import FishSimulation from "./FishSimulation";

function App() {
  return (
    <main className="flex flex-col items-center gap-8 py-16 max-w-[1280px] mx-auto">
      <FishSimulation />
    </main>
  );
}

export default App;
