import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from '..pages/Dashboard'

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            <Routes>
	        <Routes path="/" element={<Dashboard />} />
            </Routes>
        </Routes>
    );
};

export default AppRoutes
