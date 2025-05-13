import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpassword, setCpassword] = useState("");
  const [pro, isPro] = useState(false);
  const navaigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (name == "" || email == "" || password == "" || cpassword == "") {
        toast.error("Please fill up all the fields");
        return;
      }
      if (password != cpassword) {
        toast.error("Password and Confirm Password not match");
        return;
      }
      isPro(true);
      const data = await axios.post("http://127.0.0.1:5000/register", {
        name,
        email,
        password,
      });
      if (data.data.status == "true") {
        navaigate("/login");
      } else {
        toast.error("User is already exist");
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
        <div className="text-xl">Register</div>
        <form
          action=""
          className="flex flex-col w-full items-center gap-2"
          onSubmit={handleSubmit}
        >
          <input
            type="text"
            placeholder="Username"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="text"
            placeholder="Confirm Password"
            name="cpassword"
            value={cpassword}
            onChange={(e) => setCpassword(e.target.value)}
          />
          <button>Submit</button>
          <p>
            Already have an account ?{" "}
            <Link to={"/login"} className="pointer text-blue-500">
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
