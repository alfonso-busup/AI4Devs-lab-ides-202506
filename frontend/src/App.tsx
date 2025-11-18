import React from 'react';
import './App.css';
import DashboardHeader from './components/DashboardHeader';
import CandidateList from './components/CandidateList';

function App() {
  return (
    <div className="App">
      <DashboardHeader />
      <header className="App-header">
        {/* Se reemplaza el contenido previo por la lista de candidatos */}
        <CandidateList />
      </header>
    </div>
  );
}

export default App;
