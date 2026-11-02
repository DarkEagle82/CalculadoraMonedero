import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { HomeScreen } from './components/HomeScreen';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <HomeScreen />
    </ThemeProvider>
  );
};

export default App;
