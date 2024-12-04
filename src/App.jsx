import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import TextEditor from './Components/TextEditor'
import {v4 as uuidv4} from 'uuid'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path ="/" index element={<Navigate to={`/document/${uuidv4()}`} replace/>}/>
        <Route path ="/document/:id" element={<TextEditor/>}/>
      </Routes>
    </Router>
  )
}

export default App
