import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import Dashboard from './dashboard.jsx';
import Api from './database/Api';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <>
    <App /> 
    {/* <Api />
    {/* <Dashboard /> */}
    </>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
