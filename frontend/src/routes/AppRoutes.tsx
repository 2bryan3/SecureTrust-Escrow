import React, {useEffect, useState} from 'react'
import {BrowserRouter, Route, Routes} from "react-router-dom";
import { useNavigate } from "react-router-dom"
import Dashboard from '../pages/Dashboard'

const AppRoutes: React.FC = () => {
    
    const navigate = useNavigate();

    return (
        <Routes>
            <Route path="/" element={<Dashboard />} />
        </Routes>
    );
};

export default AppRoutes
