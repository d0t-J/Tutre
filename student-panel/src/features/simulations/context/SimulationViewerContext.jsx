import { createContext, useContext } from 'react';

export const SimulationViewerContext = createContext({});

export const useSimulationViewer = () => useContext(SimulationViewerContext);
