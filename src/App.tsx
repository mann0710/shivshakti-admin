import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerDetails from './components/CustomerDetails';
import MenuCreation from './components/MenuCreation';
import Summary from './components/Summary';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <img src="/logo.png" alt="Shiv Shakti Catering" className="logo" />
            <div className="slogan">
              <h2>Delicious Food, Perfect Service</h2>
              <p>Making your special moments memorable</p>
            </div>
          </div>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<CustomerDetails />} />
            <Route path="/menu" element={<MenuCreation />} />
            <Route path="/summary" element={<Summary />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
