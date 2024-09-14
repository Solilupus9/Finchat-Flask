import './App.css'
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import MainPage from "./Components/MainPage.tsx";
import ChatPage from "./Components/ChatPage.tsx";
import SignInPage from "./Components/SignInPage.tsx";
import SignUpPage from './Components/SignUpPage.tsx';
import {Toaster} from "react-hot-toast";
function App() {
    return (
        <BrowserRouter>
            <Toaster/>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path='/chat' element={<ChatPage/>}/>
                <Route path='/sign-in' element={<SignInPage/>}/>
                <Route path='/sign-up' element={<SignUpPage/>}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App