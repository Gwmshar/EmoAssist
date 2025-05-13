import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AboutUs from "./pages/AboutUs";
import { Toaster } from "react-hot-toast";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Chatbot from "./pages/Chatbot";
import { useEffect, useState } from "react";
function App() {
  const [name, setName] = useState("");
  const [login, setLogin] = useState(false);
  const [id, setId] = useState(null);
  useEffect(() => {
    const userName = localStorage.getItem("userName");
    setName(userName);
  }, []);
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home name={name} login={login} />} />
          <Route path="aboutus" element={<AboutUs />} />
          <Route
            path="login"
            element={
              <Login setName={setName} setLogin={setLogin} setId={setId} />
            }
          />
          <Route path="register" element={<Register />} />
          <Route path="chat" element={<Chatbot name={name} id={id} />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
