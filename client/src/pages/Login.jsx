import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Login({ setName }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pro, isPro] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (email == "" || password == "") {
        toast.error("Please fill up all the fields");
        return;
      }
      isPro(true);
      const data = await axios.post("http://127.0.0.1:5000/login", {
        email,
        password,
      });
      const id = data.data.user.id;
      const name = data.data.user.name;
      localStorage.setItem("userId", id);
      localStorage.setItem("userName", name);
      console.log(id);

      if (data.data.status == "true") {
        setName(data.data.user.name);
        navigate("/");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (e) {
      toast.error("Server Error");
    } finally {
      isPro(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col justify-center items-center gap-2">
      {pro && <div className="absolute bottom-2">Authenticating</div>}
      <div className="text-2xl font-bold">EmoAssist</div>
      <div className="flex flex-col h-3/4 w-3/4 gap-2 items-center pt-5">
        <div className="text-xl">Login</div>
        <form
          action=""
          className="flex flex-col w-full items-center gap-2"
          onSubmit={handleSubmit}
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button>Submit</button>
          <p>
            Didn't have an account ?{" "}
            <Link to={"/register"} className="pointer text-blue-500">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
